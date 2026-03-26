// Service Worker v3 — aggressive caching for speed
const STATIC_CACHE = 'static-v4';
const API_CACHE = 'api-v4';
const IMG_CACHE = 'img-v4';

const API_PATTERNS = ['/rest/v1/site_settings', '/rest/v1/products_public', '/rest/v1/banners'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== API_CACHE && k !== IMG_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Hashed static assets → cache forever (immutable content hashes)
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((c) =>
        c.match(event.request).then((r) => r || fetch(event.request).then((res) => {
          if (res.ok) c.put(event.request, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  // Images (Supabase storage) → stale-while-revalidate
  if (url.pathname.includes('/storage/v1/')) {
    event.respondWith(
      caches.open(IMG_CACHE).then((c) =>
        c.match(event.request).then((cached) => {
          const fresh = fetch(event.request).then((res) => {
            if (res.ok) c.put(event.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }

  // API → stale-while-revalidate (show cached immediately, update in background)
  if (API_PATTERNS.some((p) => url.pathname.includes(p))) {
    event.respondWith(
      caches.open(API_CACHE).then((c) =>
        c.match(event.request).then((cached) => {
          const fresh = fetch(event.request).then((res) => {
            if (res.ok) c.put(event.request, res.clone());
            return res;
          }).catch(() => cached);
          // Return cached instantly if available, update in background
          if (cached) {
            fresh.catch(() => {});
            return cached;
          }
          return fresh;
        })
      )
    );
    return;
  }
});
