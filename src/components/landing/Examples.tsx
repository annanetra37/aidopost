"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { INDUSTRIES } from "@/lib/industries";
import { ProductScene, type ArtProduct } from "../art/ProductScene";
import { Reveal } from "./Reveal";

const STYLE_IDS = ["minimalist", "casual", "premium"] as const;
const BY_INDUSTRY: Record<string, ArtProduct[]> = {
  fashion_apparel: ["sneaker"],
  jewellery_accessories: ["ring", "watch"],
  beauty_cosmetics: ["perfume", "serum"],
  food_beverage: ["tea"],
  home_interior: ["candle", "mug"],
  electronics_gadgets: ["headphones"],
  health_wellness: ["serum", "tea"],
  arts_crafts_handmade: ["mug", "candle"],
  kids_toys: ["toy"],
  sports_outdoors: ["sneaker"],
};

export function Examples() {
  const t = useTranslations("examples");
  const ts = useTranslations("studio.style");
  const locale = useLocale();
  const [industry, setIndustry] = useState<string>("all");
  const [style, setStyle] = useState<string>("all");

  const items = useMemo(() => {
    const out: {
      key: string;
      product: ArtProduct;
      style: (typeof STYLE_IDS)[number];
      industry: string;
    }[] = [];
    for (const ind of INDUSTRIES) {
      if (industry !== "all" && ind.id !== industry) continue;
      for (const product of BY_INDUSTRY[ind.id]) {
        for (const s of STYLE_IDS) {
          if (style !== "all" && s !== style) continue;
          out.push({ key: `${ind.id}-${product}-${s}`, product, style: s, industry: ind.id });
        }
      }
    }
    return out.slice(0, 18);
  }, [industry, style]);

  const chip = (active: boolean) =>
    `focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-fg text-bg" : "glass hover:bg-bg-soft"}`;

  return (
    <section id="examples" className="relative scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {t("kicker")}
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("title")}
          </h2>
        </Reveal>
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          <button className={chip(industry === "all")} onClick={() => setIndustry("all")}>
            {t("all")}
          </button>
          {INDUSTRIES.map((i) => (
            <button
              key={i.id}
              className={chip(industry === i.id)}
              onClick={() => setIndustry(i.id)}
            >
              {i.names[locale] ?? i.names.en}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button className={chip(style === "all")} onClick={() => setStyle("all")}>
            {t("allStyles")}
          </button>
          {STYLE_IDS.map((s) => (
            <button key={s} className={chip(style === s)} onClick={() => setStyle(s)}>
              {ts(s)}
            </button>
          ))}
        </div>
      </div>
      <div className="marquee mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee-track flex w-max gap-5 px-4">
          {[...items, ...items].map((it, i) => (
            <figure
              key={`${it.key}-${i}`}
              className="group relative h-64 w-64 shrink-0 overflow-hidden rounded-[28px] shadow-soft ring-1 ring-line sm:h-72 sm:w-72"
              aria-hidden={i >= items.length}
            >
              <ProductScene
                product={it.product}
                style={it.style}
                className="h-full w-full transition duration-500 group-hover:scale-105"
              />
              <figcaption className="glass absolute bottom-3 start-3 rounded-full px-3 py-1 text-xs font-semibold">
                {ts(it.style)}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
