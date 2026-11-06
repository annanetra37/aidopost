import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetForm } from "./ResetForm";

export default async function ResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token = "" } = await searchParams;
  const t = await getTranslations("auth");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-[28px] border border-line bg-card-solid p-7 shadow-soft">
        <h1 className="mb-5 font-display text-2xl font-extrabold">{t("resetTitle")}</h1>
        <ResetForm token={token} />
      </div>
    </div>
  );
}
