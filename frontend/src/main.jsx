import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import * as Sentry from '@sentry/react';
import { registerServiceWorker } from './utils/serviceWorker.js';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Register service worker for offline support and caching
if (import.meta.env.PROD) {
  registerServiceWorker();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find root element. The app cannot start.');
  document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif;"><h1>Application Error</h1><p>Failed to initialize the application. Please refresh the page.</p></div>';
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
