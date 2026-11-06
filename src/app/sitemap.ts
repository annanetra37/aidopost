import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/routing";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/pricing", "/terms", "/privacy", "/refunds"];
  return pages.flatMap((p) =>
    LOCALES.map((l) => ({
      url: `${env.appUrl}/${l}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.6,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((x) => [x, `${env.appUrl}/${x}${p}`])),
      },
    })),
  );
}
