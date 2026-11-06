// Sends signed Paddle notifications through the real webhook route and checks the database effects.
import crypto from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SECRET = "pdl_ntfset_test_secret";
process.env.PADDLE_API_KEY = "pdl_sdbx_apikey_test";
process.env.PADDLE_WEBHOOK_SECRET = SECRET;
process.env.PADDLE_PRICE_LITE_MONTHLY = "pri_lite_monthly_test";
process.env.PADDLE_PRICE_CREDIT_PACK = "pri_pack_test";

const hasDb = !!process.env.DATABASE_URL;

function signed(body: object, secret = SECRET) {
  const raw = JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000);
  const h1 = crypto.createHmac("sha256", secret).update(`${ts}:${raw}`).digest("hex");
  return new Request("http://localhost/api/webhooks/paddle", {
    method: "POST",
    headers: { "paddle-signature": `ts=${ts};h1=${h1}`, "content-type": "application/json" },
    body: raw,
  });
}

const now = new Date().toISOString();
const event = (type: string, data: object) => ({
  event_id: `evt_${crypto.randomUUID()}`,
  event_type: type,
  occurred_at: now,
  notification_id: `ntf_${crypto.randomUUID()}`,
  data,
});
// A complete price object, shaped like Paddle sends it.
const price = (id: string, amount: string, interval: "month" | null) => ({
  id,
  product_id: "pro_test",
  description: id,
  type: "standard",
  name: id,
  billing_cycle: interval ? { interval, frequency: 1 } : null,
  trial_period: null,
  tax_mode: "account_setting",
  unit_price: { amount, currency_code: "USD" },
  unit_price_overrides: [],
  quantity: { minimum: 1, maximum: 1 },
  status: "active",
  custom_data: null,
  import_meta: null,
  created_at: now,
  updated_at: now,
});
const txn = (id: string, extra: object) => ({
  id,
  status: "completed",
  customer_id: "ctm_test_1",
  address_id: null,
  business_id: null,
  currency_code: "USD",
  origin: "web",
  subscription_id: null,
  invoice_id: null,
  invoice_number: null,
  collection_mode: "automatic",
  discount_id: null,
  billing_details: null,
  billing_period: null,
  items: [],
  details: {
    tax_rates_used: [],
    totals: { subtotal: "500", tax: "0", discount: "0", total: "500", grand_total: "500", fee: null, earnings: null, currency_code: "USD" },
    adjusted_totals: null,
    payout_totals: null,
    adjusted_payout_totals: null,
    line_items: [],
  },
  payments: [],
  checkout: null,
  created_at: now,
  updated_at: now,
  billed_at: now,
  ...extra,
});

describe.skipIf(!hasDb)("Paddle webhook", () => {
  let POST: (req: Request) => Promise<Response>;
  let prisma: typeof import("@/lib/db").prisma;
  let getBalance: typeof import("@/lib/credits").getBalance;
  let userId: string;

  beforeAll(async () => {
    ({ POST } = await import("./route"));
    ({ prisma } = await import("@/lib/db"));
    ({ getBalance } = await import("@/lib/credits"));
    await prisma.subscription.deleteMany({ where: { providerCustomerId: "ctm_test_1" } });
    const u = await prisma.user.create({ data: { email: `paddle${Date.now()}@test.dev` } });
    userId = u.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("rejects a bad signature", async () => {
    const res = await POST(signed(event("transaction.completed", txn("txn_bad", {})), "wrong-secret"));
    expect(res.status).toBe(400);
  });

  it("adds 20 credits for a credit pack, once", async () => {
    const body = event("transaction.completed", txn("txn_pack_1", { custom_data: { userId, kind: "credit_pack" }, items: [{ price: price("pri_pack_test", "500", null), quantity: 1 }] }));
    expect((await POST(signed(body))).status).toBe(200);
    expect((await POST(signed(body))).status).toBe(200); // Paddle retries — must not double-grant
    expect(await getBalance(userId)).toBe(20);
    const p = await prisma.purchase.findUnique({ where: { providerRef: "txn_pack_1" } });
    expect(p?.status).toBe("paid");
    expect(p?.amount).toBe(500);
  });

  it("activates Lite and grants 40 monthly credits on a subscription payment", async () => {
    const body = event(
      "transaction.completed",
      txn("txn_sub_1", {
        origin: "web",
        subscription_id: "sub_test_1",
        custom_data: { userId, kind: "lite_monthly" },
        billing_period: { starts_at: now, ends_at: new Date(Date.now() + 30 * 864e5).toISOString() },
        items: [{ price: price("pri_lite_monthly_test", "1500", "month"), quantity: 1 }],
      }),
    );
    expect((await POST(signed(body))).status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.plan).toBe("lite");
    expect(await getBalance(userId)).toBe(60);
    const sub = await prisma.subscription.findUniqueOrThrow({ where: { userId } });
    expect(sub.provider).toBe("paddle");
    expect(sub.providerSubscriptionId).toBe("sub_test_1");
  });

  it("returns the user to Free when the subscription is canceled", async () => {
    const body = event("subscription.canceled", {
      id: "sub_test_1",
      status: "canceled",
      customer_id: "ctm_test_1",
      address_id: "add_1",
      business_id: null,
      currency_code: "USD",
      created_at: now,
      updated_at: now,
      started_at: now,
      first_billed_at: now,
      next_billed_at: null,
      paused_at: null,
      canceled_at: now,
      discount: null,
      collection_mode: "automatic",
      billing_details: null,
      current_billing_period: null,
      billing_cycle: { interval: "month", frequency: 1 },
      scheduled_change: null,
      items: [{ status: "inactive", quantity: 1, recurring: true, created_at: now, updated_at: now, previously_billed_at: now, next_billed_at: null, trial_dates: null, price: price("pri_lite_monthly_test", "1500", "month"), product: null }],
      custom_data: null,
      import_meta: null,
    });
    expect((await POST(signed(body))).status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.plan).toBe("free");
    expect(await getBalance(userId)).toBe(20); // monthly credits expire, the purchased pack stays
  });
});
