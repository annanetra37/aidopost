// Plans mirror Renderforest's structure and price points (spec §4).
// Shared between server and client — keep free of server-only imports.
export type PlanId = "free" | "lite" | "pro";
export type Period = "monthly" | "annual";
export type AspectRatio = "1:1" | "4:5" | "9:16";

export interface PlanDef {
  id: PlanId;
  priceMonthly: number; // USD, billed monthly
  priceAnnualPerMonth: number; // USD per month, billed annually
  generations: number; // per month (free: one-time trial)
  downloadPx: number; // max long side
  watermark: boolean;
  savedBrands: number; // Infinity = unlimited
  aspectRatios: AspectRatio[];
  commercialLicence: boolean;
  priorityQueue: boolean;
  support: "help_centre" | "email" | "priority_email";
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    priceMonthly: 0,
    priceAnnualPerMonth: 0,
    generations: 5,
    downloadPx: 1024,
    watermark: true,
    savedBrands: 1,
    aspectRatios: ["1:1"],
    commercialLicence: false,
    priorityQueue: false,
    support: "help_centre",
  },
  lite: {
    id: "lite",
    priceMonthly: 15,
    priceAnnualPerMonth: 9,
    generations: 40,
    downloadPx: 2048,
    watermark: false,
    savedBrands: 3,
    aspectRatios: ["1:1", "4:5", "9:16"],
    commercialLicence: true,
    priorityQueue: false,
    support: "email",
  },
  pro: {
    id: "pro",
    priceMonthly: 39,
    priceAnnualPerMonth: 19,
    generations: 160,
    downloadPx: 4096,
    watermark: false,
    savedBrands: Infinity,
    aspectRatios: ["1:1", "4:5", "9:16"],
    commercialLicence: true,
    priorityQueue: true,
    support: "priority_email",
  },
};

export const TRIAL_CREDITS = 5;
export const HD_IMAGE_PRICE_USD = 5;
export const HD_IMAGE_PX = 2048;
export const CREDIT_PACK = { credits: 20, priceUsd: 5 };
export const FREE_DOWNLOAD_PX = 1024;
export const VARIANTS = ["A", "B", "C"] as const;
export type VariantId = (typeof VARIANTS)[number];

export function annualSavingsPct(plan: PlanDef): number {
  if (!plan.priceMonthly) return 0;
  return Math.round((1 - plan.priceAnnualPerMonth / plan.priceMonthly) * 100);
}

export function allowedSizes(plan: PlanId, purchasedHd: boolean): number[] {
  const max = Math.max(PLANS[plan].downloadPx, purchasedHd ? HD_IMAGE_PX : 0);
  return [1024, 2048, 4096].filter((s) => s <= max);
}
