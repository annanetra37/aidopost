import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "./db";

/** Returns the signed-in user or a 401 response. */
export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id)
    return {
      user: null,
      error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }),
    } as const;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user)
    return {
      user: null,
      error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }),
    } as const;
  return { user, error: null } as const;
}

export function jsonError(code: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: code, ...extra }, { status });
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
