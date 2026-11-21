"use server";

import { headers } from "next/headers";
import { env } from "@/lib/env";
import { supabaseAdmin, supabaseForUser } from "@/lib/supabase/server";

export type LoginState = { sent?: string; error?: string; devLink?: string };

const isDev = process.env.NODE_ENV !== "production";

/** The address the visitor is actually using (handy when dev runs on :3001). */
async function siteOrigin() {
  if (!isDev) return env.siteUrl();
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return env.siteUrl();
}

export async function sendSignInLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const nextRaw = String(form.get("next") ?? "/account");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/account";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email doesn't look right." };

  const origin = await siteOrigin();
  const supabase = await supabaseForUser();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (!error) return { sent: email };

  console.error("Sign-in email failed:", error.status, error.message);
  const msg = error.message ?? "";
  let friendly = "We couldn't send the link. Try again in a minute.";
  if (error.status === 429 || /rate limit|only request this after/i.test(msg)) {
    friendly = "Too many sign-in emails just now. Wait a few minutes, then try again.";
  } else if (/not authori[sz]ed/i.test(msg)) {
    friendly = "We can't email that address yet. Please try again later.";
  }

  // On your own computer only: skip the email and offer a direct sign-in link,
  // so testing isn't blocked by Supabase's email limits.
  if (isDev) {
    const devLink = await localSignInLink(email, next, origin);
    return { error: `${friendly} (Supabase said: ${msg || "no details"})`, devLink };
  }
  return { error: friendly };
}

/** Local testing only: a one-time sign-in link made without sending an email. */
async function localSignInLink(email: string, next: string, origin: string) {
  try {
    const admin = supabaseAdmin();
    // Make sure the account exists (ignored if it already does).
    await admin.auth.admin.createUser({ email, email_confirm: true });
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data.properties?.hashed_token) return undefined;
    return `${origin}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(next)}`;
  } catch (err) {
    console.error("Local sign-in link failed:", err);
    return undefined;
  }
}

export async function signOut() {
  const supabase = await supabaseForUser();
  await supabase.auth.signOut();
}
