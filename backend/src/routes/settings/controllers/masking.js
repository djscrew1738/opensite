/**
 * API Key Masking Utilities
 * Secure masking for sensitive configuration values
 */

import { SENSITIVE_KEYS } from '../schema.js';

/**
 * Mask a single API key
 * @param {string} key - The API key to mask
 * @returns {string} Masked key (e.g., "sk_live_****_abcd")
 */
export function maskKey(key) {
  if (!key || key.length < 8) return '';
  
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Check if a key should be masked
 * @param {string} keyName - The setting key name
 * @returns {boolean}
 */
export function isSensitiveKey(keyName) {
  return SENSITIVE_KEYS.includes(keyName);
}

/**
 * Mask sensitive values in settings object
 * @param {Record<string, any>} settings - Raw settings from database
 * @returns {Record<string, any>} Settings with sensitive values masked
 */
export function maskSensitiveValues(settings) {
  const masked = { ...settings };
  
  for (const key of SENSITIVE_KEYS) {
    if (masked[key] !== undefined) {
      const value = masked[key];
      masked[`${key}_masked`] = maskKey(value);
      masked[`${key}_configured`] = value && value.length > 0;
      delete masked[key];
    }
  }
  
  return masked;
}

/**
 * Extract only changed sensitive keys from update
 * @param {Record<string, any>} updates - Update payload
 * @returns {string[]} Array of sensitive key names present in updates
 */
export function getChangedSensitiveKeys(updates) {
  return Object.keys(updates).filter(key => isSensitiveKey(key));
}
