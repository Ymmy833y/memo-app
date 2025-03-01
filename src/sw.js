const CACHE_NAME = 'memo-app-cache-v2';
const ASSET_MANIFEST = './parcel-manifest.json';

// List of external CDN URLs to cache
const CDN_URLS = [
  'https://uicdn.toast.com/editor/latest/toastui-editor.min.css',
  'https://uicdn.toast.com/editor/latest/theme/toastui-editor-dark.min.css',
  'https://uicdn.toast.com/tui-color-picker/latest/tui-color-picker.min.css',
  'https://uicdn.toast.com/editor-plugin-color-syntax/latest/toastui-editor-plugin-color-syntax.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.23.0/themes/prism.min.css',
  'https://uicdn.toast.com/editor-plugin-code-syntax-highlight/latest/toastui-editor-plugin-code-syntax-highlight.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    // Fetch asset manifest and then add both local and CDN resources to the cache
    fetch(ASSET_MANIFEST)
      .then(response => response.json())
      .then(manifest => {
        // Convert manifest paths to absolute URLs
        let urlsFromManifest = Object.values(manifest).map(url => new URL(url, self.location).toString());
        // Always include index.html
        const indexUrl = new URL('./index.html', self.location).toString();
        if (!urlsFromManifest.includes(indexUrl)) {
          urlsFromManifest.push(indexUrl);
        }
        // Combine local assets with CDN resources
        const allUrls = urlsFromManifest.concat(CDN_URLS);
        return caches.open(CACHE_NAME).then(cache => {
          return Promise.all(
            allUrls.map(url => {
              const urlObj = new URL(url);
              // Skip unsupported chrome-extension requests
              if (urlObj.protocol === 'chrome-extension:') {
                return Promise.resolve();
              }
              // For CDN URLs, fetch with no-cors mode and then cache
              if (url.startsWith('https://uicdn.toast.com/')) {
                return fetch(new Request(url, { mode: 'no-cors' }))
                  .then(response => cache.put(url, response))
                  .catch(error => {
                    console.error(`Failed to cache ${url}:`, error);
                    return Promise.resolve();
                  });
              }
              // For local assets, fetch normally and then cache
              return fetch(url)
                .then(response => cache.put(url, response))
                .catch(error => {
                  console.error(`Failed to cache ${url}:`, error);
                  return Promise.resolve();
                });
            })
          );
        });
      })
      .catch(error => {
        console.error('Failed to load asset manifest:', error);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Ignore WebSocket requests for HMR and requests with chrome-extension scheme
  const requestUrl = new URL(event.request.url);
  if (event.request.url.includes('/ws') || requestUrl.protocol === 'chrome-extension:') {
    return;
  }

  // Define destinations to use network-first strategy
  const networkFirstDestinations = ['document', 'script', 'style'];

  // For navigation, script, and style requests, use network-first strategy.
  if (event.request.mode === 'navigate' || networkFirstDestinations.includes(event.request.destination)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log('[SW] Network fetch succeeded for:', event.request.url);
          // Clone the response and update the cache
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          console.warn('[SW] Network fetch failed for:', event.request.url, ', attempting to serve from cache.');
          // If network fetch fails, try to return the cached response
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('[SW] Serving cached response for:', event.request.url);
              return cachedResponse;
            }
            // For navigation requests, fallback to cached index.html
            if (event.request.mode === 'navigate') {
              console.warn('[SW] No cached response found, serving cached index.html for navigation request.');
              return caches.match(new URL('./index.html', self.location).toString());
            }
            console.error('[SW] No cached response available for:', event.request.url);
            // Otherwise, return a 503 Service Unavailable response
            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
    return;
  }

  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[SW] Serving cached response for:', event.request.url);
          return response;
        }
        return fetch(event.request)
          .then(networkResponse => networkResponse)
          .catch(() => {
            console.error('[SW] Failed to fetch:', event.request.url);
            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});
