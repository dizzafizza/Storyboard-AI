// Storyboard AI Service Worker - DEVELOPMENT VERSION
// For use with Vite dev server

const CACHE_NAME = 'storyboard-ai-dev';
const BASE_PATH = '/';

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
  console.log('🔧 DEV Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 DEV Service Worker: Caching essential assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ DEV Service Worker: Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ DEV Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 DEV Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ DEV Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ DEV Service Worker: Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ DEV Service Worker: Activation failed', error);
      })
  );
});

// Fetch event - handle proxy requests only in development
// Let Vite handle everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle proxy requests only in development mode
  // In dev mode, we don't need the proxy since Vite handles it
  // But we keep the handler for consistency with production
  if (url.pathname.startsWith('/openai-proxy/') || url.pathname.startsWith('/image-proxy/')) {
    console.log('🔄 DEV Service Worker: Detected proxy request', url.pathname);
    console.log('⚠️ DEV Service Worker: In development mode, Vite handles proxying');
    return; // Let Vite handle the proxy in development
  }
  
  // Skip handling all other requests in development
  // Let Vite dev server handle them
  return;
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('📨 DEV Service Worker: Received message', event.data);
  
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

// Enhanced error handling
self.addEventListener('error', (event) => {
  console.error('❌ DEV Service Worker: Global error', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ DEV Service Worker: Unhandled promise rejection', event.reason);
});

console.log('🚀 DEV Service Worker: Script loaded and ready'); 