import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/site/AuthForm";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    verified?: string;
    error?: string;
    callbackUrl?: string;
    mode?: string;
    code?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const session = await auth();
  const callbackPath = sp.callbackUrl?.startsWith(`/${locale}/`)
    ? sp.callbackUrl.slice(locale.length + 1)
    : "/studio";
  if (session?.user) redirect(`/${locale}${callbackPath}`);
  const t = await getTranslations("auth");
  const errCode = sp.code ?? sp.error;
  const error = errCode
    ? t.has(`errors.${errCode}`)
      ? t(`errors.${errCode}`)
      : t("errors.generic")
    : null;
  return (
    <div className="relative">
      <div className="mesh">
        <span />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-4 py-16">
        <div className="rounded-[28px] border border-line bg-card-solid p-7 shadow-soft">
          <AuthForm
            initialMode={sp.verified || sp.mode === "login" ? "login" : "signup"}
            callbackPath={callbackPath}
            notice={sp.verified ? t("verified") : null}
            initialError={error}
          />
        </div>
      </div>
    </div>
  );
}
