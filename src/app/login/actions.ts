"use server";

import { env } from "@/lib/env";
import { supabaseForUser } from "@/lib/supabase/server";

export type LoginState = { sent?: string; error?: string };

export async function sendSignInLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const nextRaw = String(form.get("next") ?? "/account");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/account";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email doesn't look right." };

  const supabase = await supabaseForUser();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${env.siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: "We couldn't send the link. Try again in a minute." };
  return { sent: email };
}

export async function signOut() {
  const supabase = await supabaseForUser();
  await supabase.auth.signOut();
}
