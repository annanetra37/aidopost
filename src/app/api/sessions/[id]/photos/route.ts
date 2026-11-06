import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { enqueue } from "@/lib/queue";
import { putObject } from "@/lib/storage";
import { ImageValidationError, normaliseUpload } from "@/lib/images";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { sessionView } from "@/lib/session-view";
import { requireUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };
export const maxDuration = 60;

async function reanalyse(sessionId: string, photoCount: number) {
  // Product analysis (varB) starts as soon as the 2nd photo lands; re-runs when a 3rd is added/removed.
  const s = await prisma.studioSession.update({
    where: { id: sessionId },
    data: {
      analysisVersion: { increment: 1 },
      status: photoCount >= 2 ? "analysing" : "draft",
    },
  });
  await prisma.$executeRaw`UPDATE sessions SET product_analysis = NULL, prompts = NULL WHERE id = ${sessionId}`;
  if (photoCount >= 2) await enqueue("product", { sessionId, version: s.analysisVersion });
}

/** Upload one product photo (multipart field "file"). Server validates, converts HEIC, normalises to JPEG. */
export async function POST(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  if (!(await rateLimit(`upload:${user.id}`, LIMITS.upload.limit, LIMITS.upload.window)))
    return jsonError("RATE_LIMITED", 429);

  const session = await prisma.studioSession.findFirst({
    where: { id, userId: user.id },
    include: {
      photos: true,
      _count: { select: { generations: { where: { status: { not: "failed" } } } } },
    },
  });
  if (!session) return jsonError("NOT_FOUND", 404);
  if (session._count.generations > 0) return jsonError("LOCKED", 409);
  if (session.photos.length >= 3) return jsonError("MAX_PHOTOS");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("INVALID_INPUT");

  try {
    const { data, width, height } = await normaliseUpload(Buffer.from(await file.arrayBuffer()));
    const key = `uploads/${user.id}/${id}/${crypto.randomUUID()}.jpg`;
    await putObject(key, data, "image/jpeg");
    const order = Math.max(-1, ...session.photos.map((p) => p.order)) + 1;
    await prisma.sessionPhoto.create({
      data: { sessionId: id, storageKey: key, width, height, order },
    });
  } catch (err) {
    if (err instanceof ImageValidationError) return jsonError(err.code);
    throw err;
  }
  await reanalyse(id, session.photos.length + 1);
  return NextResponse.json(await sessionView(id, user.id), { status: 201 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const photoId = new URL(req.url).searchParams.get("photoId") ?? "";
  const session = await prisma.studioSession.findFirst({
    where: { id, userId: user.id },
    include: {
      _count: { select: { generations: { where: { status: { not: "failed" } } }, photos: true } },
    },
  });
  if (!session) return jsonError("NOT_FOUND", 404);
  if (session._count.generations > 0) return jsonError("LOCKED", 409);
  const del = await prisma.sessionPhoto.deleteMany({ where: { id: photoId, sessionId: id } });
  if (del.count) await reanalyse(id, session._count.photos - 1);
  return NextResponse.json(await sessionView(id, user.id));
}
