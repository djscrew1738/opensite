/**
 * BaseService - Abstract base class for all business services
 * 
 * Provides common functionality for:
 * - Logging
 * - Error handling
 * - Event emission
 * - Transaction management
 * 
 * Usage:
 *   class LeadService extends BaseService {
 *     async createLead(data) {
 *       return this.execute('createLead', async () => {
 *         // Business logic here
 *       });
 *     }
 *   }
 */

import logger from '../logger.js';
import { AppError } from '../../utils/errors.js';

export class BaseService {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logger = logger.child({ service: serviceName });
  }

  /**
   * Execute a function with standardized error handling and logging
   * @param {string} operation - Name of the operation
   * @param {Function} fn - Async function to execute
   * @param {Object} context - Additional context for logging
   * @returns {Promise<*>} Result of the function
   */
  async execute(operation, fn, context = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Starting ${operation}`, context);
      
      const result = await fn();
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Completed ${operation}`, { 
        ...context, 
        durationMs: duration 
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`Failed ${operation}`, {
        ...context,
        error: error.message,
        durationMs: duration,
        stack: error.stack
      });

      // Wrap non-AppError exceptions
      if (!(error instanceof AppError)) {
        throw new AppError(
          error.message || `${operation} failed`,
          500,
          'INTERNAL_ERROR',
          { originalError: error.message, ...context }
        );
      }
      
      throw error;
    }
  }

  /**
   * Validate data using a schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @param {string} operation - Operation name for error messages
   * @returns {Object} Validated data
   */
  validate(data, schema, operation = 'validate') {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }
        
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
        
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        { errors, operation }
      );
    }
    
    return data;
  }

  /**
   * Emit an event (can be overridden for event-driven architecture)
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    this.logger.debug(`Event emitted: ${event}`, { event, data });
    // Override in subclasses to integrate with event bus (Redis, RabbitMQ, etc.)
  }

  /**
   * Cache result of a function
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<*>} Cached or fresh result
   */
  async cacheResult(key, fn, ttl = 300) {
    // This would integrate with your cache service
    // Implementation depends on your cache service
    return fn();
  }
}

export default BaseService;
