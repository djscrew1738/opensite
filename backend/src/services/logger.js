// Winston Logger with Daily Rotation
// All logs stored in /tool/logs folder

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate path from backend/src/services/logger.js to tool/logs
// backend/src/services/logger.js -> backend/ -> opensite/ -> tool/
const TOOL_DIR = path.join(__dirname, '../../../tool');
const LOGS_DIR = path.join(TOOL_DIR, 'logs');

// Ensure logs directory exists
fs.mkdirSync(LOGS_DIR, { recursive: true });

// Sensitive field patterns to redact from logs
const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /apiKey/i,
  /api_key/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /pass/i,  // matches 'pass', 'imap_pass', etc.
  /key/i,   // matches 'key', 'apiKey', etc.
  /credential/i,
  /auth/i,
];

/**
 * Sanitize an object for logging by redacting sensitive fields
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized copy of the object
 */
export function sanitizeForLog(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Check if key matches any sensitive pattern
    const isSensitive = SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive && value !== undefined && value !== null) {
      // Redact sensitive value
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Daily rotate file transport for all logs
const allLogsTransport = new DailyRotateFile({
  filename: path.join(LOGS_DIR, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: customFormat
});

// Daily rotate file transport for errors only
const errorLogsTransport = new DailyRotateFile({
  filename: path.join(LOGS_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: customFormat
});

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    allLogsTransport,
    errorLogsTransport
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOGS_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOGS_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add request logging helper
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Sanitize request body if present
  if (req.body && typeof req.body === 'object') {
    logData.body = sanitizeForLog(req.body);
  }
  
  logger.info('HTTP Request', logData);
};

// Add error logging helper
logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.url,
      ip: req.ip
    })
  };
  logger.error('Error occurred', errorInfo);
};

console.log(`✅ Logger initialized - Logs stored in: ${LOGS_DIR}`);

export default logger;
