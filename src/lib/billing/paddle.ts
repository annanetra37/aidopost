// Paddle Billing: checkout (Paddle.js overlay opened on a server-created transaction),
// customer portal, and webhook verification. Docs: developer.paddle.com
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { prisma } from "../db";
import { paddleConfig, PRICES, type CheckoutKind } from "./config";
import { linkCustomer } from "./core";

let client: Paddle | null = null;
export function paddle(): Paddle {
  if (!paddleConfig.apiKey) throw new Error("PADDLE_API_KEY is not configured");
  if (!client) {
    client = new Paddle(paddleConfig.apiKey, {
      environment: paddleConfig.environment === "production" ? Environment.production : Environment.sandbox,
    });
  }
  return client;
}

/** The Paddle customer for this user (created on first checkout, or found by email). */
export async function ensurePaddleCustomer(user: { id: string; email: string; name: string | null }): Promise<string> {
  const row = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (row?.provider === "paddle") return row.providerCustomerId;
  let customerId: string;
  try {
    const c = await paddle().customers.create({ email: user.email, name: user.name ?? undefined, customData: { userId: user.id } });
    customerId = c.id;
  } catch (err) {
    // Already exists in Paddle (e.g. bought before with this email) → look it up.
    const page = await paddle().customers.list({ email: [user.email] }).next();
    if (!page[0]) throw err;
    customerId = page[0].id;
  }
  await linkCustomer(user.id, "paddle", customerId);
  return customerId;
}

export async function createPaddleTransaction(
  user: { id: string; email: string; name: string | null },
  kind: CheckoutKind,
  generationId?: string,
) {
  const customerId = await ensurePaddleCustomer(user);
  const txn = await paddle().transactions.create({
    items: [{ priceId: PRICES.paddle[kind], quantity: 1 }],
    customerId,
    customData: { userId: user.id, kind, generationId: generationId ?? "" },
  });
  return txn.id;
}

export async function paddlePortalUrl(customerId: string, subscriptionId?: string | null) {
  const session = await paddle().customerPortalSessions.create(customerId, subscriptionId ? [subscriptionId] : []);
  return session.urls.general.overview;
}
