/**
 * Route Prefetching Utility
 * Prefetches route components on hover/touch for faster navigation
 */

const prefetchCache = new Set();

/**
 * Prefetch a module by its import function
 * @param {Function} importFn - Dynamic import function
 * @param {string} id - Unique identifier for the route/module
 */
export function prefetchRoute(importFn, id) {
  if (prefetchCache.has(id)) return;
  
  // Use requestIdleCallback for non-critical prefetching
  const schedule = window.requestIdleCallback || window.setTimeout;
  
  schedule(() => {
    importFn()
      .then(() => {
        prefetchCache.add(id);
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug(`[Prefetch] Loaded: ${id}`);
        }
      })
      .catch(err => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug(`[Prefetch] Failed: ${id}`, err);
        }
      });
  }, { timeout: 2000 });
}

/**
 * Prefetch multiple routes
 * @param {Array<{importFn: Function, id: string}>} routes
 */
export function prefetchRoutes(routes) {
  routes.forEach(({ importFn, id }) => prefetchRoute(importFn, id));
}

/**
 * Create a hover handler that prefetches on hover
 * @param {Function} importFn - Dynamic import function
 * @param {string} id - Route identifier
 */
export function createPrefetchHandler(importFn, id) {
  let hasPrefetched = false;
  
  return () => {
    if (!hasPrefetched) {
      hasPrefetched = true;
      prefetchRoute(importFn, id);
    }
  };
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload fonts if not using system fonts
  const criticalFonts = [
    // Add critical font URLs here if using custom fonts
  ];
  
  criticalFonts.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Initialize prefetching for navigation links
 * Call this in your layout component
 */
export function initPrefetch() {
  // Prefetch on link hover
  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('[data-prefetch]');
    if (link) {
      const importFn = window.__PREFETCH_ROUTES__?.[link.dataset.prefetch];
      if (importFn) {
        prefetchRoute(importFn, link.dataset.prefetch);
      }
    }
  }, { passive: true });
}

export default {
  prefetchRoute,
  prefetchRoutes,
  createPrefetchHandler,
  preloadCriticalResources,
  initPrefetch
};
