import { prisma } from "../db";

// USD per 1M tokens (input, output). Keep in sync with provider pricing pages.
const CLAUDE_PRICES: Record<string, [number, number]> = {
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-sonnet-5-5": [2, 10],
  "claude-opus-5-5": [4, 20],
};

// Approximate USD per generated image (third-party reports — confirm on Google's pricing page).
const GEMINI_IMAGE_PRICES: Record<string, number> = {
  "gemini-2.5-flash-image": 0.039,
  "gemini-3-pro-image-preview": 0.134,
};

export function claudeCost(model: string, tokensIn = 0, tokensOut = 0): number | null {
  const p = CLAUDE_PRICES[model];
  return p ? (tokensIn * p[0] + tokensOut * p[1]) / 1_000_000 : null;
}

export function geminiImageCost(model: string): number | null {
  return GEMINI_IMAGE_PRICES[model] ?? null;
}

export interface AiLogEntry {
  callType: string;
  model: string;
  generationId?: string | null;
  sessionId?: string | null;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
  costUsd?: number | null;
  success: boolean;
  error?: string;
}

export async function logAiCall(e: AiLogEntry) {
  try {
    await prisma.aiCallLog.create({
      data: {
        callType: e.callType,
        model: e.model,
        generationId: e.generationId ?? null,
        sessionId: e.sessionId ?? null,
        tokensIn: e.tokensIn,
        tokensOut: e.tokensOut,
        latencyMs: e.latencyMs,
        costUsd: e.costUsd ?? null,
        success: e.success,
        error: e.error?.slice(0, 1000),
      },
    });
  } catch (err) {
    console.error("[ai-log] failed to write log", err);
  }
}
