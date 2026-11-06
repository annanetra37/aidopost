import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AuthModalProvider } from "@/components/site/AuthModal";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PaddlePaymentLink } from "@/components/site/PaddlePaymentLink";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  return (
    <AuthModalProvider signedIn={!!session?.user}>
      <Header />
      <main>{children}</main>
      <Footer />
      <PaddlePaymentLink />
    </AuthModalProvider>
  );
}
