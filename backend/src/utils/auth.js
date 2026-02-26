import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
  : 'dev-secret-do-not-use-in-prod');
const JWT_EXPIRES_IN = '7d';
const JWT_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Hash a password
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user.
 * Includes a unique jti (JWT ID) so individual tokens can be revoked.
 * @param {object} user
 * @returns {{ token: string, jti: string, expiresAt: string }}
 */
export function generateToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + JWT_EXPIRES_SECONDS * 1000).toISOString();
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      jti,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return { token, jti, expiresAt };
}

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
