"use client";
// Paddle "default payment link": Paddle emails (e.g. "update your card") link to our site with
// ?_ptxn=txn_… — this opens that transaction's checkout on top of the page.
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { initializePaddle } from "@paddle/paddle-js";

const PADDLE_LOCALES = ["en", "ar", "de", "es", "sv", "tr"];

export function PaddlePaymentLink() {
  const locale = useLocale();
  useEffect(() => {
    const txn = new URLSearchParams(window.location.search).get("_ptxn");
    if (!txn) return;
    (async () => {
      const cfg = await fetch("/api/billing/paddle-config").then((r) => r.json()).catch(() => null);
      if (!cfg?.enabled) return;
      const paddle = await initializePaddle({ token: cfg.clientToken, environment: cfg.environment });
      paddle?.Checkout.open({
        transactionId: txn,
        settings: { displayMode: "overlay", theme: "light", locale: PADDLE_LOCALES.includes(locale) ? locale : "en" },
      });
    })();
  }, [locale]);
  return null;
}
