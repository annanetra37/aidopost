import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata = { title: "Terms of Service" };

const SECTIONS: [string, string][] = [
  [
    "1. The service",
    "AidoPost (aidopost.com) generates staged product images from photos you upload, using third-party AI models (Anthropic Claude for analysis and Google Gemini for image generation).",
  ],
  [
    "2. Your account",
    "You must provide accurate information and keep your credentials safe. One free trial is available per person; creating multiple accounts to obtain additional trials is not allowed.",
  ],
  [
    "3. Your uploads",
    "You confirm that you own, or have the right to use, every photo, brand name and description you submit, and that they do not infringe anyone's rights. You grant AidoPost a limited licence to process your uploads solely to provide the service.",
  ],
  [
    "4. Generated images",
    "Images are AI-generated. On Lite and Pro plans, and for individually purchased HD images, you may use generated images commercially. Free-trial images are provided for personal evaluation and carry a watermark. You are responsible for how you use generated images, including checking that they accurately represent your product.",
  ],
  [
    "5. Acceptable use",
    "Do not upload illegal content, content depicting real people without consent, weapons, drugs, adult content, or products you are not permitted to sell. We may suspend accounts that misuse the service.",
  ],
  [
    "6. Plans, credits and payments",
    "Each generated image uses one credit. Failed generations are refunded automatically. Monthly allowances do not roll over. Subscriptions renew automatically until cancelled in the billing portal; you keep access until the end of the paid period. Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders, provides all customer service inquiries and handles returns. VAT or sales tax is added where required. See also our Refund Policy.",
  ],
  [
    "7. Takedown requests",
    "If you believe content on AidoPost infringes your rights, contact legal@aidopost.com.",
  ],
  [
    "8. Liability",
    'The service is provided "as is". To the extent permitted by law, AidoPost is not liable for indirect damages. Nothing limits rights you have as a consumer under applicable law.',
  ],
  ["9. Contact", "hello@aidopost.com"],
];

export default async function Terms({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <LegalPage titleKey="termsTitle" sections={SECTIONS} />;
}
