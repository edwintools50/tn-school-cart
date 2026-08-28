import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-brand-light/60 mt-8">
      <div className="mx-auto max-w-6xl px-4 py-9 text-sm text-foreground-muted flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-display font-semibold text-foreground">TN School Cart</span>
          <span>&copy; {new Date().getFullYear()} &middot; Serving schools across all 38 districts of Tamil Nadu</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/join" className="hover:text-brand hover:underline font-medium">
            Join as Teacher / Vendor / Gig Worker
          </Link>
          <Link href="/terms" className="hover:text-brand hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-brand hover:underline">
            Privacy Policy
          </Link>
          <Link href="/refund-policy" className="hover:text-brand hover:underline">
            Refund & Cancellation Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
