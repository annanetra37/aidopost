// Call 3 — Prompts A, B, C in one Claude Sonnet 5.5 call. Written in English regardless of UI language.
import { z } from "zod";
import { env } from "../env";
import { STYLES, type StyleId } from "../styles";
import { structuredCall } from "./claude";
import { hasPreservationBlock, preservationBlock, withPreservationBlock } from "./preservation";
import type { ProductAnalysis } from "./product";
import { mockEnabled, mockPrompts } from "./mock";

const PromptsSchema = z.object({
  A: z.object({ concept: z.string(), prompt: z.string() }),
  B: z.object({ concept: z.string(), prompt: z.string() }),
  C: z.object({ concept: z.string(), prompt: z.string() }),
});
export type ScenePrompts = {
  A: string;
  B: string;
  C: string;
  concepts: { A: string; B: string; C: string };
};

export interface PromptInputs {
  industry: { id: string; name: string };
  product: ProductAnalysis;
  style: StyleId;
  brandDescription: string;
  aspectRatio: string;
  sessionId?: string;
}

export async function writeScenePrompts(input: PromptInputs, attempt = 1): Promise<ScenePrompts> {
  const style = STYLES[input.style];
  const block = preservationBlock(input.product.product_name);
  const system = [
    "You are an award-winning commercial product photographer and art director writing prompts for an image-editing model.",
    "The model receives the customer's real product photos as references and must stage that exact product in a new scene.",
    "Write three clearly different scene concepts:",
    "A = studio / hero shot; B = lifestyle / in-use context; C = creative / editorial flat-lay or concept.",
    "Each prompt must be self-contained English prose (80–160 words) describing background, surface, props, lighting, camera angle, lens, depth of field and composition for the given aspect ratio, leaving clean space around the product for social media.",
    "Each prompt MUST begin with this preservation block, copied character-for-character:",
    `"""${block}"""`,
    "Never describe changes to the product itself. Never ask for text, logos, watermarks or faces.",
  ].join("\n");
  const user = [
    `Industry: ${input.industry.name} (${input.industry.id})`,
    `Brand description: ${input.brandDescription}`,
    `Product: ${JSON.stringify(input.product)}`,
    `Style: ${input.style} — background: ${style.background}; lighting: ${style.lighting}; props: ${style.props}; mood: ${style.mood}`,
    `Aspect ratio: ${input.aspectRatio}`,
  ].join("\n");

  const out = mockEnabled()
    ? await mockPrompts(input.product.product_name)
    : await structuredCall({
        callType: "prompts",
        model: env.claudePromptModel,
        effort: "medium",
        maxTokens: 8000,
        system,
        content: user,
        schema: PromptsSchema,
        sessionId: input.sessionId,
      });

  const name = input.product.product_name;
  const missing = (["A", "B", "C"] as const).filter(
    (v) => !hasPreservationBlock(out[v].prompt, name),
  );
  if (missing.length && attempt < 2) {
    console.warn(`[prompts] preservation block missing in ${missing.join(",")}; retrying`);
    return writeScenePrompts(input, attempt + 1);
  }
  // Last line of defence: insert the exact block ourselves.
  return {
    A: withPreservationBlock(out.A.prompt, name),
    B: withPreservationBlock(out.B.prompt, name),
    C: withPreservationBlock(out.C.prompt, name),
    concepts: { A: out.A.concept, B: out.B.concept, C: out.C.concept },
  };
}
