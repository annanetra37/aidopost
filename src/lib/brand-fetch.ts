// "Find my brand" (spec §5 step 1): website → page text; social link → public metadata only;
// brand name → web search. Claude then writes the description in the UI language.
import { lookup } from "dns/promises";
import net from "net";
import { parse, type HTMLElement } from "node-html-parser";
import { env } from "./env";

export type BrandSourceType = "website" | "social" | "name";

const SOCIAL_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "tiktok.com",
  "linkedin.com",
  "x.com",
  "twitter.com",
  "pinterest.com",
  "youtube.com",
  "threads.net",
];
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;

export function classifyInput(raw: string): { type: BrandSourceType; url?: URL } {
  const s = raw.trim();
  const looksLikeUrl = /^https?:\/\//i.test(s) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s);
  if (s.startsWith("@"))
    return { type: "social", url: new URL(`https://www.instagram.com/${s.slice(1)}/`) };
  if (looksLikeUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      const host = url.hostname.replace(/^www\.|^m\./, "");
      return {
        type: SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ? "social" : "website",
        url,
      };
    } catch {
      /* fall through */
    }
  }
  return { type: "name" };
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v = ip.toLowerCase();
  return (
    v === "::1" ||
    v === "::" ||
    v.startsWith("fc") ||
    v.startsWith("fd") ||
    v.startsWith("fe80") ||
    v.startsWith("::ffff:127.") ||
    v.startsWith("::ffff:10.") ||
    v.startsWith("::ffff:192.168.")
  );
}

/** Block requests to internal networks (SSRF). */
export async function assertPublicUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Unsupported port");
  const addrs = net.isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("Blocked host");
}

async function safeFetch(url: URL, redirects = 3): Promise<{ html: string; finalUrl: URL } | null> {
  await assertPublicUrl(url);
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AidoPostBot/1.0; +https://aidopost.com/bot)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en;q=0.8,*;q=0.5",
    },
  });
  if (res.status >= 300 && res.status < 400 && res.headers.get("location") && redirects > 0) {
    return safeFetch(new URL(res.headers.get("location")!, url), redirects - 1);
  }
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) break;
    chunks.push(value);
  }
  reader.cancel().catch(() => {});
  return { html: Buffer.concat(chunks).toString("utf8"), finalUrl: url };
}

function meta(root: HTMLElement, key: string) {
  return (
    root.querySelector(`meta[property="${key}"]`)?.getAttribute("content") ??
    root.querySelector(`meta[name="${key}"]`)?.getAttribute("content") ??
    ""
  ).trim();
}

function extract(html: string, includeBody: boolean) {
  const root = parse(html);
  const parts = [
    `Title: ${root.querySelector("title")?.text.trim() ?? ""}`,
    `og:title: ${meta(root, "og:title")}`,
    `Description: ${meta(root, "description")}`,
    `og:description: ${meta(root, "og:description")}`,
    `og:site_name: ${meta(root, "og:site_name")}`,
  ];
  if (includeBody) {
    root.querySelectorAll("script,style,noscript,svg,nav,footer,form").forEach((n) => n.remove());
    const text = (root.querySelector("main") ?? root.querySelector("body") ?? root).text
      .replace(/\s+/g, " ")
      .trim();
    parts.push(`Page text: ${text.slice(0, 4000)}`);
  }
  return { text: parts.filter((p) => !p.endsWith(": ")).join("\n"), root };
}

async function fetchWebsite(url: URL): Promise<string> {
  const home = await safeFetch(url);
  if (!home) return "";
  const { text, root } = extract(home.html, true);
  const out = [`[${home.finalUrl.href}]\n${text}`];
  // Up to 2 more pages that look like "about" pages (3 pages total).
  const aboutLinks = root
    .querySelectorAll("a[href]")
    .map((a) => a.getAttribute("href") ?? "")
    .filter((h) =>
      /about|our-story|story|who-we-are|uber-uns|ueber-uns|hakkimizda|om-oss|nosotros|quienes|%D9%85%D9%86|mer-masin/i.test(
        h,
      ),
    )
    .map((h) => {
      try {
        return new URL(h, home.finalUrl);
      } catch {
        return null;
      }
    })
    .filter((u): u is URL => !!u && u.hostname === home.finalUrl.hostname);
  const unique = [...new Map(aboutLinks.map((u) => [u.pathname, u])).values()].slice(0, 2);
  const pages = await Promise.allSettled(unique.map((u) => safeFetch(u)));
  for (const p of pages) {
    if (p.status === "fulfilled" && p.value)
      out.push(`[${p.value.finalUrl.href}]\n${extract(p.value.html, true).text}`);
  }
  return out.join("\n\n");
}

async function fetchSocial(url: URL): Promise<string> {
  // Public metadata only (og:title, og:description, bio) — no logged-in scraping (Meta ToS).
  const page = await safeFetch(url);
  return page ? `[${url.href}]\n${extract(page.html, false).text}` : "";
}

async function searchName(name: string): Promise<string> {
  if (!env.braveKey) return "";
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(name)}&count=3`,
    {
      headers: { "X-Subscription-Token": env.braveKey, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) return "";
  const data = (await res.json()) as {
    web?: { results?: { title: string; url: string; description: string }[] };
  };
  return (data.web?.results ?? [])
    .slice(0, 3)
    .map((r) => `[${r.url}] ${r.title}\n${r.description.replace(/<[^>]+>/g, "")}`)
    .join("\n\n");
}

export async function gatherBrandSources(
  input: string,
): Promise<{ type: BrandSourceType; url?: string; text: string }> {
  const { type, url } = classifyInput(input);
  let text = "";
  try {
    if (type === "website" && url) text = await fetchWebsite(url);
    else if (type === "social" && url) text = await fetchSocial(url);
    else text = await searchName(input);
  } catch (err) {
    console.warn(`[brand-fetch] ${type} failed`, String(err));
  }
  return { type, url: url?.href, text };
}
