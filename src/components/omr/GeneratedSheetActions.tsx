"use client";

import Link from "next/link";
import { useState } from "react";
import { Printer, Share2, ScanLine } from "lucide-react";

// Chrome's built-in PDF viewer already has print/share icons buried in its
// own toolbar, but a TWA (this app's Android build) hides that browser
// chrome entirely for a native-app feel — so those icons are effectively
// unreachable there. These buttons put the same actions directly in our UI.

async function fetchAsFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch the PDF.");
  const blob = await res.blob();
  return new File([blob], filename, { type: "application/pdf" });
}

async function printPdf(url: string, filename: string, onError: (msg: string) => void) {
  try {
    const file = await fetchAsFile(url, filename);
    const objectUrl = URL.createObjectURL(file);
    const iframe = document.createElement("iframe");
    // A zero-size iframe can stop Chrome's built-in PDF viewer from
    // initialising properly, which then throws a SecurityError when we try
    // to reach contentWindow.print() — give it a real layout size and push
    // it off-screen instead.
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "600px";
    iframe.style.height = "800px";
    iframe.style.border = "0";
    iframe.src = objectUrl;
    document.body.appendChild(iframe);

    const cleanup = () => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(objectUrl);
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // Some Chrome PDF-viewer configurations refuse script access to the
        // embedded viewer even for a same-origin blob URL — fall back to
        // opening it directly so the user can still print via Chrome's own
        // toolbar/menu.
        onError("Couldn't open the print dialog directly — opening the PDF in a new tab instead.");
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };
    // Print dialogs (and the OS-level "choose a printer over wifi/USB" flow
    // they hand off to) are fire-and-forget from here, so there's no clean
    // "done printing" signal to clean up on — a generous timeout is the
    // simplest reliable way to eventually remove the iframe.
    setTimeout(cleanup, 60_000);
  } catch {
    onError("Couldn't prepare the PDF for printing — opening it in a new tab instead.");
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

async function sharePdf(url: string, filename: string, title: string, onError: (msg: string) => void) {
  // navigator.share must be checked synchronously, before any await — once
  // the click handler has awaited a fetch, the browser no longer treats a
  // fallback window.open() as a direct response to the user's tap and will
  // often silently block it. When share isn't available at all, we already
  // have the plain url, so we can skip the fetch and open it immediately.
  if (!navigator.share) {
    onError("Sharing isn't supported on this browser — opening the PDF in a new tab instead.");
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  try {
    const file = await fetchAsFile(url, filename);
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return; // user cancelled the share sheet
  }

  try {
    await navigator.share({ url, title });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    onError("Couldn't share the PDF — opening it in a new tab instead.");
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export default function GeneratedSheetActions({
  fileUrl,
  title,
}: {
  fileUrl: string;
  title: string;
}) {
  const [busy, setBusy] = useState<"print" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filename = `${title.replace(/[^a-zA-Z0-9._-]/g, "_") || "omr-sheet"}.pdf`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setError(null);
            setBusy("print");
            await printPdf(fileUrl, filename, setError);
            setBusy(null);
          }}
          className="flex items-center gap-1.5 rounded-md border border-brand/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark hover:bg-brand/5 disabled:opacity-60"
        >
          <Printer size={14} />
          {busy === "print" ? "Preparing..." : "Print"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setError(null);
            setBusy("share");
            await sharePdf(fileUrl, filename, title, setError);
            setBusy(null);
          }}
          className="flex items-center gap-1.5 rounded-md border border-brand/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark hover:bg-brand/5 disabled:opacity-60"
        >
          <Share2 size={14} />
          {busy === "share" ? "Preparing..." : "Share PDF"}
        </button>
        <Link
          href="/omr/evaluate"
          className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          <ScanLine size={14} />
          Scan a sheet
        </Link>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
