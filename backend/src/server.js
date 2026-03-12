// Refactored server.js

import dotenv from 'dotenv';
import app from './app.js';
import { startServer } from './services/startup.js';
import { validateEnvironment } from './utils/env-validator.js';
import { checkAdminTokenConfig } from './middleware/auth.js';

dotenv.config();

validateEnvironment();
checkAdminTokenConfig();

const PORT = process.env.PORT || 5001;

startServer(app, PORT);
