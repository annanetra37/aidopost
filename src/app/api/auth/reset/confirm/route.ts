import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { jsonError } from "@/lib/session";

export async function POST(req: Request) {
  const body = z
    .object({ token: z.string(), password: z.string().min(8).max(200) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("INVALID_INPUT");
  const email = await consumeToken(body.data.token, "reset");
  if (!email) return jsonError("INVALID_TOKEN");
  await prisma.user.update({
    where: { email },
    data: { passwordHash: await bcrypt.hash(body.data.password, 11), emailVerified: new Date() },
  });
  return NextResponse.json({ ok: true });
}
