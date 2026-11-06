// Call 1 — Industry (varA). Claude Haiku 5.5, picks the nearest of the fixed industries.
import { z } from "zod";
import { env } from "../env";
import { structuredCall } from "./claude";
import { mockEnabled, mockIndustry } from "./mock";

export interface IndustryOption {
  id: string;
  name: string;
  typicalProducts: string;
}

export async function classifyIndustry(description: string, industries: IndustryOption[]) {
  const ids = industries.map((i) => i.id) as [string, ...string[]];
  const schema = z.object({
    industry_id: z.enum(ids),
    confidence: z.number().describe("0 to 1"),
  });
  const list = industries.map((i) => `- ${i.id}: ${i.name} (e.g. ${i.typicalProducts})`).join("\n");
  const out = mockEnabled()
    ? await mockIndustry(description, ids)
    : await structuredCall({
        callType: "industry",
        model: env.claudeFastModel,
        effort: "low",
        maxTokens: 1000,
        system:
          "You classify small businesses into exactly one industry from a fixed list. " +
          "Always choose the nearest match, even when none fits perfectly, and report your confidence from 0 to 1. " +
          "The description may be in any language.",
        content: `Industries:\n${list}\n\nBusiness description:\n"""${description}"""`,
        schema,
      });
  const confidence = Math.max(0, Math.min(1, out.confidence));
  if (confidence < 0.5)
    console.warn(`[industry] low confidence ${confidence} → ${out.industry_id}`);
  return { industryId: out.industry_id, confidence };
}
