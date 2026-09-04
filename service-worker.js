const CACHE_NAME = "mess-ledger-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];


// ================================
// INSTALL
// ================================

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );

  // Activate the new service worker immediately
  self.skipWaiting();
});


// ================================
// ACTIVATE
// ================================

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );

  // Take control of the app immediately
  self.clients.claim();
});


// ================================
// FETCH
// ================================

self.addEventListener("fetch", event => {

  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }


  // --------------------------------
  // HTML / PAGE REQUEST
  // Always try the internet first
  // --------------------------------

  if (event.request.mode === "navigate") {

    event.respondWith(
      fetch(event.request)
        .then(response => {

          // Save newest HTML to cache
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put("./index.html", copy);
            });

          return response;
        })

        // If internet isn't available,
        // use cached version
        .catch(() => {
          return caches.match("./index.html");
        })
    );

    return;
  }


  // --------------------------------
  // OTHER FILES
  // Cache first
  // --------------------------------

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {

            if (
              response.ok &&
              new URL(event.request.url).origin === self.location.origin
            ) {

              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, copy);
                });
            }

            return response;
          });

      })
  );
});
