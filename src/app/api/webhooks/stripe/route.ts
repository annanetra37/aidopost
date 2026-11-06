import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/billing/stripe";
import { planFromPrice } from "@/lib/billing/config";
import { applySubscription, grantForPayment, recordPurchase } from "@/lib/billing/core";

export const dynamic = "force-dynamic";

async function sync(sub: Stripe.Subscription, userId?: string | null) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const periodEnd =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return applySubscription({
    provider: "stripe",
    customerId,
    userId: userId ?? sub.metadata?.userId,
    subscriptionId: sub.id,
    priceId: item?.price.id,
    status: sub.status,
    periodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  });
}

function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const legacy = (inv as unknown as { subscription?: string | { id: string } | null }).subscription;
  const modern = (inv as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } })
    .parent?.subscription_details?.subscription;
  const s = modern ?? legacy;
  return s ? (typeof s === "string" ? s : s.id) : null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!sig || !secret) return NextResponse.json({ error: "not configured" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), sig, secret);
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
      if (cs.mode === "payment" && cs.payment_status === "paid" && (kind === "hd_image" || kind === "credit_pack")) {
        await recordPurchase({
          provider: "stripe",
          ref: cs.id,
          paymentId: typeof cs.payment_intent === "string" ? cs.payment_intent : null,
          userId,
          kind,
          generationId: cs.metadata?.generationId,
          amount: cs.amount_total ?? 0,
        });
      }
      if (cs.mode === "subscription" && cs.subscription) {
        await sync(await stripe.subscriptions.retrieve(typeof cs.subscription === "string" ? cs.subscription : cs.subscription.id), userId);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await sync(event.data.object);
      break;
    case "invoice.paid": {
      const inv = event.data.object;
      const subId = invoiceSubscriptionId(inv);
      if (!subId || !inv.id) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      const row = await sync(sub);
      const plan = planFromPrice(sub.items.data[0]?.price.id)?.plan;
      if (row && plan) await grantForPayment(row.userId, plan, `invoice:${inv.id}`);
      break;
    }
    case "invoice.payment_failed": {
      const subId = invoiceSubscriptionId(event.data.object);
      if (subId) await prisma.subscription.updateMany({ where: { providerSubscriptionId: subId }, data: { status: "past_due" } });
      break;
    }
  }
  return NextResponse.json({ received: true });
}
