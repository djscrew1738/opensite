// Refactored server.js

import express from 'express';
import dotenv from 'dotenv';
import { startServer } from './services/startup.js';
import { registerMiddleware } from './middleware/index.js';
import { registerRoutes } from './routes/index.js';
import { registerErrorHandlers } from './middleware/error-handlers.js';
import { validateEnvironment } from './utils/env-validator.js';

dotenv.config();
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5001;

registerMiddleware(app);
registerRoutes(app);
registerErrorHandlers(app);

startServer(app, PORT);
