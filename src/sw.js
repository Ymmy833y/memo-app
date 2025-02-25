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

  event.respondWith(
    caches.match(event.request.url).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        // For navigation requests, return cached index.html
        if (event.request.mode === 'navigate') {
          return caches.match(new URL('./index.html', self.location).toString());
        }
        // Otherwise, return a 503 response
        return new Response('', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
