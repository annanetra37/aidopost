import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { paddlePortalUrl } from "@/lib/billing/paddle";
import { getStripe } from "@/lib/billing/stripe";
import { requireUser, jsonError } from "@/lib/session";

/** Link to the provider's self-service page: change plan, update card, download invoices, cancel. */
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!sub) return jsonError("NO_CUSTOMER", 404);
  const { locale = "en" } = await req.json().catch(() => ({}));
  if (sub.provider === "paddle") {
    return NextResponse.json({ url: await paddlePortalUrl(sub.providerCustomerId, sub.providerSubscriptionId) });
  }
  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.providerCustomerId,
    return_url: `${env.appUrl}/${locale}/studio`,
  });
  return NextResponse.json({ url: portal.url });
}
