"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { addDeliverable, adminUploadUrl, deliver, refundOrder, removeDeliverable, sendProof, startWork } from "@/app/admin/actions";
import type { OrderStatus } from "@/lib/rules";

type Props = {
  orderId: string;
  status: OrderStatus;
  deliverables: { id: string; label: string; url?: string }[];
  formats: string[];
  extras: string[];
  refundable: boolean;
  paidTotal: string;
};

async function upload(orderId: string, bucket: "proofs" | "finals", file: File) {
  const res = await adminUploadUrl(orderId, bucket, file.name);
  if ("error" in res && res.error) throw new Error(res.error);
  const { path, token } = res as { path: string; token: string };
  const { error } = await supabaseBrowser().storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw new Error("Upload failed.");
  return path;
}

export default function AdminOrderActions(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);

  const run = (fn: () => Promise<{ error?: string } | void>) => {
    setError(null);
    start(async () => {
      try {
        const res = await fn();
        if (res && res.error) setError(res.error);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  const canProof = ["paid", "in_progress", "revision_requested"].includes(p.status);

  return (
    <section className="vg-card space-y-5 p-5">
      <h2 className="font-display text-xl font-black">Actions</h2>

      {p.status === "paid" && (
        <button disabled={pending} onClick={() => run(() => startWork(p.orderId))} className="vg-pill vg-pill--solid w-full justify-center">
          Start work
        </button>
      )}

      {canProof && (
        <div className="space-y-2">
          <p className="font-medium">Send a proof</p>
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="A note for the customer (optional)" className="w-full rounded-2xl border-2 border-black/20 p-3 text-sm" />
          <button
            disabled={pending || !proofFile}
            onClick={() =>
              run(async () => {
                const path = await upload(p.orderId, "proofs", proofFile!);
                const res = await sendProof(p.orderId, path, note);
                if (!res.error) {
                  setProofFile(null);
                  setNote("");
                }
                return res;
              })
            }
            className="vg-pill vg-pill--solid w-full justify-center disabled:opacity-50"
          >
            {pending ? "Sending…" : "Upload and send proof"}
          </button>
        </div>
      )}

      {(p.status === "approved" || p.status === "delivered") && (
        <div className="space-y-2">
          <p className="font-medium">Final files</p>
          <p className="text-xs opacity-70">
            This package gets: {p.formats.join(", ")}
            {p.extras.length > 0 && `; ${p.extras.join("; ")}`}
          </p>
          <ul className="space-y-1 text-sm">
            {p.deliverables.map((d) => (
              <li key={d.id} className="flex justify-between gap-2">
                <a href={d.url} className="truncate underline">{d.label}</a>
                <button className="text-xs opacity-60" onClick={() => run(() => removeDeliverable(p.orderId, d.id))}>Remove</button>
              </li>
            ))}
          </ul>
          <input
            type="file"
            multiple
            className="text-sm"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              run(async () => {
                for (const f of files) {
                  const path = await upload(p.orderId, "finals", f);
                  const res = await addDeliverable(p.orderId, path, f.name);
                  if (res.error) return res;
                }
              });
            }}
          />
          {p.status === "approved" && (
            <button disabled={pending || !p.deliverables.length} onClick={() => run(() => deliver(p.orderId))} className="vg-pill vg-pill--solid w-full justify-center disabled:opacity-50">
              Deliver to customer
            </button>
          )}
        </div>
      )}

      {p.refundable && (
        <div className="border-t-2 border-black/5 pt-4 text-sm">
          {confirmRefund ? (
            <>
              <p>Refund {p.paidTotal} in full? This can&apos;t be undone.</p>
              <div className="mt-2 flex gap-2">
                <button disabled={pending} onClick={() => run(() => refundOrder(p.orderId))} className="vg-pill !py-2 bg-magenta text-white">Yes, refund</button>
                <button onClick={() => setConfirmRefund(false)} className="vg-pill !py-2">Cancel</button>
              </div>
            </>
          ) : (
            <button onClick={() => setConfirmRefund(true)} className="underline opacity-70">Full refund (allowed through the first round)</button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
