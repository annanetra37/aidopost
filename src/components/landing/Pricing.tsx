"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PLANS, annualSavingsPct, type Period, type PlanId } from "@/lib/plans";
import { track } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout-client";
import { useAuthModal } from "../site/AuthModal";

function features(id: PlanId, t: ReturnType<typeof useTranslations>) {
  const p = PLANS[id];
  return [
    id === "free" ? t("f_generations_free") : t("f_generations", { count: p.generations }),
    id === "free" ? t("f_quality_free") : id === "lite" ? t("f_quality_lite") : t("f_quality_pro"),
    p.watermark ? t("f_watermark") : t("f_nowatermark"),
    !Number.isFinite(p.savedBrands)
      ? t("f_brands_unlimited")
      : p.savedBrands === 1
        ? t("f_brands_one")
        : t("f_brands", { count: p.savedBrands }),
    p.aspectRatios.length > 1 ? t("f_formats_all") : t("f_formats_square"),
    ...(p.commercialLicence ? [t("f_licence")] : []),
    ...(p.priorityQueue ? [t("f_priority")] : []),
    p.support === "help_centre"
      ? t("f_support_help")
      : p.support === "email"
        ? t("f_support_email")
        : t("f_support_priority"),
  ];
}

/**
 * Pricing cards. On the website, paid CTAs go to sign-up (or straight to Checkout when signed in);
 * in the studio the same component powers the paywall.
 */
export function PricingCards({
  currentPlan,
  compact = false,
  returnPath = "/studio",
}: {
  currentPlan?: PlanId;
  compact?: boolean;
  returnPath?: string;
}) {
  const t = useTranslations("pricing");
  const te = useTranslations("studio.errors");
  const locale = useLocale();
  const { openAuth, signedIn } = useAuthModal();
  const [period, setPeriod] = useState<Period>("annual");
  const [busy, setBusy] = useState<string | null>(null);
  const maxSave = Math.max(annualSavingsPct(PLANS.lite), annualSavingsPct(PLANS.pro));

  async function choose(id: PlanId) {
    if (id === "free") {
      if (!signedIn) openAuth("signup");
      else window.location.href = `/${locale}/studio`;
      return;
    }
    if (!signedIn) return openAuth("signup");
    setBusy(id);
    track("checkout_started", { plan: id, period });
    try {
      await startCheckout({ kind: `${id}_${period}`, locale, returnPath });
    } catch (e) {
      const code = (e as Error).message;
      alert(te.has(code) ? te(code) : te("generic"));
    } finally {
      setBusy(null);
    }
  }

  const plans: PlanId[] = compact ? ["lite", "pro"] : ["free", "lite", "pro"];

  return (
    <div>
      <div className="flex justify-center">
        <div className="glass inline-flex rounded-full p-1">
          {(["monthly", "annual"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`focus-ring rounded-full px-5 py-2 text-sm font-semibold transition ${period === p ? "bg-fg text-bg" : "text-muted"}`}
            >
              {t(p)}
              {p === "annual" && (
                <span className="ms-2 rounded-full bg-ok/15 px-2 py-0.5 text-xs text-ok">
                  {t("save", { pct: maxSave })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`mx-auto mt-10 grid gap-5 ${compact ? "max-w-3xl md:grid-cols-2" : "md:grid-cols-3"}`}
      >
        {plans.map((id) => {
          const p = PLANS[id];
          const popular = id === "pro";
          const price = period === "annual" ? p.priceAnnualPerMonth : p.priceMonthly;
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-[28px] p-7 ${popular ? "bg-fg text-bg shadow-soft" : "glass"}`}
            >
              {popular && (
                <span className="absolute -top-3 start-7 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                  {t("popular")}
                </span>
              )}
              <h3 className="text-lg font-bold">{t(id)}</h3>
              <p className={`text-sm ${popular ? "opacity-70" : "text-muted"}`}>
                {t(`${id}Tagline`)}
              </p>
              <p className="mt-5 flex items-end gap-1">
                <span className="font-display text-5xl font-extrabold tracking-tight">
                  ${price}
                </span>
                {id !== "free" && (
                  <span className={`pb-2 text-sm ${popular ? "opacity-70" : "text-muted"}`}>
                    {t("perMonth")}
                  </span>
                )}
              </p>
              <p className={`min-h-5 text-xs ${popular ? "opacity-60" : "text-muted"}`}>
                {id === "free"
                  ? ""
                  : period === "annual"
                    ? t("billedAnnually", { total: p.priceAnnualPerMonth * 12 })
                    : t("billedMonthly")}
              </p>
              <ul className="mt-6 grid flex-1 gap-2.5 text-sm">
                {features(id, t).map((f) => (
                  <li key={f} className="flex gap-2">
                    <svg
                      viewBox="0 0 20 20"
                      className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? "text-accent" : "text-primary"}`}
                      fill="currentColor"
                    >
                      <path d="M7.6 13.2 4.4 10l-1.4 1.4 4.6 4.6 9.4-9.4L15.6 5Z" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={currentPlan === id || busy === id}
                onClick={() => choose(id)}
                className={`focus-ring mt-7 h-12 rounded-full font-semibold transition disabled:opacity-50 ${popular ? "bg-brand text-white hover:brightness-110" : "border border-line bg-card-solid hover:-translate-y-0.5"}`}
              >
                {currentPlan === id
                  ? t("current")
                  : busy === id
                    ? "…"
                    : id === "free"
                      ? t("ctaFree")
                      : t("ctaPaid", { plan: t(id) })}
              </button>
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          {t("notes")} <br /> {t("vat")}
        </p>
      )}
    </div>
  );
}

export function PricingSection() {
  const t = useTranslations("pricing");
  return (
    <section id="pricing" className="relative scroll-mt-24 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t("kicker")}
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("title")}
          </h2>
        </div>
        <div className="mt-10">
          <PricingCards />
        </div>
      </div>
    </section>
  );
}
