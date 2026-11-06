import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricingSection } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("pricing"), alternates: { canonical: `/${locale}/pricing` } };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="relative">
      <div className="mesh">
        <span />
      </div>
      <div className="relative z-10">
        <PricingSection />
        <Faq />
      </div>
    </div>
  );
}
