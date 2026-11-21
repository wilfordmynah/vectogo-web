import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import StatusBadge from "@/components/StatusBadge";
import { PACKAGES } from "@/lib/config";
import type { OrderRow } from "@/lib/orders";
import { currentUser, supabaseForUser } from "@/lib/supabase/server";
import { syncPendingPayments } from "@/lib/payments";

export const metadata = { title: "My orders | Vectogo" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await currentUser();
  if (user) await syncPendingPayments(user.id);
  const supabase = await supabaseForUser();
  const { data } = await supabase
    .from("orders")
    .select("id, number, package, status, brief, created_at")
    .neq("status", "awaiting_payment")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Pick<OrderRow, "id" | "number" | "package" | "status" | "brief" | "created_at">[];

  return (
    <PortalShell>
      <h1 className="font-display text-4xl font-black">My orders</h1>
      {orders.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-pink p-8">
          <p className="font-display text-2xl font-black">Nothing here yet!</p>
          <p className="mt-1">Got a fuzzy logo? Let&apos;s make it happy.</p>
          <Link href="/order" className="vg-pill vg-pill--solid mt-5">Start an order</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="vg-card flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-display text-xl font-black">{o.brief?.businessName || "Your logo"}</p>
                  <p className="text-sm opacity-70">
                    Order #{o.number} · {PACKAGES[o.package].name} · {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
