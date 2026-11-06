import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueue } from "@/lib/queue";
import { InsufficientCreditsError, reserveCredit, getBalance } from "@/lib/credits";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { PLANS, VARIANTS, type AspectRatio } from "@/lib/plans";
import { requireUser, jsonError } from "@/lib/session";
import type { ProductAnalysis } from "@/lib/ai/product";

type Ctx = { params: Promise<{ id: string }> };

/** Reserve a credit and start the next variant (A, then B, then C). */
export async function POST(_req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  if (!(await rateLimit(`generate:${user.id}`, LIMITS.generate.limit, LIMITS.generate.window))) {
    return jsonError("RATE_LIMITED", 429);
  }

  const session = await prisma.studioSession.findFirst({
    where: { id, userId: user.id },
    include: { photos: true, generations: true },
  });
  if (!session) return jsonError("NOT_FOUND", 404);
  if (session.photos.length < 2) return jsonError("NEED_PHOTOS");
  if (!session.style) return jsonError("NEED_STYLE");
  if (!PLANS[user.plan].aspectRatios.includes(session.aspectRatio as AspectRatio))
    return jsonError("RATIO_NOT_ALLOWED", 403);
  const analysis = session.productAnalysis as ProductAnalysis | null;
  if (analysis && !analysis.same_product) return jsonError("SAME_PRODUCT");

  // Idempotent: if a variant is already in flight, return it.
  const inFlight = session.generations.find((g) => g.status === "queued" || g.status === "running");
  if (inFlight) return NextResponse.json({ generationId: inFlight.id, variant: inFlight.variant });

  const done = new Set(
    session.generations.filter((g) => g.status === "succeeded").map((g) => g.variant),
  );
  const variant = VARIANTS.find((v) => !done.has(v));
  if (!variant) return jsonError("ALL_VARIANTS_USED");

  const existing = session.generations.find((g) => g.variant === variant); // a failed attempt → retry it
  const gen = existing
    ? await prisma.generation.update({
        where: { id: existing.id },
        data: {
          status: "queued",
          stage: "queued",
          error: null,
          errorCode: null,
          createdAt: new Date(),
        },
      })
    : await prisma.generation.create({ data: { sessionId: id, variant } });

  try {
    // Retries of a failed (refunded) attempt need a fresh reservation key.
    await prisma.creditLedger.updateMany({
      where: { generationId: gen.id, refId: { in: [`reserve:${gen.id}`, `refund:${gen.id}`] } },
      data: { refId: null },
    });
    await reserveCredit(user.id, gen.id);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      await prisma.generation.update({
        where: { id: gen.id },
        data: { status: "failed", stage: "failed", errorCode: "NO_CREDITS" },
      });
      return jsonError("NO_CREDITS", 402);
    }
    throw err;
  }

  await enqueue(
    "generate",
    { generationId: gen.id },
    { priority: PLANS[user.plan].priorityQueue ? 1 : 5 },
  );
  return NextResponse.json(
    { generationId: gen.id, variant, credits: await getBalance(user.id) },
    { status: 202 },
  );
}
