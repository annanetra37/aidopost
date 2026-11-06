"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "./Modal";
import { api } from "./api";
import { useStudio } from "./StudioContext";
import { track } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout-client";
import type { AspectRatio } from "@/lib/plans";

type Ent = {
  plan: string;
  clean: boolean;
  purchased: boolean;
  maxPx: number;
  ratios: AspectRatio[];
  sizes: number[];
};

/** Renderforest-style download: free (watermarked) / buy HD / subscribe — or direct size+format for paid users. */
export function DownloadModal({
  generationId,
  sessionId,
  onClose,
}: {
  generationId: string | null;
  sessionId: string;
  onClose: () => void;
}) {
  const t = useTranslations("studio.download");
  const te = useTranslations("studio.errors");
  const ts = useTranslations("studio.style");
  const locale = useLocale();
  const { openPaywall } = useStudio();
  const [ent, setEnt] = useState<Ent | null>(null);
  const [size, setSize] = useState(1024);
  const [ratio, setRatio] = useState<AspectRatio | "orig">("orig");
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!generationId) return;
    setEnt(null);
    api<Ent>(`/api/generations/${generationId}/entitlement`).then((e) => {
      setEnt(e);
      setSize(e.sizes[e.sizes.length - 1]);
    });
  }, [generationId]);

  const href = (s: number, r: AspectRatio | "orig") =>
    `/api/generations/${generationId}/download?size=${s}${r !== "orig" ? `&ratio=${encodeURIComponent(r)}` : ""}`;
  const onDownload = (kind: string) => track("download", { kind, size });

  const buyHd = async () => {
    setBuying(true);
    try {
      track("checkout_started", { kind: "hd_image" });
      await startCheckout({ kind: "hd_image", generationId, locale, returnPath: `/studio?session=${sessionId}` });
    } catch (e) {
      const code = (e as Error).message;
      alert(te.has(code) ? te(code) : te("generic"));
    } finally {
      setBuying(false);
    }
  };

  return (
    <Modal open={!!generationId} onClose={onClose} wide={!!ent && !ent.clean} label={t("title")}>
      <h2 className="font-display text-2xl font-extrabold tracking-tight">{t("title")}</h2>
      {!ent ? (
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-bg-soft" />
      ) : !ent.clean ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-3xl border border-line p-5">
            <h3 className="font-bold">{t("freeTitle")}</h3>
            <p className="mt-1 flex-1 text-sm text-muted">{t("freeText")}</p>
            <a
              href={href(1024, "orig")}
              onClick={() => onDownload("free")}
              className="focus-ring mt-5 grid h-11 place-items-center rounded-full border border-line font-semibold hover:bg-bg-soft"
            >
              {t("freeCta")}
            </a>
          </div>
          <div className="flex flex-col rounded-3xl border-2 border-primary p-5">
            <h3 className="font-bold">{t("hdTitle")}</h3>
            <p className="mt-1 flex-1 text-sm text-muted">{t("hdText")}</p>
            <button
              onClick={buyHd}
              disabled={buying}
              className="focus-ring mt-5 h-11 rounded-full bg-fg font-semibold text-bg disabled:opacity-60"
            >
              {buying ? "…" : t("hdCta")}
            </button>
          </div>
          <div className="relative flex flex-col rounded-3xl bg-brand p-5 text-white shadow-soft">
            <span className="absolute -top-3 start-5 rounded-full bg-fg px-3 py-1 text-xs font-bold text-bg">
              {t("bestValue")}
            </span>
            <h3 className="font-bold">{t("subTitle")}</h3>
            <p className="mt-1 flex-1 text-sm text-white/85">{t("subText")}</p>
            <button
              onClick={() => {
                onClose();
                openPaywall();
              }}
              className="focus-ring mt-5 h-11 rounded-full bg-white font-semibold text-violet-700"
            >
              {t("subCta")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5">
          {ent.purchased && ent.plan === "free" && (
            <p className="rounded-2xl bg-ok/10 p-3 text-sm text-ok">{t("purchased")}</p>
          )}
          <div>
            <p className="text-sm font-semibold">{t("size")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ent.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={`focus-ring rounded-full border px-4 py-2 text-sm ${size === s ? "border-primary bg-primary/10 font-semibold" : "border-line"}`}
                >
                  {s} px{s === 4096 ? " · Ultra HD" : s === 2048 ? " · HD" : ""}
                </button>
              ))}
            </div>
          </div>
          {ent.ratios.length > 0 && (
            <div>
              <p className="text-sm font-semibold">{t("format")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["orig", ...ent.ratios] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatio(r)}
                    aria-pressed={ratio === r}
                    className={`focus-ring rounded-full border px-4 py-2 text-sm ${ratio === r ? "border-primary bg-primary/10 font-semibold" : "border-line"}`}
                  >
                    {r === "orig"
                      ? t("original")
                      : `${r === "1:1" ? ts("square") : r === "4:5" ? ts("portrait") : ts("story")} ${r}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          <a
            href={href(size, ratio)}
            onClick={() => onDownload(ent.plan === "free" ? "hd_purchase" : "paid")}
            className="focus-ring grid h-12 place-items-center rounded-full bg-brand font-semibold text-white shadow-soft"
          >
            ⬇ {t("downloadNow")}
          </a>
        </div>
      )}
    </Modal>
  );
}
