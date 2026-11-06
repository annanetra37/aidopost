import { getTranslations } from "next-intl/server";

export async function LegalPage({
  titleKey,
  sections,
}: {
  titleKey: "termsTitle" | "privacyTitle" | "refundsTitle";
  sections: [string, string][];
}) {
  const t = await getTranslations("legal");
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{t(titleKey)}</h1>
      <p className="mt-2 text-sm text-muted">{t("updated", { date: "2026-11-06" })}</p>
      <p className="mt-4 rounded-2xl bg-accent-2/15 p-3 text-sm">{t("draft")}</p>
      <div className="mt-10 grid gap-8" lang="en" dir="ltr">
        {sections.map(([h, body]) => (
          <section key={h}>
            <h2 className="text-xl font-bold">{h}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
