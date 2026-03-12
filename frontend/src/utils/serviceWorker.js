/**
 * Service Worker Registration
 * Handles registration, updates, and communication with the service worker
 */

const SW_PATH = '/service-worker.js';

/**
 * Register the service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    });

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('New version available');
          
          // Dispatch custom event for the app to handle
          window.dispatchEvent(new CustomEvent('sw-update-available', {
            detail: { registration }
          }));
        }
      });
    });

    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  if (registration) {
    const result = await registration.unregister();
    console.log('Service Worker unregistered:', result);
  }
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaiting() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  if (registration.waiting) {
    registration.waiting.postMessage('skipWaiting');
  }
}

/**
 * Clear all caches
 */
export async function clearCaches() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  if (registration.active) {
    registration.active.postMessage('clearCache');
  }
  
  // Also clear via Cache API directly
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}

/**
 * Check if the app is in offline mode
 */
export function isOffline() {
  return !navigator.onLine;
}

/**
 * Listen for online/offline events
 * @param {Function} callback - Called with online status
 * @returns {Function} Unsubscribe function
 */
export function listenForConnectivityChanges(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Hook to use service worker in React components
 * Returns current registration status and helper functions
 */
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Register service worker
    registerServiceWorker().then((registration) => {
      setIsRegistered(!!registration);
    });

    // Listen for update events
    const handleUpdate = () => setHasUpdate(true);
    window.addEventListener('sw-update-available', handleUpdate);

    // Listen for connectivity changes
    const unsubscribe = listenForConnectivityChanges((online) => {
      setIsOffline(!online);
    });

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
      unsubscribe();
    };
  }, []);

  return {
    isRegistered,
    hasUpdate,
    isOffline,
    updateApp: skipWaiting,
    clearCaches,
    unregister: unregisterServiceWorker,
  };
}

// Import React for the hook
import { useState, useEffect } from 'react';
