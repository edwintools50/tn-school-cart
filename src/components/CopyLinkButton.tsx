"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail without HTTPS/permissions — the link text is
      // already visible on the page for manual copying either way.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand hover:underline"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
