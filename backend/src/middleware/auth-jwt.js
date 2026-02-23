import { verifyToken } from '../utils/auth.js';
import logger from '../services/logger.js';

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access denied', 
      code: 'UNAUTHORIZED' 
    });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (err) {
    logger.warn('Invalid token attempt', { ip: req.ip, error: err.message });
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token', 
      code: 'FORBIDDEN' 
    });
  }
}

/**
 * Middleware to require specific roles
 * @param {string[]} roles - Array of allowed roles
 */
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN_ROLE' 
      });
    }

    next();
  };
}
