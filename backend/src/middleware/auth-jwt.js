import { verifyToken } from '../utils/auth.js';
import { db } from '../services/database.js';
import logger from '../services/logger.js';

/**
 * Middleware to authenticate requests using JWT.
 * Validates the Bearer scheme, signature, expiry, and blocklist (revoked tokens).
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.error('Access denied', 'UNAUTHORIZED', null, 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.error('Authorization header must use Bearer scheme', 'UNAUTHORIZED', null, 401);
  }

  const token = parts[1];

  try {
    const user = verifyToken(token);

    // Check token blocklist (revoked on logout or force-expire)
    if (user.jti) {
      const revoked = await db.isTokenRevoked(user.jti);
      if (revoked) {
        logger.warn('Revoked token used', { ip: req.ip, userId: user.id, jti: user.jti });
        return res.error('Token has been revoked', 'FORBIDDEN', null, 403);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn('Invalid token attempt', { ip: req.ip, error: err.message });
    return res.error('Invalid or expired token', 'FORBIDDEN', null, 403);
  }
}

/**
 * Middleware to require specific roles
 * @param {string[]} roles - Array of allowed roles
 */
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    if (!roles.includes(req.user.role)) {
      return res.error('Insufficient permissions', 'FORBIDDEN_ROLE', null, 403);
    }

    next();
  };
}
