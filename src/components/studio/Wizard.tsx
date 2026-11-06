"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, type Generation, type SessionView } from "./api";
import { BrandStep } from "./BrandStep";
import { ProductStep } from "./ProductStep";
import { StyleStep } from "./StyleStep";
import { ResultView } from "./ResultView";
import { DownloadModal } from "./DownloadModal";
import { useStudio } from "./StudioContext";
import { track } from "@/lib/analytics";
import type { AspectRatio } from "@/lib/plans";

type Step = "brand" | "product" | "style" | "result";
const STEPS: Step[] = ["brand", "product", "style", "result"];

function stepFor(s: SessionView): Step {
  if (s.generations.length > 0) return "result";
  if (s.photos.length < 2 || (s.analysis && !s.analysis.sameProduct)) return "product";
  return "style";
}

export function Wizard() {
  const t = useTranslations("studio");
  const te = useTranslations("studio.errors");
  const router = useRouter();
  const params = useSearchParams();
  const { me, refresh, openPaywall } = useStudio();
  const [step, setStep] = useState<Step>("brand");
  const [session, setSessionState] = useState<SessionView | null>(null);
  const [active, setActive] = useState<Generation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const setSession = useCallback((s: SessionView | null) => {
    setSessionState(s);
    const url = new URL(window.location.href);
    if (s) url.searchParams.set("session", s.id);
    else url.searchParams.delete("session");
    url.searchParams.delete("new");
    window.history.replaceState(null, "", url.toString());
  }, []);

  // Resume a session from the URL (refresh, checkout return), or start fresh.
  useEffect(() => {
    const id = params.get("session");
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setToast(t("toast.checkoutSuccess"));
      track("paid", { kind: params.get("kind") });
      refresh();
    } else if (checkout === "cancelled") setToast(t("toast.checkoutCancelled"));
    if (params.get("new")) {
      setSessionState(null);
      setStep("brand");
      return;
    }
    if (!id) return;
    api<SessionView>(`/api/sessions/${id}`)
      .then((s) => {
        setSessionState(s);
        setStep(stepFor(s));
        const running = s.generations.find((g) => g.status === "queued" || g.status === "running");
        if (running) follow(s.id, running);
      })
      .catch(() => setSession(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (!toast) return;
    const tm = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(tm);
  }, [toast]);

  useEffect(() => () => esRef.current?.close(), []);

  const reload = useCallback(async (id: string) => {
    const s = await api<SessionView>(`/api/sessions/${id}`);
    setSessionState(s);
    return s;
  }, []);

  /** Follow a generation's progress over SSE (with a polling fallback). */
  const follow = useCallback(
    (sessionId: string, gen: Generation) => {
      setActive(gen);
      esRef.current?.close();
      const finish = async (g: Generation) => {
        esRef.current?.close();
        const s = await reload(sessionId);
        setActive(null);
        refresh();
        if (g.status === "succeeded") {
          track("image_generated", { variant: g.variant });
          try {
            if (!localStorage.getItem("first_image")) {
              localStorage.setItem("first_image", "1");
              track("first_image");
            }
          } catch {}
        }
        return s;
      };
      const es = new EventSource(`/api/sessions/${sessionId}/events?generation=${gen.id}`);
      esRef.current = es;
      es.addEventListener("progress", (e) => setActive(JSON.parse((e as MessageEvent).data)));
      es.addEventListener("done", (e) => finish(JSON.parse((e as MessageEvent).data)));
      es.onerror = () => {
        es.close();
        // Fallback: poll the session until the generation settles.
        const iv = setInterval(async () => {
          const s = await api<SessionView>(`/api/sessions/${sessionId}`).catch(() => null);
          const g = s?.generations.find((x) => x.id === gen.id);
          if (!g) return;
          setActive(g);
          if (g.status === "succeeded" || g.status === "failed") {
            clearInterval(iv);
            finish(g);
          }
        }, 1500);
      };
    },
    [reload, refresh],
  );

  async function chooseBrand(brand: { id: string }) {
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>("/api/sessions", {
        method: "POST",
        json: { brandId: brand.id },
      });
      setSession(await reload(id));
      setStep("product");
    } finally {
      setBusy(false);
    }
  }

  async function generate(sessionId: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ generationId: string; variant: Generation["variant"] }>(
        `/api/sessions/${sessionId}/generate`,
        { method: "POST" },
      );
      setStep("result");
      follow(sessionId, {
        id: r.generationId,
        variant: r.variant,
        status: "queued",
        stage: "queued",
        errorCode: null,
        previewUrl: null,
      });
      refresh();
    } catch (e) {
      const code = (e as ApiError).code;
      if (code === "NO_CREDITS") openPaywall();
      else setError(te.has(code) ? te(code) : te("generic"));
      await reload(sessionId).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  async function suggest(style: string, ratio: AspectRatio) {
    if (!session) return;
    if ((me?.credits ?? 0) < 1) return openPaywall();
    setBusy(true);
    try {
      await api(`/api/sessions/${session.id}`, {
        method: "PATCH",
        json: { style, aspectRatio: ratio },
      });
    } catch (e) {
      const code = (e as ApiError).code;
      setError(te.has(code) ? te(code) : te("generic"));
      setBusy(false);
      return;
    }
    await generate(session.id);
  }

  async function another() {
    if (!session) return;
    if ((me?.credits ?? 0) < 1) return openPaywall();
    await generate(session.id);
  }

  async function newSession(opts: { copyFrom?: boolean }) {
    if (!session) return;
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>("/api/sessions", {
        method: "POST",
        json: { brandId: session.brand.id, copyFrom: opts.copyFrom ? session.id : undefined },
      });
      const s = await reload(id);
      setSession(s);
      setStep(opts.copyFrom ? "style" : "product");
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div>
      {/* Progress rail */}
      <nav aria-label="progress" className="mx-auto mb-10 max-w-3xl">
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${i < stepIndex ? "bg-primary text-white" : i === stepIndex ? "bg-brand text-white shadow-soft" : "bg-bg-soft text-muted"}`}
              >
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span
                className={`hidden text-sm font-semibold sm:block ${i === stepIndex ? "" : "text-muted"}`}
              >
                {t(`steps.${s}`)}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`h-0.5 flex-1 rounded-full ${i < stepIndex ? "bg-primary" : "bg-line"}`}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {error && (
        <p
          className="mx-auto mb-6 max-w-3xl rounded-2xl bg-danger/10 p-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {step === "brand" && <BrandStep onSelect={chooseBrand} />}
      {step === "product" && session && (
        <ProductStep
          session={session}
          setSession={setSessionState}
          onBack={() => {
            setSession(null);
            setStep("brand");
          }}
          onNext={() => setStep("style")}
        />
      )}
      {step === "style" && session && (
        <StyleStep
          session={session}
          busy={busy}
          onBack={() => setStep("product")}
          onSuggest={suggest}
        />
      )}
      {step === "result" && session && (
        <ResultView
          session={session}
          active={active}
          busy={busy}
          onDownload={setDownloadId}
          onAnother={another}
          onTryStyle={() => newSession({ copyFrom: true })}
          onNewProduct={() => newSession({})}
          onNewBrand={() => {
            setSession(null);
            setStep("brand");
            router.refresh();
          }}
        />
      )}

      {session && (
        <DownloadModal
          generationId={downloadId}
          sessionId={session.id}
          onClose={() => setDownloadId(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-[80] mx-auto w-fit rounded-full bg-fg px-5 py-3 text-sm font-semibold text-bg shadow-soft"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
