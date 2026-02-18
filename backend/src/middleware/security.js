// Security Middleware

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from '../services/logger.js';

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many requests, please try again later'
    });
  }
});

// Stricter rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true
});

// Rate limiting for upload endpoints
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit reached, please try again later',
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many uploads, please try again later'
    });
  }
});

// Request size limiter
export const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.get('content-length');

  if (contentLength && parseInt(contentLength) > 110 * 1024 * 1024) {
    logger.warn('Request size exceeded', {
      ip: req.ip,
      size: contentLength
    });
    return res.status(413).json({
      error: 'Request size too large. Maximum 50MB allowed.'
    });
  }

  next();
};

// CORS configuration
export const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Request ID middleware
export const requestId = (req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

// IP whitelist middleware (optional)
export const ipWhitelist = (whitelist = []) => {
  return (req, res, next) => {
    if (whitelist.length === 0) {
      return next();
    }

    const clientIp = req.ip || req.connection.remoteAddress;

    if (!whitelist.includes(clientIp)) {
      logger.warn('IP not whitelisted', { ip: clientIp });
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    next();
  };
};
