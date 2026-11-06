import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import { requireUser, jsonError } from "@/lib/session";
import { LOCALES } from "@/i18n/routing";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const [credits, sub] = await Promise.all([
    getBalance(user.id),
    prisma.subscription.findUnique({ where: { userId: user.id } }),
  ]);
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    plan: user.plan,
    uiLanguage: user.uiLanguage,
    credits,
    subscription: sub?.providerSubscriptionId
      ? { status: sub.status, period: sub.billingPeriod, currentPeriodEnd: sub.currentPeriodEnd }
      : null,
  });
}

export async function PATCH(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = z
    .object({ uiLanguage: z.enum(LOCALES) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("INVALID_INPUT");
  await prisma.user.update({ where: { id: user.id }, data: { uiLanguage: body.data.uiLanguage } });
  return NextResponse.json({ ok: true });
}
