import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CtaButton } from "../site/AuthModal";
import { BeforeAfter } from "./BeforeAfter";
import { Reveal } from "./Reveal";

export function Hero() {
  const t = useTranslations("hero");
  return (
    <section className="relative overflow-hidden">
      <div className="mesh">
        <span />
      </div>
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <Reveal>
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> {t("badge")}
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tighter sm:text-6xl lg:text-7xl">
            {t("title1")}
            <br />
            <span className="text-gradient">{t("title2")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">{t("subtitle")}</p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <CtaButton>{t("cta")}</CtaButton>
            <Link
              href="/#examples"
              className="focus-ring inline-flex h-14 items-center rounded-full px-6 font-semibold hover:bg-bg-soft"
            >
              {t("secondary")}
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted">✓ {t("ctaNote")}</p>
          <div className="mt-10 flex items-center gap-3 text-sm text-muted">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {["#f9a8d4", "#c4b5fd", "#fcd34d", "#86efac"].map((c, i) => (
                <span
                  key={c}
                  className="grid h-8 w-8 place-items-center rounded-full border-2 border-bg text-xs font-bold text-white"
                  style={{ background: c }}
                >
                  {"ANSE"[i]}
                </span>
              ))}
            </div>
            {t("trust")}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="relative">
            <div className="blob-morph absolute -inset-6 -z-10 bg-brand opacity-25 blur-2xl" />
            <BeforeAfter />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
