import { NextResponse, type NextRequest } from "next/server";
import JSZip from "jszip";
import { getCustomerOrder, getOrderAdmin } from "@/lib/orders";
import { filesUnlocked } from "@/lib/rules";
import { currentUser, isAdminEmail, supabaseAdmin } from "@/lib/supabase/server";

// All final files for an order in one zip. Customers can only zip their own
// delivered orders; the admin can zip any order.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const admin = isAdminEmail(user.email);
  const bundle = admin ? await getOrderAdmin(id) : await getCustomerOrder(id);
  if (!bundle) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!admin && !filesUnlocked(bundle.order)) return NextResponse.json({ error: "Files aren't ready yet." }, { status: 403 });

  const zip = new JSZip();
  const storage = supabaseAdmin().storage.from("finals");
  for (const d of bundle.deliverables) {
    const { data } = await storage.download(d.file_path);
    if (data) zip.file(d.file_path.split("/").pop()!, await data.arrayBuffer());
  }
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const name = `vectogo-${bundle.order.number}.zip`;
  return new NextResponse(bytes as unknown as BodyInit, {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${name}"` },
  });
}
