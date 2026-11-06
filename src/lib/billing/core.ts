// Provider-independent effects of payments: plan changes, monthly credit grants, purchases.
import { prisma } from "../db";
import { expireMonthly, grantMonthly, grantPack } from "../credits";
import { CREDIT_PACK, PLANS, type PlanId } from "../plans";
import { planFromPrice, type Provider } from "./config";

const ACTIVE = ["active", "trialing", "past_due"];

/** Find (or remember) the billing row for a provider customer. */
export async function linkCustomer(userId: string, provider: Provider, customerId: string) {
  return prisma.subscription.upsert({
    where: { userId },
    update: { provider, providerCustomerId: customerId },
    create: { userId, provider, providerCustomerId: customerId },
  });
}

export async function findByCustomer(customerId: string | null | undefined) {
  return customerId ? prisma.subscription.findUnique({ where: { providerCustomerId: customerId } }) : null;
}

/** Apply the latest subscription state from a provider webhook. */
export async function applySubscription(input: {
  provider: Provider;
  customerId: string;
  userId?: string | null;
  subscriptionId: string;
  priceId: string | null | undefined;
  status: string;
  periodEnd: Date | null;
}) {
  let row = await findByCustomer(input.customerId);
  if (!row && input.userId) row = await linkCustomer(input.userId, input.provider, input.customerId);
  if (!row) return null;
  const mapped = planFromPrice(input.priceId);
  const active = ACTIVE.includes(input.status);
  const plan: PlanId = active && mapped ? mapped.plan : "free";
  const updated = await prisma.subscription.update({
    where: { id: row.id },
    data: {
      provider: input.provider,
      providerSubscriptionId: input.subscriptionId,
      plan,
      billingPeriod: mapped?.period ?? row.billingPeriod,
      status: input.status,
      currentPeriodEnd: input.periodEnd,
    },
  });
  await prisma.user.update({ where: { id: row.userId }, data: { plan } });
  if (!active) await expireMonthly(row.userId);
  return updated;
}

/** A subscription payment went through: reset the monthly allowance (no rollover). Idempotent by refId. */
export async function grantForPayment(userId: string, plan: PlanId, refId: string) {
  if (plan === "free") return false;
  const granted = await grantMonthly(userId, PLANS[plan].generations, refId);
  if (granted) await prisma.subscription.updateMany({ where: { userId }, data: { lastGrantAt: new Date() } });
  return granted;
}

/** One-off purchase completed: unlock an HD image or add a 20-credit pack. Idempotent by provider ref. */
export async function recordPurchase(input: {
  provider: Provider;
  ref: string;
  paymentId?: string | null;
  userId: string;
  kind: "hd_image" | "credit_pack";
  generationId?: string | null;
  amount: number;
}) {
  await prisma.purchase.upsert({
    where: { providerRef: input.ref },
    update: { status: "paid" },
    create: {
      provider: input.provider,
      providerRef: input.ref,
      providerPaymentId: input.paymentId ?? null,
      userId: input.userId,
      kind: input.kind,
      generationId: input.kind === "hd_image" ? input.generationId || null : null,
      amount: input.amount,
      status: "paid",
    },
  });
  if (input.kind === "credit_pack") await grantPack(input.userId, CREDIT_PACK.credits, `pack:${input.ref}`);
}
