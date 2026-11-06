import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { grantTrial, normaliseEmail } from "@/lib/credits";
import { clientIp } from "@/lib/session";
import { env } from "@/lib/env";
import { LOCALES } from "@/i18n/routing";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale") ?? "en";
  const locale = (LOCALES as readonly string[]).includes(localeParam) ? localeParam : "en";
  const email = await consumeToken(url.searchParams.get("token") ?? "", "verify");
  if (!email) return NextResponse.redirect(`${env.appUrl}/${locale}/login?error=invalid_token`);
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await grantTrial(user.id, [normaliseEmail(email)], clientIp(req));
  return NextResponse.redirect(`${env.appUrl}/${locale}/login?verified=1`);
}
