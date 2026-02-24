import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
  : 'dev-secret-do-not-use-in-prod');
const JWT_EXPIRES_IN = '7d';

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
 * Generate a JWT token for a user
 * @param {object} user 
 * @returns {string}
 */
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify a JWT token
 * @param {string} token 
 * @returns {object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
