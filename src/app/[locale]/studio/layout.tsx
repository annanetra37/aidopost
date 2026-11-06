import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import { AuthModalProvider } from "@/components/site/AuthModal";
import { StudioProvider } from "@/components/studio/StudioContext";
import { StudioShell } from "@/components/studio/StudioShell";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  if (!user) redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/studio`)}`);
  if (user.uiLanguage !== locale)
    await prisma.user.update({ where: { id: user.id }, data: { uiLanguage: locale } });
  const credits = await getBalance(user.id);
  return (
    <AuthModalProvider signedIn>
      <StudioProvider
        initial={{
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          credits,
          subscription: null,
        }}
      >
        <StudioShell>{children}</StudioShell>
      </StudioProvider>
    </AuthModalProvider>
  );
}
