// Small built-in blocklist of disposable email domains (trial-abuse control, spec §4).
// Extend via DISPOSABLE_EMAIL_DOMAINS (comma-separated) without a deploy.
const BUILT_IN = [
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "sharklasers.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mintemail.com",
  "mohmal.com",
  "emailondeck.com",
  "tempr.email",
  "discard.email",
  "spamgourmet.com",
  "mailnesia.com",
  "moakt.com",
  "burnermail.io",
  "tempmailo.com",
  "minuteinbox.com",
  "mail.tm",
  "emailfake.com",
  "1secmail.com",
  "inboxkitten.com",
];

const extra = (process.env.DISPOSABLE_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);
const BLOCKED = new Set([...BUILT_IN, ...extra]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return BLOCKED.has(domain) || [...BLOCKED].some((d) => domain.endsWith(`.${d}`));
}
