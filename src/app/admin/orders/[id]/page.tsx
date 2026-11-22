import Link from "next/link";
import { notFound } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import StatusBadge from "@/components/StatusBadge";
import Messages from "@/components/Messages";
import AdminOrderActions from "@/components/AdminOrderActions";
import ColorSwatches from "@/components/ColorSwatches";
import { fileNameOf } from "@/lib/uploads";
import { PACKAGES, money } from "@/lib/config";
import { forRules, getOrderAdmin, signedUrls } from "@/lib/orders";
import { canRefund, roundsLeft } from "@/lib/rules";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await getOrderAdmin(id);
  if (!b) notFound();
  const { order, proofs, payments, deliverables } = b;
  const { data: profile } = await supabaseAdmin().from("profiles").select("email, business_name").eq("id", order.customer_id).single();
  const r = forRules(b);
  const left = roundsLeft(r);
  const pkg = PACKAGES[order.package];

  const logoUrls = await signedUrls("uploads", order.logo_paths, (p) => `order-${order.number}-${p.split("/").pop()}`);
  const extraFiles = b.messages.flatMap((m) => m.attachments ?? []);
  const extraUrls = await signedUrls("uploads", extraFiles, (p) => `order-${order.number}-${fileNameOf(p)}`);
  const proofUrls = await signedUrls("proofs", proofs.map((p) => p.file_path));
  const finalUrls = await signedUrls("finals", deliverables.map((d) => d.file_path));
  const paidTotal = payments.filter((p) => p.status === "paid").reduce((n, p) => n + p.amount_cents, 0);

  return (
    <PortalShell>
      <Link href="/admin" className="text-sm underline">← Queue</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-70">Order #{order.number} · {profile?.email}</p>
          <h1 className="font-display text-4xl font-black">{order.brief.businessName || "Untitled"}</h1>
          <p className="mt-1">
            {pkg.name} · {pkg.formats.join(", ")} · {left === null ? "unlimited rounds" : `${left} round${left === 1 ? "" : "s"} left`}
            {order.extra_rounds > 0 && ` · ${order.extra_rounds} One More Thing!`}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      {order.refund_requested_at && order.status !== "refunded" && (
        <p className="mt-4 rounded-xl bg-peach p-3 text-sm">The customer asked for a refund on {new Date(order.refund_requested_at).toLocaleString()}.</p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-2xl font-black">Brief</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Item label="Fonts" value={order.brief.fontsUnsure ? "Not sure" : order.brief.fonts} />
              {order.brief.colors && (
                <div className="rounded-2xl bg-pink/50 p-3">
                  <dt className="text-sm opacity-60">Colors</dt>
                  <dd className="mt-1">
                    <ColorSwatches value={order.brief.colors} />
                  </dd>
                </div>
              )}
              <Item label="What matters most" value={order.brief.priorities} />
              <Item label="Notes" value={order.brief.notes} />
            </dl>
            <h3 className="mt-6 font-medium">Customer files</h3>
            <ul className="mt-2 flex flex-wrap gap-3">
              {order.logo_paths.map((p, i) => (
                <li key={p}>
                  <a href={logoUrls[p]} className="vg-pill !py-2 text-sm">{order.brief.fileNames?.[i] ?? `File ${i + 1}`}</a>
                </li>
              ))}
              {extraFiles.map((p) => (
                <li key={p}>
                  <a href={extraUrls[p]} className="vg-pill !py-2 text-sm">📎 {fileNameOf(p)}</a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-black">Proofs</h2>
            {proofs.length === 0 && <p className="mt-2 opacity-60">None sent yet.</p>}
            <ul className="mt-3 space-y-4">
              {proofs.map((p) => (
                <li key={p.id} className="flex gap-4 rounded-2xl border-2 border-black/10 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofUrls[p.file_path]} alt="" className="h-24 w-24 rounded-lg object-contain" />
                  <div className="text-sm">
                    <p className="font-medium">Proof {p.round} · {new Date(p.created_at).toLocaleString()}</p>
                    {p.note && <p className="whitespace-pre-wrap">{p.note}</p>}
                    <p className="mt-1">
                      {p.response === "pending" ? "Waiting on customer" : p.response === "approved" ? "Approved" : "Changes requested:"}
                    </p>
                    {p.response_note && <p className="whitespace-pre-wrap rounded-lg bg-pink p-2">{p.response_note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <Messages orderId={order.id} messages={b.messages} fileUrls={extraUrls} asAdmin />
        </div>

        <aside className="space-y-6">
          <AdminOrderActions
            orderId={order.id}
            status={order.status}
            deliverables={deliverables.map((d) => ({ id: d.id, label: d.label, url: finalUrls[d.file_path] }))}
            formats={pkg.formats}
            extras={pkg.extras}
            refundable={canRefund(r)}
            paidTotal={money(paidTotal)}
          />

          <section className="rounded-2xl border-2 border-black/10 p-5 text-sm">
            <h2 className="font-display text-lg font-black">Payments</h2>
            <ul className="mt-2 space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span>{p.description} <span className="opacity-60">({p.status})</span></span>
                  <span>{money(p.amount_cents)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </PortalShell>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl bg-pink/50 p-3">
      <dt className="text-sm opacity-60">{label}</dt>
      <dd className="whitespace-pre-wrap">{value || "—"}</dd>
    </div>
  );
}
