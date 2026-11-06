"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { CtaButton, useAuthModal } from "./AuthModal";

export function Header() {
  const t = useTranslations("nav");
  const { openAuth, signedIn } = useAuthModal();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#how", label: t("how") },
    { href: "/#examples", label: t("examples") },
    { href: "/pricing", label: t("pricing") },
    { href: "/#faq", label: t("faq") },
  ];

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? "py-2" : "py-4"}`}>
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 transition-all sm:px-5 ${scrolled ? "glass mx-3 h-14 shadow-soft sm:mx-auto" : "h-14"}`}
      >
        <Link href="/" className="focus-ring rounded-full" aria-label="AidoPost">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="focus-ring rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          {!signedIn && (
            <button
              onClick={() => openAuth("login")}
              className="focus-ring hidden rounded-full px-3 py-2 text-sm font-medium hover:bg-bg-soft sm:block"
            >
              {t("login")}
            </button>
          )}
          <span className="hidden sm:block">
            <CtaButton size="md">{signedIn ? t("studio") : t("cta")}</CtaButton>
          </span>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={t("menu")}
            aria-expanded={open}
            className="focus-ring grid h-9 w-9 place-items-center rounded-full hover:bg-bg-soft md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="glass mx-3 mt-2 rounded-3xl p-3 shadow-soft md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 font-medium hover:bg-bg-soft"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 grid gap-2 border-t border-line pt-3">
            {!signedIn && (
              <button
                onClick={() => {
                  setOpen(false);
                  openAuth("login");
                }}
                className="rounded-full border border-line py-3 font-medium"
              >
                {t("login")}
              </button>
            )}
            <CtaButton size="md" className="h-12 w-full">
              {signedIn ? t("studio") : t("cta")}
            </CtaButton>
          </div>
        </div>
      )}
    </header>
  );
}
