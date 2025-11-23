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

  // Ignorar esquemas no soportados (chrome-extension, data, blob, etc.)
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' ||
      url.protocol === 'data:' ||
      url.protocol === 'blob:') {
    // No intentar cachear estos recursos
    return;
  }

  // App shell y estáticos: cache-first, luego red
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            // Solo cachear si la respuesta es exitosa
            if (res.ok) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => {
                try {
                  c.put(req, clone);
                } catch (error) {
                  // Ignorar errores de cache (puede fallar con algunos recursos)
                  console.warn('Service Worker: Error al cachear recurso:', req.url);
                }
              });
            }
            return res;
          }).catch((error) => {
            // Si falla el fetch, intentar devolver del cache
            return caches.match(req);
          })
      )
    );
    return;
  }

  // Backend API (orígenes externos): network-first con fallback a cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Solo cachear si la respuesta es exitosa
        if (res.ok) {
          const clone = res.clone();
          caches.open('mobzi-api-v1').then((c) => {
            try {
              c.put(req, clone);
            } catch (error) {
              // Ignorar errores de cache
              console.warn('Service Worker: Error al cachear API:', req.url);
            }
          });
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});