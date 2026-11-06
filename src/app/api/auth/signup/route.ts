import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isDisposableEmail } from "@/lib/disposable-email";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp, jsonError } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/auth-emails";
import { LOCALES } from "@/i18n/routing";

const Body = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(200),
  name: z.string().max(100).optional(),
  locale: z.enum(LOCALES).default("en"),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("INVALID_INPUT");
  const { password, name, locale } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const ip = clientIp(req);
  if (!(await rateLimit(`signup:${ip}`, LIMITS.signupPerIp.limit, LIMITS.signupPerIp.window))) {
    return jsonError("RATE_LIMITED", 429);
  }
  if (isDisposableEmail(email)) return jsonError("DISPOSABLE_EMAIL");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerified) return jsonError("EMAIL_TAKEN", 409);

  const passwordHash = await bcrypt.hash(password, 11);
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: name ?? existing.name, uiLanguage: locale },
    });
  } else {
    await prisma.user.create({
      data: { email, passwordHash, name, uiLanguage: locale, authProvider: "email" },
    });
  }
  await sendVerificationEmail(email, locale);
  return NextResponse.json({ ok: true });
}
