// Job queue: BullMQ on Redis in production (separate worker service), in-process fallback
// for local development when REDIS_URL is not set.
import { Queue } from "bullmq";
import { getRedis } from "./redis";

export const QUEUE_NAME = "aidopost";

export type JobMap = {
  industry: { brandId: string };
  product: { sessionId: string; version: number };
  generate: { generationId: string };
  "cron:cleanup": Record<string, never>;
  "cron:grants": Record<string, never>;
};
export type JobName = keyof JobMap;

let queue: Queue | null = null;
export function getQueue(): Queue | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!queue) queue = new Queue(QUEUE_NAME, { connection: redis });
  return queue;
}

export async function enqueue<N extends JobName>(
  name: N,
  data: JobMap[N],
  opts: { jobId?: string; priority?: number } = {},
) {
  const q = getQueue();
  if (q) {
    await q.add(name, data, {
      jobId: opts.jobId,
      priority: opts.priority,
      attempts: 1,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
    return;
  }
  // Local dev: run in the background of the web process.
  const { runJob } = await import("./jobs");
  setImmediate(() => {
    runJob(name, data).catch((err) => console.error(`[job:${name}] failed`, err));
  });
}
