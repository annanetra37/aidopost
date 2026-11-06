"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export const STAGES = [
  "queued",
  "analysing_brand",
  "recognising_product",
  "designing_scene",
  "lighting",
  "final_touches",
  "done",
] as const;

/** Light, airy progress screen driven by real backend stages (via SSE). */
export function LoadingScreen({ stage }: { stage: string }) {
  const t = useTranslations("studio.loading");
  const tips = t.raw("tips") as string[];
  const [tip, setTip] = useState(0);
  const [creep, setCreep] = useState(0);
  const idx = Math.max(0, STAGES.indexOf(stage as (typeof STAGES)[number]));

  useEffect(() => {
    const iv = setInterval(() => setTip((i) => (i + 1) % tips.length), 4500);
    return () => clearInterval(iv);
  }, [tips.length]);

  // Creep forward within a stage so long steps (image generation) still feel alive.
  useEffect(() => {
    setCreep(0);
    const iv = setInterval(() => setCreep((c) => Math.min(0.9, c + (1 - c) * 0.06)), 400);
    return () => clearInterval(iv);
  }, [idx]);

  const pct = Math.min(100, ((idx + creep) / (STAGES.length - 1)) * 100);
  const visible = STAGES.slice(1, -1);

  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-48 w-48">
        <div className="blob-morph absolute inset-0 bg-gradient-to-br from-violet-300 via-pink-300 to-amber-200 opacity-80 blur-sm dark:from-violet-600 dark:via-pink-600 dark:to-amber-500" />
        <div className="blob-morph absolute inset-6 bg-white/50 backdrop-blur [animation-delay:-3s] dark:bg-white/10" />
        <div className="absolute inset-0 grid place-items-center">
          <svg
            viewBox="0 0 48 48"
            className="h-14 w-14 text-white drop-shadow"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <rect x="6" y="14" width="36" height="26" rx="6" />
            <circle cx="24" cy="27" r="7" />
            <path d="M17 14l3-5h8l3 5" />
          </svg>
        </div>
      </div>
      <h2 className="mt-8 font-display text-2xl font-extrabold tracking-tight">{t("title")}</h2>
      <p className="mt-1 text-sm font-medium text-primary">{t(`stages.${STAGES[idx]}`)}…</p>
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-4 flex w-full justify-between gap-1 text-[11px] text-muted">
        {visible.map((s, i) => (
          <li key={s} className={`flex-1 ${i + 1 <= idx ? "font-semibold text-fg" : ""}`}>
            {t(`stages.${s}`)}
          </li>
        ))}
      </ol>
      <div className="glass mt-10 w-full rounded-3xl p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          {t("funFact")}
        </p>
        <p key={tip} className="mt-2 animate-[fadeIn_.5s_ease] text-sm">
          {tips[tip]}
        </p>
      </div>
    </div>
  );
}
