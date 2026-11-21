"use client";

import { useState, useTransition } from "react";
import { approveProof, requestChanges, requestRefund, startOneMoreThing, startUpgrade } from "@/app/account/actions";

type Props = {
  orderId: string;
  canRespond: boolean;
  canChange: boolean;
  canOneMore: boolean;
  oneMorePrice: string;
  upgrades: { id: string; name: string; price: string }[];
  refundable: boolean;
  refundRequested: boolean;
  isDelivered: boolean;
};

export default function OrderCustomerActions(p: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<null | "changes" | "one-more" | "refund">(null);

  const run = (fn: () => Promise<{ error?: string; url?: string }>) => {
    setError(null);
    start(async () => {
      try {
        const res = await fn();
        if (res.url) window.location.assign(res.url);
        else if (res.error) setError(res.error);
        else {
          setMode(null);
          setNotes("");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const outOfRounds = p.canRespond && !p.canChange;
  const anything = p.canRespond || p.canOneMore || p.upgrades.length > 0 || p.refundable;
  if (!anything && !p.refundRequested) return null;

  return (
    <section className="vg-card space-y-4 p-5">
      {p.canRespond && (
        <>
          <h2 className="font-display text-xl font-black">How&apos;s it looking?</h2>
          <button disabled={pending} onClick={() => run(() => approveProof(p.orderId))} className="vg-pill vg-pill--solid w-full justify-center">
            Love it, approve!
          </button>
          {p.canChange && (
            <button disabled={pending} onClick={() => setMode(mode === "changes" ? null : "changes")} className="vg-pill w-full justify-center">
              Ask for changes
            </button>
          )}
        </>
      )}

      {(outOfRounds || p.canOneMore) && (
        <div className="rounded-2xl bg-pink p-4 text-sm">
          <p className="font-medium">
            {p.isDelivered ? "Need an alteration?" : "You're out of revision rounds on this package."}
          </p>
          {p.canOneMore && (
            <button disabled={pending} onClick={() => setMode(mode === "one-more" ? null : "one-more")} className="vg-pill mt-3 w-full justify-center bg-white">
              One More Thing! {p.oneMorePrice}
            </button>
          )}
        </div>
      )}

      {mode && mode !== "refund" && (
        <div>
          <label className="text-sm font-medium" htmlFor="notes">
            {mode === "one-more" ? "What should we change? (one more round, then final)" : "What should we change?"}
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-2xl border-2 border-black/20 p-3 outline-none focus:border-purple"
          />
          <button
            disabled={pending || !notes.trim()}
            onClick={() => run(() => (mode === "one-more" ? startOneMoreThing(p.orderId, notes) : requestChanges(p.orderId, notes)))}
            className="vg-pill vg-pill--solid mt-2 w-full justify-center disabled:opacity-50"
          >
            {mode === "one-more" ? `Pay ${p.oneMorePrice} and send` : "Send my changes"}
          </button>
        </div>
      )}

      {p.upgrades.length > 0 && (
        <div className="text-sm">
          <p className="font-medium">Want more rounds or files? Upgrade for the difference:</p>
          <div className="mt-2 space-y-2">
            {p.upgrades.map((u) => (
              <button key={u.id} disabled={pending} onClick={() => run(() => startUpgrade(p.orderId, u.id))} className="vg-pill w-full justify-between">
                <span>{u.name}</span>
                <span>+{u.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {p.refundable && !p.refundRequested && (
        <div className="border-t-2 border-black/5 pt-3 text-sm">
          {mode === "refund" ? (
            <>
              <label htmlFor="reason" className="font-medium">Sorry it&apos;s not working out. Anything we should know?</label>
              <textarea id="reason" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-2xl border-2 border-black/20 p-3" />
              <button disabled={pending} onClick={() => run(() => requestRefund(p.orderId, notes))} className="vg-pill mt-2 w-full justify-center">
                Request my full refund
              </button>
            </>
          ) : (
            <button onClick={() => setMode("refund")} className="underline opacity-70">Not happy? Full refund through the first round</button>
          )}
        </div>
      )}
      {p.refundRequested && <p className="text-sm">Refund requested. We&apos;ll process it shortly.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
