"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/auth/reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setState(res.ok ? "done" : "error");
  }
  if (state === "done")
    return (
      <p className="rounded-2xl bg-ok/10 p-3 text-sm text-ok">
        {t("resetDone")}{" "}
        <Link href="/login?mode=login" className="font-semibold underline">
          {t("login")}
        </Link>
      </p>
    );
  return (
    <form onSubmit={submit} className="grid gap-3">
      {state === "error" && (
        <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">
          {t("errors.INVALID_TOKEN")}
        </p>
      )}
      <label className="grid gap-1 text-sm font-medium">
        {t("newPassword")}
        <input
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="focus-ring h-12 rounded-2xl border border-line bg-card-solid px-4"
        />
      </label>
      <button
        disabled={state === "busy"}
        className="focus-ring h-12 rounded-full bg-brand font-semibold text-white"
      >
        {t("resetSave")}
      </button>
    </form>
  );
}
