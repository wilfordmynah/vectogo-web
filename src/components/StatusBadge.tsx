import { STATUS_LABEL, type OrderStatus } from "@/lib/rules";

const STYLE: Record<OrderStatus, string> = {
  awaiting_payment: "bg-black/10",
  paid: "bg-peach",
  in_progress: "bg-mint",
  proof_ready: "bg-magenta text-white",
  revision_requested: "bg-pink",
  approved: "bg-purple text-white",
  delivered: "bg-black text-white",
  refunded: "bg-black/10 line-through",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-medium ${STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}
