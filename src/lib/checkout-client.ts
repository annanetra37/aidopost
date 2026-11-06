"use client";
// Starts a payment in the browser. Stripe → redirect to its hosted page.
// Paddle → open Paddle's checkout overlay on top of our page, then go to the success URL.
import { initializePaddle } from "@paddle/paddle-js";
import type { CheckoutKind, CheckoutStart } from "./billing/config";

// Languages Paddle's checkout UI is shown in; others fall back to English.
const PADDLE_LOCALES = ["en", "ar", "de", "es", "sv", "tr"];

export class CheckoutError extends Error {}

export async function startCheckout(input: {
  kind: CheckoutKind;
  locale: string;
  returnPath?: string;
  generationId?: string | null;
}): Promise<void> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, generationId: input.generationId ?? undefined }),
  });
  const data = (await res.json().catch(() => ({}))) as CheckoutStart & { error?: string };
  if (!res.ok) throw new CheckoutError(data.error ?? "generic");

  if (data.provider === "stripe") {
    window.location.href = data.url;
    return;
  }
  const instance = await initializePaddle({
    token: data.clientToken,
    environment: data.environment,
    eventCallback: (e) => {
      if (e.name === "checkout.completed") {
        // Webhooks update the plan/credits; give them a moment, then land on the success page.
        setTimeout(() => (window.location.href = data.successUrl), 1500);
      }
    },
  });
  if (!instance) throw new CheckoutError("generic");
  instance.Checkout.open({
    transactionId: data.transactionId,
    settings: {
      displayMode: "overlay",
      theme: "light",
      locale: PADDLE_LOCALES.includes(input.locale) ? input.locale : "en",
    },
  });
}
