"use server";

import { revalidatePath } from "next/cache";
import { PACKAGES } from "@/lib/config";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/email";
import { forRules, getOrderAdmin } from "@/lib/orders";
import { canRefund } from "@/lib/rules";
import { stripe } from "@/lib/stripe";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase/server";

// Everything Vectogo does from the order workspace. Each action checks the
// signed-in person is on the ADMIN_EMAILS list before touching anything.

type Result = { error?: string };

async function load(orderId: string) {
  await requireAdmin();
  const b = await getOrderAdmin(orderId);
  if (!b) throw new Error("Order not found.");
  const { data: profile } = await supabaseAdmin().from("profiles").select("email").eq("id", b.order.customer_id).single();
  return { ...b, email: profile?.email as string | undefined };
}

const orderLink = (id: string) => `${env.siteUrl()}/account/orders/${id}`;
const done = (id: string) => {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
};

/** Upload links for proofs and final files go straight to private storage. */
export async function adminUploadUrl(orderId: string, bucket: "proofs" | "finals", fileName: string) {
  await requireAdmin();
  const safe = fileName.replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").slice(0, 120) || "file";
  const path = `${orderId}/${Date.now()}-${safe}`;
  const { data, error } = await supabaseAdmin().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return { error: "Couldn't start the upload." };
  return { path: data.path, token: data.token };
}

export async function startWork(orderId: string): Promise<Result> {
  const b = await load(orderId);
  if (b.order.status !== "paid") return { error: "Only new orders can be started." };
  await supabaseAdmin().from("orders").update({ status: "in_progress" }).eq("id", orderId).eq("status", "paid");
  done(orderId);
  return {};
}

export async function sendProof(orderId: string, path: string, note: string): Promise<Result> {
  const b = await load(orderId);
  if (!["paid", "in_progress", "revision_requested"].includes(b.order.status)) return { error: "This order isn't waiting on a proof." };
  if (!path.startsWith(`${orderId}/`)) return { error: "Upload the proof first." };
  const db = supabaseAdmin();
  const round = b.proofs.length + 1;
  await db.from("proofs").insert({ order_id: orderId, round, file_path: path, note: note.trim() || null });
  await db.from("orders").update({ status: "proof_ready" }).eq("id", orderId);
  if (b.email) {
    await sendMail({
      to: b.email,
      subject: `Proof ${round} is ready for order #${b.order.number}`,
      lines: ["Ta-da! Your proof is ready.", "Have a look, then approve it or tell us what to change."],
      link: { href: orderLink(orderId), label: "See your proof" },
    });
  }
  done(orderId);
  return {};
}

export async function addDeliverable(orderId: string, path: string, label: string): Promise<Result> {
  await load(orderId);
  if (!path.startsWith(`${orderId}/`)) return { error: "Upload the file first." };
  await supabaseAdmin().from("deliverables").insert({ order_id: orderId, file_path: path, label: label.trim() || path.split("/").pop() });
  done(orderId);
  return {};
}

export async function removeDeliverable(orderId: string, deliverableId: string): Promise<Result> {
  await load(orderId);
  await supabaseAdmin().from("deliverables").delete().eq("id", deliverableId).eq("order_id", orderId);
  done(orderId);
  return {};
}

export async function deliver(orderId: string): Promise<Result> {
  const b = await load(orderId);
  if (b.order.status !== "approved") return { error: "The customer hasn't approved a proof yet." };
  if (!b.deliverables.length) return { error: "Add the final files first." };
  await supabaseAdmin().from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", orderId);
  if (b.email) {
    await sendMail({
      to: b.email,
      subject: `Bam! Your files for order #${b.order.number} are ready`,
      lines: [
        "Your logo is crisp, happy and ready for anything.",
        `Download all your ${PACKAGES[b.order.package].formats.join(", ")} files from your account, any time.`,
      ],
      link: { href: orderLink(orderId), label: "Download your files" },
    });
  }
  done(orderId);
  return {};
}

/** Full refund of every payment on the order. Allowed only through the first round. */
export async function refundOrder(orderId: string): Promise<Result> {
  const b = await load(orderId);
  if (!canRefund(forRules(b))) return { error: "Past the first round: refunds are no longer offered." };
  const paid = b.payments.filter((p) => p.status === "paid");
  if (!paid.length) return { error: "Nothing to refund." };
  for (const p of paid) {
    const intentId = (await supabaseAdmin().from("payments").select("stripe_payment_intent_id").eq("id", p.id).single()).data
      ?.stripe_payment_intent_id;
    if (!intentId) return { error: `Payment "${p.description}" has no Stripe record.` };
    await stripe().refunds.create({ payment_intent: intentId, metadata: { order_id: orderId } }, { idempotencyKey: `refund-${p.id}` });
  }
  // Stripe's charge.refunded webhook marks the order Refunded and emails the customer.
  done(orderId);
  return {};
}

export async function adminSendMessage(orderId: string, body: string): Promise<Result> {
  const b = await load(orderId);
  const text = body.trim().slice(0, 4000);
  if (!text) return { error: "Write a message first." };
  await supabaseAdmin().from("messages").insert({ order_id: orderId, from_vectogo: true, body: text });
  if (b.email) {
    await sendMail({
      to: b.email,
      subject: `A note about order #${b.order.number}`,
      lines: [text],
      link: { href: orderLink(orderId), label: "Reply in your account" },
    });
  }
  done(orderId);
  return {};
}
