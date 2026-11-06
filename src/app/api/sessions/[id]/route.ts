import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessionView } from "@/lib/session-view";
import { requireUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const view = await sessionView((await params).id, user.id);
  return view ? NextResponse.json(view) : jsonError("NOT_FOUND", 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const body = z
    .object({
      style: z.enum(["minimalist", "casual", "premium"]).optional(),
      aspectRatio: z.enum(["1:1", "4:5", "9:16"]).optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("INVALID_INPUT");
  const session = await prisma.studioSession.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { generations: { where: { status: { not: "failed" } } } } } },
  });
  if (!session) return jsonError("NOT_FOUND", 404);
  if (session._count.generations > 0) return jsonError("LOCKED", 409);
  await prisma.studioSession.update({ where: { id }, data: body.data });
  return NextResponse.json(await sessionView(id, user.id));
}
