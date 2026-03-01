/**
 * LeadService - Business logic layer for Lead management
 * 
 * This service encapsulates all business logic for leads:
 * - Validation
 * - Scoring
 * - Caching
 * - Event emission
 * - Transaction management
 * 
 * It uses LeadRepository for data access and coordinates
 * with other services (scoring, notifications, etc.)
 */

import { BaseService } from './base/BaseService.js';
import { leadRepository } from './repositories/LeadRepository.js';
import { scoringService } from './scoring.js';
import { cache } from './cache.js';
import { AppError, NotFoundError, ValidationError } from '../utils/errors.js';
import logger from './logger.js';

export class LeadService extends BaseService {
  constructor() {
    super('LeadService');
    this.repository = leadRepository;
  }

  // ============================================================================
  // CRUD Operations with Business Logic
  // ============================================================================

  /**
   * Create a new lead with validation and initial scoring
   * @param {Object} leadData - Lead data
   * @param {string} userId - Creating user ID
   * @returns {Promise<Object>}
   */
  async createLead(leadData, userId) {
    return this.execute('createLead', async () => {
      // Validate input
      this.validate(leadData, {
        name: { required: true, type: 'string', minLength: 2 },
        email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        company: { type: 'string' },
        phone: { type: 'string' },
        status: { enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed'] }
      });

      // Check for duplicates
      const exists = await this.repository.exists({ email: leadData.email });
      if (exists) {
        throw new AppError(
          'Lead with this email already exists',
          409,
          'DUPLICATE_ENTRY',
          { email: leadData.email }
        );
      }

      // Create lead
      const lead = await this.repository.create({
        ...leadData,
        userId,
        status: leadData.status || 'new',
        createdAt: new Date().toISOString()
      });

      // Auto-score if enough data
      if (this.shouldAutoScore(lead)) {
        await this.scoreLead(lead.id);
      }

      // Invalidate cache
      this.invalidateLeadCaches(userId);

      // Emit event
      this.emit('lead:created', { leadId: lead.id, userId });

      logger.info('Lead created', { leadId: lead.id, name: lead.name });

      return lead;
    }, { userId, leadName: leadData.name });
  }

  /**
   * Get leads list with filtering and caching
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getLeads(filters = {}, options = {}) {
    return this.execute('getLeads', async () => {
      const { status, tier, search, userId } = filters;
      const { page = 1, limit = 50 } = options;

      // Build cache key
      const cacheKey = `leads:list:${userId}:${status}:${tier}:${search}:${page}:${limit}`;
      
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Leads served from cache', { cacheKey });
        return cached;
      }

      // Fetch from repository
      let result;
      if (search) {
        result = await this.repository.search(search, { page, limit });
      } else {
        const repoFilters = {};
        if (status) repoFilters.status = status;
        if (tier) repoFilters.tier = tier;
        if (userId) repoFilters.userId = userId;

        result = await this.repository.findAll(repoFilters, { page, limit });
      }

      // Enrich with calculated fields
      const enrichedData = result.data.map(lead => ({
        ...lead,
        daysSinceCreated: this.calculateDaysSince(lead.createdAt),
        isStale: this.isStale(lead)
      }));

      const response = {
        leads: enrichedData,
        total: result.total,
        page,
        limit
      };

      // Cache for 30 seconds
      cache.set(cacheKey, response, 30);

      return response;
    }, { filters, options });
  }

  /**
   * Get single lead by ID
   * @param {string} id - Lead ID
   * @returns {Promise<Object>}
   */
  async getLead(id) {
    return this.execute('getLead', async () => {
      const cacheKey = `lead:${id}`;
      
      let lead = cache.get(cacheKey);
      
      if (!lead) {
        lead = await this.repository.findById(id);
        
        if (!lead) {
          throw new NotFoundError('Lead', id);
        }

        // Cache for 5 minutes
        cache.set(cacheKey, lead, 300);
      }

      return lead;
    }, { leadId: id });
  }

  /**
   * Update lead
   * @param {string} id - Lead ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>}
   */
  async updateLead(id, updates) {
    return this.execute('updateLead', async () => {
      // Validate updates
      this.validate(updates, {
        name: { type: 'string', minLength: 2 },
        email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        status: { enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed'] },
        tier: { enum: ['hot', 'warm', 'cold'] }
      });

      // Check if exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Lead', id);
      }

      // Update
      const lead = await this.repository.update(id, updates);

      // Invalidate caches
      cache.del(`lead:${id}`);
      this.invalidateLeadCaches(lead.userId);

      // Emit event
      this.emit('lead:updated', { leadId: id, updates: Object.keys(updates) });

      logger.info('Lead updated', { leadId: id });

      return lead;
    }, { leadId: id, updates: Object.keys(updates) });
  }

  /**
   * Delete lead
   * @param {string} id - Lead ID
   * @returns {Promise<boolean>}
   */
  async deleteLead(id) {
    return this.execute('deleteLead', async () => {
      const lead = await this.repository.findById(id);
      if (!lead) {
        throw new NotFoundError('Lead', id);
      }

      await this.repository.delete(id);

      // Invalidate caches
      cache.del(`lead:${id}`);
      this.invalidateLeadCaches(lead.userId);

      // Emit event
      this.emit('lead:deleted', { leadId: id });

      logger.info('Lead deleted', { leadId: id });

      return true;
    }, { leadId: id });
  }

  // ============================================================================
  // Business Logic Operations
  // ============================================================================

  /**
   * Score a lead using AI
   * @param {string} id - Lead ID
   * @returns {Promise<Object>}
   */
  async scoreLead(id) {
    return this.execute('scoreLead', async () => {
      const lead = await this.getLead(id);

      // Call scoring service
      const result = await scoringService.scoreLead(id);

      if (!result || !result.scoring) {
        throw new AppError('Scoring failed', 500, 'AI_ERROR');
      }

      // Update lead with score
      const updated = await this.repository.updateScore(
        id,
        result.scoring.score,
        result.scoring
      );

      // Invalidate cache
      cache.del(`lead:${id}`);

      // Emit event
      this.emit('lead:scored', { 
        leadId: id, 
        score: result.scoring.score,
        tier: result.scoring.tier 
      });

      return {
        lead: updated,
        score: result.scoring.score,
        tier: result.scoring.tier,
        status: result.scoring.status,
        reasoning: result.scoring.reasoning
      };
    }, { leadId: id });
  }

  /**
   * Bulk update lead status
   * @param {Array<string>} ids - Lead IDs
   * @param {string} status - New status
   * @returns {Promise<number>}
   */
  async bulkUpdateStatus(ids, status) {
    return this.execute('bulkUpdateStatus', async () => {
      if (!ids || ids.length === 0) {
        throw new ValidationError('No lead IDs provided');
      }

      const updated = await this.repository.bulkUpdate(ids, { status });

      // Invalidate caches
      for (const id of ids) {
        cache.del(`lead:${id}`);
      }
      cache.delPattern('leads:list:');

      // Emit event
      this.emit('leads:bulkUpdated', { leadIds: ids, status });

      logger.info('Bulk status update', { count: updated, status });

      return updated;
    }, { leadIds: ids.length, status });
  }

  /**
   * Get lead statistics
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    return this.execute('getStatistics', async () => {
      const cacheKey = 'leads:statistics';
      
      let stats = cache.get(cacheKey);
      if (!stats) {
        stats = await this.repository.getStatistics();
        cache.set(cacheKey, stats, 60); // Cache for 1 minute
      }

      return stats;
    });
  }

  /**
   * Assign lead to user
   * @param {string} id - Lead ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async assignLead(id, userId) {
    return this.execute('assignLead', async () => {
      const lead = await this.getLead(id);
      
      const updated = await this.repository.assignToUser(id, userId);

      // Invalidate caches
      cache.del(`lead:${id}`);
      this.invalidateLeadCaches(lead.userId);
      this.invalidateLeadCaches(userId);

      this.emit('lead:assigned', { leadId: id, userId });

      return updated;
    }, { leadId: id, userId });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  shouldAutoScore(lead) {
    // Auto-score if we have enough information
    return !!(lead.email && (lead.company || lead.phone));
  }

  calculateDaysSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  }

  isStale(lead) {
    const daysSinceContact = lead.lastContactedAt 
      ? this.calculateDaysSince(lead.lastContactedAt)
      : this.calculateDaysSince(lead.createdAt);
    
    return daysSinceContact > 7 && !['closed', 'converted'].includes(lead.status);
  }

  invalidateLeadCaches(userId) {
    cache.delPattern('leads:list:');
    if (userId) {
      cache.delPattern(`leads:list:${userId}`);
    }
  }
}

// Export singleton
export const leadService = new LeadService();
export default leadService;
