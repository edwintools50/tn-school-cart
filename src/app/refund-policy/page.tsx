export const metadata = {
  title: "Refund & Cancellation Policy — TN School Cart",
};

const sectionClass = "space-y-2";
const headingClass = "text-lg font-bold mt-8 mb-2";
const bodyClass = "text-sm text-foreground/70 leading-relaxed";

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 w-full">
      <h1 className="text-2xl font-bold mb-1">Refund & Cancellation Policy</h1>
      <p className="text-xs text-foreground/50 mb-6">Last updated: 20 July 2026</p>

      <div className="card p-6 sm:p-8">
        <h2 className={headingClass}>1. Product orders</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            You may cancel a product order free of charge as long as the
            supplier has not yet marked it &quot;Shipped&quot;. Once an order
            is shipped, cancellation is at the supplier&apos;s discretion.
            To request a cancellation, contact us via the WhatsApp chat button
            on the Platform with your order ID.
          </p>
          <p className={bodyClass}>
            If a paid order is cancelled before shipping, or a supplier is
            unable to fulfil it, the amount paid is refunded to the original
            payment method via Razorpay. Refunds typically reflect in your
            account within 5–7 business days, depending on your bank.
          </p>
          <p className={bodyClass}>
            For damaged, incorrect, or missing items received, report the
            issue within 48 hours of delivery via WhatsApp with photos of the
            item; we will coordinate with the supplier on a replacement or
            refund.
          </p>
        </div>

        <h2 className={headingClass}>2. Gig work</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            A gig request can be cancelled by the Principal/HM at no cost
            while it is still &quot;Open&quot; (before a worker is assigned).
            Once a worker is assigned, cancellation should be agreed directly
            between the school and the worker; if work has already begun, any
            payment for work completed is a matter between the two parties.
          </p>
        </div>

        <h2 className={headingClass}>3. How to request a refund</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            Use the WhatsApp chat button available on every page of the
            Platform, or the contact option on your order/gig detail page,
            and include your order or gig ID. Our admin team reviews refund
            requests and coordinates with the relevant supplier or worker.
          </p>
        </div>

        <h2 className={headingClass}>4. Disputes</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            If a refund or cancellation cannot be resolved directly between
            buyer and seller, either party may escalate to TN School Cart
            admin for review by sharing order details and any supporting
            evidence (photos, messages).
          </p>
        </div>
      </div>
    </div>
  );
}
