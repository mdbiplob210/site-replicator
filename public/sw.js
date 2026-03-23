// Service Worker for caching static assets and API responses
const CACHE_NAME = 'store-cache-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Static assets to pre-cache
const STATIC_ASSETS = [
  '/',
];

// API URL patterns to cache
const API_CACHE_PATTERNS = [
  '/rest/v1/site_settings',
  '/rest/v1/products_public',
  '/rest/v1/banners',
  '/storage/v1/',
];

const API_CACHE_TTL = 60 * 1000; // 1 minute for API responses
const IMAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for images

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Cache images from Supabase storage with stale-while-revalidate
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

  // Cache API responses (site_settings, products, banners) - network first with cache fallback
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
