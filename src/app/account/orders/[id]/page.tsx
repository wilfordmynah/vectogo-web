import { notFound } from "next/navigation";
import PortalShell from "@/components/PortalShell";
import StatusBadge from "@/components/StatusBadge";
import OrderCustomerActions from "@/components/OrderCustomerActions";
import Messages from "@/components/Messages";
import { PACKAGES, money, upgradeOptions, ONE_MORE_THING } from "@/lib/config";
import { forRules, getCustomerOrder, signedUrls } from "@/lib/orders";
import { syncPendingPayments } from "@/lib/payments";
import ColorSwatches from "@/components/ColorSwatches";
import { fileNameOf, isImagePath } from "@/lib/uploads";
import { currentUser } from "@/lib/supabase/server";
import {
  STATUS_HELP,
  TIMELINE,
  canBuyOneMoreThing,
  canRefund,
  canRequestChanges,
  canRespondToProof,
  canUpgrade,
  filesUnlocked,
  roundsLeft,
} from "@/lib/rules";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const user = await currentUser();
  if (user) await syncPendingPayments(user.id);
  const b = await getCustomerOrder(id);
  if (!b || b.order.status === "awaiting_payment") notFound();
  const { order, proofs, deliverables } = b;
  const r = forRules(b);
  const pkg = PACKAGES[order.package];
  const left = roundsLeft(r);

  const proofUrls = await signedUrls("proofs", proofs.map((p) => p.file_path));
  const unlocked = filesUnlocked(r);
  const fileUrls = unlocked
    ? await signedUrls("finals", deliverables.map((d) => d.file_path), (p) => p.split("/").pop()!)
    : {};

  // Everything the customer has sent us: the original logos plus files attached to messages.
  const sentFiles = [...order.logo_paths, ...b.messages.flatMap((m) => (m.from_vectogo ? [] : (m.attachments ?? [])))];
  const allAttachments = b.messages.flatMap((m) => m.attachments ?? []);
  const uploadUrls = await signedUrls("uploads", [...new Set([...sentFiles, ...allAttachments])]);
  const displayName = (p: string, i: number) =>
    i < order.logo_paths.length ? (order.brief.fileNames?.[i] ?? fileNameOf(p)) : fileNameOf(p);

  const step = TIMELINE.indexOf(order.status === "revision_requested" ? "in_progress" : order.status);

  return (
    <PortalShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-70">Order #{order.number}</p>
          <h1 className="font-display text-4xl font-black">{order.brief.businessName || "Your logo"}</h1>
          <p className="mt-1">{pkg.name} · {pkg.formats.join(", ")}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {paid && (
        <p className="mt-6 rounded-xl bg-mint p-3 text-sm">Payment received, thanks! This page updates in a few seconds; refresh if it hasn&apos;t yet.</p>
      )}

      {/* Status timeline */}
      {order.status !== "refunded" && (
        <ol className="mt-8 grid grid-cols-5 gap-2 text-center text-xs sm:text-sm">
          {TIMELINE.map((s, i) => (
            <li key={s}>
              <div className={`h-2 rounded-full ${i <= step ? "bg-purple" : "bg-black/10"}`} />
              <span className={`mt-2 block ${i === step ? "font-bold text-purple" : "opacity-70"}`}>
                {["Paid", "In progress", "Proof", "Approved", "Delivered"][i]}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-lg">{STATUS_HELP[order.status]}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {/* Proofs */}
          {proofs.length > 0 && (
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl font-black">Proofs</h2>
                <p className="text-sm">
                  {left === null ? "Unlimited revision rounds" : `${left} revision round${left === 1 ? "" : "s"} left`}
                </p>
              </div>
              <ul className="mt-4 space-y-6">
                {[...proofs].reverse().map((p) => (
                  <li key={p.id} className="vg-card overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proofUrls[p.file_path]} alt={`Proof ${p.round}`} className="max-h-[480px] w-full bg-[repeating-conic-gradient(#f3f3f3_0_25%,#fff_0_50%)] bg-[length:20px_20px] object-contain p-6" />
                    <div className="border-t-2 border-black p-5">
                      <p className="font-medium">Proof {p.round} · {new Date(p.created_at).toLocaleDateString()}</p>
                      {p.note && <p className="mt-1 whitespace-pre-wrap">{p.note}</p>}
                      {p.response === "approved" && <p className="mt-2 font-medium text-purple">You approved this one.</p>}
                      {p.response === "changes" && (
                        <p className="mt-2 whitespace-pre-wrap text-sm"><strong>Your changes:</strong> {p.response_note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Downloads */}
          {unlocked && (
            <section>
              <h2 className="font-display text-2xl font-black">Your files</h2>
              <p className="mt-1">Yours forever. Come back any time.</p>
              <ul className="mt-4 divide-y-2 divide-black/5 rounded-2xl border-2 border-black/10">
                {deliverables.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 p-4">
                    <span className="font-medium">{d.label}</span>
                    <a href={fileUrls[d.file_path]} className="text-sm font-medium text-purple underline">Download</a>
                  </li>
                ))}
              </ul>
              {deliverables.length > 1 && (
                <a href={`/api/orders/${order.id}/zip`} className="vg-pill vg-pill--solid mt-4">Download everything (.zip)</a>
              )}
            </section>
          )}

          <section>
            <h2 className="font-display text-2xl font-black">Your brief and files</h2>
            <div className="mt-4 grid gap-6 rounded-3xl border-2 border-black/10 p-5 sm:grid-cols-2">
              <dl className="space-y-3 text-sm">
                <Field label="Business name" value={order.brief.businessName} />
                <Field label="Fonts" value={order.brief.fontsUnsure ? "Not sure, you figure it out" : order.brief.fonts} />
                {order.brief.colors && (
                  <div>
                    <dt className="opacity-60">Brand colors</dt>
                    <dd className="mt-1">
                      <ColorSwatches value={order.brief.colors} />
                    </dd>
                  </div>
                )}
                <Field label="What matters most" value={order.brief.priorities} />
                <Field label="Anything else" value={order.brief.notes} />
              </dl>
              <div>
                <p className="text-sm opacity-60">Files you sent</p>
                <ul className="mt-2 grid grid-cols-3 gap-3">
                  {sentFiles.map((p, i) => (
                    <li key={p}>
                      <a href={uploadUrls[p]} target="_blank" rel="noreferrer" className="block text-center text-xs" title={displayName(p, i)}>
                        {isImagePath(p) && uploadUrls[p] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={uploadUrls[p]} alt="" className="aspect-square w-full rounded-xl border-2 border-black/10 bg-white object-contain p-1" />
                        ) : (
                          <span className="grid aspect-square w-full place-items-center rounded-xl bg-pink font-bold uppercase">
                            {p.split(".").pop()}
                          </span>
                        )}
                        <span className="mt-1 block truncate">{displayName(p, i)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs opacity-60">Need to send another version? Attach it in Messages below.</p>
              </div>
            </div>
          </section>

          <Messages orderId={order.id} messages={b.messages} fileUrls={uploadUrls} />
        </div>

        <aside className="space-y-6">
          <OrderCustomerActions
            orderId={order.id}
            canRespond={canRespondToProof(r)}
            canChange={canRequestChanges(r)}
            canOneMore={canBuyOneMoreThing(r)}
            oneMorePrice={money(ONE_MORE_THING.priceCents)}
            upgrades={
              canUpgrade(r)
                ? upgradeOptions(order.package).map((o) => ({ id: o.to.id, name: o.to.name, price: money(o.differenceCents) }))
                : []
            }
            refundable={canRefund(r)}
            refundRequested={!!order.refund_requested_at}
            isDelivered={order.status === "delivered"}
          />

        </aside>
      </div>
    </PortalShell>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="opacity-60">{label}</dt>
      <dd className="whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
