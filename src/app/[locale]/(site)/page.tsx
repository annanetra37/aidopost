import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Examples } from "@/components/landing/Examples";
import { Bento } from "@/components/landing/Bento";
import { PricingSection } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <HowItWorks />
      <Examples />
      <Bento />
      <PricingSection />
      <Faq />
      <FinalCta />
    </>
  );
}
