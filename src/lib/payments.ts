import "server-only";
import type Stripe from "stripe";
import { PACKAGES, isPackageId } from "@/lib/config";
import { env } from "@/lib/env";
import { notifyVectogo, sendMail } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

// What happens on our side when Stripe confirms money moved. Every function
// is safe to run twice: Stripe can deliver the same event more than once.

export async function applyPaidPayment(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return;
  const db = supabaseAdmin();

  const { data: payment } = await db.from("payments").select("*").eq("id", paymentId).single();
  if (!payment || payment.status === "paid") return; // unknown, or already handled

  const intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  let receiptUrl: string | null = null;
  if (intentId) {
    const intent = await stripe().paymentIntents.retrieve(intentId, { expand: ["latest_charge"] });
    const charge = intent.latest_charge as Stripe.Charge | null;
    receiptUrl = charge?.receipt_url ?? null;
  }
  let invoiceUrl: string | null = null;
  if (session.invoice) {
    const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice.id;
    const invoice = await stripe().invoices.retrieve(invoiceId!);
    invoiceUrl = invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null;
  }

  // Claim the payment first so a duplicate event can't apply it twice.
  const { data: claimed } = await db
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: intentId ?? null,
      receipt_url: receiptUrl,
      invoice_url: invoiceUrl,
    })
    .eq("id", paymentId)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();
  if (!claimed) return;

  const { data: order } = await db
    .from("orders")
    .select("*, profiles(email)")
    .eq("id", payment.order_id)
    .single();
  if (!order) return;
  const email = (order.profiles as { email: string } | null)?.email;
  const orderUrl = `${env.siteUrl()}/account/orders/${order.id}`;
  const adminUrl = `${env.siteUrl()}/admin/orders/${order.id}`;

  if (payment.kind === "package") {
    await db.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id).eq("status", "awaiting_payment");
    if (email) {
      await sendMail({
        to: email,
        subject: `Got it! Order #${order.number} is in`,
        lines: [
          "Woohoo, your logo is in good hands.",
          `We'll reply within 24 hours with a review of your request, and your first proof follows 1 to 2 days after that.`,
        ],
        link: { href: orderUrl, label: "See your order" },
      });
    }
    await notifyVectogo(`New order #${order.number}: ${PACKAGES[order.package as keyof typeof PACKAGES].name}`, [
      `${order.brief?.businessName ?? "A customer"} just paid.`,
    ], adminUrl);
  }

  const upgradeTo: unknown = payment.upgrade_to;
  if (payment.kind === "upgrade" && isPackageId(upgradeTo)) {
    await db.from("orders").update({ package: upgradeTo }).eq("id", order.id);
    await db.from("messages").insert({
      order_id: order.id,
      from_vectogo: false,
      body: `Upgraded to ${PACKAGES[upgradeTo].name}.`,
    });
    if (email) {
      await sendMail({
        to: email,
        subject: `You're on ${PACKAGES[upgradeTo].name} now`,
        lines: ["Upgrade done! Your extra rounds and files are unlocked.", "Pick up right where you left off."],
        link: { href: orderUrl, label: "Back to your order" },
      });
    }
    await notifyVectogo(`Order #${order.number} upgraded to ${PACKAGES[upgradeTo].name}`, [], adminUrl);
  }

  if (payment.kind === "one_more_thing") {
    // One more round, used straight away with the notes they sent at checkout.
    const notes = session.metadata?.notes ?? "";
    await db
      .from("orders")
      .update({
        extra_rounds: order.extra_rounds + 1,
        rounds_used: order.rounds_used + 1,
        status: "revision_requested",
      })
      .eq("id", order.id);
    const { data: latest } = await db
      .from("proofs")
      .select("id, response")
      .eq("order_id", order.id)
      .order("round", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest && latest.response === "pending") {
      await db.from("proofs").update({ response: "changes", response_note: notes, responded_at: new Date().toISOString() }).eq("id", latest.id);
    }
    await db.from("messages").insert({ order_id: order.id, from_vectogo: false, body: `One More Thing! ${notes}`.trim() });
    await notifyVectogo(`One More Thing! on order #${order.number}`, [notes || "No notes added."], adminUrl);
  }
}

export async function markPaymentFailed(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return;
  await supabaseAdmin().from("payments").update({ status: "failed" }).eq("id", paymentId).eq("status", "pending");
}

/** Records a refund made in Stripe (from the admin button or Stripe's dashboard). */
export async function applyRefund(charge: Stripe.Charge) {
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!intentId) return;
  const db = supabaseAdmin();
  const { data: payment } = await db.from("payments").select("*").eq("stripe_payment_intent_id", intentId).maybeSingle();
  if (!payment) return;

  const fully = charge.amount_refunded >= charge.amount;
  await db
    .from("payments")
    .update({ refunded_cents: charge.amount_refunded, status: fully ? "refunded" : "paid" })
    .eq("id", payment.id);

  // The order is refunded once every paid payment on it has been fully refunded.
  const { data: rest } = await db.from("payments").select("status").eq("order_id", payment.order_id).in("status", ["paid"]);
  if (fully && (rest?.length ?? 0) === 0) {
    const { data: order } = await db
      .from("orders")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("id", payment.order_id)
      .neq("status", "refunded")
      .select("id, number, profiles(email)")
      .maybeSingle();
    const email = (order?.profiles as { email: string } | null | undefined)?.email;
    if (order && email) {
      await sendMail({
        to: email,
        subject: `Your refund for order #${order.number}`,
        lines: [
          "No hard feelings! Your full refund is on its way.",
          "It usually shows up on your statement within 5 to 10 business days.",
        ],
      });
    }
  }
}
