// Winston Logger with Daily Rotation
// All logs stored in /tool/logs folder

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const TOOL_DIR = path.join(process.cwd(), '../../tool');
const LOGS_DIR = path.join(TOOL_DIR, 'logs');

// Ensure logs directory exists
fs.mkdirSync(LOGS_DIR, { recursive: true });

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
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
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
