import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata = { title: "Privacy Policy" };

const SECTIONS: [string, string][] = [
  [
    "What we collect",
    "Account data (name, email, sign-in provider), brand descriptions you write or approve, product photos you upload, generated images, billing status (via Paddle — we never see card numbers), and, with your consent, product analytics.",
  ],
  [
    "Why we use it",
    "To provide the service: analysing your brand and product, generating images, managing credits and subscriptions, preventing free-trial abuse, and improving quality (e.g. logging AI call outcomes and costs).",
  ],
  [
    "Processors",
    "Anthropic (AI analysis), Google (image generation), Paddle (payments, as Merchant of Record), Railway (hosting), Microsoft Azure (photo and image storage), Resend (email), PostHog and Sentry (analytics and error monitoring, consent-based). Data processing agreements are in place with each processor.",
  ],
  [
    "Storage and security",
    "Photos and images are stored privately and only served through short-lived signed links (15 minutes) to you. API keys never reach your browser.",
  ],
  [
    "Cookies",
    "Essential cookies keep you signed in and remember your language. Analytics cookies are only set if you accept them in the cookie banner.",
  ],
  [
    "Retention and deletion",
    "Abandoned uploads are deleted after 24 hours. When you delete your account, your photos and images are removed within 30 days. We keep minimal records needed to prevent repeated free trials and to meet tax obligations.",
  ],
  [
    "Your rights (GDPR)",
    "You can access, correct, export or delete your data, and object to processing. Contact privacy@aidopost.com.",
  ],
];

export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <LegalPage titleKey="privacyTitle" sections={SECTIONS} />;
}
