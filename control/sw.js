// Payoff Control service worker: caches the app shell so it opens instantly and installs as an app.
// Never caches /api/ (live data, private) or Identity calls.
const CACHE = "payoff-control-v1";
const SHELL = [
  "/control/",
  "/control/app.css",
  "/control/app.js",
  "/control/manifest.webmanifest",
  "/control/icons/logo-cream.png",
  "/control/icons/icon-192.png",
  "/control/fonts/fonts.css",
  "/control/fonts/anton-latin-400-normal.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.pathname.startsWith("/control/")) return;
  // Network first, cache as fallback (always fresh when online, still opens offline)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/control/"))),
  );
});
