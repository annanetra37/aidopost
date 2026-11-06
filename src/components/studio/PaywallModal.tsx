"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "./Modal";
import { PricingCards } from "../landing/Pricing";
import { startCheckout } from "@/lib/checkout-client";
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
  const te = useTranslations("studio.errors");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const buyPack = async () => {
    setBusy(true);
    try {
      await startCheckout({ kind: "credit_pack", locale });
    } catch (e) {
      const code = (e as Error).message;
      alert(te.has(code) ? te(code) : te("generic"));
    } finally {
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
