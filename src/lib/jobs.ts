// Job handlers — the AI pipeline (spec §6). Executed by the worker (or in-process in dev).
import sharp from "sharp";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { env } from "./env";
import { commitCredit, grantMonthly, refundCredit } from "./credits";
import { deleteObject, getObject, putObject } from "./storage";
import { forAnalysis } from "./images";
import { PLANS, type VariantId } from "./plans";
import type { StyleId } from "./styles";
import type { JobMap, JobName } from "./queue";
import { classifyIndustry } from "./ai/industry";
import { analyseProduct, type ProductAnalysis } from "./ai/product";
import { writeScenePrompts, type ScenePrompts } from "./ai/prompts";
import { generateImage, ImageGenerationError } from "./ai/gemini";
import { checkFidelity } from "./ai/fidelity";
import { STRONGER_PRESERVATION } from "./ai/preservation";
import { AiRefusalError } from "./ai/claude";

export async function runJob<N extends JobName>(name: N, data: JobMap[N]) {
  switch (name) {
    case "industry":
      return runIndustry((data as JobMap["industry"]).brandId);
    case "product": {
      const d = data as JobMap["product"];
      return runProduct(d.sessionId, d.version);
    }
    case "generate":
      return runGenerate((data as JobMap["generate"]).generationId);
    case "cron:cleanup":
      return runCleanup();
    case "cron:grants":
      return runAnnualGrants();
  }
}

// ---------- varA: industry ----------
export async function runIndustry(brandId: string) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand || brand.industryId) return brand?.industryId ?? null;
  const industries = await prisma.industry.findMany({ orderBy: { sortOrder: "asc" } });
  const result = await classifyIndustry(
    brand.description,
    industries.map((i) => ({
      id: i.id,
      name: (i.nameTranslations as Record<string, string>).en ?? i.id,
      typicalProducts: i.typicalProducts,
    })),
  );
  await prisma.brand.update({
    where: { id: brandId },
    data: { industryId: result.industryId, industryConfidence: result.confidence },
  });
  return result.industryId;
}

// ---------- varB: product ----------
async function loadPhotos(sessionId: string) {
  const photos = await prisma.sessionPhoto.findMany({
    where: { sessionId },
    orderBy: { order: "asc" },
  });
  return Promise.all(photos.map((p) => getObject(p.storageKey)));
}

