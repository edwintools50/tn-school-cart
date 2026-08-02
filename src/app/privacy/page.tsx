export const metadata = {
  title: "Privacy Policy — TN School Cart",
};

const sectionClass = "space-y-2";
const headingClass = "text-lg font-bold mt-8 mb-2";
const bodyClass = "text-sm text-foreground/70 leading-relaxed";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 w-full">
      <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-xs text-foreground/50 mb-6">Last updated: 2 August 2026</p>

      <div className="card p-6 sm:p-8">
        <p className={bodyClass}>
          This Privacy Policy explains what information TN School Cart
          collects, why we collect it, and how it is used, in accordance with
          India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>

        <h2 className={headingClass}>1. Information we collect</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            When you register or use the Platform, we collect: your name,
            email address, phone number, and password (stored as a secure
            hash, never in plain text); for Principals/HMs, your school name,
            UDISE number, and district/taluk/block/pin code; for suppliers and
            gig workers, your business name and service area; and, where you
            choose to provide them, a school verification photo, gig-request
            photos, and gig-completion proof photos.
          </p>
        </div>

        <h2 className={headingClass}>2. Why we collect it</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            We use this information to operate your account, verify schools
            and suppliers before approving listings, process and deliver
            orders and gig requests, send order/gig status updates over
            WhatsApp, and process payments securely.
          </p>
        </div>

        <h2 className={headingClass}>3. Who we share it with</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            We share only what is necessary with the service providers that
            power the Platform: Razorpay (payment processing), Meta/WhatsApp
            (order and gig notifications), Vercel Blob (photo storage), Neon
            (database hosting), Resend (order and delivery emails), and Sentry
            (error diagnostics, which may incidentally include device and
            request information). We do not sell your personal information to
            third parties.
          </p>
        </div>

        <h2 className={headingClass}>4. Cookies</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            The Platform uses a single essential cookie (<code>tnsc_session</code>)
            to keep you signed in. It is httpOnly and cannot be read by
            scripts; we do not use tracking or advertising cookies.
          </p>
        </div>

        <h2 className={headingClass}>5. Data retention</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            We retain account and transaction data for as long as your account
            is active and as needed to meet legal and accounting obligations.
            You may request deletion of your account and associated data at
            any time, subject to records we are required to keep for
            completed transactions.
          </p>
        </div>

        <h2 className={headingClass}>6. Your rights</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            You may request access to, correction of, or deletion of your
            personal information by contacting us through the WhatsApp chat
            button on the Platform or your account dashboard.
          </p>
        </div>

        <h2 className={headingClass}>7. Changes to this Policy</h2>
        <div className={sectionClass}>
          <p className={bodyClass}>
            We may update this Privacy Policy from time to time. Material
            changes will be reflected by updating the date at the top of this
            page.
          </p>
        </div>
      </div>
    </div>
  );
}
