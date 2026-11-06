import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  const fallback = locale === "en" ? messages : (await import(`../messages/en.json`)).default;
  return {
    locale,
    messages: deepMerge(fallback, messages),
    onError: () => {},
  };
});

type Obj = Record<string, unknown>;
function deepMerge(base: Obj, over: Obj): Obj {
  const out: Obj = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) && typeof base[k] === "object"
        ? deepMerge(base[k] as Obj, v as Obj)
        : v;
  }
  return out;
}
