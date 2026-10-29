import type { OrderStatus } from "@/lib/shop";
import { cx } from "./ui";

const styles: Record<OrderStatus, string> = {
  pending: "bg-ball-400/25 text-ball-700 dark:text-ball-300",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  collected: "bg-navy-50 text-navy-700 dark:bg-navy-900 dark:text-navy-100",
  cancelled: "bg-bg-soft text-fg-muted line-through",
};

export function OrderStatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[status])}>{label}</span>;
}
