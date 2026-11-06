"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Generation, SessionView } from "./api";
import { LoadingScreen } from "./LoadingScreen";

export function ResultView({
  session,
  active,
  onDownload,
  onAnother,
  onTryStyle,
  onNewProduct,
  onNewBrand,
  busy,
}: {
  session: SessionView;
  active: Generation | null; // the generation currently in flight
  onDownload: (id: string) => void;
  onAnother: () => void;
  onTryStyle: () => void;
  onNewProduct: () => void;
  onNewBrand: () => void;
  busy: boolean;
}) {
  const t = useTranslations("studio.result");
  const te = useTranslations("studio.errors");
  const done = session.generations.filter((g) => g.status === "succeeded");
  const [selected, setSelected] = useState<string | null>(null);
  const latest = done[done.length - 1];
  useEffect(() => setSelected(latest?.id ?? null), [latest?.id]);
  const current = done.find((g) => g.id === selected) ?? latest;
  const failed = !active ? session.generations.find((g) => g.status === "failed") : null;
  const inFlight = active && (active.status === "queued" || active.status === "running");
  const n = done.length;
  const aspect =
    session.aspectRatio === "4:5"
      ? "aspect-[4/5]"
      : session.aspectRatio === "9:16"
        ? "aspect-[9/16] max-h-[70vh]"
        : "aspect-square";

  if (inFlight) return <LoadingScreen stage={active.stage} />;

  return (
    <div className="mx-auto max-w-5xl">
      {failed && (
        <div className="mx-auto mb-6 max-w-xl rounded-3xl bg-danger/10 p-5 text-center">
          <p className="font-semibold text-danger">
            {failed.errorCode && te.has(failed.errorCode) ? te(failed.errorCode) : t("failed")}
          </p>
          {failed.errorCode === "SAME_PRODUCT" ? (
            <button
              onClick={onNewProduct}
              className="focus-ring mt-3 h-10 rounded-full bg-fg px-5 text-sm font-semibold text-bg"
            >
              {t("newProduct")}
            </button>
          ) : (
            <button
              onClick={onAnother}
              disabled={busy}
              className="focus-ring mt-3 h-10 rounded-full bg-fg px-5 text-sm font-semibold text-bg"
            >
              {t("retry")}
            </button>
          )}
        </div>
      )}

      {current && (
        <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div
              className={`relative mx-auto w-full overflow-hidden rounded-[28px] bg-bg-soft shadow-soft ring-1 ring-line ${aspect}`}
            >
              <img
                key={current.id}
                src={current.previewUrl!}
                alt=""
                className="h-full w-full animate-[fadeIn_.6s_ease] object-cover"
              />
            </div>
            {done.length > 1 && (
              <div className="mt-4 flex gap-3">
                {done.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g.id)}
                    aria-pressed={g.id === current.id}
                    className={`focus-ring h-20 w-20 overflow-hidden rounded-2xl ring-2 transition ${g.id === current.id ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img src={g.previewUrl!} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="glass rounded-[28px] p-6 sm:p-8">
            <p className="text-sm font-semibold text-primary">
              {t("photoOf", { n: done.indexOf(current) + 1 })} · {t(`concept.${current.variant}`)}
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
              {session.brand.name}
            </h2>
            {session.analysis && (
              <p className="text-sm text-muted">{session.analysis.productName}</p>
            )}
            <button
              onClick={() => onDownload(current.id)}
              className="focus-ring mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-fg font-semibold text-bg"
            >
              ⬇ {t("download")}
            </button>
            {n < 3 ? (
              <>
                <button
                  onClick={onAnother}
                  disabled={busy}
                  className="focus-ring mt-3 h-12 w-full rounded-full bg-brand font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-60"
                >
                  ✨ {t("another", { n: n + 1 })}
                </button>
                <p className="mt-4 text-sm text-muted">{t("note")}</p>
                <div className="mt-3 flex gap-1.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < n ? "bg-brand" : "bg-bg-soft"}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-6 border-t border-line pt-6">
                <p className="font-semibold">{t("allUsed")}</p>
                <div className="mt-4 grid gap-2">
                  <button
                    onClick={onTryStyle}
                    className="focus-ring h-11 rounded-full bg-brand font-semibold text-white"
                  >
                    {t("tryStyle")}
                  </button>
                  <button
                    onClick={onNewProduct}
                    className="focus-ring h-11 rounded-full border border-line font-semibold hover:bg-bg-soft"
                  >
                    {t("newProduct")}
                  </button>
                  <button
                    onClick={onNewBrand}
                    className="focus-ring h-11 rounded-full border border-line font-semibold hover:bg-bg-soft"
                  >
                    {t("newBrand")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
