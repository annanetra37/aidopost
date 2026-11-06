import { Redis } from "ioredis";
import { env } from "./env";

const g = globalThis as unknown as { redis?: Redis | null };

/** Shared Redis connection, or null when REDIS_URL is not configured (local dev). */
export function getRedis(): Redis | null {
  if (g.redis !== undefined) return g.redis;
  g.redis = env.redisUrl ? new Redis(env.redisUrl, { maxRetriesPerRequest: null }) : null;
  return g.redis;
}
