import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { enqueue } from "@/lib/queue";
import { PLANS } from "@/lib/plans";
import { requireUser, jsonError } from "@/lib/session";
import { LOCALES } from "@/i18n/routing";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const brands = await prisma.brand.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { industry: true },
  });
  return NextResponse.json({
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      sourceType: b.sourceType,
      industryId: b.industryId,
      industryNames: b.industry?.nameTranslations ?? null,
    })),
    limit: Number.isFinite(PLANS[user.plan].savedBrands) ? PLANS[user.plan].savedBrands : null,
  });
}

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(30).max(1000),
  sourceType: z.enum(["typed", "website", "social", "name"]),
  sourceUrl: z.string().url().max(500).optional().nullable(),
  language: z.enum(LOCALES),
});

/** Save an approved brand and start industry classification (varA) in the background. */
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("INVALID_INPUT", 400, { issues: parsed.error.issues });

  const limit = PLANS[user.plan].savedBrands;
  const count = await prisma.brand.count({ where: { userId: user.id } });
  if (count >= limit) return jsonError("BRAND_LIMIT", 403, { limit });

  const brand = await prisma.brand.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      descriptionLanguage: parsed.data.language,
      sourceType: parsed.data.sourceType,
      sourceUrl: parsed.data.sourceUrl ?? null,
    },
  });
  await enqueue("industry", { brandId: brand.id }, { jobId: `industry-${brand.id}` });
  return NextResponse.json(
    { brand: { id: brand.id, name: brand.name, description: brand.description } },
    { status: 201 },
  );
}

export async function DELETE(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await prisma.brand.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
