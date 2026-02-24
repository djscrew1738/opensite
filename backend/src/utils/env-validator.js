// utils/env-validator.js
// Validates environment variables at startup

import { z } from 'zod';
import logger from '../services/logger.js';

const envSchema = z.object({
  ENCRYPTION_KEY: z.string().min(1, "ENCRYPTION_KEY is required."),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required."),
  DATABASE_URL: z.string().optional(),
  PORT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  GROQ_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENCLAW_URL: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
});

export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    logger.info('[env] Environment variables validated successfully');
  } catch (error) {
    logger.error('[env] Invalid environment variables:', error.format());
    process.exit(1);
  }
}
