import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await db.order.findMany({
    include: { buyer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">All orders</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-foreground/60">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                <p className="text-xs text-foreground/50">
                  {order.buyer.name} &middot; {order.shippingSchool} ({order.shippingDistrict}) &middot;{" "}
                  {order.items.length} item(s) &middot;{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className="font-bold">&#8377;{order.totalAmount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
