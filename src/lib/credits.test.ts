import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  commitCredit,
  getBalance,
  grantMonthly,
  grantPack,
  grantTrial,
  InsufficientCreditsError,
  normaliseEmail,
  refundCredit,
  reserveCredit,
  bucketBalances,
} from "./credits";

describe("normaliseEmail", () => {
  it("strips plus tags and gmail dots", () => {
    expect(normaliseEmail("Jane.Doe+promo@GoogleMail.com")).toBe("janedoe@gmail.com");
    expect(normaliseEmail("a.b+x@example.com")).toBe("a.b@example.com");
  });
});

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("credit ledger (integration)", () => {
  const db = new PrismaClient();
  let userId: string;

  beforeEach(async () => {
    const u = await db.user.create({ data: { email: `t${Date.now()}${Math.random()}@test.dev` } });
    userId = u.id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { endsWith: "@test.dev" } } });
    await db.trialClaim.deleteMany({ where: { identity: { contains: "@trial.test" } } });
    await db.$disconnect();
  });

  it("grants the trial once per identity", async () => {
    const id = `x${Date.now()}@trial.test`;
    expect(await grantTrial(userId, [id], null, db)).toBe(true);
    expect(await getBalance(userId, db)).toBe(5);
    const other = await db.user.create({ data: { email: `o${Date.now()}@test.dev` } });
    expect(await grantTrial(other.id, [id], null, db)).toBe(false);
    expect(await getBalance(other.id, db)).toBe(0);
  });

  it("reserves, commits and refunds", async () => {
    await grantPack(userId, 2, `pack-${userId}`, db);
    await reserveCredit(userId, "gen1", db);
    await reserveCredit(userId, "gen1", db); // idempotent
    expect(await getBalance(userId, db)).toBe(1);
    await commitCredit("gen1", db);
    await reserveCredit(userId, "gen2", db);
    expect(await getBalance(userId, db)).toBe(0);
    await expect(reserveCredit(userId, "gen3", db)).rejects.toBeInstanceOf(
      InsufficientCreditsError,
    );
    await refundCredit("gen2", db);
    await refundCredit("gen2", db); // idempotent
    expect(await getBalance(userId, db)).toBe(1);
  });

  it("never double-spends under concurrency", async () => {
    await grantPack(userId, 3, `pack-c-${userId}`, db);
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) => reserveCredit(userId, `c-${userId}-${i}`, db)),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(await getBalance(userId, db)).toBe(0);
  });

  it("monthly credits don't roll over and are spent first", async () => {
    await grantPack(userId, 20, `pack-m-${userId}`, db);
    await grantMonthly(userId, 40, `m1-${userId}`, db);
    await reserveCredit(userId, `m-${userId}`, db);
    let b = await bucketBalances(db, userId);
    expect(b.monthly).toBe(39);
    expect(b.pack).toBe(20);
    await grantMonthly(userId, 40, `m2-${userId}`, db);
    await grantMonthly(userId, 40, `m2-${userId}`, db); // idempotent
    b = await bucketBalances(db, userId);
    expect(b.monthly).toBe(40);
    expect(await getBalance(userId, db)).toBe(60);
  });
});
