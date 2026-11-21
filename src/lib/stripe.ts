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
};

/** A Checkout Session for one line item, with a saved card and an invoice PDF. */
export async function createCheckout(input: CheckoutInput) {
  const site = env.siteUrl();
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
    payment_intent_data: {
      setup_future_usage: "on_session",
      metadata: { order_id: input.orderId, payment_id: input.paymentId },
    },
    saved_payment_method_options: { payment_method_save: "enabled" },
    invoice_creation: { enabled: true },
    metadata: { order_id: input.orderId, payment_id: input.paymentId },
    success_url: `${site}${input.successPath}${input.successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}${input.cancelPath}`,
  });
}
