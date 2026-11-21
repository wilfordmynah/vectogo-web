import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseForUser } from "@/lib/supabase/server";

// Where the emailed sign-in link lands. Supports both link styles Supabase can
// send: `token_hash` (works even if opened on another device; see README) and
// `code` (the default).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const supabase = await supabaseForUser();

  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const code = searchParams.get("code");

  let ok = false;
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) return NextResponse.redirect(`${origin}/login?error=link&next=${encodeURIComponent(next)}`);
  return NextResponse.redirect(`${origin}${next}`);
}

function safeNext(next: string | null) {
  // Only allow paths on this site.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}
