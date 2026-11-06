// Credit ledger service (spec §6 failure handling, §7 data model).
// Balance = SUM(credit_ledger.delta). Credits live in buckets so monthly allowances can expire
// (no rollover) without touching purchased packs or the free trial.
import { Prisma, PrismaClient, type CreditBucket } from "@prisma/client";
import { prisma as defaultPrisma } from "./db";
import { TRIAL_CREDITS } from "./plans";

type Tx = Prisma.TransactionClient;

/** Spend order: expiring monthly credits first, then trial, then purchased packs. */
export const SPEND_ORDER: CreditBucket[] = ["monthly", "trial", "pack"];

export class InsufficientCreditsError extends Error {
  code = "NO_CREDITS" as const;
  constructor() {
    super("Not enough credits");
  }
}

async function lockUser(tx: Tx, userId: string) {
  // Serialise all ledger writes for one user so reserve can't double-spend.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
}

export async function bucketBalances(tx: Tx | PrismaClient, userId: string) {
  const rows = await tx.creditLedger.groupBy({
    by: ["bucket"],
    where: { userId },
    _sum: { delta: true },
  });
  const out: Record<CreditBucket, number> = { trial: 0, monthly: 0, pack: 0 };
  for (const r of rows) out[r.bucket] = r._sum.delta ?? 0;
  return out;
}

export async function getBalance(
  userId: string,
  db: PrismaClient = defaultPrisma,
): Promise<number> {
  const agg = await db.creditLedger.aggregate({ where: { userId }, _sum: { delta: true } });
  return agg._sum.delta ?? 0;
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Reserve one credit for a generation. Idempotent per generation. */
export async function reserveCredit(
  userId: string,
  generationId: string,
  db: PrismaClient = defaultPrisma,
) {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const existing = await tx.creditLedger.findUnique({
      where: { refId: `reserve:${generationId}` },
    });
    if (existing) return existing;
    const balances = await bucketBalances(tx, userId);
    const bucket = SPEND_ORDER.find((b) => balances[b] > 0);
    if (!bucket) throw new InsufficientCreditsError();
    return tx.creditLedger.create({
      data: {
        userId,
        delta: -1,
        bucket,
        reason: "reserve",
        generationId,
        refId: `reserve:${generationId}`,
      },
    });
  });
}

/** Mark a reserved credit as spent (generation succeeded). */
export async function commitCredit(generationId: string, db: PrismaClient = defaultPrisma) {
  await db.creditLedger.updateMany({
    where: { refId: `reserve:${generationId}`, reason: "reserve" },
    data: { reason: "spend" },
  });
}

/** Return a reserved credit (any failure). Idempotent; no-op if nothing was reserved. */
export async function refundCredit(generationId: string, db: PrismaClient = defaultPrisma) {
  const reserve = await db.creditLedger.findUnique({ where: { refId: `reserve:${generationId}` } });
  if (!reserve) return null;
  try {
    return await db.creditLedger.create({
      data: {
        userId: reserve.userId,
        delta: 1,
        bucket: reserve.bucket,
        reason: "refund",
        generationId,
        refId: `refund:${generationId}`,
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return null;
    throw e;
  }
}

/**
 * Grant the free trial once per real identity (verified email, OAuth account).
 * Returns true if credits were granted.
 */
export async function grantTrial(
  userId: string,
  identities: string[],
  ip?: string | null,
  db: PrismaClient = defaultPrisma,
): Promise<boolean> {
  const ids = [...new Set(identities.filter(Boolean))];
  try {
    return await db.$transaction(async (tx) => {
      await lockUser(tx, userId);
      const claimed = await tx.trialClaim.findFirst({ where: { identity: { in: ids } } });
      if (claimed) return false;
      await tx.trialClaim.createMany({
        data: ids.map((identity) => ({ identity, userId, ip: ip ?? null })),
      });
      await tx.creditLedger.create({
        data: {
          userId,
          delta: TRIAL_CREDITS,
          bucket: "trial",
          reason: "trial",
          refId: `trial:${userId}`,
        },
      });
      return true;
    });
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

/** Reset the monthly bucket to `allowance` (unused monthly credits expire). Idempotent by refId. */
export async function grantMonthly(
  userId: string,
  allowance: number,
  refId: string,
  db: PrismaClient = defaultPrisma,
): Promise<boolean> {
  try {
    return await db.$transaction(async (tx) => {
      await lockUser(tx, userId);
      if (await tx.creditLedger.findUnique({ where: { refId } })) return false;
      const { monthly } = await bucketBalances(tx, userId);
      if (monthly > 0) {
        await tx.creditLedger.create({
          data: { userId, delta: -monthly, bucket: "monthly", reason: "monthly_expire" },
        });
      }
      await tx.creditLedger.create({
        data: { userId, delta: allowance, bucket: "monthly", reason: "monthly_grant", refId },
      });
      return true;
    });
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

/** Expire whatever is left in the monthly bucket (subscription ended). */
export async function expireMonthly(userId: string, db: PrismaClient = defaultPrisma) {
  await db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const { monthly } = await bucketBalances(tx, userId);
    if (monthly > 0) {
      await tx.creditLedger.create({
        data: { userId, delta: -monthly, bucket: "monthly", reason: "monthly_expire" },
      });
    }
  });
}

export async function grantPack(
  userId: string,
  credits: number,
  refId: string,
  db: PrismaClient = defaultPrisma,
) {
  try {
    await db.creditLedger.create({
      data: { userId, delta: credits, bucket: "pack", reason: "pack", refId },
    });
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

/** Normalise an email for trial-abuse checks: lowercase, strip +tags, gmail dots. */
export function normaliseEmail(email: string): string {
  const [rawLocal, rawDomain = ""] = email.trim().toLowerCase().split("@");
  let local = rawLocal.split("+")[0];
  const domain = rawDomain === "googlemail.com" ? "gmail.com" : rawDomain;
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}
