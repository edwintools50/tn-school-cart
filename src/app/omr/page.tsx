import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasOmrAccess, OMR_SUITE_PRODUCT_ID } from "@/lib/omr/access";

export default async function OmrHubPage() {
  const user = await getCurrentUser();
  const hasAccess = user ? await hasOmrAccess(user.id, user.role) : false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 w-full">
      <p className="text-xs font-semibold tracking-wide uppercase text-brand mb-2">Axion Omni OMR Suite</p>
      <h1 className="text-3xl font-bold mb-3">OMR sheet creation &amp; evaluation</h1>
      <p className="text-foreground/70 mb-8">
        Generate printable OMR answer sheets, scan and auto-grade filled sheets with a phone camera, and track every
        student&apos;s progress across exams — no scanner hardware needed.
      </p>

      {hasAccess ? (
        <div className="card p-6">
          <p className="text-sm font-semibold text-green-700 mb-4">✓ You have access to the OMR Suite</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/omr/sheet-builder" className="rounded-md border border-border px-4 py-3 hover:bg-black/5">
              <div className="font-semibold">Sheet Builder</div>
              <div className="text-xs text-foreground/50">Generate printable OMR sheets</div>
            </Link>
            <Link href="/omr/evaluate" className="rounded-md border border-border px-4 py-3 hover:bg-black/5">
              <div className="font-semibold">Evaluate</div>
              <div className="text-xs text-foreground/50">Scan, score, dashboard, progress</div>
            </Link>
            <Link href="/omr/branding" className="rounded-md border border-border px-4 py-3 hover:bg-black/5 sm:col-span-2">
              <div className="font-semibold">Branding</div>
              <div className="text-xs text-foreground/50">Put your institute&apos;s name and logo on sheets</div>
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <ul className="text-sm text-foreground/70 space-y-2 mb-6 list-disc list-inside">
            <li>Multi-set (P/Q/R/S) answer keys to deter copying</li>
            <li>Batch roster import — one pre-filled sheet per student</li>
            <li>Camera-based scan &amp; auto-grade, no dedicated scanner needed</li>
            <li>Branded PDF report cards, class dashboard, and cross-exam progress tracking</li>
            <li>White-label your own institute&apos;s name and logo</li>
          </ul>
          <Link
            href={`/marketplace/${OMR_SUITE_PRODUCT_ID}`}
            className="inline-block bg-brand text-white font-semibold rounded-md px-5 py-2.5 hover:bg-brand-dark transition-colors"
          >
            {user ? "Get access — view in Marketplace" : "View in Marketplace"}
          </Link>
          {!user && <p className="text-xs text-foreground/50 mt-3">You&apos;ll need to log in to purchase.</p>}
        </div>
      )}

      <p className="text-sm text-foreground/60 mt-6 text-center">
        Prefer an app?{" "}
        <Link href="/omr/download" className="text-brand hover:underline font-medium">
          Download for Android
        </Link>
      </p>
    </div>
  );
}
