"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "./api";
import { DownloadModal } from "./DownloadModal";

type HistorySession = {
  id: string;
  brandName: string;
  style: string | null;
  aspectRatio: string;
  createdAt: string;
  images: { id: string; variant: string; previewUrl: string }[];
};

export function History() {
  const t = useTranslations("studio.historyPage");
  const ts = useTranslations("studio.style");
  const [sessions, setSessions] = useState<HistorySession[] | null>(null);
  const [download, setDownload] = useState<{ gen: string; session: string } | null>(null);
  useEffect(() => {
    api<{ sessions: HistorySession[] }>("/api/sessions").then((r) => setSessions(r.sessions));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      {!sessions ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-3xl bg-bg-soft" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass mt-8 rounded-[28px] p-10 text-center">
          <p className="text-muted">{t("empty")}</p>
          <Link
            href="/studio?new=1"
            className="focus-ring mt-5 inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-white"
          >
            {t("start")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8">
          {sessions.map((s) => (
            <section key={s.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-bold">
                  {s.brandName}{" "}
                  {s.style && (
                    <span className="font-normal text-muted">
                      · {ts(s.style)} · {s.aspectRatio}
                    </span>
                  )}
                </h2>
                <time className="text-xs text-muted">
                  {new Date(s.createdAt).toLocaleDateString()}
                </time>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {s.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setDownload({ gen: img.id, session: s.id })}
                    className="focus-ring group relative aspect-square overflow-hidden rounded-3xl ring-1 ring-line"
                  >
                    <img
                      src={img.previewUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 end-2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100">
                      ⬇
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <DownloadModal
        generationId={download?.gen ?? null}
        sessionId={download?.session ?? ""}
        onClose={() => setDownload(null)}
      />
    </div>
  );
}
