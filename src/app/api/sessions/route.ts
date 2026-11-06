import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/session";
import { enqueue } from "@/lib/queue";

/** Create a studio session for a brand. `copyFrom` reuses another session's photos ("Try another style"). */
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = z
    .object({
      brandId: z.string(),
      copyFrom: z.string().optional(),
      style: z.enum(["minimalist", "casual", "premium"]).optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("INVALID_INPUT");
  const brand = await prisma.brand.findFirst({ where: { id: body.data.brandId, userId: user.id } });
  if (!brand) return jsonError("NOT_FOUND", 404);

  let source = null;
  if (body.data.copyFrom) {
    source = await prisma.studioSession.findFirst({
      where: { id: body.data.copyFrom, userId: user.id },
      include: { photos: true },
    });
  }
  const session = await prisma.studioSession.create({
    data: {
      userId: user.id,
      brandId: brand.id,
      style: body.data.style,
      aspectRatio: source?.aspectRatio ?? "1:1",
      // Same photos → same product analysis; prompts are rewritten for the new style.
      productAnalysis: source?.productAnalysis ?? undefined,
      status: source?.productAnalysis ? "ready" : "draft",
      photos: source
        ? {
            create: source.photos.map((p) => ({
              storageKey: p.storageKey,
              width: p.width,
              height: p.height,
              order: p.order,
            })),
          }
        : undefined,
    },
  });
  if (source && !source.productAnalysis && source.photos.length >= 2) {
    await prisma.studioSession.update({
      where: { id: session.id },
      data: { status: "analysing", analysisVersion: 1 },
    });
    await enqueue("product", { sessionId: session.id, version: 1 });
  }
  return NextResponse.json({ id: session.id }, { status: 201 });
}

/** History: all past sessions with their images. */
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const sessions = await prisma.studioSession.findMany({
    where: { userId: user.id, generations: { some: { status: "succeeded" } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      brand: true,
      generations: { where: { status: "succeeded" }, orderBy: { variant: "asc" } },
    },
  });
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      brandName: s.brand.name,
      style: s.style,
      aspectRatio: s.aspectRatio,
      createdAt: s.createdAt,
      images: s.generations.map((g) => ({
        id: g.id,
        variant: g.variant,
        previewUrl: `/api/generations/${g.id}/preview`,
      })),
    })),
  });
}
