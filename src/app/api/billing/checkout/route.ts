import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ensureCustomer, getStripe, SUBSCRIPTION_KINDS, type CheckoutKind } from "@/lib/stripe";
import { requireUser, jsonError } from "@/lib/session";

const Body = z.object({
  kind: z.enum([
    "lite_monthly",
    "lite_annual",
    "pro_monthly",
    "pro_annual",
    "hd_image",
    "credit_pack",
  ]),
  generationId: z.string().optional(),
  locale: z.string().default("en"),
  returnPath: z.string().startsWith("/").default("/studio"),
});

/** Stripe Checkout for Lite/Pro (monthly/annual), a one-off HD image, or a 20-credit pack. */
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("INVALID_INPUT");
  const { kind, generationId, locale, returnPath } = parsed.data;
  const price = env.stripe.prices[kind as CheckoutKind];
  if (!price || !env.stripe.secretKey) return jsonError("BILLING_NOT_CONFIGURED", 503);

  if (kind === "hd_image") {
    const gen = await prisma.generation.findFirst({
      where: { id: generationId, session: { userId: user.id }, status: "succeeded" },
    });
    if (!gen) return jsonError("NOT_FOUND", 404);
  }
  if (kind === "credit_pack" && user.plan === "free") return jsonError("PAID_PLAN_REQUIRED", 403);

  const customer = await ensureCustomer(user);
  const isSub = SUBSCRIPTION_KINDS.includes(kind);
  const base = `${env.appUrl}/${locale}${returnPath}`;
  const sep = returnPath.includes("?") ? "&" : "?";
  const session = await getStripe().checkout.sessions.create({
    mode: isSub ? "subscription" : "payment",
    customer,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    automatic_tax: { enabled: process.env.STRIPE_TAX === "true" },
    customer_update:
      process.env.STRIPE_TAX === "true" ? { address: "auto", name: "auto" } : undefined,
    locale: (["de", "es", "sv", "tr"].includes(locale) ? locale : "auto") as "auto",
    metadata: { userId: user.id, kind, generationId: generationId ?? "" },
    subscription_data: isSub ? { metadata: { userId: user.id } } : undefined,
    success_url: `${base}${sep}checkout=success&kind=${kind}${generationId ? `&generation=${generationId}` : ""}`,
    cancel_url: `${base}${sep}checkout=cancelled`,
  });
  return NextResponse.json({ url: session.url });
}
