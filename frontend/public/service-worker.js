/**
 * OpenSite Service Worker
 * Provides caching and offline support for the application
 */

const CACHE_NAME = 'opensite-v1';
const STATIC_CACHE = 'opensite-static-v1';
const API_CACHE = 'opensite-api-v1';
const IMAGE_CACHE = 'opensite-images-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/settings',
  '/api/health',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('Static cache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('opensite-') && 
                   name !== STATIC_CACHE && 
                   name !== API_CACHE &&
                   name !== IMAGE_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Static assets - Cache first, network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Images - Cache with expiration
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }
});

/**
 * Handle API requests with network-first strategy
 * Good for data that changes frequently
 */
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network returns error, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for HTML requests
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * Handle static assets with cache-first strategy
 * Good for JS/CSS files that don't change often
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Return cached version immediately
    // But also fetch update in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse);
        }
      })
      .catch(() => {});
    
    return cachedResponse;
  }
  
  // Not in cache, fetch and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url);
    throw error;
  }
}

/**
 * Handle image requests with cache and expiration
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  const cachedResponse = await cache.match(request);
  
  // Check if cached response is still fresh (7 days)
  if (cachedResponse) {
    const dateHeader = cachedResponse.headers.get('date');
    if (dateHeader) {
      const cachedDate = new Date(dateHeader);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (Date.now() - cachedDate.getTime() < maxAge) {
        return cachedResponse;
      }
    }
  }
  
  // Fetch fresh image
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return cached version even if expired
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Check if a path is a static asset
 */
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff')
  );
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
