import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // app.aidopost.com → https://aidopost.com/{locale}/studio. Everything is served from the main
  // domain so the login cookie and OAuth callback URLs are the same everywhere.
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("app.")) {
    const first = req.nextUrl.pathname.split("/")[1];
    const locale = routing.locales.includes(first as never)
      ? first
      : req.cookies.get("NEXT_LOCALE")?.value || routing.defaultLocale;
    const url = new URL(req.url);
    url.host = host.slice(4);
    url.port = "";
    url.protocol = "https:";
    url.pathname = `/${locale}/studio`;
    url.search = "";
    return NextResponse.redirect(url, 308);
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
