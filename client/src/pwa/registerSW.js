// ============================================================================
// registerSW.js — safe registration of the PWA service worker (/sw.js)
// ----------------------------------------------------------------------------
// - Feature-detects Service Worker support.
// - Registers only in production builds (avoids interfering with Vite's dev
//   HMR) and only over HTTPS or localhost, as required by the SW spec.
// - Registration is deferred to the `load` event so it never competes with the
//   app's initial render.
// The Firebase Cloud Messaging worker registers separately, at its own scope,
// so this does not affect push notifications.
// ============================================================================

export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // Only register the caching worker for production builds.
  if (!import.meta.env.PROD) return;

  const { protocol, hostname } = window.location;
  const isSecure =
    protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isSecure) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('[pwa] service worker registration failed:', err));
  });
}
