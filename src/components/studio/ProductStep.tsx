"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { api, ApiError, type SessionView } from "./api";
import { checkPhotoQuality } from "./quality";

export function ProductStep({
  session,
  setSession,
  onNext,
  onBack,
}: {
  session: SessionView;
  setSession: (s: SessionView) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("studio.product");
  const te = useTranslations("studio.errors");
  const tc = useTranslations("common");
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  // Poll while the product analysis (varB) runs in the background.
  useEffect(() => {
    if (session.status !== "analysing") return;
    const iv = setInterval(async () => {
      try {
        const s = await api<SessionView>(`/api/sessions/${session.id}`);
        if (s.status !== "analysing") setSession(s);
      } catch {}
    }, 1500);
    return () => clearInterval(iv);
  }, [session.status, session.id, setSession]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const room = 3 - session.photos.length;
      const list = Array.from(files).slice(0, room);
      if (Array.from(files).length > room) setError(te("MAX_PHOTOS"));
      for (const file of list) {
        setUploading((u) => u + 1);
        const issue = await checkPhotoQuality(file);
        if (issue) setWarnings((w) => [...w, t("qualityWarning", { issue: t(issue) })]);
        try {
          const fd = new FormData();
          fd.append("file", file);
          const s = await api<SessionView>(`/api/sessions/${session.id}/photos`, {
            method: "POST",
            body: fd,
          });
          setSession(s);
        } catch (e) {
          const code = (e as ApiError).code;
          setError(te.has(code) ? te(code) : te("generic"));
        } finally {
          setUploading((u) => u - 1);
        }
      }
    },
    [session.id, session.photos.length, setSession, t, te],
  );

  const remove = async (photoId: string) => {
    setWarnings([]);
    try {
      setSession(
        await api<SessionView>(`/api/sessions/${session.id}/photos?photoId=${photoId}`, {
          method: "DELETE",
        }),
      );
    } catch (e) {
      setError(te.has((e as ApiError).code) ? te((e as ApiError).code) : te("generic"));
    }
  };

  const count = session.photos.length;
  const notSame = session.analysis && !session.analysis.sameProduct;
  const canContinue = count >= 2 && !uploading && !notSame && !session.locked;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_240px]">
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (count < 3) upload(e.dataTransfer.files);
            }}
            className={`glass grid place-items-center rounded-[28px] border-2 border-dashed p-8 text-center transition ${drag ? "border-primary bg-primary/5" : "border-line"} ${count >= 3 ? "opacity-50" : ""}`}
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-soft">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </div>
            <p className="mt-4 font-semibold">{t("drop")}</p>
            <p className="text-sm text-muted">{t("or")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={count >= 3}
                onClick={() => fileRef.current?.click()}
                className="focus-ring h-11 rounded-full bg-fg px-5 text-sm font-semibold text-bg disabled:opacity-50"
              >
                {t("browse")}
              </button>
              <button
                type="button"
                disabled={count >= 3}
                onClick={() => camRef.current?.click()}
                className="focus-ring h-11 rounded-full border border-line px-5 text-sm font-semibold md:hidden"
              >
                {t("camera")}
              </button>
            </div>
            <p className="mt-4 text-xs text-muted">{t("rules")}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) upload(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={camRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                if (e.target.files) upload(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <p className="mt-5 text-sm font-semibold">{t("count", { count })}</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => {
              const p = session.photos[i];
              return (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-bg-soft"
                >
                  {p ? (
                    <>
                      <img src={p.url} alt="" className="h-full w-full object-cover" />
                      {!session.locked && (
                        <button
                          onClick={() => remove(p.id)}
                          aria-label={t("remove")}
                          className="focus-ring absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white"
                        >
                          ✕
                        </button>
                      )}
                    </>
                  ) : i < count + uploading ? (
                    <div className="grid h-full place-items-center text-xs text-muted">
                      <span className="animate-pulse">{t("uploading")}</span>
                    </div>
                  ) : (
                    <div className="grid h-full place-items-center text-3xl text-line">+</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2" aria-live="polite">
            {error && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
            {warnings.map((w, i) => (
              <p key={i} className="rounded-2xl bg-accent-2/15 p-3 text-sm">
                {w}
              </p>
            ))}
            {session.status === "analysing" && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
                {t("analysing")}
              </p>
            )}
            {session.analysis?.sameProduct && (
              <p className="rounded-2xl bg-ok/10 p-3 text-sm text-ok">
                ✓ {t("recognised", { name: session.analysis.productName })}
              </p>
            )}
            {notSame && (
              <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{t("notSame")}</p>
            )}
          </div>
        </div>

        <aside className="glass h-fit rounded-3xl p-5 text-sm">
          <h2 className="font-semibold">{t("tipsTitle")}</h2>
          <ul className="mt-3 grid gap-2 text-muted">
            {["tip1", "tip2", "tip3"].map((k) => (
              <li key={k} className="flex gap-2">
                <span className="text-primary">✦</span>
                {t(k)}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-fg"
        >
          ← {tc("back")}
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          title={count < 2 ? t("needTwo") : undefined}
          className="focus-ring h-12 rounded-full bg-brand px-8 font-semibold text-white shadow-soft disabled:opacity-40"
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
