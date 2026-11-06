// Image generation with Gemini (Nano Banana family). Model IDs live in config (GEMINI_IMAGE_MODEL).
import { GoogleGenAI } from "@google/genai";
import { env } from "../env";
import { geminiImageCost, logAiCall } from "./log";
import { mockEnabled, mockImage } from "./mock";

let client: GoogleGenAI | null = null;
function gemini() {
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiKey });
  return client;
}

export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public code: "SAFETY_BLOCK" | "NO_IMAGE" | "RATE_LIMIT" | "UPSTREAM",
    public retryable: boolean,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateImage(opts: {
  prompt: string;
  references: Buffer[];
  aspectRatio: string;
  model?: string;
  generationId: string;
}): Promise<{ image: Buffer; mimeType: string; model: string; costUsd: number | null }> {
  const model = opts.model ?? env.geminiImageModel;
  if (mockEnabled()) {
    const seed = /Lifestyle/.test(opts.prompt) ? 1 : /Editorial/.test(opts.prompt) ? 2 : 0;
    return {
      image: await mockImage(opts.references, opts.aspectRatio, seed),
      mimeType: "image/png",
      model: "mock",
      costUsd: 0,
    };
  }
  let lastErr: unknown;
  // Exponential backoff on 429/5xx, max 2 retries (spec §6).
  for (let attempt = 0; attempt <= 2; attempt++) {
    const started = Date.now();
    try {
      const res = await gemini().models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              ...opts.references.map((r) => ({
                inlineData: { mimeType: "image/jpeg", data: r.toString("base64") },
              })),
              { text: opts.prompt },
            ],
          },
        ],
        config: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: opts.aspectRatio } },
      });
      const cand = res.candidates?.[0];
      const part = cand?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part?.inlineData?.data) {
        const reason = res.promptFeedback?.blockReason ?? cand?.finishReason ?? "unknown";
        const safety = /SAFETY|PROHIBITED|BLOCK|IMAGE_SAFETY|RECITATION/i.test(String(reason));
        throw new ImageGenerationError(
          `No image returned (${reason})`,
          safety ? "SAFETY_BLOCK" : "NO_IMAGE",
          !safety,
        );
      }
      const costUsd = geminiImageCost(model);
      await logAiCall({
        callType: "image",
        model,
        generationId: opts.generationId,
        latencyMs: Date.now() - started,
        costUsd,
        success: true,
      });
      return {
        image: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType ?? "image/png",
        model,
        costUsd,
      };
    } catch (err) {
      lastErr = err;
      await logAiCall({
        callType: "image",
        model,
        generationId: opts.generationId,
        latencyMs: Date.now() - started,
        success: false,
        error: String(err),
      });
      const status = (err as { status?: number }).status;
      const retryable =
        err instanceof ImageGenerationError
          ? err.retryable
          : status === 429 || (status !== undefined && status >= 500);
      if (!retryable || attempt === 2) break;
      await sleep(1000 * 2 ** attempt + Math.random() * 300);
    }
  }
  if (lastErr instanceof ImageGenerationError) throw lastErr;
  const status = (lastErr as { status?: number }).status;
  throw new ImageGenerationError(
    String(lastErr),
    status === 429 ? "RATE_LIMIT" : "UPSTREAM",
    false,
  );
}
