import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { money } from "@/lib/config";
import type { PaymentRow } from "@/lib/orders";
import { currentUser, supabaseForUser } from "@/lib/supabase/server";
import { syncPendingPayments } from "@/lib/payments";

export const metadata = { title: "Billing | Vectogo" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await currentUser();
  if (user) await syncPendingPayments(user.id);
  const supabase = await supabaseForUser();
  const { data } = await supabase
    .from("payments")
    .select("*, orders(number)")
    .in("status", ["paid", "refunded"])
    .order("paid_at", { ascending: false });
  const payments = (data ?? []) as (PaymentRow & { orders: { number: number } | null })[];

  return (
    <PortalShell>
      <h1 className="font-display text-4xl font-black">Billing</h1>
      <p className="mt-2">Every payment and refund, with Stripe receipts. If you choose to save a card at checkout, Stripe keeps it safe.</p>
      {payments.length === 0 ? (
        <p className="mt-8 opacity-70">No payments yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2">Date</th>
                <th>Order</th>
                <th>What</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Documents</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-black/10">
                  <td className="py-3">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ""}</td>
                  <td>
                    <Link className="underline" href={`/account/orders/${p.order_id}`}>#{p.orders?.number}</Link>
                  </td>
                  <td>{p.description}</td>
                  <td className="text-right">
                    {money(p.amount_cents)}
                    {p.refunded_cents > 0 && <span className="block text-magenta">Refunded {money(p.refunded_cents)}</span>}
                  </td>
                  <td className="space-x-3 text-right">
                    {p.receipt_url && <a className="underline" href={p.receipt_url}>Receipt</a>}
                    {p.invoice_url && <a className="underline" href={p.invoice_url}>Invoice</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
