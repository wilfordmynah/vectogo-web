import "server-only";
import type { PackageId } from "@/lib/config";
import type { OrderForRules, OrderStatus } from "@/lib/rules";
import { supabaseAdmin, supabaseForUser } from "@/lib/supabase/server";

export type OrderRow = {
  id: string;
  number: number;
  customer_id: string;
  package: PackageId;
  status: OrderStatus;
  brief: {
    businessName?: string;
    fonts?: string;
    fontsUnsure?: boolean;
    colors?: string;
    priorities?: string;
    notes?: string;
    fileNames?: string[];
  };
  logo_paths: string[];
  rounds_used: number;
  extra_rounds: number;
  refund_requested_at: string | null;
  refunded_at: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};
export type ProofRow = {
  id: string;
  round: number;
  file_path: string;
  note: string | null;
  response: "pending" | "approved" | "changes";
  response_note: string | null;
  created_at: string;
};
export type PaymentRow = {
  id: string;
  order_id: string;
  kind: "package" | "upgrade" | "one_more_thing";
  description: string;
  amount_cents: number;
  status: "pending" | "paid" | "refunded" | "failed";
  refunded_cents: number;
  receipt_url: string | null;
  invoice_url: string | null;
  created_at: string;
  paid_at: string | null;
};
export type MessageRow = { id: string; from_vectogo: boolean; body: string; created_at: string };
export type DeliverableRow = { id: string; file_path: string; label: string; created_at: string };

export type OrderBundle = {
  order: OrderRow;
  proofs: ProofRow[];
  payments: PaymentRow[];
  messages: MessageRow[];
  deliverables: DeliverableRow[];
};

export function forRules(b: Pick<OrderBundle, "order" | "proofs">): OrderForRules {
  return {
    package: b.order.package,
    status: b.order.status,
    rounds_used: b.order.rounds_used,
    extra_rounds: b.order.extra_rounds,
    proofs_sent: b.proofs.length,
  };
}

async function loadBundle(client: Awaited<ReturnType<typeof supabaseForUser>> | ReturnType<typeof supabaseAdmin>, id: string) {
  const { data: order } = await client.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;
  const [proofs, payments, messages, deliverables] = await Promise.all([
    client.from("proofs").select("*").eq("order_id", id).order("round"),
    client.from("payments").select("*").eq("order_id", id).order("created_at"),
    client.from("messages").select("*").eq("order_id", id).order("created_at"),
    client.from("deliverables").select("*").eq("order_id", id).order("created_at"),
  ]);
  return {
    order: order as OrderRow,
    proofs: (proofs.data ?? []) as ProofRow[],
    payments: (payments.data ?? []) as PaymentRow[],
    messages: (messages.data ?? []) as MessageRow[],
    deliverables: (deliverables.data ?? []) as DeliverableRow[],
  } satisfies OrderBundle;
}

/** The order as its customer may see it (Row Level Security applies). */
export async function getCustomerOrder(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return loadBundle(await supabaseForUser(), id);
}

/** Full access, for the admin area and server actions that already checked access. */
export async function getOrderAdmin(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return loadBundle(supabaseAdmin(), id);
}

/** Short-lived download links for private files. */
export async function signedUrls(bucket: "uploads" | "proofs" | "finals", paths: string[], downloadName?: (p: string) => string) {
  if (!paths.length) return {} as Record<string, string>;
  const storage = supabaseAdmin().storage.from(bucket);
  const out: Record<string, string> = {};
  await Promise.all(
    paths.map(async (p) => {
      const { data } = await storage.createSignedUrl(p, 60 * 30, downloadName ? { download: downloadName(p) } : undefined);
      if (data?.signedUrl) out[p] = data.signedUrl;
    }),
  );
  return out;
}
