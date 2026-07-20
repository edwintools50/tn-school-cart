export const metadata = {
  title: "Terms of Service — TN School Cart",
};

const sectionClass = "space-y-2";
const headingClass = "text-lg font-bold mt-8 mb-2";
const bodyClass = "text-sm text-foreground/70 leading-relaxed";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 w-full">
      <h1 className="text-2xl font-bold mb-1">Terms of Service</h1>
      <p className="text-xs text-foreground/50 mb-6">Last updated: 20 July 2026</p>

      <div className="card p-6 sm:p-8">
        <p className={bodyClass}>
          These Terms of Service (&quot;Terms&quot;) govern your use of TN School Cart
          (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;), a marketplace connecting school
          Principals /HMs across Tamil Nadu with suppliers of school goods and
          independent gig workers offering campus services. By creating an
          account or using the Platform, you agree to these Terms.
        </p>

        <h2 className={headingClass}>1. What TN School Cart is</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            TN School Cart is a facilitator, not the seller or service provider.
            Products listed by suppliers and jobs performed by gig workers are
            their own goods and services — TN School Cart connects buyers and
            sellers and processes payment, but is not a party to the underlying
            sale of goods or the underlying contract for work.
          </p>
        </div>

        <h2 className={headingClass}>2. Accounts and eligibility</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            Principal/HM accounts must represent a genuine Tamil Nadu school and
            provide an accurate UDISE number and school details. Supplier and
            gig-worker accounts are reviewed by our admin team before they can
            list products or services; we may reject or suspend any account
            that provides false information, misrepresents its identity, or
            violates these Terms.
          </p>
          <p className={bodyClass}>
            You are responsible for keeping your account password confidential
            and for all activity under your account.
          </p>
        </div>

        <h2 className={headingClass}>3. Orders and payments</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            Payments for product orders are processed through Razorpay. Prices,
            stock, and delivery timelines are set by individual suppliers.
            Order status (confirmed, shipped, delivered) is updated by the
            supplier fulfilling the order. See our{" "}
            <a href="/refund-policy" className="text-brand hover:underline">
              Refund & Cancellation Policy
            </a>{" "}
            for how cancellations and refunds are handled.
          </p>
        </div>

        <h2 className={headingClass}>4. Gig work</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            Gig requests posted by Principals/HMs and offers submitted by gig
            workers form a direct arrangement between those two parties. TN
            School Cart does not supervise, insure, or guarantee the quality of
            work performed, and is not responsible for disputes arising from
            work carried out at a school premises. Both parties are encouraged
            to agree on scope, price, and timeline clearly before work begins.
          </p>
        </div>

        <h2 className={headingClass}>5. Prohibited conduct</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            You may not use the Platform to list counterfeit, unsafe, or
            illegal goods; misrepresent your identity, school, or business;
            circumvent Platform payments for transactions initiated on the
            Platform; or harass, defraud, or mislead other users.
          </p>
        </div>

        <h2 className={headingClass}>6. Limitation of liability</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            To the maximum extent permitted by law, TN School Cart is not
            liable for indirect, incidental, or consequential damages arising
            from your use of the Platform, including losses arising from
            products purchased or gig work performed by third parties listed
            on the Platform.
          </p>
        </div>

        <h2 className={headingClass}>7. Changes to these Terms</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            We may update these Terms from time to time. Continued use of the
            Platform after changes are posted constitutes acceptance of the
            revised Terms.
          </p>
        </div>

        <h2 className={headingClass}>8. Governing law</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            These Terms are governed by the laws of India, and disputes are
            subject to the exclusive jurisdiction of the courts of Tamil Nadu.
          </p>
        </div>

        <h2 className={headingClass}>9. Contact</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            Questions about these Terms can be sent via the WhatsApp chat
            button on the Platform, or to the contact details available on
            your account dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
