// Request Validation Middleware

import { body, param, query, validationResult } from 'express-validator';
import logger from '../services/logger.js';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      path: req.path,
      errors: errors.array()
    });

    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

// Lead validation rules
export const validateLead = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Company name too long'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location too long'),
  body('projectType')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Project type too long'),
  body('value')
    .optional()
    .isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Notes too long'),
  handleValidationErrors
];

// Estimate validation rules
export const validateEstimate = [
  body('sqft')
    .isFloat({ min: 100, max: 1000000 }).withMessage('Square footage must be between 100 and 1,000,000'),
  body('bathrooms')
    .isFloat({ min: 0.5, max: 500 }).withMessage('Bathrooms must be between 0.5 and 500'),
  body('units')
    .isInt({ min: 1, max: 10000 }).withMessage('Units must be between 1 and 10,000'),
  body('stories')
    .isInt({ min: 1, max: 100 }).withMessage('Stories must be between 1 and 100'),
  body('lavatories')
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage('Lavatories must be between 0 and 1,000'),
  body('barSinks')
    .optional()
    .isInt({ min: 0, max: 500 }).withMessage('Bar sinks must be between 0 and 500'),
  body('tubs')
    .optional()
    .isInt({ min: 0, max: 500 }).withMessage('Tubs must be between 0 and 500'),
  body('showerBases')
    .optional()
    .isInt({ min: 0, max: 500 }).withMessage('Shower bases must be between 0 and 500'),
  body('mudPans')
    .optional()
    .isInt({ min: 0, max: 500 }).withMessage('Mud pans must be between 0 and 500'),
  body('washingMachines')
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage('Washing machines must be between 0 and 1,000'),
  body('toilets')
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage('Toilets must be between 0 and 1,000'),
  body('waterSoftenerPreplumb')
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage('Water softener pre-plumb must be between 0 and 1,000'),
  body('kitchenFaucets')
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage('Kitchen faucets must be between 0 and 1,000'),
  handleValidationErrors
];

// Project validation rules
export const validateProject = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  body('leadId')
    .optional()
    .isUUID().withMessage('Invalid lead ID format'),
  body('value')
    .optional()
    .isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('phase')
    .optional()
    .isIn(['rough-in', 'top-out', 'trim']).withMessage('Invalid phase'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status'),
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  param('id')
    .isUUID().withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query parameter validation
export const validateLeadQuery = [
  query('status')
    .optional()
    .isIn(['hot', 'warm', 'cold']).withMessage('Invalid status'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query too long'),
  handleValidationErrors
];

// AI chat validation
export const validateChat = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters'),
  body('conversationId')
    .optional()
    .isUUID().withMessage('Invalid conversation ID format'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Model name too long'),
  handleValidationErrors
];

// Sanitize input helper
export const sanitizeInput = (req, res, next) => {
  // Remove any null bytes
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};
