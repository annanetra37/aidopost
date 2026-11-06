"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "./Modal";
import { PricingCards } from "../landing/Pricing";
import { api } from "./api";
import type { PlanId } from "@/lib/plans";

export function PaywallModal({
  open,
  onClose,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanId;
}) {
  const t = useTranslations("studio.paywall");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const buyPack = async () => {
    setBusy(true);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        json: { kind: "credit_pack", locale },
      });
      window.location.href = url;
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} wide label={t("title")}>
      <div className="text-center">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>
      <div className="mt-6">
        <PricingCards compact currentPlan={plan} />
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        {plan !== "free" && (
          <button
            onClick={buyPack}
            disabled={busy}
            className="focus-ring h-12 rounded-full border border-line px-6 font-semibold hover:bg-bg-soft"
          >
            {t("pack")}
          </button>
        )}
        <button onClick={onClose} className="text-sm text-muted hover:text-fg">
          {t("close")}
        </button>
      </div>
    </Modal>
  );
}
