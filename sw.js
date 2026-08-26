// Minimal service worker — only exists to satisfy "installable" criteria and
// let the app shell load instantly / work if you briefly lose signal.
// Deliberately network-first: your live Calendar/Tasks/weather/email data
// should never be served from a stale cache while you're online.

const CACHE_NAME = 'daily-dashboard-shell-v1';
const SHELL_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache same-origin app-shell files, never the external API
        // calls (Apps Script, Open-Meteo) — those must always be live.
        if (event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
