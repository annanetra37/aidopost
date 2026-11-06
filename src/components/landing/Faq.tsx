import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";

export function Faq() {
  const t = useTranslations("faq");
  const items = [1, 2, 3, 4, 5, 6];
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20">
      <Reveal>
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-primary">
          {t("kicker")}
        </p>
        <h2 className="mt-2 text-center font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("title")}
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-3">
        {items.map((n) => (
          <details key={n} className="glass group rounded-3xl p-5 open:shadow-soft">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {t(`q${n}`)}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg-soft transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-muted">{t(`a${n}`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
