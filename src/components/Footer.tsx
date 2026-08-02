import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-foreground/60 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span>&copy; {new Date().getFullYear()} TN School Cart</span>
          <span>Serving schools across all 38 districts of Tamil Nadu</span>
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
