import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const statusColor: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
  const user = await requireUser(["PRINCIPAL"]);

  const orders = await db.order.findMany({
    where: { buyerId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">My orders</h1>

      {orders.length === 0 ? (
        <div className="card p-8 text-center">
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

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="card p-4 flex items-center justify-between hover:border-brand transition-colors"
              >
                <div>
                  <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                  <p className="text-xs text-foreground/50">
                    {order.items.length} item(s) &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">&#8377;{order.totalAmount.toFixed(2)}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[overallStatus]}`}
                  >
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
