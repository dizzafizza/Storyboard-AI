// Storyboard AI Service Worker
// Enhanced Safari compatibility and offline support

const CACHE_NAME = 'storyboard-ai-v1.0.0';
const BASE_PATH = '/storyboard-ai/';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}site.webmanifest`,
  `${BASE_PATH}proxy.js`,
];

// Import the proxy handler
self.importScripts(`${BASE_PATH}proxy.js`);

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching essential assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Activation failed', error);
      })
  );
});

// Fetch event - serve cached content when offline and handle proxy requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle proxy requests
  if (url.pathname.startsWith('/openai-proxy/') || url.pathname.startsWith('/image-proxy/')) {
    console.log('🔄 Service Worker: Handling proxy request', url.pathname);
    event.respondWith(self.handleProxyRequest(event.request));
    return;
  }
  
  // Only handle requests from our domain
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip Chrome extension requests and non-http requests
  if (event.request.url.includes('chrome-extension') || 
      !event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📋 Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Cache successful responses for HTML, CSS, JS files
            if (event.request.method === 'GET' && 
                (event.request.url.includes('.html') ||
                 event.request.url.includes('.css') ||
                 event.request.url.includes('.js') ||
                 event.request.url === `${self.location.origin}${BASE_PATH}`)) {
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.log('🌐 Service Worker: Network failed, checking cache', error);
            
            // If this is a navigation request, return the cached index.html
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}index.html`);
            }
            
            // For other requests, just fail
            throw error;
          });
      })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Received message', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME
    });
  }
});

// Background sync for Safari (limited support)
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync', event.tag);
  
  if (event.tag === 'storyboard-sync') {
    event.waitUntil(
      // Perform background sync operations
      Promise.resolve()
        .then(() => {
          console.log('✅ Service Worker: Background sync complete');
        })
        .catch((error) => {
          console.error('❌ Service Worker: Background sync failed', error);
        })
    );
  }
});

// Push notification support (if needed in future)
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push received', event);
  // Handle push notifications if implemented
});

// Enhanced error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker: Global error', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker: Unhandled promise rejection', event.reason);
});

console.log('🚀 Service Worker: Script loaded and ready'); 