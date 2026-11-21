import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Supabase client acting as the signed-in visitor. Reads are limited by RLS. */
export async function supabaseForUser() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes cookies instead.
        }
      },
    },
  });
}

/** Supabase client with full access. Server only; check permissions before using. */
export function supabaseAdmin() {
  return createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function currentUser() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return env.adminEmails().includes(email.toLowerCase());
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Please sign in.");
  return user;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) throw new Error("Not allowed.");
  return user;
}
