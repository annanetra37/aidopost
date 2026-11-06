import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata = { title: "Refund Policy" };

const SECTIONS: [string, string][] = [
  ["Who processes your payment", "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders and handles refunds and billing enquiries on our behalf."],
  ["Subscriptions (Lite and Pro)", "You can cancel at any time from Billing in the studio; you keep access until the end of the period you paid for. If you are not satisfied, you can request a full refund within 14 days of your first payment, provided you have used no more than 5 image generations in that period."],
  ["One-off purchases", "HD image purchases and credit packs can be refunded within 14 days if the image could not be downloaded or the credits were not used."],
  ["Failed generations", "If an image fails to generate, the credit is returned to your account automatically — no request needed."],
  ["How to ask for a refund", "Email hello@aidopost.com with the email address you used to pay, or reply to your Paddle receipt. Refunds go back to the original payment method, usually within 5–10 business days."],
  ["Your legal rights", "This policy does not affect your statutory rights as a consumer, including the EU right of withdrawal where it applies."],
];

export default async function Refunds({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <LegalPage titleKey="refundsTitle" sections={SECTIONS} />;
}
