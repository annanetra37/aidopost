import { defineRouting } from "next-intl/routing";

export const LOCALES = ["en", "hy", "ar", "de", "tr", "sv", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const RTL_LOCALES: Locale[] = ["ar"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hy: "Հայերեն",
  ar: "العربية",
  de: "Deutsch",
  tr: "Türkçe",
  sv: "Svenska",
  es: "Español",
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365 },
});

export function dir(locale: string): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale as Locale) ? "rtl" : "ltr";
}
