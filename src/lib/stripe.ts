import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";

let client: Stripe | null = null;
export function stripe() {
  // Fetch-based client so it runs on Cloudflare Workers as well as Node.
  client ??= new Stripe(env.stripeSecretKey(), { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

/** One Stripe Customer per Vectogo account, created on first checkout. */
export async function ensureStripeCustomer(userId: string, email: string) {
  const db = supabaseAdmin();
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", userId).single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id as string;

  const customer = await stripe().customers.create({ email, metadata: { vectogo_user_id: userId } });
  await db.from("profiles").upsert({ id: userId, email, stripe_customer_id: customer.id });
  return customer.id;
}

type CheckoutInput = {
  customerId: string;
  orderId: string;
  paymentId: string;
  name: string;
  description: string;
  amountCents: number;
  successPath: string;
  cancelPath: string;
  /** Extra notes for the webhook (Stripe allows up to 500 characters per value). */
  extraMetadata?: Record<string, string>;
};

/**
 * A Checkout Session for one line item. The customer can tick "save my card"
 * for next time (upgrades, One More Thing!), and gets a receipt and an invoice PDF.
 */
export async function createCheckout(input: CheckoutInput) {
  const site = env.siteUrl();
  const metadata = { ...input.extraMetadata, order_id: input.orderId, payment_id: input.paymentId };
  return stripe().checkout.sessions.create({
    mode: "payment",
    customer: input.customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: { name: input.name, description: input.description },
        },
      },
    ],
    // Saving the card is the customer's choice (a checkbox on the Stripe page).
    // Don't combine this with setup_future_usage, which saves every card without asking.
    payment_intent_data: { metadata: { order_id: input.orderId, payment_id: input.paymentId } },
    saved_payment_method_options: { payment_method_save: "enabled" },
    invoice_creation: { enabled: true },
    metadata,
    success_url: `${site}${input.successPath}${input.successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}${input.cancelPath}`,
  });
}

/**
 * Closes any unpaid checkout pages of this kind still open on the order, so a
 * customer who clicks "Upgrade" twice can't end up paying twice.
 */
export async function expireOpenCheckouts(orderId: string, kind: "upgrade" | "one_more_thing") {
  const db = supabaseAdmin();
  const { data: open } = await db
    .from("payments")
    .select("id, stripe_checkout_session_id")
    .eq("order_id", orderId)
    .eq("kind", kind)
    .eq("status", "pending");
  for (const p of open ?? []) {
    if (p.stripe_checkout_session_id) {
      try {
        await stripe().checkout.sessions.expire(p.stripe_checkout_session_id);
      } catch {
        // Already completed or expired: the webhook has (or will have) the final word.
        continue;
      }
    }
    await db.from("payments").update({ status: "failed" }).eq("id", p.id).eq("status", "pending");
  }
}
