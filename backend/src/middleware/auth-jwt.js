import { verifyToken } from '../utils/auth.js';
import logger from '../services/logger.js';

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.error('Access denied', 'UNAUTHORIZED', null, 401);
  }

  try {
    const user = verifyToken(token);
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
