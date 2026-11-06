import Stripe from "stripe";
import { prisma } from "../db";
import { linkCustomer } from "./core";

let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export async function ensureStripeCustomer(user: { id: string; email: string; name: string | null }): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (existing?.provider === "stripe") return existing.providerCustomerId;
  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id },
  });
  await linkCustomer(user.id, "stripe", customer.id);
  return customer.id;
}
