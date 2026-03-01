/**
 * BaseRepository - Abstract base class for all data repositories
 * 
 * Implements the Repository Pattern to abstract database operations.
 * Provides standardized CRUD operations and query building.
 * 
 * Usage:
 *   class LeadRepository extends BaseRepository {
 *     constructor() {
 *       super('leads', db);
 *     }
 *     
 *     async findByStatus(status) {
 *       return this.findWhere({ status });
 *     }
 *   }
 */

import { AppError } from '../../utils/errors.js';

export class BaseRepository {
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Find a single record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findById(id, options = {}) {
    const { include = [], select = null } = options;
    
    try {
      let query = this.db.queryBuilder
        .from(this.tableName)
        .where({ id })
        .first();
      
      if (select) {
        query = query.select(select);
      }
      
      // Handle includes (relationships)
      for (const relation of include) {
        query = query.leftJoin(
          relation.table,
          `${this.tableName}.${relation.foreignKey}`,
          `${relation.table}.id`
        );
      }
      
      return await query;
    } catch (error) {
      throw this.handleError(error, 'findById');
    }
  }

  /**
   * Find all records with optional filtering
   * @param {Object} filters - Filter conditions
   * @param {Object} options - Query options (limit, offset, orderBy)
   * @returns {Promise<{data: Array, total: number}>}
   */
  async findAll(filters = {}, options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      orderBy = 'createdAt', 
      order = 'desc',
      search = null,
      searchFields = []
    } = options;

    try {
      // Build base query
      let query = this.db.queryBuilder.from(this.tableName);
      let countQuery = this.db.queryBuilder.from(this.tableName).count('* as count');

      // Apply filters
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.whereIn(key, value);
            countQuery = countQuery.whereIn(key, value);
          } else {
            query = query.where(key, value);
            countQuery = countQuery.where(key, value);
          }
        }
      }

      // Apply search
      if (search && searchFields.length > 0) {
        query = query.where(function() {
          for (const field of searchFields) {
            this.orWhere(field, 'like', `%${search}%`);
          }
        });
        countQuery = countQuery.where(function() {
          for (const field of searchFields) {
            this.orWhere(field, 'like', `%${search}%`);
          }
        });
      }

      // Get total count
      const countResult = await countQuery.first();
      const total = parseInt(countResult.count, 10);

      // Apply pagination and ordering
      const data = await query
        .orderBy(orderBy, order)
        .limit(limit)
        .offset(offset);

      return { data, total };
    } catch (error) {
      throw this.handleError(error, 'findAll');
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      const [id] = await this.db.queryBuilder
        .into(this.tableName)
        .insert(data);
      
      return this.findById(id);
    } catch (error) {
      throw this.handleError(error, 'create');
    }
  }

  /**
   * Update a record by ID
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      const updated = await this.db.queryBuilder
        .from(this.tableName)
        .where({ id })
        .update({
          ...data,
          updatedAt: new Date().toISOString()
        });

      if (updated === 0) {
        throw new AppError(
          `${this.tableName} not found`,
          404,
          'NOT_FOUND',
          { id }
        );
      }

      return this.findById(id);
    } catch (error) {
      throw this.handleError(error, 'update');
    }
  }

  /**
   * Delete a record by ID
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const deleted = await this.db.queryBuilder
        .from(this.tableName)
        .where({ id })
        .del();

      if (deleted === 0) {
        throw new AppError(
          `${this.tableName} not found`,
          404,
          'NOT_FOUND',
          { id }
        );
      }

      return true;
    } catch (error) {
      throw this.handleError(error, 'delete');
    }
  }

  /**
   * Perform bulk update
   * @param {Array<string|number>} ids - Record IDs
   * @param {Object} data - Update data
   * @returns {Promise<number>} Number of updated records
   */
  async bulkUpdate(ids, data) {
    try {
      return await this.db.queryBuilder
        .from(this.tableName)
        .whereIn('id', ids)
        .update({
          ...data,
          updatedAt: new Date().toISOString()
        });
    } catch (error) {
      throw this.handleError(error, 'bulkUpdate');
    }
  }

  /**
   * Perform bulk delete
   * @param {Array<string|number>} ids - Record IDs
   * @returns {Promise<number>} Number of deleted records
   */
  async bulkDelete(ids) {
    try {
      return await this.db.queryBuilder
        .from(this.tableName)
        .whereIn('id', ids)
        .del();
    } catch (error) {
      throw this.handleError(error, 'bulkDelete');
    }
  }

  /**
   * Check if a record exists
   * @param {Object} conditions - Where conditions
   * @returns {Promise<boolean>}
   */
  async exists(conditions) {
    try {
      let query = this.db.queryBuilder
        .from(this.tableName)
        .where(conditions)
        .first();

      const result = await query;
      return !!result;
    } catch (error) {
      throw this.handleError(error, 'exists');
    }
  }

  /**
   * Count records matching conditions
   * @param {Object} conditions - Where conditions
   * @returns {Promise<number>}
   */
  async count(conditions = {}) {
    try {
      let query = this.db.queryBuilder
        .from(this.tableName)
        .count('* as count');

      for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined && value !== null) {
          query = query.where(key, value);
        }
      }

      const result = await query.first();
      return parseInt(result.count, 10);
    } catch (error) {
      throw this.handleError(error, 'count');
    }
  }

  /**
   * Execute within a transaction
   * @param {Function} callback - Function to execute
   * @returns {Promise<*>}
   */
  async transaction(callback) {
    const trx = await this.db.transaction();
    
    try {
      const result = await callback(trx);
      await trx.commit();
      return result;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Handle database errors consistently
   * @param {Error} error - Original error
   * @param {string} operation - Operation name
   * @returns {AppError}
   */
  handleError(error, operation) {
    if (error instanceof AppError) {
      return error;
    }

    // Handle unique constraint violations
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
      return new AppError(
        'Duplicate entry',
        409,
        'DUPLICATE_ENTRY',
        { originalError: error.message, operation }
      );
    }

    // Handle foreign key violations
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.code === '23503') {
      return new AppError(
        'Referenced record not found',
        400,
        'FOREIGN_KEY_VIOLATION',
        { originalError: error.message, operation }
      );
    }

    return new AppError(
      `Database operation failed: ${operation}`,
      500,
      'DATABASE_ERROR',
      { originalError: error.message, operation }
    );
  }
}

export default BaseRepository;
