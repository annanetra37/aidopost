import { useTranslations } from "next-intl";
import { CtaButton } from "../site/AuthModal";

export function FinalCta() {
  const t = useTranslations("finalCta");
  return (
    <section className="px-4 pb-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-fg px-6 py-16 text-center text-bg sm:px-12">
        <div className="blob-morph absolute -start-20 -top-20 h-72 w-72 bg-primary opacity-50 blur-3xl" />
        <div className="blob-morph absolute -bottom-24 -end-16 h-72 w-72 bg-accent opacity-40 blur-3xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 opacity-75">{t("subtitle")}</p>
          <div className="mt-8">
            <CtaButton>{t("cta")}</CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
