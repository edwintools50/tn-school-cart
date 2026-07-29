// TN School Cart — app-shell service worker.
//
// Deliberately dumb: this worker's only job is to show a friendly offline
// page when there's no network. It must NEVER cache page HTML, API
// responses, or _next/static bundles with a stale-while-revalidate style
// strategy — the Android app (Trusted Web Activity) relies on every page
// load going straight to the network so a website deploy is visible with
// zero app update. Bump CACHE_NAME on the rare occasion this file's own
// cached asset list changes, to force old workers to drop stale entries.
const CACHE_NAME = "tnsc-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only intercept top-level navigations (page loads). Everything else
  // (API calls, static assets, Razorpay/analytics scripts) passes straight
  // through untouched — no caching, no interception.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL))
  );
});
