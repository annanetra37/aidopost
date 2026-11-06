"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";

export type AuthMode = "signup" | "login" | "reset";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  );
}

export function AuthForm({
  initialMode = "signup",
  callbackPath = "/studio",
  notice,
  initialError,
}: {
  initialMode?: AuthMode;
  callbackPath?: string;
  notice?: string | null;
  initialError?: string | null;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(notice ?? null);
  const callbackUrl = `/${locale}${callbackPath}`;

  const errText = (code: string) =>
    t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.generic");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined, locale }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "generic");
        track("signup", { method: "email" });
        setInfo(t("checkEmail", { email }));
      } else if (mode === "login") {
        const res = await signIn("credentials", { email, password, redirect: false });
        if (!res || res.error)
          throw new Error(res?.code && res.code !== "credentials" ? res.code : "invalid");
        router.push(callbackUrl);
        router.refresh();
      } else {
        await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, locale }),
        });
        setInfo(t("resetSent"));
      }
    } catch (err) {
      setError(errText((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  const oauth = (provider: "google" | "microsoft-entra-id") => {
    track("signup", { method: provider });
    signIn(provider, { redirectTo: callbackUrl });
  };

  const title =
    mode === "signup" ? t("title") : mode === "login" ? t("loginTitle") : t("resetTitle");
  const subtitle = mode === "signup" ? t("subtitle") : mode === "login" ? t("loginSubtitle") : null;

  return (
    <div className="w-full">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}

      {mode !== "reset" && (
        <div className="mt-6 grid gap-2.5">
          <button
            type="button"
            onClick={() => oauth("google")}
            className="focus-ring flex h-12 items-center justify-center gap-3 rounded-full border border-line bg-card-solid font-medium transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <GoogleIcon /> {t("google")}
          </button>
          <button
            type="button"
            onClick={() => oauth("microsoft-entra-id")}
            className="focus-ring flex h-12 items-center justify-center gap-3 rounded-full border border-line bg-card-solid font-medium transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <MicrosoftIcon /> {t("microsoft")}
          </button>
          <div className="my-2 flex items-center gap-3 text-xs uppercase text-muted">
            <span className="h-px flex-1 bg-line" /> {t("or")}{" "}
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      )}

      {info && (
        <p className="mt-4 rounded-2xl bg-ok/10 p-3 text-sm text-ok" role="status">
          {info}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mt-4 grid gap-3">
        {mode === "signup" && (
          <label className="grid gap-1 text-sm font-medium">
            {t("name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="focus-ring h-12 rounded-2xl border border-line bg-card-solid px-4 font-normal"
            />
          </label>
        )}
        <label className="grid gap-1 text-sm font-medium">
          {t("email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="focus-ring h-12 rounded-2xl border border-line bg-card-solid px-4 font-normal"
          />
        </label>
        {mode !== "reset" && (
          <div className="grid gap-1 text-sm font-medium">
            <div className="flex justify-between">
              <label htmlFor="auth-password">{t("password")}</label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-xs font-normal text-primary hover:underline"
                >
                  {t("forgot")}
                </button>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="focus-ring h-12 rounded-2xl border border-line bg-card-solid px-4 font-normal"
            />
            {mode === "signup" && (
              <span className="text-xs font-normal text-muted">{t("passwordHint")}</span>
            )}
          </div>
        )}
        <button
          disabled={busy}
          className="focus-ring mt-1 h-12 rounded-full bg-brand font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-60"
        >
          {busy
            ? "…"
            : mode === "signup"
              ? t("signup")
              : mode === "login"
                ? t("login")
                : t("resetSend")}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "signup" ? t("haveAccount") : t("noAccount")}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError(null);
            setInfo(null);
          }}
          className="font-semibold text-primary hover:underline"
        >
          {mode === "signup" ? t("switchLogin") : t("switchSignup")}
        </button>
      </p>
      <p className="mt-4 text-center text-xs text-muted">
        {t.rich("terms", {
          terms: (c) => (
            <Link href="/terms" className="underline">
              {c}
            </Link>
          ),
          privacy: (c) => (
            <Link href="/privacy" className="underline">
              {c}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
