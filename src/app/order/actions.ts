"use server";

import { isPackageId, PACKAGES } from "@/lib/config";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { createCheckout, ensureStripeCustomer } from "@/lib/stripe";

export type Brief = {
  businessName: string;
  fonts: string;
  fontsUnsure: boolean;
  colors: string;
  priorities: string;
  notes: string;
  /** Browser only: the logo's colors were already picked out once. */
  colorsAuto?: boolean;
};

export type Draft = {
  package: string;
  files: { path: string; name: string }[];
  brief: Brief;
};

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

/** Creates the order and sends the customer to Stripe Checkout. */
export async function startCheckout(draft: Draft): Promise<{ error?: string; url?: string }> {
  const user = await requireUser();
  if (!isPackageId(draft.package)) return { error: "Pick a package first." };
  const files = (draft.files ?? []).filter((f) => /^drafts\/[0-9a-f-]{36}\.[a-z]{3,4}$/.test(f.path)).slice(0, 5);
  if (!files.length) return { error: "Upload your logo first." };
  const brief: Brief = {
    businessName: clip(draft.brief?.businessName, 120),
    fonts: clip(draft.brief?.fonts, 300),
    fontsUnsure: Boolean(draft.brief?.fontsUnsure),
    colors: clip(draft.brief?.colors, 300),
    priorities: clip(draft.brief?.priorities, 1000),
    notes: clip(draft.brief?.notes, 2000),
  };
  if (!brief.businessName) return { error: "Add your business name to the brief." };

  const pkg = PACKAGES[draft.package];
  const db = supabaseAdmin();
  const customerId = await ensureStripeCustomer(user.id, user.email!);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      customer_id: user.id,
      package: pkg.id,
      brief: { ...brief, fileNames: files.map((f) => clip(f.name, 200)) },
      logo_paths: files.map((f) => f.path),
    })
    .select("id, number")
    .single();
  if (error || !order) return { error: "We couldn't save your order. Please try again." };

  const { data: payment } = await db
    .from("payments")
    .insert({ order_id: order.id, kind: "package", description: pkg.name, amount_cents: pkg.priceCents })
    .select("id")
    .single();

  const session = await createCheckout({
    customerId,
    orderId: order.id,
    paymentId: payment!.id,
    name: `Vectogo: ${pkg.name}`,
    description: `Order #${order.number} for ${brief.businessName}`,
    amountCents: pkg.priceCents,
    successPath: `/order/confirmed?order=${order.id}`,
    cancelPath: `/order?step=review&cancelled=1`,
  });
  await db.from("payments").update({ stripe_checkout_session_id: session.id }).eq("id", payment!.id);

  return { url: session.url! };
}
