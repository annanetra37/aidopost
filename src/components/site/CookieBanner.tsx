"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CookieBanner() {
  const t = useTranslations("cookies");
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem("cookie-consent"));
    } catch {}
  }, []);
  if (!show) return null;
  const choose = (v: "all" | "essential") => {
    try {
      localStorage.setItem("cookie-consent", v);
    } catch {}
    window.dispatchEvent(new Event("cookie-consent"));
    setShow(false);
  };
  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-2xl glass p-4 shadow-soft"
    >
      <p className="text-sm text-muted">
        {t("text")}{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">
          {t("more")}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          onClick={() => choose("essential")}
          className="focus-ring rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-bg-soft"
        >
          {t("essential")}
        </button>
        <button
          onClick={() => choose("all")}
          className="focus-ring rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
