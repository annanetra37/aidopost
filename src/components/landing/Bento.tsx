import Image from "next/image";
import { useTranslations } from "next-intl";
import ringBefore from "../../../public/hero/ring-before.webp";
import ringAfter from "../../../public/hero/ring-after.webp";
import { LOCALE_LABELS, LOCALES } from "@/i18n/routing";
import { ProductScene } from "../art/ProductScene";
import { Reveal } from "./Reveal";

export function Bento() {
  const t = useTranslations("benefits");
  const th = useTranslations("hero");
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          {t("kicker")}
        </p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("title")}
        </h2>
      </Reveal>
      <div className="mt-12 grid auto-rows-[minmax(180px,auto)] gap-4 md:grid-cols-6">
        <Reveal className="md:col-span-4 md:row-span-2">
          <div className="glass flex h-full flex-col overflow-hidden rounded-[28px] p-7 md:flex-row md:items-center md:gap-6">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold">{t("exactTitle")}</h3>
              <p className="mt-2 text-muted">{t("exactText")}</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:mt-0 md:w-1/2">
              <Image
                src={ringBefore}
                alt={th("beforeAlt")}
                sizes="240px"
                placeholder="blur"
                className="aspect-square w-full rounded-2xl object-cover"
              />
              <Image
                src={ringAfter}
                alt={th("afterAlt")}
                sizes="240px"
                placeholder="blur"
                className="aspect-square w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </Reveal>
        <Reveal className="md:col-span-2" delay={0.05}>
          <div className="h-full rounded-[28px] bg-brand p-7 text-white shadow-soft">
            <h3 className="text-2xl font-bold">{t("langTitle")}</h3>
            <p className="mt-2 text-white/85">{t("langText")}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {LOCALES.map((l) => (
                <span
                  key={l}
                  lang={l}
                  className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold"
                >
                  {LOCALE_LABELS[l]}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal className="md:col-span-2" delay={0.1}>
          <div className="glass h-full rounded-[28px] p-7">
            <div className="flex -space-x-6 rtl:space-x-reverse">
              {(["minimalist", "casual", "premium"] as const).map((s) => (
                <ProductScene
                  key={s}
                  product="candle"
                  style={s}
                  className="h-20 w-20 rounded-2xl ring-4 ring-bg"
                />
              ))}
            </div>
            <h3 className="mt-4 text-xl font-bold">{t("variantsTitle")}</h3>
            <p className="mt-1 text-sm text-muted">{t("variantsText")}</p>
          </div>
        </Reveal>
        {(
          [
            ["sizes", "M4 4h16v16H4zM8 4v16M4 9h16"],
            ["speed", "M13 2 4 14h7l-1 8 9-12h-7l1-8Z"],
            ["brand", "M12 21s-7-4.4-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.6-7 11-7 11Z"],
          ] as const
        ).map(([k, d], i) => (
          <Reveal key={k} className="md:col-span-2" delay={0.1 + i * 0.05}>
            <div className="glass h-full rounded-[28px] p-7">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <path d={d} />
                </svg>
              </span>
              <h3 className="mt-4 text-xl font-bold">{t(`${k}Title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`${k}Text`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
