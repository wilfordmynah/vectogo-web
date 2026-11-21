import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { applyPaidPayment, applyRefund, markPaymentFailed } from "@/lib/payments";

// Stripe calls this URL for every payment and refund. The site only trusts
// these signed events to mark an order Paid, Upgraded or Refunded.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      body,
      signature ?? "",
      env.stripeWebhookSecret(),
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status === "paid") await applyPaidPayment(session);
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await markPaymentFailed(event.data.object);
        break;
      case "charge.refunded":
        await applyRefund(event.data.object);
        break;
    }
  } catch (err) {
    console.error(`Webhook ${event.type} failed`, err);
    // A 500 makes Stripe retry later.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
