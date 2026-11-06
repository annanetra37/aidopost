"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "../site/Logo";
import { LanguageSwitcher } from "../site/LanguageSwitcher";
import { ThemeToggle } from "../site/ThemeToggle";
import { useStudio } from "./StudioContext";
import { api } from "./api";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("studio");
  const tp = useTranslations("pricing");
  const locale = useLocale();
  const { me, openPaywall } = useStudio();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const portal = async () => {
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", {
        method: "POST",
        json: { locale },
      });
      window.location.href = url;
    } catch {
      openPaywall();
    }
  };

  return (
    <div className="relative min-h-dvh">
      <div className="mesh opacity-60">
        <span />
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
          <Link href="/studio" className="focus-ring rounded-full">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/studio?new=1"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-fg"
            >
              {t("newShoot")}
            </Link>
            <Link
              href="/studio/history"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-fg"
            >
              {t("history")}
            </Link>
          </nav>
          <div className="flex items-center gap-1">
            <button
              onClick={openPaywall}
              className="focus-ring glass flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold"
              title={tp(me?.plan ?? "free")}
            >
              <span className="h-2 w-2 rounded-full bg-accent" />
              {t("credits", { count: me?.credits ?? 0 })}
            </button>
            {me?.plan === "free" && (
              <button
                onClick={openPaywall}
                className="focus-ring hidden h-9 rounded-full bg-brand px-4 text-sm font-semibold text-white sm:block"
              >
                {t("upgrade")}
              </button>
            )}
            <LanguageSwitcher persist />
            <ThemeToggle />
            <div className="relative" ref={ref}>
              <button
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                className="focus-ring grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-primary/15 text-sm font-bold text-primary"
              >
                {me?.image ? (
                  <img src={me.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  (me?.name ?? me?.email ?? "?").slice(0, 1).toUpperCase()
                )}
              </button>
              {menu && (
                <div className="absolute end-0 mt-2 w-56 rounded-2xl border border-line bg-card-solid p-1 shadow-soft">
                  <p className="truncate px-3 py-2 text-xs text-muted">{me?.email}</p>
                  <Link
                    href="/studio?new=1"
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-bg-soft sm:hidden"
                  >
                    {t("newShoot")}
                  </Link>
                  <Link
                    href="/studio/history"
                    className="block rounded-xl px-3 py-2 text-sm hover:bg-bg-soft sm:hidden"
                  >
                    {t("history")}
                  </Link>
                  {me?.plan !== "free" ? (
                    <button
                      onClick={portal}
                      className="block w-full rounded-xl px-3 py-2 text-start text-sm hover:bg-bg-soft"
                    >
                      {t("billing")}
                    </button>
                  ) : (
                    <button
                      onClick={openPaywall}
                      className="block w-full rounded-xl px-3 py-2 text-start text-sm hover:bg-bg-soft"
                    >
                      {t("upgrade")}
                    </button>
                  )}
                  <button
                    onClick={() => signOut({ redirectTo: `/${locale}` })}
                    className="block w-full rounded-xl px-3 py-2 text-start text-sm text-danger hover:bg-bg-soft"
                  >
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
