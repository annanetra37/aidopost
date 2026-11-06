// Thin wrapper over the Anthropic SDK: structured JSON outputs (Zod), refusal handling,
// and per-call logging of model / latency / tokens / cost (spec §6).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { env } from "../env";
import { claudeCost, logAiCall } from "./log";

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: env.anthropicKey || undefined, maxRetries: 2 });
  return client;
}

export class AiRefusalError extends Error {
  code = "AI_REFUSED" as const;
}

export interface StructuredCallOptions<T extends z.ZodType> {
  callType: string;
  model: string;
  system: string;
  content: Anthropic.ContentBlockParam[] | string;
  schema: T;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
  sessionId?: string | null;
  generationId?: string | null;
}

export async function structuredCall<T extends z.ZodType>(
  opts: StructuredCallOptions<T>,
): Promise<z.infer<T>> {
  const started = Date.now();
  try {
    const res = await anthropic().messages.parse({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 4000,
      system: opts.system,
      messages: [{ role: "user", content: opts.content }],
      output_config: { format: zodOutputFormat(opts.schema), effort: opts.effort ?? "low" },
    });
    if (res.stop_reason === "refusal") {
      throw new AiRefusalError(`Claude declined (${res.stop_details?.category ?? "unknown"})`);
    }
    if (res.parsed_output == null)
      throw new Error(`No structured output (stop_reason=${res.stop_reason})`);
    await logAiCall({
      callType: opts.callType,
      model: opts.model,
      sessionId: opts.sessionId,
      generationId: opts.generationId,
      tokensIn: res.usage.input_tokens,
      tokensOut: res.usage.output_tokens,
      latencyMs: Date.now() - started,
      costUsd: claudeCost(opts.model, res.usage.input_tokens, res.usage.output_tokens),
      success: true,
    });
    return res.parsed_output as z.infer<T>;
  } catch (err) {
    await logAiCall({
      callType: opts.callType,
      model: opts.model,
      sessionId: opts.sessionId,
      generationId: opts.generationId,
      latencyMs: Date.now() - started,
      success: false,
      error: String(err),
    });
    throw err;
  }
}

export function imageBlock(jpeg: Buffer): Anthropic.ImageBlockParam {
  return {
    type: "image",
    source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") },
  };
}
