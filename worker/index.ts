// BullMQ worker service (Railway "worker"): Claude + Gemini jobs, fidelity checks, scheduled jobs.
import http from "http";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { QUEUE_NAME, getQueue, type JobName } from "@/lib/queue";
import { runJob } from "@/lib/jobs";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL is required for the worker");
  process.exit(1);
}

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 8);

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const t = Date.now();
    await runJob(job.name as JobName, job.data);
    console.info(`[worker] ${job.name} ${job.id} done in ${Date.now() - t}ms`);
  },
  { connection, concurrency },
);

worker.on("failed", (job, err) => console.error(`[worker] ${job?.name} ${job?.id} failed`, err));

async function scheduleCrons() {
  const q = getQueue()!;
  await q.upsertJobScheduler(
    "cleanup-daily",
    { pattern: "17 3 * * *" },
    { name: "cron:cleanup", data: {} },
  );
  await q.upsertJobScheduler(
    "grants-daily",
    { pattern: "41 4 * * *" },
    { name: "cron:grants", data: {} },
  );
}
scheduleCrons().catch((e) => console.error("[worker] cron scheduling failed", e));

// Tiny health endpoint for Railway.
http
  .createServer((req, res) => {
    res.writeHead(worker.isRunning() ? 200 : 503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: worker.isRunning() }));
  })
  .listen(Number(process.env.PORT ?? 8080));

console.info(`[worker] listening on queue "${QUEUE_NAME}" with concurrency ${concurrency}`);

async function shutdown() {
  await worker.close();
  await connection.quit();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
