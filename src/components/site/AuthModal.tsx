"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { AuthForm, type AuthMode } from "./AuthForm";

type Ctx = { openAuth: (mode?: AuthMode) => void; signedIn: boolean };
const AuthCtx = createContext<Ctx>({ openAuth: () => {}, signedIn: false });
export const useAuthModal = () => useContext(AuthCtx);

export function AuthModalProvider({
  children,
  signedIn,
}: {
  children: React.ReactNode;
  signedIn: boolean;
}) {
  const t = useTranslations("common");
  const [mode, setMode] = useState<AuthMode | null>(null);
  const openAuth = useCallback((m: AuthMode = "signup") => setMode(m), []);

  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMode(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mode]);

  return (
    <AuthCtx.Provider value={{ openAuth, signedIn }}>
      {children}
      {mode && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setMode(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-[28px] border border-line bg-card-solid p-7 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMode(null)}
              aria-label={t("close")}
              className="focus-ring absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full hover:bg-bg-soft"
            >
              ✕
            </button>
            <AuthForm initialMode={mode} />
          </div>
        </div>
      )}
    </AuthCtx.Provider>
  );
}

/** "Try the app for free" — opens the sign-up modal when logged out, else goes to the studio. */
export function CtaButton({
  children,
  className = "",
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const { openAuth, signedIn } = useAuthModal();
  const cls = `focus-ring group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-brand font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:brightness-110 ${size === "lg" ? "h-14 px-8 text-base" : "h-10 px-5 text-sm"} ${className}`;
  const inner = (
    <>
      <span className="absolute inset-y-0 -start-1/2 w-1/3 -skew-x-12 bg-white/30 opacity-0 transition group-hover:animate-[shimmer_1s_ease] group-hover:opacity-100" />
      {children}
      <svg viewBox="0 0 20 20" className="h-4 w-4 rtl:rotate-180" fill="currentColor" aria-hidden>
        <path d="M11.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L14.6 11H3a1 1 0 1 1 0-2h11.6l-3.3-3.3a1 1 0 0 1 0-1.4Z" />
      </svg>
    </>
  );
  if (signedIn) {
    return (
      <Link href="/studio" className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      onClick={() => {
        track("cta_click");
        openAuth("signup");
      }}
      className={cls}
    >
      {inner}
    </button>
  );
}
