// middleware/index.js
// Registers all core middleware for the Express app

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import {
  securityHeaders,
  apiLimiter,
  requestId,
  corsOptions,
  requestSizeLimiter
} from './security.js';
import { sanitizeInput } from './validation.js';
import { requestLogger } from './logging.js';
import { responseWrapper } from '../utils/response.js';

export function registerMiddleware(app) {
  app.set('trust proxy', 1);
  app.use(requestId);
  app.use(cors(corsOptions));
  app.use(securityHeaders);
  app.use(compression());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  app.use(sanitizeInput);
  app.use(requestSizeLimiter);
  app.use(responseWrapper);
  app.use(requestLogger);
  app.use('/api/', apiLimiter);
}
