// Permit Operations Module
// Adds permit and discovery-related operations to DatabaseService

import { v4 as uuidv4 } from 'uuid';

/**
 * Permit operations mixin
 * Adds permit, discovery run, and lead-related methods to DatabaseService
 */
export function addPermitOperations(DatabaseService) {
  // ==================== Permit Operations ====================
  
  // Get all permits with optional filtering
  DatabaseService.prototype.getAllPermits = function(filters = {}) {
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
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    query += ' ORDER BY issuedDate DESC';
    
    return this.db.prepare(query).all(...params);
  };

  // Get single permit
  DatabaseService.prototype.getPermit = function(id) {
    return this.db.prepare('SELECT * FROM permits WHERE id = ?').get(id);
  };

  // Create permit
  DatabaseService.prototype.createPermit = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO permits (
        id, permitNumber, address, city, state, zip, 
        contractor, contractorPhone, estimatedCost, 
        issuedDate, status, description, sourceId, 
        tier, leadScore, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
    );
    
    return this.getPermit(id);
  };

  // Update permit
  DatabaseService.prototype.updatePermit = function(id, data) {
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE permits SET
        permitNumber = COALESCE(?, permitNumber),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        contractor = COALESCE(?, contractor),
        contractorPhone = COALESCE(?, contractorPhone),
        estimatedCost = COALESCE(?, estimatedCost),
        status = COALESCE(?, status),
        tier = COALESCE(?, tier),
        leadScore = COALESCE(?, leadScore),
        updatedAt = ?
      WHERE id = ?
    `).run(
      data.permitNumber,
      data.address,
      data.city,
      data.contractor,
      data.contractorPhone,
      data.estimatedCost,
      data.status,
      data.tier,
      data.leadScore,
      now,
      id
    );
    
    return this.getPermit(id);
  };

  // ==================== Discovery Run Operations ====================
  
  // Get all discovery runs
  DatabaseService.prototype.getAllDiscoveryRuns = function() {
    return this.db.prepare('SELECT * FROM discovery_runs ORDER BY createdAt DESC').all();
  };

  // Get discovery run by ID
  DatabaseService.prototype.getDiscoveryRun = function(id) {
    return this.db.prepare('SELECT * FROM discovery_runs WHERE id = ?').get(id);
  };

  // Create discovery run
  DatabaseService.prototype.createDiscoveryRun = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO discovery_runs (
        id, keyword, city, lat, lng, radius, zone,
        totalFound, enriched, scored, status, stage, progress,
        jobId, error, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.keyword || null,
      data.city || null,
      data.lat || null,
      data.lng || null,
      data.radius || null,
      data.zone || null,
      data.totalFound || 0,
      data.enriched || 0,
      data.scored || 0,
      data.status || 'pending',
      data.stage || 'pending',
      data.progress || 0,
      data.jobId || null,
      data.error || null,
      now,
      now
    );
    
    return this.getDiscoveryRun(id);
  };

  // Update discovery run
  DatabaseService.prototype.updateDiscoveryRun = function(id, data) {
    const now = new Date().toISOString();
    
    this.db.prepare(`
      UPDATE discovery_runs SET
        totalFound = COALESCE(?, totalFound),
        enriched = COALESCE(?, enriched),
        scored = COALESCE(?, scored),
        status = COALESCE(?, status),
        stage = COALESCE(?, stage),
        progress = COALESCE(?, progress),
        jobId = COALESCE(?, jobId),
        error = COALESCE(?, error),
        updatedAt = ?
      WHERE id = ?
    `).run(
      data.totalFound,
      data.enriched,
      data.scored,
      data.status,
      data.stage,
      data.progress,
      data.jobId,
      data.error,
      now,
      id
    );
    
    return this.getDiscoveryRun(id);
  };

  // Get discovery leads by run
  DatabaseService.prototype.getDiscoveryLeadsByRun = function(runId, filters = {}) {
    let query = 'SELECT * FROM discovery_leads WHERE runId = ?';
    const params = [runId];
    
    if (filters.tier) {
      query += ' AND icpTier = ?';
      params.push(filters.tier);
    }
    
    return this.db.prepare(query).all(...params);
  };

  // Get discovery lead
  DatabaseService.prototype.getDiscoveryLead = function(id) {
    return this.db.prepare('SELECT * FROM discovery_leads WHERE id = ?').get(id);
  };

  // Create discovery lead
  DatabaseService.prototype.createDiscoveryLead = function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    this.db.prepare(`
      INSERT INTO discovery_leads (
        id, runId, businessName, address, website, phone,
        rating, reviewCount, category, placeId, domainHash,
        emails, extractedPhones, servicesOffered, aboutSummary,
        icpScore, icpTier, icpReasoning, plumbingRelevance,
        outreachSubject, outreachBody, enrichmentStatus,
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.runId,
      data.businessName || null,
      data.address || null,
      data.website || null,
      data.phone || null,
      data.rating || null,
      data.reviewCount || null,
      data.category || null,
      data.placeId || null,
      data.domainHash || null,
      data.emails ? JSON.stringify(data.emails) : null,
      data.extractedPhones ? JSON.stringify(data.extractedPhones) : null,
      data.servicesOffered ? JSON.stringify(data.servicesOffered) : null,
      data.aboutSummary || null,
      data.icpScore || 0,
      data.icpTier || 'unscored',
      data.icpReasoning || null,
      data.plumbingRelevance || 0,
      data.outreachSubject || null,
      data.outreachBody || null,
      data.enrichmentStatus || 'pending',
      now
    );
    
    return this.getDiscoveryLead(id);
  };

  // Update discovery lead
  DatabaseService.prototype.updateDiscoveryLead = function(id, data) {
    this.db.prepare(`
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
    `).run(
      data.emails ? JSON.stringify(data.emails) : null,
      data.extractedPhones ? JSON.stringify(data.extractedPhones) : null,
      data.servicesOffered ? JSON.stringify(data.servicesOffered) : null,
      data.aboutSummary,
      data.enrichmentStatus,
      data.icpScore,
      data.icpTier,
      data.icpReasoning,
      data.plumbingRelevance,
      data.outreachSubject,
      data.outreachBody,
      id
    );
    
    return this.getDiscoveryLead(id);
  };

  // Get discovery lead by domain hash
  DatabaseService.prototype.getDiscoveryLeadByDomainHash = function(domainHash) {
    return this.db.prepare('SELECT * FROM discovery_leads WHERE domainHash = ?').get(domainHash);
  };

  // Get all data sources
  DatabaseService.prototype.getAllDataSources = function() {
    return this.db.prepare('SELECT * FROM data_sources ORDER BY name').all();
  };
}

export default addPermitOperations;
