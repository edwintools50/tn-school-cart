import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/whatsapp";
import { updateOrderItemStatusAction } from "../actions";

const statusColor: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const NEXT_STATUS: Record<string, { value: string; label: string } | null> = {
  PLACED: { value: "CONFIRMED", label: "Confirm order" },
  CONFIRMED: { value: "SHIPPED", label: "Mark shipped" },
  SHIPPED: { value: "DELIVERED", label: "Mark delivered" },
  DELIVERED: null,
  CANCELLED: null,
};

export default async function SupplierOrdersPage() {
  const user = await requireUser(["SUPPLIER"]);

  const orderItems = await db.orderItem.findMany({
    where: { supplierId: user.id },
    include: { order: true },
    orderBy: { order: { createdAt: "desc" } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Incoming orders</h1>

      {orderItems.length === 0 ? (
        <p className="text-sm text-foreground/60">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orderItems.map((item) => {
            const next = NEXT_STATUS[item.status];
            const whatsappHref = whatsappLink(
              `Hi, this is regarding Order #${item.order.id.slice(-8)} for ${item.titleAtOrder} (${item.order.shippingSchool}). Current status: ${item.status}.`
            );
            return (
              <div key={item.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">{item.titleAtOrder}</p>
                  <p className="text-xs text-foreground/50">
                    Order #{item.order.id.slice(-8)} &middot; {item.order.shippingSchool} (
                    {item.order.shippingDistrict}) &middot; {item.quantity} &times; &#8377;
                    {item.priceAtOrder.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[item.status]}`}
                  >
                    {item.status}
                  </span>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#128C7E] hover:underline"
                  >
                    WhatsApp
                  </a>
                  {next && (
                    <form action={updateOrderItemStatusAction}>
                      <input type="hidden" name="orderItemId" value={item.id} />
                      <input type="hidden" name="status" value={next.value} />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        {next.label}
                      </button>
                    </form>
                  )}
                  {item.status === "PLACED" && (
                    <form action={updateOrderItemStatusAction}>
                      <input type="hidden" name="orderItemId" value={item.id} />
                      <input type="hidden" name="status" value="CANCELLED" />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
