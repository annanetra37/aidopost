import { prisma } from "./db";
import { HD_IMAGE_PX, PLANS, FREE_DOWNLOAD_PX, type PlanId } from "./plans";

/** What a user may download for a given generation. */
export async function entitlementFor(userId: string, plan: PlanId, generationId: string) {
  const purchased = !!(await prisma.purchase.findFirst({
    where: { userId, generationId, kind: "hd_image", status: "paid" },
  }));
  const paid = plan !== "free";
  const maxPx = paid ? PLANS[plan].downloadPx : purchased ? HD_IMAGE_PX : FREE_DOWNLOAD_PX;
  return {
    clean: paid || purchased,
    purchased,
    maxPx,
    ratios: paid ? PLANS[plan].aspectRatios : [],
  };
}
