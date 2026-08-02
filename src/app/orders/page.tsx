import Link from "next/link";
import {
  PackageSearch,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MARKETPLACE_BUYER_ROLES } from "@/lib/constants";

const statusColor: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusIcon: Record<string, LucideIcon> = {
  PLACED: Clock,
  CONFIRMED: CheckCircle2,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
};

export default async function OrdersPage() {
  const user = await requireUser(MARKETPLACE_BUYER_ROLES);

  const orders = await db.order.findMany({
    where: { buyerId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 w-full">
      <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold mb-6">
        <Package size={22} className="text-brand" />
        My orders
      </h1>

      {orders.length === 0 ? (
        <div className="card p-8 flex flex-col items-center text-center rounded-2xl">
          <PackageSearch size={36} className="mb-3 text-foreground/30" />
          <p className="text-sm text-foreground/60 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/marketplace" className="text-brand font-semibold hover:underline">
            Browse the marketplace &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const overallStatus = order.items.every((i) => i.status === "DELIVERED")
              ? "DELIVERED"
              : order.items.some((i) => i.status === "CANCELLED")
                ? order.items.every((i) => i.status === "CANCELLED")
                  ? "CANCELLED"
                  : "PLACED"
                : order.items[0]?.status ?? "PLACED";
            const StatusIcon = statusIcon[overallStatus];

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="card p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-brand hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Order #{order.id.slice(-8)}</p>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {order.items.length} item(s) &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <span className="font-bold text-brand-dark text-sm sm:text-base">
                    &#8377;{order.totalAmount.toFixed(2)}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${statusColor[overallStatus]}`}
                  >
                    {StatusIcon && <StatusIcon size={11} />}
                    {overallStatus}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
