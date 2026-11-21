"use client";

import { createBrowserClient } from "@supabase/ssr";

// Trim stray spaces or quotes: a key with a line break in it makes Safari fail
// with "The string did not match the expected pattern."
const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "").trim();

export function supabaseBrowser() {
  return createBrowserClient(clean(process.env.NEXT_PUBLIC_SUPABASE_URL), clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}
