// Service Worker for caching static assets and API responses
const CACHE_NAME = 'store-cache-v2';
const API_CACHE_NAME = 'api-cache-v2';
const STATIC_CACHE_NAME = 'static-cache-v2';

// API URL patterns to cache
const API_CACHE_PATTERNS = [
  '/rest/v1/site_settings',
  '/rest/v1/products_public',
  '/rest/v1/banners',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME && k !== STATIC_CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Cache hashed static assets (JS/CSS) with cache-first strategy — they have content hashes so are immutable
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Cache images from Supabase storage with cache-first + background revalidation
  if (url.pathname.includes('/storage/v1/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached);

          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Cache API responses - network first with cache fallback
  const isApiRequest = API_CACHE_PATTERNS.some((p) => url.pathname.includes(p) || url.href.includes(p));
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});
