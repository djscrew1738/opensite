// Refactored server.js

import express from 'express';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { startServer } from './services/startup.js';
import { registerMiddleware } from './middleware/index.js';
import { registerRoutes } from './routes/index.js';
import { registerErrorHandlers } from './middleware/error-handlers.js';
import { validateEnvironment } from './utils/env-validator.js';
import { checkAdminTokenConfig } from './middleware/auth.js';

dotenv.config();

validateEnvironment();
checkAdminTokenConfig();

const app = express();
const PORT = process.env.PORT || 5001;
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

startServer(app, PORT);
