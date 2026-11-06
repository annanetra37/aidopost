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
          <ul className="mt-10 grid gap-3 sm:max-w-xl">
            {(["proof1", "proof2", "proof3"] as const).map((k) => (
              <li key={k} className="flex items-center gap-3 text-base font-semibold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white shadow-soft">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M7.6 13.2 4.4 10l-1.4 1.4 4.6 4.6 9.4-9.4L15.6 5Z" />
                  </svg>
                </span>
                {t(k)}
              </li>
            ))}
          </ul>
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
