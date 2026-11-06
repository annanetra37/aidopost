import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // app.aidopost.com serves the studio: send its root to /{locale}/studio.
  const host = req.headers.get("host") ?? "";
  if (
    host.startsWith("app.") &&
    (req.nextUrl.pathname === "/" || routing.locales.some((l) => req.nextUrl.pathname === `/${l}`))
  ) {
    const locale =
      req.nextUrl.pathname.slice(1) ||
      req.cookies.get("NEXT_LOCALE")?.value ||
      routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/studio`, req.url));
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
