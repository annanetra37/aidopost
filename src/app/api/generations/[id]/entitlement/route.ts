import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { entitlementFor } from "@/lib/entitlements";
import { allowedSizes } from "@/lib/plans";
import { requireUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const gen = await prisma.generation.findFirst({
    where: { id, session: { userId: user.id }, status: "succeeded" },
  });
  if (!gen) return jsonError("NOT_FOUND", 404);
  const ent = await entitlementFor(user.id, user.plan, id);
  return NextResponse.json({
    plan: user.plan,
    ...ent,
    sizes: allowedSizes(user.plan, ent.purchased),
  });
}
