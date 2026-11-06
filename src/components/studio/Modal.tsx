"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function Modal({
  open,
  onClose,
  children,
  wide = false,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  label?: string;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative my-8 w-full rounded-[28px] border border-line bg-card-solid p-6 shadow-soft sm:p-8 ${wide ? "max-w-4xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t("close")}
          className="focus-ring absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full hover:bg-bg-soft"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
