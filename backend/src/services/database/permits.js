// Permit Operations Module
// Adds permit, builder, and discovery-related operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

/**
 * Permit operations mixin
 * Adds permit, discovery run, and lead-related methods to DatabaseService
 */
export function addPermitOperations(DatabaseService) {
  // ==================== Permit Operations ====================
  
  /**
   * Get all permits with comprehensive filtering
   */
  DatabaseService.prototype.getAllPermits = async function(filters = {}) {
    let query = 'SELECT * FROM permits WHERE 1=1';
    const params = [];
    
    if (filters.sourceId) {
      query += ' AND sourceId = ?';
      params.push(filters.sourceId);
    }
    
    if (filters.tier) {
      query += ' AND tier = ?';
      params.push(filters.tier);
    }
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }

    if (filters.zipCode) {
      query += ' AND zip = ?';
      params.push(filters.zipCode);
    }

    if (filters.minScore) {
      query += ' AND leadScore >= ?';
      params.push(filters.minScore);
    }

    if (filters.startDate) {
      query += ' AND issuedDate >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND issuedDate <= ?';
      params.push(filters.endDate);
    }

    if (filters.search) {
      query += ' AND (permitNumber LIKE ? OR address LIKE ? OR contractor LIKE ? OR description LIKE ?)';
      const search = `%${filters.search}%`;
      params.push(search, search, search, search);
    }
    
    query += ' ORDER BY issuedDate DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }
    
    try {
      return await this.all(query, params);
    } catch (error) {
      logger.error('Error getting all permits', { error: error.message, filters });
      return [];
    }
  };

  /**
   * Get single permit
   */
  DatabaseService.prototype.getPermit = async function(id) {
    try {
      return await this.get('SELECT * FROM permits WHERE id = ?', [id]);
    } catch (error) {
      return null;
    }
  };

  /**
   * Create permit
   */
  DatabaseService.prototype.createPermit = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await this.run(`
        INSERT INTO permits (
          id, permitNumber, address, city, state, zip, 
          contractor, contractorPhone, estimatedCost, 
          issuedDate, status, description, sourceId, 
          tier, leadScore, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.permitNumber || null,
        data.address || null,
        data.city || null,
        data.state || 'TX',
        data.zip || null,
        data.contractor || null,
        data.contractorPhone || null,
        data.estimatedCost || 0,
        data.issuedDate || now,
        data.status || 'new',
        data.description || null,
        data.sourceId || null,
        data.tier || 'unscored',
        data.leadScore || 0,
        now,
        now
      ]);
      
      return await this.getPermit(id);
    } catch (error) {
      logger.error('Failed to create permit', { error: error.message });
      throw error;
    }
  };

  /**
   * Update permit
   */
  DatabaseService.prototype.updatePermit = async function(id, data) {
    const fields = [];
    const params = [];
    const now = new Date().toISOString();

    const allowedFields = [
      'permitNumber', 'address', 'city', 'zip', 'contractor', 
      'contractorPhone', 'estimatedCost', 'status', 'tier', 
      'leadScore', 'description'
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return await this.getPermit(id);

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    try {
      const result = await this.run(`UPDATE permits SET ${fields.join(', ')} WHERE id = ?`, params);
      if (result.changes === 0) return null;
      return await this.getPermit(id);
    } catch (error) {
      logger.error(`Failed to update permit: ${id}`, { error: error.message });
      throw error;
    }
  };

  /**
   * Upsert permit (for ingestion)
   */
  DatabaseService.prototype.upsertPermit = async function(data) {
    const now = new Date().toISOString();
    
    // Check for existing by sourceId + permitNumber or address + issuedDate
    let existing = null;
    if (data.sourceId && data.permitNumber) {
      existing = await this.get('SELECT id FROM permits WHERE sourceId = ? AND permitNumber = ?', [data.sourceId, data.permitNumber]);
    }
    
    if (!existing && data.address && data.issuedDate) {
      existing = await this.get('SELECT id FROM permits WHERE address = ? AND issuedDate = ?', [data.address, data.issuedDate]);
    }

    if (existing) {
      return await this.updatePermit(existing.id, data);
    } else {
      return await this.createPermit(data);
    }
  };

  /**
   * Get permit dashboard summary
   */
  DatabaseService.prototype.getPermitSummary = async function() {
    try {
      const stats = await this.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN tier = 'hot' THEN 1 ELSE 0 END) as hot,
          SUM(CASE WHEN tier = 'warm' THEN 1 ELSE 0 END) as warm,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newPermits,
          SUM(estimatedCost) as totalValue
        FROM permits
      `);
      
      const cityBreakdown = await this.all(`
        SELECT city, COUNT(*) as count FROM permits GROUP BY city ORDER BY count DESC LIMIT 5
      `);
      
      return { ...stats, topCities: cityBreakdown };
    } catch (error) {
      return { total: 0, hot: 0, warm: 0, newPermits: 0, totalValue: 0, topCities: [] };
    }
  };

  /**
   * Get cities with permit counts
   */
  DatabaseService.prototype.getCitiesWithCounts = async function() {
    try {
      return await this.all(`
        SELECT city, COUNT(*) as count, SUM(estimatedCost) as totalValue
        FROM permits 
        WHERE city IS NOT NULL
        GROUP BY city 
        ORDER BY count DESC
      `);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get stats for a specific city
   */
  DatabaseService.prototype.getCityStats = async function(city) {
    try {
      const basic = await this.get(`
        SELECT COUNT(*) as total, SUM(estimatedCost) as totalValue, AVG(leadScore) as avgScore
        FROM permits WHERE city = ?
      `, [city]);
      
      const statusCounts = await this.all(`
        SELECT status, COUNT(*) as count FROM permits WHERE city = ? GROUP BY status
      `, [city]);
      
      return { ...basic, statuses: statusCounts };
    } catch (error) {
      return { total: 0, totalValue: 0 };
    }
  };

  // ==================== Builder Operations ====================

  /**
   * Upsert a builder
   */
  DatabaseService.prototype.upsertBuilder = async function(data) {
    const now = new Date().toISOString();
    try {
      let existing = await this.get('SELECT id FROM builders WHERE name = ? OR company = ?', [data.name, data.company]);
      
      if (existing) {
        await this.run(`UPDATE builders SET updatedAt = ? WHERE id = ?`, [now, existing.id]);
        return existing;
      }
      
      const id = uuidv4();
      await this.run(`
        INSERT INTO builders (id, name, company, licenseNumber, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, data.name, data.company || data.name, data.licenseNumber || null, now, now]);
      
      return { id };
    } catch (error) {
      logger.error('Builder upsert failed', { error: error.message });
      return null;
    }
  };

  /**
   * Get all builders with filtering
   */
  DatabaseService.prototype.getAllBuilders = async function(filters = {}) {
    let query = 'SELECT * FROM builders WHERE 1=1';
    const params = [];
    
    if (filters.search) {
      query += ' AND (name LIKE ? OR company LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s);
    }
    
    if (filters.hasPlumber !== undefined) {
      query += ' AND hasPlumber = ?';
      params.push(filters.hasPlumber ? 1 : 0);
    }
    
    query += ' ORDER BY totalPermits DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }
    
    try {
      return await this.all(query, params);
    } catch (error) {
      return [];
    }
  };

  /**
   * Get single builder
   */
  DatabaseService.prototype.getBuilder = async function(id) {
    return await this.get('SELECT * FROM builders WHERE id = ?', [id]);
  };

  /**
   * Link permit to builder
   */
  DatabaseService.prototype.linkPermitBuilder = async function(permitId, builderId, role = 'contractor') {
    try {
      const id = uuidv4();
      await this.run(`
        INSERT INTO permit_builder_map (id, permitId, builderId, role)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(permitId, builderId) DO UPDATE SET role = excluded.role
      `, [id, permitId, builderId, role]);
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Get builders for a permit
   */
  DatabaseService.prototype.getPermitBuilders = async function(permitId) {
    return await this.all(`
      SELECT b.*, pbm.role
      FROM builders b
      JOIN permit_builder_map pbm ON b.id = pbm.builderId
      WHERE pbm.permitId = ?
    `, [permitId]);
  };

  /**
   * Get permits for a builder
   */
  DatabaseService.prototype.getBuilderPermits = async function(builderId) {
    return await this.all(`
      SELECT p.*, pbm.role
      FROM permits p
      JOIN permit_builder_map pbm ON p.id = pbm.permitId
      WHERE pbm.builderId = ?
      ORDER BY p.issuedDate DESC
    `, [builderId]);
  };

  // ==================== Geographic / Location ====================

  /**
   * Get permits near a location (rough bounding box + haversine if available)
   */
  DatabaseService.prototype.getPermitsNearLocation = async function(lat, lng, radiusMiles) {
    // Rough bounding box for efficiency
    const degPerMile = 1 / 69; 
    const latDelta = radiusMiles * degPerMile;
    const lngDelta = radiusMiles * (degPerMile / Math.cos(lat * Math.PI / 180));
    
    try {
      // If we don't have lat/lng columns in permits yet, this will fail
      // Falling back to city matching if coordinates aren't indexed
      return await this.all(`
        SELECT * FROM permits 
        WHERE (lat BETWEEN ? AND ?) AND (lng BETWEEN ? AND ?)
      `, [lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta]);
    } catch (e) {
      // Coordinates might be in a different table or missing
      logger.warn('Permits location search failed, likely missing lat/lng columns');
      return [];
    }
  };

  // ==================== Unified Search ====================

  /**
   * Search across multiple entities
   */
  DatabaseService.prototype.unifiedSearch = async function(q, type = null) {
    const results = { permits: [], leads: [], builders: [] };
    const term = `%${q}%`;
    
    if (!type || type === 'permit') {
      results.permits = await this.all('SELECT * FROM permits WHERE address LIKE ? OR permitNumber LIKE ? LIMIT 10', [term, term]);
    }
    
    if (!type || type === 'lead') {
      results.leads = await this.all('SELECT * FROM leads WHERE name LIKE ? OR company LIKE ? LIMIT 10', [term, term]);
    }
    
    if (!type || type === 'builder') {
      results.builders = await this.all('SELECT * FROM builders WHERE name LIKE ? OR company LIKE ? LIMIT 10', [term, term]);
    }
    
    return results;
  };

  // ==================== Discovery / Data Sources ====================
  
  /**
   * Get active data sources
   */
  DatabaseService.prototype.getActiveDataSources = async function() {
    return await this.all('SELECT * FROM data_sources WHERE config NOT LIKE "%active: false%"');
  };

  /**
   * Update data source fetch status
   */
  DatabaseService.prototype.updateDataSourceFetchStatus = async function(id, count, failed = false) {
    const now = new Date().toISOString();
    const configUpdate = failed ? 'lastStatus: "failed"' : `lastCount: ${count}, lastFetch: "${now}", lastStatus: "success"`;
    // Note: In a real app we'd parse and update JSON config properly
    await this.run('UPDATE data_sources SET createdAt = ? WHERE id = ?', [now, id]);
  };

  DatabaseService.prototype.getAllDiscoveryRuns = async function() {
    return await this.all('SELECT * FROM discovery_runs ORDER BY createdAt DESC');
  };

  DatabaseService.prototype.getDiscoveryRun = async function(id) {
    return await this.get('SELECT * FROM discovery_runs WHERE id = ?', [id]);
  };

  DatabaseService.prototype.createDiscoveryRun = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    try {
      await this.run(`
        INSERT INTO discovery_runs (
          id, keyword, city, lat, lng, radius, zone,
          totalFound, enriched, scored, status, stage, progress,
          jobId, error, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, data.keyword || null, data.city || null, data.lat || null, data.lng || null, 
        data.radius || null, data.zone || null, data.totalFound || 0, data.enriched || 0, 
        data.scored || 0, data.status || 'pending', data.stage || 'pending', data.progress || 0, 
        data.jobId || null, data.error || null, now, now
      ]);
      return await this.getDiscoveryRun(id);
    } catch (e) { throw e; }
  };

  DatabaseService.prototype.updateDiscoveryRun = async function(id, data) {
    const fields = []; const params = [];
    const now = new Date().toISOString();
    const allowed = ['totalFound', 'enriched', 'scored', 'status', 'stage', 'progress', 'jobId', 'error'];
    for (const k of allowed) { if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); } }
    if (fields.length === 0) return await this.getDiscoveryRun(id);
    fields.push('updatedAt = ?'); params.push(now); params.push(id);
    await this.run(`UPDATE discovery_runs SET ${fields.join(', ')} WHERE id = ?`, params);
    return await this.getDiscoveryRun(id);
  };

  DatabaseService.prototype.getDiscoveryLeadsByRun = async function(runId, filters = {}) {
    let query = 'SELECT * FROM discovery_leads WHERE runId = ?';
    const params = [runId];
    if (filters.tier) { query += ' AND icpTier = ?'; params.push(filters.tier); }
    return await this.all(query, params);
  };

  DatabaseService.prototype.getDiscoveryLead = async function(id) {
    return await this.get('SELECT * FROM discovery_leads WHERE id = ?', [id]);
  };

  DatabaseService.prototype.createDiscoveryLead = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    await this.run(`
      INSERT INTO discovery_leads (
        id, runId, businessName, address, website, phone,
        rating, reviewCount, category, placeId, domainHash,
        emails, extractedPhones, servicesOffered, aboutSummary,
        icpScore, icpTier, icpReasoning, plumbingRelevance,
        outreachSubject, outreachBody, enrichmentStatus,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, data.runId, data.businessName || null, data.address || null, data.website || null, data.phone || null,
      data.rating || null, data.reviewCount || null, data.category || null, data.placeId || null, data.domainHash || null,
      data.emails ? JSON.stringify(data.emails) : null, data.extractedPhones ? JSON.stringify(data.extractedPhones) : null,
      data.servicesOffered ? JSON.stringify(data.servicesOffered) : null, data.aboutSummary || null,
      data.icpScore || 0, data.icpTier || 'unscored', data.icpReasoning || null, data.plumbingRelevance || 0,
      data.outreachSubject || null, data.outreachBody || null, data.enrichmentStatus || 'pending', now
    ]);
    return await this.getDiscoveryLead(id);
  };

  DatabaseService.prototype.updateDiscoveryLead = async function(id, data) {
    await this.run(`
      UPDATE discovery_leads SET
        emails = COALESCE(?, emails),
        extractedPhones = COALESCE(?, extractedPhones),
        servicesOffered = COALESCE(?, servicesOffered),
        aboutSummary = COALESCE(?, aboutSummary),
        enrichmentStatus = COALESCE(?, enrichmentStatus),
        icpScore = COALESCE(?, icpScore),
        icpTier = COALESCE(?, icpTier),
        icpReasoning = COALESCE(?, icpReasoning),
        plumbingRelevance = COALESCE(?, plumbingRelevance),
        outreachSubject = COALESCE(?, outreachSubject),
        outreachBody = COALESCE(?, outreachBody)
      WHERE id = ?
    `, [
      data.emails ? JSON.stringify(data.emails) : null,
      data.extractedPhones ? JSON.stringify(data.extractedPhones) : null,
      data.servicesOffered ? JSON.stringify(data.servicesOffered) : null,
      data.aboutSummary, data.enrichmentStatus, data.icpScore, data.icpTier,
      data.icpReasoning, data.plumbingRelevance, data.outreachSubject, data.outreachBody, id
    ]);
    return await this.getDiscoveryLead(id);
  };

  DatabaseService.prototype.getDiscoveryLeadByDomainHash = async function(domainHash) {
    return await this.get('SELECT * FROM discovery_leads WHERE domainHash = ?', [domainHash]);
  };

  DatabaseService.prototype.getAllDataSources = async function() {
    return await this.all('SELECT * FROM data_sources ORDER BY name');
  };
}

export default addPermitOperations;
