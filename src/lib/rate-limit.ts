// Fixed-window rate limiter. Redis in production; in-memory fallback for local dev.
import { getRedis } from "./redis";

const memory = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const redis = getRedis();
  const k = `rl:${key}`;
  if (redis) {
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSec);
    return count <= limit;
  }
  const now = Date.now();
  const entry = memory.get(k);
  if (!entry || entry.resetAt < now) {
    memory.set(k, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

export const LIMITS = {
  generate: { limit: 10, window: 60 },
  brandFetch: { limit: 20, window: 3600 },
  signupPerIp: { limit: 5, window: 3600 },
  upload: { limit: 60, window: 3600 },
} as const;
