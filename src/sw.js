const CACHE_NAME = 'memo-app-cache-v2';
const ASSET_MANIFEST = './parcel-manifest.json';

self.addEventListener('install', event => {
  event.waitUntil(
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
        return caches.open(CACHE_NAME).then(cache => {
          return Promise.all(
            urlsFromManifest.map(url => {
              return cache.add(url).catch(error => {
                console.error(`Failed to add ${url} to cache:`, error);
                // On error, skip and continue
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
  // Ignore WebSocket requests for HMR
  if (event.request.url.includes('/ws')) {
    return;
  }
  
  // For navigation requests (i.e. HTML pages), use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Optionally update the cache with the fresh response
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // If network fails, fall back to the cached index.html
          return caches.match(new URL('./index.html', self.location).toString());
        })
    );
    return;
  }
  
  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request.url).then(response => {
      return response || fetch(event.request).catch(() => {
        return new Response('', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
