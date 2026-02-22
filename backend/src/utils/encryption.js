// Encryption utilities for sensitive data at rest
// Uses AES-256-GCM for authenticated encryption

import crypto from 'crypto';
import logger from '../services/logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Master key from environment - must be set for encryption to work
function getMasterKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    // In development, generate a warning but don't fail
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('ENCRYPTION_KEY not set - using derived key (NOT FOR PRODUCTION)');
      // Derive a deterministic key from a fixed string for dev only
      return crypto.scryptSync('opensite-dev-key-do-not-use-in-production', 'salt', KEY_LENGTH);
    }
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }
  
  // Derive 32-byte key from provided key using scrypt
  return crypto.scryptSync(key, 'opensite-salt-v1', KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string in format: iv:authTag:ciphertext (base64)
 */
export function encrypt(text) {
  if (!text) return text;
  if (typeof text !== 'string') {
    throw new Error('encrypt() expects a string');
  }
  
  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv:authTag:ciphertext
    const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    return result;
  } catch (error) {
    logger.error('Encryption failed', { error: error.message });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedData - Encrypted string in format: iv:authTag:ciphertext (base64)
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return encryptedData;
  if (typeof encryptedData !== 'string') {
    throw new Error('decrypt() expects a string');
  }
  
  // Check if data is not encrypted (legacy plaintext)
  if (!encryptedData.includes(':')) {
    // Return as-is, this is plaintext
    return encryptedData;
  }
  
  try {
    const key = getMasterKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    throw new Error('Failed to decrypt data - data may be corrupted or key may be incorrect');
  }
}

/**
 * Check if a value appears to be encrypted
 * @param {string} value 
 * @returns {boolean}
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  // Encrypted values have format: iv:authTag:ciphertext (3 parts)
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/**
 * Generate a secure encryption key
 * Run once and set as ENCRYPTION_KEY environment variable
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Rotate encryption key - re-encrypt data with new key
 * (For future use when key rotation is needed)
 */
export function rotateKey(encryptedData, oldKey, newKey) {
  // Store old key temporarily, decrypt, then re-encrypt with new key
  process.env.ENCRYPTION_KEY = oldKey;
  const plaintext = decrypt(encryptedData);
  process.env.ENCRYPTION_KEY = newKey;
  const reencrypted = encrypt(plaintext);
  return reencrypted;
}

export default { encrypt, decrypt, isEncrypted, generateEncryptionKey };
