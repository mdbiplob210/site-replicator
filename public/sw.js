// Service Worker v7 — maximum speed caching
const STATIC_CACHE = 'static-v7';
const API_CACHE = 'api-v7';
const IMG_CACHE = 'img-v7';
const NAV_CACHE = 'nav-v7';

const API_PATTERNS = ['/rest/v1/site_settings', '/rest/v1/products_public', '/rest/v1/banners', '/rest/v1/categories', '/rest/v1/landing_pages'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![STATIC_CACHE, API_CACHE, IMG_CACHE, NAV_CACHE].includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Navigation requests → network-first with 1.5s fallback (faster than before)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(NAV_CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        }),
        new Promise((resolve) => {
          setTimeout(() => {
            caches.match(event.request).then((r) => {
              if (r) resolve(r);
            });
          }, 1500);
        })
      ]).catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Hashed static assets → cache forever (immutable)
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

  // Images (Supabase storage) → cache-first
  if (url.pathname.includes('/storage/v1/')) {
    event.respondWith(
      caches.open(IMG_CACHE).then((c) =>
        c.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res.ok) c.put(event.request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 404 }));
        })
      )
    );
    return;
  }

  // External images → cache-first
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico)(\?|$)/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMG_CACHE).then((c) =>
        c.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            if (res.ok) c.put(event.request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 404 }));
        })
      )
    );
    return;
  }

  // API → stale-while-revalidate (instant from cache, update in background)
  if (API_PATTERNS.some((p) => url.pathname.includes(p))) {
    event.respondWith(
      caches.open(API_CACHE).then((c) =>
        c.match(event.request).then((cached) => {
          const fresh = fetch(event.request).then((res) => {
            if (res.ok) c.put(event.request, res.clone());
            return res;
          }).catch(() => cached);
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

  // Facebook SDK and analytics — cache for speed
  if (url.hostname === 'connect.facebook.net' || url.hostname.includes('facebook.com')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((c) =>
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

  // Google Fonts — cache forever
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
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
});
