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
    
    query += ' ORDER BY issuedDate DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    return await this.all(query, params);
  };

  // Get single permit
  DatabaseService.prototype.getPermit = async function(id) {
    return await this.get('SELECT * FROM permits WHERE id = ?', [id]);
  };

  // Create permit
  DatabaseService.prototype.createPermit = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
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
  };

  // Update permit
  DatabaseService.prototype.updatePermit = async function(id, data) {
    const now = new Date().toISOString();
    
    await this.run(`
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
    `, [
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
    ]);
    
    return await this.getPermit(id);
  };

  // ==================== Discovery Run Operations ====================
  
  // Get all discovery runs
  DatabaseService.prototype.getAllDiscoveryRuns = async function() {
    return await this.all('SELECT * FROM discovery_runs ORDER BY createdAt DESC');
  };

  // Get discovery run by ID
  DatabaseService.prototype.getDiscoveryRun = async function(id) {
    return await this.get('SELECT * FROM discovery_runs WHERE id = ?', [id]);
  };

  // Create discovery run
  DatabaseService.prototype.createDiscoveryRun = async function(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await this.run(`
      INSERT INTO discovery_runs (
        id, keyword, city, lat, lng, radius, zone,
        totalFound, enriched, scored, status, stage, progress,
        jobId, error, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);
    
    return await this.getDiscoveryRun(id);
  };

  // Update discovery run
  DatabaseService.prototype.updateDiscoveryRun = async function(id, data) {
    const now = new Date().toISOString();
    
    await this.run(`
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
    `, [
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
    ]);
    
    return await this.getDiscoveryRun(id);
  };

  // Get discovery leads by run
  DatabaseService.prototype.getDiscoveryLeadsByRun = async function(runId, filters = {}) {
    let query = 'SELECT * FROM discovery_leads WHERE runId = ?';
    const params = [runId];
    
    if (filters.tier) {
      query += ' AND icpTier = ?';
      params.push(filters.tier);
    }
    
    return await this.all(query, params);
  };

  // Get discovery lead
  DatabaseService.prototype.getDiscoveryLead = async function(id) {
    return await this.get('SELECT * FROM discovery_leads WHERE id = ?', [id]);
  };

  // Create discovery lead
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
    ]);
    
    return await this.getDiscoveryLead(id);
  };

  // Update discovery lead
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
      data.aboutSummary,
      data.enrichmentStatus,
      data.icpScore,
      data.icpTier,
      data.icpReasoning,
      data.plumbingRelevance,
      data.outreachSubject,
      data.outreachBody,
      id
    ]);
    
    return await this.getDiscoveryLead(id);
  };

  // Get discovery lead by domain hash
  DatabaseService.prototype.getDiscoveryLeadByDomainHash = async function(domainHash) {
    return await this.get('SELECT * FROM discovery_leads WHERE domainHash = ?', [domainHash]);
  };

  // Get all data sources
  DatabaseService.prototype.getAllDataSources = async function() {
    return await this.all('SELECT * FROM data_sources ORDER BY name');
  };
}

export default addPermitOperations;
