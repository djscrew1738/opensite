import { lazy, createElement } from 'react';
import { AlertCircle } from 'lucide-react';

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
      
      // Return a themed error component as the default export
      return { 
        default: () => createElement('div', { 
          className: 'card p-8 text-center border-danger-border bg-danger-muted/5' 
        }, [
          createElement('div', { 
            key: 'icon',
            className: 'w-12 h-12 mx-auto mb-4 rounded-xl bg-danger-muted flex items-center justify-center'
          }, createElement(AlertCircle, { className: 'w-6 h-6 text-danger-light' })),
          createElement('h3', { 
            key: 'title',
            className: 'text-sm font-bold text-text-primary uppercase tracking-wider mb-1' 
          }, 'Module Sync Error'),
          createElement('p', { 
            key: 'desc',
            className: 'text-xs text-text-muted' 
          }, `The ${name} component could not be retrieved from the server. Check your connection.`)
        ])
      };
    })
  );
}

export default lazyWithError;
