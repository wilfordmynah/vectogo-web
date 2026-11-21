import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

// Short emails in the Vectogo voice: one playful line, then a plain one,
// always with a link back to the order. Without RESEND_API_KEY they are
// logged instead of sent, so local testing works.

type Mail = { to: string | string[]; subject: string; lines: string[]; link?: { href: string; label: string } };

export async function sendMail({ to, subject, lines, link }: Mail) {
  const html = `
    <div style="font-family:Poppins,Arial,sans-serif;max-width:520px;margin:auto;color:#111014">
      <p style="font-size:22px;font-weight:800;margin:0 0 16px">vec<span style="color:#6f07e5">togo</span></p>
      ${lines.map((l) => `<p style="font-size:16px;line-height:1.5">${escapeHtml(l)}</p>`).join("")}
      ${
        link
          ? `<p><a href="${link.href}" style="display:inline-block;background:#6f07e5;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(link.label)}</a></p>`
          : ""
      }
      <p style="font-size:13px;color:#666">Questions? Just reply to this email.</p>
    </div>`;
  const text = [...lines, link ? `${link.label}: ${link.href}` : ""].join("\n\n");

  const key = env.resendApiKey();
  if (!key) {
    console.info(`[email not sent: no RESEND_API_KEY] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  try {
    await new Resend(key).emails.send({ from: env.emailFrom(), to, subject, html, text });
  } catch (err) {
    // An email failure should never break an order.
    console.error("Email failed", err);
  }
}

export function notifyVectogo(subject: string, lines: string[], href: string) {
  const admins = env.adminEmails();
  if (!admins.length) return;
  return sendMail({ to: admins, subject, lines, link: { href, label: "Open in admin" } });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
