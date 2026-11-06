import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, jsonError } from "@/lib/session";
import { sendResetEmail } from "@/lib/auth-emails";

export async function POST(req: Request) {
  const body = z
    .object({ email: z.email(), locale: z.string().default("en") })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("INVALID_INPUT");
  if (!(await rateLimit(`reset:${clientIp(req)}`, 5, 3600))) return jsonError("RATE_LIMITED", 429);
  const email = body.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Always answer OK so the endpoint can't be used to discover accounts.
  if (user) await sendResetEmail(email, body.data.locale);
  return NextResponse.json({ ok: true });
}
