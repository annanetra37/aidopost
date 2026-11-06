import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getObject, objectExists, putObject, signedUrl } from "@/lib/storage";
import { renderDownload } from "@/lib/images";
import { entitlementFor } from "@/lib/entitlements";
import type { AspectRatio } from "@/lib/plans";
import { requireUser, jsonError } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };
export const maxDuration = 60;

/**
 * Plan-aware download (spec §4). Free → 1024px with ribbon. HD purchase → clean 2048px.
 * Lite → clean up to 2048px, Pro → up to 4096px (upscaled on demand), any allowed aspect ratio.
 * The clean original is always kept, so upgrading unlocks every past image.
 */
export async function GET(req: Request, { params }: Ctx) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const url = new URL(req.url);
  const gen = await prisma.generation.findFirst({
    where: { id, session: { userId: user.id } },
    include: { session: true },
  });
  if (!gen?.storageKeyClean) return jsonError("NOT_FOUND", 404);

  const ent = await entitlementFor(user.id, user.plan, id);
  const requested = Number(url.searchParams.get("size") ?? ent.maxPx);
  const size = [1024, 2048, 4096].includes(requested) ? Math.min(requested, ent.maxPx) : ent.maxPx;
  const ratioParam = url.searchParams.get("ratio") as AspectRatio | null;
  const ratio = ratioParam && ent.ratios.includes(ratioParam) ? ratioParam : undefined;
  const watermark = !ent.clean;

  const key = gen.storageKeyClean.replace(
    "clean.png",
    `dl_${size}_${(ratio ?? "orig").replace(":", "x")}_${watermark ? "wm" : "clean"}.jpg`,
  );
  if (!(await objectExists(key))) {
    const out = await renderDownload(await getObject(gen.storageKeyClean), {
      size,
      ratio,
      watermark,
    });
    await putObject(key, out, "image/jpeg");
  }
  const filename = `aidopost-${gen.variant.toLowerCase()}-${size}${ratio ? `-${ratio.replace(":", "x")}` : ""}.jpg`;
  const signed = await signedUrl(key, filename);
  if (signed) return NextResponse.redirect(signed);
  return new Response(new Uint8Array(await getObject(key)), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
