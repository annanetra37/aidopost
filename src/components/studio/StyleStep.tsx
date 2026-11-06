"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ProductScene } from "../art/ProductScene";
import { PLANS, type AspectRatio } from "@/lib/plans";
import { useStudio } from "./StudioContext";
import { artFor } from "./artFor";
import type { SessionView } from "./api";

const STYLE_IDS = ["minimalist", "casual", "premium"] as const;
const RATIOS: { id: AspectRatio; key: "square" | "portrait" | "story"; box: string }[] = [
  { id: "1:1", key: "square", box: "h-6 w-6" },
  { id: "4:5", key: "portrait", box: "h-7 w-[22px]" },
  { id: "9:16", key: "story", box: "h-8 w-[18px]" },
];

export function StyleStep({
  session,
  onSuggest,
  onBack,
  busy,
}: {
  session: SessionView;
  onSuggest: (style: SessionView["style"] & string, ratio: AspectRatio) => void;
  onBack: () => void;
  busy: boolean;
}) {
  const t = useTranslations("studio.style");
  const tc = useTranslations("common");
  const { me, openPaywall } = useStudio();
  const plan = me?.plan ?? "free";
  const [style, setStyle] = useState<(typeof STYLE_IDS)[number]>(session.style ?? "minimalist");
  const [ratio, setRatio] = useState<AspectRatio>(
    PLANS[plan].aspectRatios.includes(session.aspectRatio) ? session.aspectRatio : "1:1",
  );
  const art = artFor(session.analysis?.productType, session.brand.industryId);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      <div role="radiogroup" className="mt-8 grid gap-4 sm:grid-cols-3">
        {STYLE_IDS.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={style === s}
            onClick={() => setStyle(s)}
            className={`focus-ring group overflow-hidden rounded-[28px] border-2 bg-card-solid text-start transition hover:-translate-y-1 ${style === s ? "border-primary shadow-soft" : "border-transparent"}`}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <ProductScene
                product={art}
                style={s}
                className="h-full w-full transition duration-500 group-hover:scale-105"
              />
              {style === s && (
                <span className="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
                  ✓
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold">{t(s)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`${s}Text`)}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">{t("ratio")}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {RATIOS.map((r) => {
            const allowed = PLANS[plan].aspectRatios.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => (allowed ? setRatio(r.id) : openPaywall())}
                aria-pressed={ratio === r.id}
                className={`focus-ring flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${ratio === r.id ? "border-primary bg-primary/5 font-semibold" : "border-line"} ${allowed ? "" : "opacity-60"}`}
              >
                <span className={`rounded-md border-2 border-current ${r.box}`} />
                <span className="text-start">
                  {t(r.key)} <span className="text-muted">{r.id}</span>
                  {!allowed && <span className="block text-xs text-primary">{t("paidOnly")}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-fg"
        >
          ← {tc("back")}
        </button>
        <div className="flex flex-col items-end">
          <button
            onClick={() => onSuggest(style, ratio)}
            disabled={busy}
            className="focus-ring group relative h-14 overflow-hidden rounded-full bg-brand px-10 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            ✨ {t("suggest")}
          </button>
          <span className="mt-1.5 text-xs text-muted">{t("usesCredit")}</span>
        </div>
      </div>
    </div>
  );
}