export async function runProduct(sessionId: string, version: number) {
  const session = await prisma.studioSession.findUnique({ where: { id: sessionId } });
  if (!session || session.analysisVersion !== version) return; // superseded by a newer upload
  const photos = await loadPhotos(sessionId);
  if (photos.length < 2) return;
  const small = await Promise.all(photos.map(forAnalysis));
  const analysis = await analyseProduct(small, sessionId);
  // Only store if no newer photo set arrived meanwhile.
  await prisma.studioSession.updateMany({
    where: { id: sessionId, analysisVersion: version },
    data: {
      productAnalysis: analysis as unknown as Prisma.InputJsonValue,
      prompts: Prisma.DbNull,
      status: "ready",
    },
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureProduct(sessionId: string): Promise<ProductAnalysis> {
  // Usually already done in the background while the user picked a style; wait briefly, then run inline.
  for (let i = 0; i < 30; i++) {
    const s = await prisma.studioSession.findUniqueOrThrow({ where: { id: sessionId } });
    if (s.productAnalysis && s.status === "ready")
      return s.productAnalysis as unknown as ProductAnalysis;
    if (s.status !== "analysing") break;
    await sleep(500);
  }
  const s = await prisma.studioSession.findUniqueOrThrow({ where: { id: sessionId } });
  await runProduct(sessionId, s.analysisVersion);
  const after = await prisma.studioSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (!after.productAnalysis) throw new Error("Product analysis unavailable");
  return after.productAnalysis as unknown as ProductAnalysis;
}

// ---------- generation ----------
class UserFacingError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function setStage(id: string, stage: string) {
  await prisma.generation.update({ where: { id }, data: { stage, status: "running" } });
}

export async function runGenerate(generationId: string) {
  const started = Date.now();
  const gen = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { session: { include: { brand: { include: { industry: true } }, user: true } } },
  });
  if (!gen || gen.status === "succeeded") return;
  const { session } = gen;
  const variant = gen.variant as VariantId;
  let cost = 0;

  try {
    // 1. Industry (varA) — reused for saved brands.
    await setStage(generationId, "analysing_brand");
    const industryId = session.brand.industryId ?? (await runIndustry(session.brandId));
    const industry = await prisma.industry.findUniqueOrThrow({ where: { id: industryId! } });

    // 2. Product (varB).
    await setStage(generationId, "recognising_product");
    const product = await ensureProduct(session.id);
    if (!product.same_product) {
      throw new UserFacingError("SAME_PRODUCT", "Photos show different products");
    }

    // 3. Prompts A/B/C — written once per session, cached for variants B and C.
    await setStage(generationId, "designing_scene");
    let prompts = session.prompts as unknown as ScenePrompts | null;
    const fresh = await prisma.studioSession.findUniqueOrThrow({ where: { id: session.id } });
    prompts = (fresh.prompts as unknown as ScenePrompts | null) ?? prompts;
    if (!prompts) {
      prompts = await writeScenePrompts({
        industry: {
          id: industry.id,
          name: (industry.nameTranslations as Record<string, string>).en ?? industry.id,
        },
        product,
        style: (session.style ?? "minimalist") as StyleId,
        brandDescription: session.brand.description,
        aspectRatio: session.aspectRatio,
        sessionId: session.id,
      });
      await prisma.studioSession.update({
        where: { id: session.id },
        data: { prompts: prompts as unknown as Prisma.InputJsonValue },
      });
    }

    // 4. Gemini image generation with all reference photos.
    await setStage(generationId, "lighting");
    const references = await loadPhotos(session.id);
    let result = await generateImage({
      prompt: prompts[variant],
      references,
      aspectRatio: session.aspectRatio,
      generationId,
    });
    cost += result.costUsd ?? 0;

    // 5. Fidelity check (feature flag) — one automatic retry with a stronger instruction, never charged twice.
    await setStage(generationId, "final_touches");
    let fidelityOk: boolean | null = null;
    if (env.fidelityCheck) {
      const refsSmall = await Promise.all(references.map(forAnalysis));
      const check = await checkFidelity(
        refsSmall,
        await forAnalysis(result.image),
        product.product_name,
        generationId,
      );
      fidelityOk = check.product_preserved;
      if (!fidelityOk) {
        console.warn(
          `[fidelity] ${generationId} failed: ${check.differences.join("; ")} — retrying`,
        );
        result = await generateImage({
          prompt: `${STRONGER_PRESERVATION}\n\n${prompts[variant]}`,
          references,
          aspectRatio: session.aspectRatio,
          generationId,
        });
        cost += result.costUsd ?? 0;
        const second = await checkFidelity(
          refsSmall,
          await forAnalysis(result.image),
          product.product_name,
          generationId,
        );
        fidelityOk = second.product_preserved;
      }
    }

    // Store the clean original as PNG; watermarking happens at download time.
    const png = await sharp(result.image).png().toBuffer({ resolveWithObject: true });
    const key = `generations/${session.userId}/${generationId}/clean.png`;
    await putObject(key, png.data, "image/png");

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: "succeeded",
        stage: "done",
        model: result.model,
        storageKeyClean: key,
        width: png.info.width,
        height: png.info.height,
        fidelityOk,
        latencyMs: Date.now() - started,
        costUsd: cost,
      },
    });
    await commitCredit(generationId);
    if (cost > 0.06)
      console.warn(`[cost] generation ${generationId} cost $${cost.toFixed(3)} (> $0.06 target)`);
  } catch (err) {
    const code =
      err instanceof UserFacingError
        ? err.code
        : err instanceof ImageGenerationError
          ? err.code
          : err instanceof AiRefusalError
            ? "AI_REFUSED"
            : "INTERNAL";
    console.error(`[generate] ${generationId} failed (${code})`, err);
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: "failed",
        stage: "failed",
        errorCode: code,
        error: String(err).slice(0, 1000),
        latencyMs: Date.now() - started,
        costUsd: cost,
      },
    });
    await refundCredit(generationId);
  }
}

// ---------- scheduled ----------
/** Delete abandoned sessions (no generations, older than 24h) and their uploads. */
export async function runCleanup() {
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
  const stale = await prisma.studioSession.findMany({
    where: { createdAt: { lt: cutoff }, generations: { none: {} } },
    include: { photos: true },
    take: 500,
  });
  for (const s of stale) {
    await Promise.allSettled(s.photos.map((p) => deleteObject(p.storageKey)));
    await prisma.studioSession.delete({ where: { id: s.id } });
  }
  console.info(`[cleanup] removed ${stale.length} abandoned sessions`);
}

/** Annual subscribers receive their allowance monthly; also a safety net for missed webhooks. */
export async function runAnnualGrants() {
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ["active", "trialing"] }, plan: { not: "free" } },
  });
  const now = new Date();
  for (const sub of subs) {
    const last = sub.lastGrantAt?.getTime() ?? 0;
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    if (last > monthAgo.getTime()) continue;
    const refId = `grant:${sub.id}:${now.toISOString().slice(0, 10)}`;
    if (await grantMonthly(sub.userId, PLANS[sub.plan].generations, refId)) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { lastGrantAt: now } });
    }
  }
}
