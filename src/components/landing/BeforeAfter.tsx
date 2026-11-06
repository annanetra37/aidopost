"use client";
import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ProductScene, type ArtProduct, type ArtStyle } from "../art/ProductScene";
import { dir } from "@/i18n/routing";

/** Interactive before/after slider: phone photo → AidoPost result. Keyboard accessible. */
export function BeforeAfter({
  product = "perfume",
  style = "premium",
}: {
  product?: ArtProduct;
  style?: ArtStyle;
}) {
  const t = useTranslations("hero");
  const rtl = dir(useLocale()) === "rtl";
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (clientX: number) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      let p = ((clientX - r.left) / r.width) * 100;
      if (rtl) p = 100 - p;
      setPos(Math.max(2, Math.min(98, p)));
    },
    [rtl],
  );

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-[32px] shadow-soft ring-1 ring-line"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons === 1 && move(e.clientX)}
    >
      <ProductScene product={product} style={style} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{ clipPath: rtl ? `inset(0 0 0 ${100 - pos}%)` : `inset(0 ${100 - pos}% 0 0)` }}
      >
        <ProductScene product={product} style="phone" className="absolute inset-0 h-full w-full" />
      </div>
      <span className="glass absolute start-4 top-4 rounded-full px-3 py-1 text-xs font-semibold">
        {t("before")}
      </span>
      <span className="absolute end-4 top-4 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
        {t("after")}
      </span>
      <div
        className="absolute inset-y-0 w-0.5 bg-white/90 shadow"
        style={{ insetInlineStart: `${pos}%` }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label={t("sliderLabel")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 4;
            const fwd = rtl ? "ArrowLeft" : "ArrowRight";
            const back = rtl ? "ArrowRight" : "ArrowLeft";
            if (e.key === fwd) setPos((p) => Math.min(98, p + step));
            if (e.key === back) setPos((p) => Math.max(2, p - step));
          }}
          className="focus-ring absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-white text-violet-700 shadow-lg rtl:translate-x-1/2"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
