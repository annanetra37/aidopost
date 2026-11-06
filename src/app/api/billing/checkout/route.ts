import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  activeProvider,
  CHECKOUT_KINDS,
  isConfigured,
  paddleConfig,
  PRICES,
  SUBSCRIPTION_KINDS,
  type CheckoutKind,
  type CheckoutStart,
} from "@/lib/billing/config";
import { createPaddleTransaction } from "@/lib/billing/paddle";
import { ensureStripeCustomer, getStripe } from "@/lib/billing/stripe";
import { requireUser, jsonError } from "@/lib/session";

const Body = z.object({
  kind: z.enum(CHECKOUT_KINDS as [CheckoutKind, ...CheckoutKind[]]),
  generationId: z.string().optional(),
  locale: z.string().default("en"),
  returnPath: z.string().startsWith("/").default("/studio"),
});

/** Start a payment for Lite/Pro (monthly/annual), a one-off HD image, or a 20-credit pack. */
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("INVALID_INPUT");
  const { kind, generationId, locale, returnPath } = parsed.data;
  const provider = activeProvider();
  if (!isConfigured(provider, kind)) return jsonError("BILLING_NOT_CONFIGURED", 503);

  if (kind === "hd_image") {
    const gen = await prisma.generation.findFirst({
      where: { id: generationId, session: { userId: user.id }, status: "succeeded" },
    });
    if (!gen) return jsonError("NOT_FOUND", 404);
  }
  if (kind === "credit_pack" && user.plan === "free") return jsonError("PAID_PLAN_REQUIRED", 403);

  const base = `${env.appUrl}/${locale}${returnPath}`;
  const sep = returnPath.includes("?") ? "&" : "?";
  const successUrl = `${base}${sep}checkout=success&kind=${kind}${generationId ? `&generation=${generationId}` : ""}`;

  if (provider === "paddle") {
    const transactionId = await createPaddleTransaction(user, kind, generationId);
    const body: CheckoutStart = {
      provider: "paddle",
      transactionId,
      clientToken: paddleConfig.clientToken,
      environment: paddleConfig.environment,
      successUrl,
    };
    return NextResponse.json(body);
  }

  const customer = await ensureStripeCustomer(user);
  const isSub = SUBSCRIPTION_KINDS.includes(kind);
  const session = await getStripe().checkout.sessions.create({
    mode: isSub ? "subscription" : "payment",
    customer,
    line_items: [{ price: PRICES.stripe[kind], quantity: 1 }],
    allow_promotion_codes: true,
    automatic_tax: { enabled: process.env.STRIPE_TAX === "true" },
    customer_update: process.env.STRIPE_TAX === "true" ? { address: "auto", name: "auto" } : undefined,
    locale: (["de", "es", "sv", "tr"].includes(locale) ? locale : "auto") as "auto",
    metadata: { userId: user.id, kind, generationId: generationId ?? "" },
    subscription_data: isSub ? { metadata: { userId: user.id } } : undefined,
    success_url: successUrl,
    cancel_url: `${base}${sep}checkout=cancelled`,
  });
  const body: CheckoutStart = { provider: "stripe", url: session.url! };
  return NextResponse.json(body);
}
