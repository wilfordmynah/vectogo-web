import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import StatusBadge from "@/components/StatusBadge";
import { PACKAGES } from "@/lib/config";
import type { OrderRow } from "@/lib/orders";
import type { OrderStatus } from "@/lib/rules";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata = { title: "Order queue | Vectogo admin" };

const GROUPS: { title: string; statuses: OrderStatus[]; hint: string }[] = [
  { title: "Needs you", statuses: ["paid", "revision_requested", "approved"], hint: "New orders, change requests and approvals to deliver" },
  { title: "In progress", statuses: ["in_progress"], hint: "You're working on these" },
  { title: "Waiting on the customer", statuses: ["proof_ready"], hint: "Proof sent" },
  { title: "Done", statuses: ["delivered", "refunded"], hint: "Last 30 days" },
];

export default async function AdminQueue({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  let query = supabaseAdmin()
    .from("orders")
    .select("id, number, package, status, brief, created_at, updated_at, paid_at, refund_requested_at, profiles(email)")
    .neq("status", "awaiting_payment")
    .order("created_at", { ascending: true })
    .limit(300);
  if (q?.trim()) {
    const n = Number(q.replace("#", ""));
    query = Number.isFinite(n) && n > 0 ? query.eq("number", n) : query.ilike("brief->>businessName", `%${q.trim()}%`);
  }
  const { data } = await query;
  type Row = Pick<OrderRow, "id" | "number" | "package" | "status" | "brief" | "created_at" | "updated_at" | "paid_at" | "refund_requested_at"> & {
    profiles: { email: string } | null;
  };
  const orders = (data ?? []) as unknown as Row[];

  return (
    <PortalShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-black">Order queue</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Order # or business" className="rounded-full border-2 border-black/20 px-4 py-2" />
          <button className="vg-pill !py-2">Search</button>
        </form>
      </div>

      {GROUPS.map((g) => {
        const rows = orders.filter((o) => g.statuses.includes(o.status) && (g.title !== "Done" || o.updated_at >= since));
        const list = g.title === "Done" ? [...rows].reverse() : rows;
        return (
          <section key={g.title} className="mt-10">
            <h2 className="font-display text-2xl font-black">
              {g.title} <span className="font-extralight">({rows.length})</span>
            </h2>
            <p className="text-sm opacity-60">{g.hint}</p>
            {list.length > 0 && (
              <ul className="mt-3 divide-y-2 divide-black/5 rounded-2xl border-2 border-black/10">
                {list.map((o) => {
                  const late = o.status === "paid" && o.paid_at && Date.now() - Date.parse(o.paid_at) > 24 * 3600e3;
                  return (
                    <li key={o.id}>
                      <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-pink/40">
                        <div>
                          <p className="font-medium">
                            #{o.number} · {o.brief?.businessName || "Untitled"}
                            {late && <span className="ml-2 rounded-full bg-magenta px-2 py-0.5 text-xs text-white">Over 24h</span>}
                            {o.refund_requested_at && o.status !== "refunded" && (
                              <span className="ml-2 rounded-full bg-peach px-2 py-0.5 text-xs">Refund requested</span>
                            )}
                          </p>
                          <p className="text-sm opacity-60">
                            {PACKAGES[o.package].name} · {o.profiles?.email} · {new Date(o.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={o.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </PortalShell>
  );
}
