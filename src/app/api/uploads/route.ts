import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { LOGO_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploads";

// Hands the order form a one-time link to upload a logo straight into private
// storage. Visitors can upload before signing in, so files land in a drafts
// folder and are tied to an order at checkout.

const ALLOWED = LOGO_TYPES;
const MAX_BYTES = MAX_UPLOAD_BYTES;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { type?: string; size?: number } | null;
  const ext = body?.type ? ALLOWED.get(body.type) : undefined;
  if (!ext) return NextResponse.json({ error: "Please upload a JPG, PNG, GIF, WEBP, SVG or PDF." }, { status: 400 });
  if (!body?.size || body.size > MAX_BYTES) {
    return NextResponse.json({ error: "That file is over 25 MB. Got a smaller version?" }, { status: 400 });
  }

  const path = `drafts/${crypto.randomUUID()}.${ext}`;
  try {
    const { data, error } = await supabaseAdmin().storage.from("uploads").createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message ?? "No upload link returned");
    return NextResponse.json({ path: data.path, token: data.token });
  } catch (err) {
    // Always answer in JSON so the form can show a readable message.
    console.error("Upload link failed:", err);
    const detail = process.env.NODE_ENV !== "production" && err instanceof Error ? ` (${err.message})` : "";
    return NextResponse.json({ error: `Upload isn't available right now.${detail}` }, { status: 500 });
  }
}
