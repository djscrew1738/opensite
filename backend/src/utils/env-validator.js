// utils/env-validator.js
// Validates environment variables at startup

import logger from '../services/logger.js';

export function validateEnvironment() {
  console.log('🔍 Validating environment...');
  const errors = [];
  const warnings = [];

  // CRITICAL: ENCRYPTION_KEY
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    errors.push('ENCRYPTION_KEY is not set.');
  } else {
    try {
      let keyBuffer;
      if (encryptionKey.length === 64) {
        keyBuffer = Buffer.from(encryptionKey, 'hex');
      } else {
        keyBuffer = Buffer.from(encryptionKey, 'base64');
      }
      if (keyBuffer.length !== 32) {
        errors.push(`ENCRYPTION_KEY must be 32 bytes when decoded.`);
      }
    } catch (e) {
      errors.push(`ENCRYPTION_KEY is invalid: ${e.message}`);
    }
  }

  // OPTIONAL: AI provider keys
  const aiKeys = ['GROQ_API_KEY', 'ANTHROPIC_API_KEY', 'OPENCLAW_URL'];
  if (!aiKeys.some(key => !!process.env[key])) {
    warnings.push('No cloud AI provider API keys configured.');
  }

  // OPTIONAL: Other service keys
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    warnings.push('Twilio credentials not configured.');
  }

  warnings.forEach(warning => logger.warn(`[env] ${warning}`));

  if (errors.length > 0) {
    errors.forEach(error => logger.error(`[env] FATAL: ${error}`));
    logger.error('[env] Server startup aborted.');
    process.exit(1);
  }
}
