"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { verifyRazorpayPaymentAction } from "@/app/orders/actions";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function RazorpayPayButton({
  orderId,
  razorpayOrderId,
  razorpayKeyId,
  amount,
  buyerName,
  buyerEmail,
  buyerPhone,
}: {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    setPending(true);

    const rzp = new window.Razorpay({
      key: razorpayKeyId,
      order_id: razorpayOrderId,
      amount: Math.round(amount * 100),
      currency: "INR",
      name: "TN School Cart",
      description: `Order #${orderId.slice(-8)}`,
      prefill: { name: buyerName, email: buyerEmail, contact: buyerPhone },
      theme: { color: "#145c9e" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const result = await verifyRazorpayPaymentAction({
          orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (result.ok) {
          router.refresh();
        } else {
          setError(result.error ?? "Payment verification failed.");
          setPending(false);
        }
      },
      modal: {
        ondismiss: () => setPending(false),
      },
    });
    rzp.open();
  }

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={pay}
        disabled={!scriptReady || pending}
        className="w-full bg-brand text-white font-semibold rounded-md py-3 hover:bg-brand-dark transition-colors disabled:opacity-60"
      >
        {pending ? "Opening payment..." : `Pay ₹${amount.toFixed(2)} now`}
      </button>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
