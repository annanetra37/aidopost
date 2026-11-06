import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import {
  Inter,
  Plus_Jakarta_Sans,
  Noto_Sans_Armenian,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing, dir, LOCALES } from "@/i18n/routing";
import { env } from "@/lib/env";
import { Analytics } from "@/components/site/Analytics";
import { CookieBanner } from "@/components/site/CookieBanner";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const display = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display-face",
  weight: ["600", "700", "800"],
  display: "swap",
});
const armenian = Noto_Sans_Armenian({
  subsets: ["armenian"],
  variable: "--font-armenian",
  display: "swap",
});
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(env.appUrl),
    title: { default: t("title"), template: "%s · AidoPost" },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])), "x-default": "/en" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "AidoPost",
      locale,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0716" },
  ],
};

// Applies the stored theme before paint (no flash).
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      dir={dir(locale)}
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable} ${armenian.variable} ${arabic.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <CookieBanner />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
