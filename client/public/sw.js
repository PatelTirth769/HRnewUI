/* ============================================================================
   sw.js — Progressive Web App service worker for SSV School
   ----------------------------------------------------------------------------
   Strategy:
     - App shell (index.html, offline page, icons, manifest) is precached on
       install so the app loads offline.
     - Navigations: network-first, falling back to the cached app shell, and
       finally to a friendly offline page.
     - Same-origin static assets (Vite's hashed /assets/*, images, fonts):
       cache-first (they are content-hashed, so safe to cache aggressively).
     - Everything else (API / dynamic, cross-origin CDNs): network-first with a
       cache fallback, so the app still works when the network is flaky.
     - Caches are versioned; bump CACHE_VERSION to ship a clean update.

   This worker is registered at scope "/". The Firebase Cloud Messaging worker
   (firebase-messaging-sw.js) registers itself at its own scope
   ("/firebase-cloud-messaging-push-scope"), so the two do not conflict.
   ============================================================================ */

const CACHE_VERSION = 'v1';
const APP_SHELL_CACHE = `ssv-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `ssv-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ssv-dynamic-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline.html';

// Minimal app shell. Vite's hashed assets are cached at runtime (their names
// change every build, so they cannot be listed here).
const APP_SHELL = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// ---- Install: precache the app shell -------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // addAll fails the whole install if any request 404s; add individually
      // so a single missing optional file cannot block activation.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => console.warn('[sw] precache skip', url, err))
        )
      );
      await self.skipWaiting();
    })()
  );
});

// ---- Activate: drop old versioned caches, take control -------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([APP_SHELL_CACHE, STATIC_CACHE, DYNAMIC_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('ssv-') && !keep.has(n))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// ---- Helpers --------------------------------------------------------------
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|ttf|eot|otf|png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

// ---- Fetch routing --------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; let the browser deal with POST/PUT/etc. untouched
  // (important: never cache API mutations or the Firebase messaging channel).
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore non-http(s) schemes (chrome-extension:, etc.)
  if (!url.protocol.startsWith('http')) return;

  // App navigations -> network-first with app-shell + offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put('/index.html', response.clone());
          return response;
        } catch (err) {
          const cache = await caches.open(APP_SHELL_CACHE);
          return (
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            (await cache.match(OFFLINE_URL)) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Same-origin hashed/static assets -> cache-first.
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Everything else (same-origin API/dynamic + cross-origin CDNs) -> network-first.
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});
