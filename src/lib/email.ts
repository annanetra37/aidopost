// Transactional email via Resend's HTTP API. Without RESEND_API_KEY the message is logged
// (handy in development — click the verification link from the console).
import { env } from "./env";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.resendKey) {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).join("\n");
    console.info(`[email:dev] to=${to} subject="${subject}"\n${links}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
}

export function emailLayout(title: string, body: string, ctaUrl: string, cta: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:32px;color:#1f1147">
    <h2 style="margin:0 0 12px">${title}</h2><p style="line-height:1.6">${body}</p>
    <p><a href="${ctaUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${cta}</a></p>
    <p style="color:#888;font-size:12px">AidoPost · aidopost.com</p></div>`;
}
