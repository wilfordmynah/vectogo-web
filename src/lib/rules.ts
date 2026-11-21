// The ordering rules from the "Vectogo ordering flow" doc, as plain functions
// so every screen and server action agrees on them.
//
// Terms used here:
// - A "round" is one change request. Just the basics includes 1, Oh yeah! 2,
//   I want it all! unlimited (within the original direction).
// - One More Thing! ($29) adds one round, then the job is final again.
// - Full refunds are available "through the first round": until a second
//   proof has been sent.

import { PACKAGES, upgradeOptions, type PackageId } from "./config";

export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "in_progress"
  | "proof_ready"
  | "revision_requested"
  | "approved"
  | "delivered"
  | "refunded";

export type OrderForRules = {
  package: PackageId;
  status: OrderStatus;
  rounds_used: number;
  extra_rounds: number;
  proofs_sent: number;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  in_progress: "In progress",
  proof_ready: "Proof ready",
  revision_requested: "Revision requested",
  approved: "Approved",
  delivered: "Delivered",
  refunded: "Refunded",
};

export const STATUS_HELP: Record<OrderStatus, string> = {
  awaiting_payment: "Checkout isn't finished yet.",
  paid: "You're in the queue. We'll reply within 24 hours with a review of your request.",
  in_progress: "Vectorizing and font matching are under way.",
  proof_ready: "Your proof is ready. Approve it or ask for changes.",
  revision_requested: "Got your notes. We're working on the next proof.",
  approved: "Approved! We're exporting your final files.",
  delivered: "All done. Your files are ready to download.",
  refunded: "This order was refunded.",
};

/** Customer-facing steps for the status timeline. */
export const TIMELINE: OrderStatus[] = ["paid", "in_progress", "proof_ready", "approved", "delivered"];

/** Total change requests allowed, or null for unlimited. */
export function roundsAllowed(o: Pick<OrderForRules, "package" | "extra_rounds">): number | null {
  const base = PACKAGES[o.package].rounds;
  return base === null ? null : base + o.extra_rounds;
}

/** Change requests left, or null for unlimited. */
export function roundsLeft(o: Pick<OrderForRules, "package" | "extra_rounds" | "rounds_used">): number | null {
  const allowed = roundsAllowed(o);
  return allowed === null ? null : Math.max(0, allowed - o.rounds_used);
}

export function canRespondToProof(o: OrderForRules) {
  return o.status === "proof_ready";
}

export function canRequestChanges(o: OrderForRules) {
  const left = roundsLeft(o);
  return canRespondToProof(o) && (left === null || left > 0);
}

/** Out of rounds on a live proof, or finished: offer upgrades / One More Thing!. */
export function outOfRounds(o: OrderForRules) {
  return roundsLeft(o) === 0 && (o.status === "proof_ready" || o.status === "delivered");
}

export function canBuyOneMoreThing(o: OrderForRules) {
  // Unlimited packages never need it.
  if (PACKAGES[o.package].rounds === null) return false;
  return outOfRounds(o);
}

export function canUpgrade(o: OrderForRules) {
  const active = ["paid", "in_progress", "proof_ready", "revision_requested"].includes(o.status);
  return active && upgradeOptions(o.package).length > 0;
}

/** Full refund only through the first round: no second proof sent yet. */
export function canRefund(o: OrderForRules) {
  const paidStates: OrderStatus[] = ["paid", "in_progress", "proof_ready", "revision_requested"];
  return paidStates.includes(o.status) && o.proofs_sent <= 1;
}

export function filesUnlocked(o: Pick<OrderForRules, "status">) {
  return o.status === "delivered";
}
