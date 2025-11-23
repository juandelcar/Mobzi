const STATIC_CACHE = 'mobzi-static-v1';
const SHELL = [
  '/',
  '/manifest.json',
  '/square_logo.png',
  '/circular_icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // App shell y estáticos: cache-first, luego red
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
            return res;
          })
      )
    );
    return;
  }

  // Backend API (orígenes externos): network-first con fallback a cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        const clone = res.clone();
        caches.open('mobzi-api-v1').then((c) => c.put(req, clone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});