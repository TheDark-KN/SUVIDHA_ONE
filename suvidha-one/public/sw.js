// Service Worker for SUVIDHA ONE Kiosk - Offline First
// This enables offline functionality and caching

const CACHE_NAME = "suvidha-one-v1";
const OFFLINE_URL = "/offline";

// Resources to cache immediately
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force activation
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Claim all clients
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event: FetchEvent) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response for caching
        const responseClone = response.clone();

        // Open cache and store successful responses
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache successful responses
          if (response.status === 200) {
            cache.put(event.request, responseClone);
          }
        });

        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        const cachedResponse = await caches.match(event.request);

        // Return cached response or offline page
        return cachedResponse || caches.match(OFFLINE_URL) || new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
        });
      })
  );
});

// Handle messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Background sync for offline form submissions
self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "sync-otp") {
    event.waitUntil(syncOtpRequests());
  }
});

async function syncOtpRequests() {
  // Get pending OTP requests from IndexedDB
  // This is a placeholder - implement based on your needs
  console.log("Syncing OTP requests...");
}

// Push notifications (for future use)
self.addEventListener("push", (event: PushEvent) => {
  const options = {
    body: event.data?.text() || "New notification from SUVIDHA ONE",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification("SUVIDHA ONE", options)
  );
});
