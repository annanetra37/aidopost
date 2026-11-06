// Serialises a studio session for the client.
import { prisma } from "./db";
import type { ProductAnalysis } from "./ai/product";

export async function sessionView(sessionId: string, userId: string) {
  const s = await prisma.studioSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      photos: { orderBy: { order: "asc" } },
      generations: { orderBy: { variant: "asc" } },
      brand: { include: { industry: true } },
    },
  });
  if (!s) return null;
  const analysis = s.productAnalysis as ProductAnalysis | null;
  return {
    id: s.id,
    style: s.style,
    aspectRatio: s.aspectRatio,
    status: s.status,
    createdAt: s.createdAt,
    brand: {
      id: s.brand.id,
      name: s.brand.name,
      industryId: s.brand.industryId,
      industryNames: s.brand.industry?.nameTranslations ?? null,
    },
    photos: s.photos.map((p) => ({
      id: p.id,
      url: `/api/sessions/${s.id}/photos/${p.id}`,
      width: p.width,
      height: p.height,
    })),
    analysis: analysis
      ? {
          productType: analysis.product_type,
          productName: analysis.product_name,
          sameProduct: analysis.same_product,
          photoIssues: analysis.photo_issues,
        }
      : null,
    locked: s.generations.some((g) => g.status !== "failed"),
    generations: s.generations.map((g) => ({
      id: g.id,
      variant: g.variant,
      status: g.status,
      stage: g.stage,
      errorCode: g.errorCode,
      previewUrl: g.status === "succeeded" ? `/api/generations/${g.id}/preview` : null,
      createdAt: g.createdAt,
    })),
  };
}
