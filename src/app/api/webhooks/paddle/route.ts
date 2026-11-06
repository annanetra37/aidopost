import { NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import { paddle } from "@/lib/billing/paddle";
import { paddleConfig, planFromPrice } from "@/lib/billing/config";
import { applySubscription, findByCustomer, grantForPayment, recordPurchase } from "@/lib/billing/core";

export const dynamic = "force-dynamic";

/**
 * Paddle notifications (Developer tools → Notifications). Subscribe to:
 * transaction.completed, subscription.created, subscription.updated, subscription.activated,
 * subscription.past_due, subscription.canceled.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("paddle-signature") ?? "";
  if (!signature || !paddleConfig.webhookSecret) return NextResponse.json({ error: "not configured" }, { status: 400 });
  const raw = await req.text();
  let valid = false;
  try {
    valid = await paddle().webhooks.isSignatureValid(raw, paddleConfig.webhookSecret, signature);
  } catch {
    valid = false;
  }
  if (!valid) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  let event;
  try {
    event = await paddle().webhooks.unmarshal(raw, paddleConfig.webhookSecret, signature);
  } catch (err) {
    // Genuine Paddle event we couldn't parse: 500 so Paddle retries, and it shows up in the logs.
    console.error("[paddle webhook] could not parse event", err);
    return NextResponse.json({ error: "unparseable event" }, { status: 500 });
  }

  switch (event.eventType) {
    case EventName.TransactionCompleted: {
      const t = event.data;
      const custom = (t.customData ?? {}) as { userId?: string; kind?: string; generationId?: string };
      const userId = custom.userId ?? (await findByCustomer(t.customerId))?.userId;
      if (!userId) break;
      const amount = Number(t.details?.totals?.total ?? 0);
      if (!t.subscriptionId && (custom.kind === "hd_image" || custom.kind === "credit_pack")) {
        await recordPurchase({ provider: "paddle", ref: t.id, userId, kind: custom.kind, generationId: custom.generationId, amount });
        break;
      }
      if (t.subscriptionId && t.customerId) {
        // First payment or renewal → plan active + fresh monthly allowance.
        const priceId = t.items[0]?.price?.id;
        const row = await applySubscription({
          provider: "paddle",
          customerId: t.customerId,
          userId,
          subscriptionId: t.subscriptionId,
          priceId,
          status: "active",
          periodEnd: t.billingPeriod?.endsAt ? new Date(t.billingPeriod.endsAt) : null,
        });
        const plan = planFromPrice(priceId)?.plan;
        if (row && plan) await grantForPayment(row.userId, plan, `paddle:${t.id}`);
      }
      break;
    }
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionPastDue:
    case EventName.SubscriptionCanceled: {
      const s = event.data;
      await applySubscription({
        provider: "paddle",
        customerId: s.customerId,
        userId: (s.customData as { userId?: string } | null)?.userId,
        subscriptionId: s.id,
        priceId: s.items[0]?.price?.id,
        status: s.status,
        periodEnd: s.currentBillingPeriod?.endsAt ? new Date(s.currentBillingPeriod.endsAt) : null,
      });
      break;
    }
  }
  return NextResponse.json({ received: true });
}
