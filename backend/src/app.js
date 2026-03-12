// app.js — Express application configuration
import express from 'express';
import * as Sentry from '@sentry/node';
import { registerMiddleware } from './middleware/index.js';
import { registerRoutes } from './routes/index.js';
import { registerErrorHandlers } from './middleware/error-handlers.js';

const app = express();
const sentryEnabled = !!process.env.SENTRY_DSN;

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

registerMiddleware(app);
registerRoutes(app);

if (sentryEnabled) {
  app.use(Sentry.Handlers.errorHandler());
}

registerErrorHandlers(app);

export default app;
