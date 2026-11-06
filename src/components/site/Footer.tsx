import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{t("tagline")}</p>
          <div className="mt-4 flex gap-3 text-muted">
            {[
              [
                "Instagram",
                "https://instagram.com/aidopost",
                "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 4.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2Zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6Zm5.3-9.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
              ],
              [
                "TikTok",
                "https://tiktok.com/@aidopost",
                "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z",
              ],
              [
                "LinkedIn",
                "https://linkedin.com/company/aidopost",
                "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z",
              ],
            ].map(([label, href, d]) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-fg"
                rel="noopener"
                target="_blank"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d={d} />
                </svg>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("product")}</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted">
            <li>
              <Link href="/#how" className="hover:text-fg">
                {nav("how")}
              </Link>
            </li>
            <li>
              <Link href="/#examples" className="hover:text-fg">
                {nav("examples")}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-fg">
                {nav("pricing")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("company")}</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted">
            <li>
              <a href="mailto:hello@aidopost.com" className="hover:text-fg">
                {t("contact")}
              </a>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-fg">
                {nav("faq")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{t("legal")}</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted">
            <li>
              <Link href="/terms" className="hover:text-fg">
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-fg">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/refunds" className="hover:text-fg">
                {t("refunds")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line py-6 text-center text-xs text-muted">
        {t("rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
