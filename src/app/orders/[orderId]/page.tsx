import { notFound } from "next/navigation";
import {
  MessageCircle,
  MapPin,
  Sparkles,
  Download,
  CreditCard,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MARKETPLACE_BUYER_ROLES } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";
import RazorpayPayButton from "@/components/RazorpayPayButton";

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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await requireUser(MARKETPLACE_BUYER_ROLES);

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { supplier: true, product: true } } },
  });

  if (!order || order.buyerId !== user.id) notFound();

  const allDigital = order.items.every((item) => item.product.isDigital);

  const whatsappHref = whatsappLink(
    `Hi TN School Cart, I'd like an update on Order #${order.id.slice(-8)} (${order.shippingSchool}). Total: ₹${order.totalAmount.toFixed(2)}${order.paid ? " (Paid)" : ""}.`
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 w-full">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-xl sm:text-2xl font-bold">Order #{order.id.slice(-8)}</h1>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs sm:text-sm font-semibold rounded-full px-3 py-1.5 hover:brightness-95 transition"
        >
          <MessageCircle size={14} />
          Chat on WhatsApp
        </a>
      </div>
      <p className="text-sm text-foreground/60 mb-6">
        Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
      </p>

      {!allDigital && (
        <div className="card p-4 mb-4 rounded-2xl">
          <h2 className="flex items-center gap-1.5 font-semibold mb-2">
            <MapPin size={16} className="text-brand" />
            Delivery to
          </h2>
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
      )}

      <div className="card divide-y divide-border mb-4 rounded-2xl overflow-hidden">
        {order.items.map((item) => {
          const StatusIcon = statusIcon[item.status];
          return (
            <div key={item.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                  {item.titleAtOrder}
                  {item.product.isDigital && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-brand bg-brand/10 rounded-full px-1.5 py-0.5">
                      <Sparkles size={10} />
                      Digital
                    </span>
                  )}
                </p>
                <p className="text-xs text-foreground/50 mt-0.5">
                  Sold by {item.supplier.businessName ?? item.supplier.name} &middot;{" "}
                  {item.quantity} &times; &#8377;{item.priceAtOrder.toFixed(2)}
                </p>
                {order.paid && item.product.isDigital && item.product.fileUrl && (
                  <a
                    href={`/api/downloads/${item.productId}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline mt-1"
                  >
                    <Download size={12} />
                    Download
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="font-semibold text-sm text-brand-dark">
                  &#8377;{(item.priceAtOrder * item.quantity).toFixed(2)}
                </span>
                <span
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${statusColor[item.status]}`}
                >
                  {StatusIcon && <StatusIcon size={11} />}
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
        <div className="p-4 flex justify-between font-bold">
          <span>Total {order.paid && <span className="text-accent font-normal text-xs">(Paid)</span>}</span>
          <span className="text-brand-dark">&#8377;{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {!order.paid && order.razorpayOrderId && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && (
        <div className="card p-4 mb-6 rounded-2xl">
          <h2 className="flex items-center gap-1.5 font-semibold mb-3">
            <CreditCard size={16} className="text-brand" />
            Complete payment
          </h2>
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
