// Which payment provider takes the money, and its price IDs.
// Paddle (default) is a "merchant of record": it charges the card, handles VAT/sales tax worldwide
// and pays out to the seller's own bank account. Stripe is supported as an alternative.
export type Provider = "paddle" | "stripe";
export type CheckoutKind = "lite_monthly" | "lite_annual" | "pro_monthly" | "pro_annual" | "hd_image" | "credit_pack";
export const CHECKOUT_KINDS: CheckoutKind[] = ["lite_monthly", "lite_annual", "pro_monthly", "pro_annual", "hd_image", "credit_pack"];
export const SUBSCRIPTION_KINDS: CheckoutKind[] = ["lite_monthly", "lite_annual", "pro_monthly", "pro_annual"];

const o = (n: string) => process.env[n] ?? "";

export function activeProvider(): Provider {
  const p = o("BILLING_PROVIDER");
  if (p === "stripe" || p === "paddle") return p;
  return o("STRIPE_SECRET_KEY") && !o("PADDLE_API_KEY") ? "stripe" : "paddle";
}

export const PRICES: Record<Provider, Record<CheckoutKind, string>> = {
  paddle: {
    lite_monthly: o("PADDLE_PRICE_LITE_MONTHLY"),
    lite_annual: o("PADDLE_PRICE_LITE_ANNUAL"),
    pro_monthly: o("PADDLE_PRICE_PRO_MONTHLY"),
    pro_annual: o("PADDLE_PRICE_PRO_ANNUAL"),
    hd_image: o("PADDLE_PRICE_HD_IMAGE"),
    credit_pack: o("PADDLE_PRICE_CREDIT_PACK"),
  },
  stripe: {
    lite_monthly: o("STRIPE_PRICE_LITE_MONTHLY"),
    lite_annual: o("STRIPE_PRICE_LITE_ANNUAL"),
    pro_monthly: o("STRIPE_PRICE_PRO_MONTHLY"),
    pro_annual: o("STRIPE_PRICE_PRO_ANNUAL"),
    hd_image: o("STRIPE_PRICE_HD_IMAGE"),
    credit_pack: o("STRIPE_PRICE_CREDIT_PACK"),
  },
};

export const paddleConfig = {
  apiKey: o("PADDLE_API_KEY"),
  clientToken: o("PADDLE_CLIENT_TOKEN"),
  webhookSecret: o("PADDLE_WEBHOOK_SECRET"),
  environment: (o("PADDLE_ENVIRONMENT") === "production" ? "production" : "sandbox") as "production" | "sandbox",
};

export function isConfigured(provider: Provider, kind: CheckoutKind): boolean {
  if (!PRICES[provider][kind]) return false;
  return provider === "paddle" ? !!(paddleConfig.apiKey && paddleConfig.clientToken) : !!o("STRIPE_SECRET_KEY");
}

/** Map a provider price ID back to the plan it sells. */
export function planFromPrice(priceId: string | null | undefined): { plan: "lite" | "pro"; period: "monthly" | "annual" } | null {
  if (!priceId) return null;
  for (const provider of ["paddle", "stripe"] as const) {
    const p = PRICES[provider];
    if (priceId === p.lite_monthly) return { plan: "lite", period: "monthly" };
    if (priceId === p.lite_annual) return { plan: "lite", period: "annual" };
    if (priceId === p.pro_monthly) return { plan: "pro", period: "monthly" };
    if (priceId === p.pro_annual) return { plan: "pro", period: "annual" };
  }
  return null;
}

/** Response of POST /api/billing/checkout — the browser either redirects or opens Paddle's overlay. */
export type CheckoutStart =
  | { provider: "stripe"; url: string }
  | {
      provider: "paddle";
      transactionId: string;
      clientToken: string;
      environment: "production" | "sandbox";
      successUrl: string;
    };
