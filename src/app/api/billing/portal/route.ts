import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { requireUser, jsonError } from "@/lib/session";

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  if (!sub) return jsonError("NO_CUSTOMER", 404);
  const { locale = "en" } = await req.json().catch(() => ({}));
  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${env.appUrl}/${locale}/studio`,
  });
  return NextResponse.json({ url: portal.url });
}
