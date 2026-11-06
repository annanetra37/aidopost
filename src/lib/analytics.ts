"use client";
// Product analytics (PostHog). Only initialised after cookie consent. Funnel events (spec US-23):
// visit → signup → first_image → download → paid
import posthog from "posthog-js";

let ready = false;

export function initAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (ready || !key || typeof window === "undefined") return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    capture_pageview: true,
    persistence: "localStorage+cookie",
  });
  ready = true;
}

export type FunnelEvent =
  | "cta_click"
  | "signup"
  | "brand_saved"
  | "first_image"
  | "image_generated"
  | "download"
  | "checkout_started"
  | "paid";

export function track(event: FunnelEvent, props: Record<string, unknown> = {}) {
  if (ready) posthog.capture(event, props);
}

export function identify(id: string, props: Record<string, unknown> = {}) {
  if (ready) posthog.identify(id, props);
}
