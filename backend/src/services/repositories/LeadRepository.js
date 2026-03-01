/**
 * LeadRepository - Repository Pattern implementation for Lead entity
 * 
 * Extends BaseRepository to provide Lead-specific data access operations.
 * All database queries for leads are centralized here.
 */

import { BaseRepository } from '../base/BaseRepository.js';
import { db } from '../database/index.js';
import logger from '../logger.js';

export class LeadRepository extends BaseRepository {
  constructor() {
    super('leads', db);
    this.logger = logger.child({ repository: 'LeadRepository' });
  }

  /**
   * Find leads by status
   * @param {string} status - Lead status
   * @param {Object} options - Query options
   * @returns {Promise<{data: Array, total: number}>}
   */
  async findByStatus(status, options = {}) {
    return this.findAll({ status }, options);
  }

  /**
   * Find leads by tier (hot, warm, cold)
   * @param {string} tier - Lead tier
   * @param {Object} options - Query options
   * @returns {Promise<{data: Array, total: number}>}
   */
  async findByTier(tier, options = {}) {
    return this.findAll({ tier }, options);
  }

  /**
   * Search leads by name, email, or company
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<{data: Array, total: number}>}
   */
  async search(query, options = {}) {
    return this.findAll({}, {
      ...options,
      search: query,
      searchFields: ['name', 'email', 'company', 'phone']
    });
  }

  /**
   * Find leads assigned to a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<{data: Array, total: number}>}
   */
  async findByUser(userId, options = {}) {
    return this.findAll({ userId }, options);
  }

  /**
   * Find leads by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Query options
   * @returns {Promise<{data: Array, total: number}>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    try {
      let query = this.db.queryBuilder
        .from(this.tableName)
        .whereBetween('createdAt', [startDate.toISOString(), endDate.toISOString()]);

      let countQuery = this.db.queryBuilder
        .from(this.tableName)
        .whereBetween('createdAt', [startDate.toISOString(), endDate.toISOString()])
        .count('* as count');

      // Apply pagination
      const { limit = 50, offset = 0 } = options;
      query = query.limit(limit).offset(offset);

      const [data, countResult] = await Promise.all([
        query,
        countQuery.first()
      ]);

      return {
        data,
        total: parseInt(countResult.count, 10)
      };
    } catch (error) {
      throw this.handleError(error, 'findByDateRange');
    }
  }

  /**
   * Get leads statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const [statusCounts, tierCounts, totalCount] = await Promise.all([
        this.db.queryBuilder
          .from(this.tableName)
          .select('status')
          .count('* as count')
          .groupBy('status'),
        this.db.queryBuilder
          .from(this.tableName)
          .select('tier')
          .count('* as count')
          .groupBy('tier'),
        this.count()
      ]);

      return {
        total: totalCount,
        byStatus: statusCounts.reduce((acc, { status, count }) => {
          acc[status] = parseInt(count, 10);
          return acc;
        }, {}),
        byTier: tierCounts.reduce((acc, { tier, count }) => {
          acc[tier] = parseInt(count, 10);
          return acc;
        }, {})
      };
    } catch (error) {
      throw this.handleError(error, 'getStatistics');
    }
  }

  /**
   * Update lead score
   * @param {string} id - Lead ID
   * @param {number} score - New score
   * @param {Object} scoringData - Additional scoring data
   * @returns {Promise<Object>}
   */
  async updateScore(id, score, scoringData = {}) {
    try {
      await this.db.queryBuilder
        .from(this.tableName)
        .where({ id })
        .update({
          score,
          scoringData: JSON.stringify(scoringData),
          scoredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      return this.findById(id);
    } catch (error) {
      throw this.handleError(error, 'updateScore');
    }
  }

  /**
   * Assign lead to user
   * @param {string} id - Lead ID
   * @param {string} userId - User ID to assign to
   * @returns {Promise<Object>}
   */
  async assignToUser(id, userId) {
    try {
      await this.db.queryBuilder
        .from(this.tableName)
        .where({ id })
        .update({
          userId,
          assignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      return this.findById(id);
    } catch (error) {
      throw this.handleError(error, 'assignToUser');
    }
  }

  /**
   * Get leads needing follow-up (not contacted in X days)
   * @param {number} days - Number of days
   * @returns {Promise<Array>}
   */
  async getLeadsNeedingFollowUp(days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return await this.db.queryBuilder
        .from(this.tableName)
        .where('lastContactedAt', '<', cutoffDate.toISOString())
        .orWhereNull('lastContactedAt')
        .whereNotIn('status', ['closed', 'converted'])
        .orderBy('createdAt', 'desc');
    } catch (error) {
      throw this.handleError(error, 'getLeadsNeedingFollowUp');
    }
  }
}

// Export singleton instance
export const leadRepository = new LeadRepository();
export default leadRepository;
