import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getStripe, planFromPrice } from "@/lib/stripe";
import { expireMonthly, grantMonthly, grantPack } from "@/lib/credits";
import { CREDIT_PACK, PLANS, type PlanId } from "@/lib/plans";

export const dynamic = "force-dynamic";

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const row = await prisma.subscription.findUnique({ where: { stripeCustomerId: customerId } });
  if (!row) return null;
  const item = sub.items.data[0];
  const mapped = item ? planFromPrice(item.price.id) : null;
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const periodEnd =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  const plan: PlanId = active && mapped ? mapped.plan : "free";
  await prisma.subscription.update({
    where: { id: row.id },
    data: {
      stripeSubscriptionId: sub.id,
      plan,
      billingPeriod: mapped?.period ?? row.billingPeriod,
      status: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
  await prisma.user.update({ where: { id: row.userId }, data: { plan } });
  if (!active) await expireMonthly(row.userId);
  return { ...row, plan };
}

function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const legacy = (inv as unknown as { subscription?: string | { id: string } | null }).subscription;
  const modern = (
    inv as unknown as {
      parent?: { subscription_details?: { subscription?: string | { id: string } } };
    }
  ).parent?.subscription_details?.subscription;
  const s = modern ?? legacy;
  return s ? (typeof s === "string" ? s : s.id) : null;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig || !env.stripe.webhookSecret)
    return NextResponse.json({ error: "not configured" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), sig, env.stripe.webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `bad signature: ${String(err)}` }, { status: 400 });
  }
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const cs = event.data.object;
      const userId = cs.metadata?.userId;
      const kind = cs.metadata?.kind;
      if (!userId) break;
      if (
        cs.mode === "payment" &&
        cs.payment_status === "paid" &&
        (kind === "hd_image" || kind === "credit_pack")
      ) {
        await prisma.purchase.upsert({
          where: { stripeSessionId: cs.id },
          update: { status: "paid" },
          create: {
            userId,
            kind,
            generationId: kind === "hd_image" ? cs.metadata?.generationId || null : null,
            stripeSessionId: cs.id,
            stripePaymentIntent: typeof cs.payment_intent === "string" ? cs.payment_intent : null,
            amount: cs.amount_total ?? 0,
            status: "paid",
          },
        });
        if (kind === "credit_pack") await grantPack(userId, CREDIT_PACK.credits, `pack:${cs.id}`);
      }
      if (cs.mode === "subscription" && cs.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id,
        );
        await syncSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    case "invoice.paid": {
      // New period → reset the monthly allowance (no rollover). Annual plans get monthly grants via cron.
      const inv = event.data.object;
      const subId = invoiceSubscriptionId(inv);
      if (!subId) break;
      const row = await syncSubscription(await stripe.subscriptions.retrieve(subId));
      if (row && row.plan !== "free" && inv.id) {
        if (await grantMonthly(row.userId, PLANS[row.plan].generations, `invoice:${inv.id}`)) {
          await prisma.subscription.update({
            where: { id: row.id },
            data: { lastGrantAt: new Date() },
          });
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const subId = invoiceSubscriptionId(event.data.object);
      if (subId)
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { status: "past_due" },
        });
      break;
    }
  }
  return NextResponse.json({ received: true });
}
