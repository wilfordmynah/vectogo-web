"use server";

import { revalidatePath } from "next/cache";
import { ONE_MORE_THING, PACKAGES, upgradeOptions, isPackageId } from "@/lib/config";
import { env } from "@/lib/env";
import { notifyVectogo } from "@/lib/email";
import { forRules, getCustomerOrder } from "@/lib/orders";
import { canBuyOneMoreThing, canRefund, canRequestChanges, canRespondToProof, canUpgrade } from "@/lib/rules";
import { createCheckout, ensureStripeCustomer, expireOpenCheckouts } from "@/lib/stripe";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { EXTRA_EXTENSIONS, MAX_UPLOAD_BYTES, extraPathPattern, fileNameOf, safeFileName } from "@/lib/uploads";

// Everything a customer can do on their order page. Each action loads the
// order through Row Level Security first, so a customer can only act on
// their own orders, then checks the ordering rules.

type Result = { error?: string; url?: string };

async function loadOwn(orderId: string) {
  await requireUser();
  const bundle = await getCustomerOrder(orderId);
  if (!bundle) throw new Error("Order not found.");
  return bundle;
}

const adminLink = (id: string) => `${env.siteUrl()}/admin/orders/${id}`;

export async function approveProof(orderId: string): Promise<Result> {
  const b = await loadOwn(orderId);
  if (!canRespondToProof(forRules(b))) return { error: "There's no proof waiting for you right now." };
  const latest = b.proofs.at(-1)!;
  const db = supabaseAdmin();
  await db.from("proofs").update({ response: "approved", responded_at: new Date().toISOString() }).eq("id", latest.id);
  await db.from("orders").update({ status: "approved" }).eq("id", orderId).eq("status", "proof_ready");
  await notifyVectogo(`Order #${b.order.number} approved!`, ["Time to export the final files."], adminLink(orderId));
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

export async function requestChanges(orderId: string, notes: string): Promise<Result> {
  const b = await loadOwn(orderId);
  const text = notes.trim().slice(0, 4000);
  if (!text) return { error: "Tell us what to change." };
  if (!canRequestChanges(forRules(b))) return { error: "You're out of revision rounds on this package." };
  const latest = b.proofs.at(-1)!;
  const db = supabaseAdmin();
  await db.from("proofs").update({ response: "changes", response_note: text, responded_at: new Date().toISOString() }).eq("id", latest.id);
  await db
    .from("orders")
    .update({ status: "revision_requested", rounds_used: b.order.rounds_used + 1 })
    .eq("id", orderId)
    .eq("status", "proof_ready");
  await notifyVectogo(`Changes requested on order #${b.order.number}`, [text], adminLink(orderId));
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

export async function startUpgrade(orderId: string, to: string): Promise<Result> {
  const b = await loadOwn(orderId);
  const user = await requireUser();
  if (!isPackageId(to) || !canUpgrade(forRules(b))) return { error: "That upgrade isn't available." };
  const option = upgradeOptions(b.order.package).find((o) => o.to.id === to);
  if (!option) return { error: "That upgrade isn't available." };

  await expireOpenCheckouts(orderId, "upgrade");
  const db = supabaseAdmin();
  const description = `Upgrade ${PACKAGES[b.order.package].name} to ${option.to.name}`;
  const { data: payment } = await db
    .from("payments")
    .insert({ order_id: orderId, kind: "upgrade", description, amount_cents: option.differenceCents, upgrade_to: to })
    .select("id")
    .single();
  const session = await createCheckout({
    customerId: await ensureStripeCustomer(user.id, user.email!),
    orderId,
    paymentId: payment!.id,
    name: description,
    description: `Order #${b.order.number}: price difference`,
    amountCents: option.differenceCents,
    successPath: `/account/orders/${orderId}?paid=upgrade`,
    cancelPath: `/account/orders/${orderId}`,
  });
  await db.from("payments").update({ stripe_checkout_session_id: session.id }).eq("id", payment!.id);
  return { url: session.url! };
}

export async function startOneMoreThing(orderId: string, notes: string): Promise<Result> {
  const b = await loadOwn(orderId);
  const user = await requireUser();
  const text = notes.trim();
  if (!text) return { error: "Tell us what to change." };
  if (!canBuyOneMoreThing(forRules(b))) return { error: "One More Thing! isn't available on this order right now." };

  await expireOpenCheckouts(orderId, "one_more_thing");
  const db = supabaseAdmin();
  const { data: payment } = await db
    .from("payments")
    .insert({ order_id: orderId, kind: "one_more_thing", description: ONE_MORE_THING.name, amount_cents: ONE_MORE_THING.priceCents })
    .select("id")
    .single();
  // The notes ride along on the checkout so the webhook can attach them to the round.
  const session = await createCheckout({
    customerId: await ensureStripeCustomer(user.id, user.email!),
    orderId,
    paymentId: payment!.id,
    name: `Vectogo: ${ONE_MORE_THING.name}`,
    description: `Order #${b.order.number}: ${ONE_MORE_THING.description}`,
    amountCents: ONE_MORE_THING.priceCents,
    successPath: `/account/orders/${orderId}?paid=one-more-thing`,
    cancelPath: `/account/orders/${orderId}`,
    extraMetadata: { notes: text.slice(0, 480) },
  });
  await db.from("payments").update({ stripe_checkout_session_id: session.id }).eq("id", payment!.id);
  return { url: session.url! };
}

export async function requestRefund(orderId: string, reason: string): Promise<Result> {
  const b = await loadOwn(orderId);
  if (!canRefund(forRules(b))) return { error: "Refunds are available through the first round only." };
  if (b.order.refund_requested_at) return {};
  const db = supabaseAdmin();
  await db.from("orders").update({ refund_requested_at: new Date().toISOString() }).eq("id", orderId);
  await db.from("messages").insert({ order_id: orderId, from_vectogo: false, body: `Refund requested. ${reason.trim().slice(0, 2000)}`.trim() });
  await notifyVectogo(`Refund requested on order #${b.order.number}`, [reason || "No reason given."], adminLink(orderId));
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

/** A one-time link to upload an extra file for a message on this order. */
export async function messageUploadUrl(
  orderId: string,
  file: { name: string; size: number },
): Promise<{ error?: string; path?: string; token?: string }> {
  await loadOwn(orderId);
  const name = safeFileName(file.name);
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTRA_EXTENSIONS.includes(ext)) {
    return { error: "Send images, PDF, AI, EPS, PSD, fonts or a ZIP." };
  }
  if (!file.size || file.size > MAX_UPLOAD_BYTES) return { error: "That file is over 25 MB. Got a smaller version?" };
  const path = `orders/${orderId}/extra/${crypto.randomUUID()}/${name}`;
  const { data, error } = await supabaseAdmin().storage.from("uploads").createSignedUploadUrl(path);
  if (error || !data) return { error: "Upload isn't available right now." };
  return { path: data.path, token: data.token };
}

export async function sendMessage(orderId: string, body: string, attachments: string[] = []): Promise<Result> {
  const b = await loadOwn(orderId);
  const text = body.trim().slice(0, 4000);
  const pattern = extraPathPattern(orderId);
  const files = attachments.filter((p) => pattern.test(p)).slice(0, 10);
  if (!text && !files.length) return { error: "Write a message or attach a file first." };
  const row: { order_id: string; from_vectogo: boolean; body: string; attachments?: string[] } = {
    order_id: orderId,
    from_vectogo: false,
    body: text,
  };
  if (files.length) row.attachments = files;
  const { error } = await supabaseAdmin().from("messages").insert(row);
  if (error) {
    console.error("Message failed:", error.message);
    return {
      error: /attachments/.test(error.message)
        ? "Attachments need one more database step: run supabase/migrations/0003_message_files.sql in Supabase."
        : "Couldn't send that. Please try again.",
    };
  }
  const lines = [text, ...files.map((p) => `Attached: ${fileNameOf(p)}`)].filter(Boolean);
  await notifyVectogo(`New message on order #${b.order.number}`, lines, adminLink(orderId));
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}
