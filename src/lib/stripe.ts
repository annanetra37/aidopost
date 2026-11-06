import Stripe from "stripe";
import { env } from "./env";
import { prisma } from "./db";

let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!env.stripe.secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!stripe) stripe = new Stripe(env.stripe.secretKey);
  return stripe;
}

export type CheckoutKind = keyof typeof env.stripe.prices;
export const SUBSCRIPTION_KINDS: CheckoutKind[] = [
  "lite_monthly",
  "lite_annual",
  "pro_monthly",
  "pro_annual",
];

export function planFromPrice(
  priceId: string,
): { plan: "lite" | "pro"; period: "monthly" | "annual" } | null {
  const p = env.stripe.prices;
  if (priceId === p.lite_monthly) return { plan: "lite", period: "monthly" };
  if (priceId === p.lite_annual) return { plan: "lite", period: "annual" };
  if (priceId === p.pro_monthly) return { plan: "pro", period: "monthly" };
  if (priceId === p.pro_annual) return { plan: "pro", period: "annual" };
  return null;
}

export async function ensureCustomer(user: {
  id: string;
  email: string;
  name: string | null;
}): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (existing) return existing.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });
  await prisma.subscription.create({ data: { userId: user.id, stripeCustomerId: customer.id } });
  return customer.id;
}
