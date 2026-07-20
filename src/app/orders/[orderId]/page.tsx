import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/whatsapp";
import RazorpayPayButton from "@/components/RazorpayPayButton";

const statusColor: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await requireUser(["PRINCIPAL"]);

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { supplier: true } } },
  });

  if (!order || order.buyerId !== user.id) notFound();

  const whatsappHref = whatsappLink(
    `Hi TN School Cart, I'd like an update on Order #${order.id.slice(-8)} (${order.shippingSchool}). Total: ₹${order.totalAmount.toFixed(2)}${order.paid ? " (Paid)" : ""}.`
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <h1 className="text-2xl font-bold">Order #{order.id.slice(-8)}</h1>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold rounded-md px-3 py-1.5 hover:brightness-95 transition"
        >
          Chat on WhatsApp
        </a>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
      </p>

      <div className="card p-4 mb-6">
        <h2 className="font-semibold mb-2">Delivery to</h2>
        <p className="text-sm">{order.shippingSchool}</p>
        {order.shippingUdise && (
          <p className="text-xs text-foreground/50">UDISE: {order.shippingUdise}</p>
        )}
        <p className="text-sm text-foreground/60">{order.shippingAddress}</p>
        <p className="text-sm text-foreground/60">
          {[order.shippingBlock, order.shippingTaluk].filter(Boolean).join(", ")}
          {order.shippingBlock || order.shippingTaluk ? ", " : ""}
          {order.shippingDistrict} District, Tamil Nadu
          {order.shippingPinCode ? ` - ${order.shippingPinCode}` : ""}
        </p>
      </div>

      <div className="card divide-y divide-border mb-6">
        {order.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{item.titleAtOrder}</p>
              <p className="text-xs text-foreground/50">
                Sold by {item.supplier.businessName ?? item.supplier.name} &middot;{" "}
                {item.quantity} &times; &#8377;{item.priceAtOrder.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">
                &#8377;{(item.priceAtOrder * item.quantity).toFixed(2)}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[item.status]}`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
        <div className="p-4 flex justify-between font-bold">
          <span>Total {order.paid && <span className="text-accent font-normal text-xs">(Paid)</span>}</span>
          <span>&#8377;{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {!order.paid && order.razorpayOrderId && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && (
        <div className="card p-4 mb-6">
          <h2 className="font-semibold mb-3">Complete payment</h2>
          <RazorpayPayButton
            orderId={order.id}
            razorpayOrderId={order.razorpayOrderId}
            razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
            amount={order.totalAmount}
            buyerName={user.name}
            buyerEmail={user.email}
            buyerPhone={user.phone}
          />
        </div>
      )}
    </div>
  );
}
