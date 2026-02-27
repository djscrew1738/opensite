import { lazy } from 'react';

/**
 * lazyWithError
 * Creates a lazy-loaded component with error handling
 * 
 * @param {Function} importFn - Dynamic import function
 * @param {string} name - Component name for error messages
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithError(importFn, name) {
  return lazy(() => 
    importFn().catch(err => {
      console.error(`Failed to load ${name}:`, err);
      return { 
        default: () => (
          <div className="p-4 text-red-500">Error loading {name}</div>
        ) 
      };
    })
  );
}
