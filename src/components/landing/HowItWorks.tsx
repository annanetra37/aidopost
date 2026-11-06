import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";

const ICONS = [
  "M4 5h16M4 10h10M4 15h16M4 20h8",
  "M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  "M5 12l4 4L19 6",
];

export function HowItWorks() {
  const t = useTranslations("how");
  const steps = [1, 2, 3] as const;
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          {t("kicker")}
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t("title")}
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((n, i) => (
          <Reveal key={n} delay={i * 0.1}>
            <div className="glass relative h-full overflow-hidden rounded-[28px] p-7">
              <span className="absolute -end-2 -top-6 font-display text-[120px] font-extrabold leading-none text-primary/10">
                {n}
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-soft">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ICONS[i]} />
                </svg>
              </span>
              <h3 className="mt-5 text-xl font-bold">{t(`s${n}title`)}</h3>
              <p className="mt-2 text-muted">{t(`s${n}text`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
