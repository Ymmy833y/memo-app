/// <reference lib="webworker" />

// treat self as ServiceWorkerGlobalScope
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'memo-app-cache-v3' as const;
const ASSET_MANIFEST = './parcel-manifest.json' as const;

// List of external CDN URLs to cache
const CDN_URLS = [
  'https://uicdn.toast.com/editor-plugin-code-syntax-highlight/latest/toastui-editor-plugin-code-syntax-highlight.min.css'
] as const;

// --------------------------------------------------------------------------
//  install
// --------------------------------------------------------------------------
sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        // fetch parcel‑manifest.json
        const response = await fetch(ASSET_MANIFEST);
        const manifest: Record<string, string> = await response.json();

        // convert files listed in manifest to absolute URLs
        const urlsFromManifest = Object.values(manifest).map((url) =>
          new URL(url, self.location.href).toString(),
        );

        // always include index.html
        const indexUrl = new URL('./index.html', self.location.href).toString();
        if (!urlsFromManifest.includes(indexUrl)) urlsFromManifest.push(indexUrl);

        // combine local assets and CDN for caching
        const allUrls = [...urlsFromManifest, ...CDN_URLS];

        const cache = await caches.open(CACHE_NAME);
        await Promise.all(
          allUrls.map(async (url) => {
            const urlObj = new URL(url);

            // skip chrome-extension scheme
            if (urlObj.protocol === 'chrome-extension:') return;

            try {
              // fetch toast CDN with no‑cors
              const request =
                url.startsWith('https://uicdn.toast.com/')
                  ? new Request(url, { mode: 'no-cors' })
                  : new Request(url);

              const res = await fetch(request);
              await cache.put(url, res);
            } catch (err) {
              console.error(`[SW] Failed to cache ${url}:`, err);
            }
          }),
        );
      } catch (err) {
        console.error('[SW] Failed to load asset manifest:', err);
      }
    })(),
  );
});

// --------------------------------------------------------------------------
//  activate
// --------------------------------------------------------------------------
sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    })(),
  );
});

// --------------------------------------------------------------------------
//  fetch
// --------------------------------------------------------------------------
sw.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  // ignore HMR WebSocket/chrome-extension
  if (request.url.includes('/ws') || requestUrl.protocol === 'chrome-extension:')
    return;

  // network first for document / script / style
  const networkFirstTypes: RequestDestination[] = ['document', 'script', 'style'];
  const isNetworkFirst =
    request.mode === 'navigate' || networkFirstTypes.includes(request.destination);

  if (isNetworkFirst) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);

          // if fetched successfully, save to cache
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());

          return networkResponse;
        } catch {
          console.warn('[SW] Network fetch failed, falling back to cache:', request.url);

          const cached = await caches.match(request);
          if (cached) return cached;

          // fallback for navigation: index.html
          if (request.mode === 'navigate') {
            return (await caches.match(
              new URL('./index.html', self.location.href).toString(),
            )) as Response;
          }

          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        }
      })(),
    );
    return;
  }

  // ----------------------------- cache-first -----------------------------
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        console.log('[SW] Serving cached:', request.url);
        return cached;
      }

      try {
        return await fetch(request);
      } catch {
        console.error('[SW] Fetch failed:', request.url);
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      }
    })(),
  );
});
