import { NextResponse } from "next/server";
import { z } from "zod";
import { gatherBrandSources } from "@/lib/brand-fetch";
import { writeBrandDescription } from "@/lib/ai/brand-writer";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { requireUser, jsonError } from "@/lib/session";
import { LOCALES } from "@/i18n/routing";

export const maxDuration = 30;

/** Fetch a brand from name / website / social link → draft description in the UI language. */
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = z
    .object({ query: z.string().trim().min(2).max(300), locale: z.enum(LOCALES) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("INVALID_INPUT");
  if (
    !(await rateLimit(`brandfetch:${user.id}`, LIMITS.brandFetch.limit, LIMITS.brandFetch.window))
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const sources = await gatherBrandSources(body.data.query);
  if (sources.text.replace(/\s/g, "").length < 40) {
    return NextResponse.json({ found: false, sourceType: sources.type });
  }
  try {
    const draft = await writeBrandDescription(sources.text, body.data.locale, body.data.query);
    if (!draft.enough_information)
      return NextResponse.json({ found: false, sourceType: sources.type });
    return NextResponse.json({
      found: true,
      sourceType: sources.type,
      sourceUrl: sources.url ?? null,
      name: draft.brand_name,
      description: draft.description,
    });
  } catch (err) {
    console.error("[brands/fetch]", err);
    return NextResponse.json({ found: false, sourceType: sources.type });
  }
}
