"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell service worker. Deliberately minimal: the worker
 * only ever serves a static offline fallback when the network is truly
 * unreachable — it must never cache page HTML, since the whole point of the
 * Android wrapper (TWA) is that a website deploy shows up immediately with
 * no app update required. `updateViaCache: "none"` stops the browser's own
 * HTTP cache from serving a stale sw.js, so worker updates roll out fast too.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  }, []);

  return null;
}
