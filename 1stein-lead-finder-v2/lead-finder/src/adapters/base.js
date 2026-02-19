const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Base adapter for permit data sources.
 * Each city/county adapter extends this and implements fetchRawPermits() and normalizeRecord().
 */
class BaseAdapter {
  constructor(source) {
    this.source = source;           // data_sources row from DB
    this.sourceId = source.id;
    this.fieldMapping = source.field_mapping || {};
    this.name = source.name;
  }

  /**
   * Override in subclass: fetch raw permit records from the API.
   * Should return an array of raw objects.
   */
  async fetchRawPermits(daysBack = 7) {
    throw new Error('fetchRawPermits() must be implemented by subclass');
  }

  /**
   * Override in subclass: map a raw record to the normalized permit schema.
   * Should return an object matching the permits table columns.
   */
  normalizeRecord(raw) {
    throw new Error('normalizeRecord() must be implemented by subclass');
  }

  /**
   * Run the full fetch → normalize → fingerprint pipeline.
   * Returns array of normalized permit objects ready for DB insert.
   */
  async run(daysBack = 7) {
    logger.info(`[${this.name}] Starting permit fetch (${daysBack} days back)...`);

    const rawRecords = await this.fetchRawPermits(daysBack);
    logger.info(`[${this.name}] Fetched ${rawRecords.length} raw records`);

    const normalized = [];
    for (const raw of rawRecords) {
      try {
        const record = this.normalizeRecord(raw);
        record.source_id = this.sourceId;
        record.raw_data = JSON.stringify(raw);
        record.fingerprint = this.generateFingerprint(record);
        record.permit_category = this.classifyPermitType(record.permit_type, record.description);
        normalized.push(record);
      } catch (err) {
        logger.warn(`[${this.name}] Failed to normalize record: ${err.message}`, {
          raw_id: raw.permit_number || raw.id || 'unknown'
        });
      }
    }

    logger.info(`[${this.name}] Normalized ${normalized.length}/${rawRecords.length} records`);
    return normalized;
  }

  /**
   * Generate a dedup fingerprint from key fields
   */
  generateFingerprint(record) {
    const key = [
      record.permit_number,
      record.address,
      record.issued_date,
      record.permit_type,
    ].join('|').toLowerCase();

    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Classify permit type into our categories for scoring
   */
  classifyPermitType(permitType, description) {
    const type = (permitType || '').toLowerCase();
    const desc = (description || '').toLowerCase();

    // New construction is highest value
    if (type.includes('new') || desc.includes('new construct') || desc.includes('new build')) {
      return 'new_construction';
    }

    // Plumbing specific
    if (type.includes('plumbing') || desc.includes('plumbing')) {
      return 'plumbing';
    }

    // Additions/alterations - medium value
    if (type.includes('addition') || type.includes('alteration') || type.includes('remodel')) {
      return 'addition';
    }

    // Mechanical/HVAC - low value for plumbing
    if (type.includes('mechanical') || type.includes('hvac') || type.includes('electrical')) {
      return 'mechanical';
    }

    return 'other';
  }

  /**
   * Helper: extract a mapped field from raw data
   */
  getMappedField(raw, ourField) {
    const sourceField = this.fieldMapping[ourField];
    if (!sourceField) return null;
    return raw[sourceField] || null;
  }

  /**
   * Helper: parse a date string to YYYY-MM-DD or null
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Helper: parse numeric value
   */
  parseNumber(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(String(val).replace(/[,$]/g, ''));
    return isNaN(num) ? null : num;
  }

  /**
   * Helper: detect unit count from description
   */
  extractUnits(description) {
    if (!description) return null;
    const desc = description.toLowerCase();

    // Look for explicit unit counts
    const unitMatch = desc.match(/(\d+)\s*(?:unit|dwelling|apt|apartment)/i);
    if (unitMatch) return parseInt(unitMatch[1]);

    // Common building types
    if (desc.includes('duplex') || desc.includes('two-family')) return 2;
    if (desc.includes('triplex') || desc.includes('three-family')) return 3;
    if (desc.includes('fourplex') || desc.includes('quadplex') || desc.includes('four-family')) return 4;
    if (desc.includes('townhome') || desc.includes('townhouse')) return 1; // per unit

    return null;
  }

  /**
   * Helper: detect occupancy type from permit fields
   */
  detectOccupancyType(permitType, description, workType) {
    const all = [permitType, description, workType].join(' ').toLowerCase();

    if (all.includes('commercial') || all.includes('office') || all.includes('retail') || all.includes('restaurant')) {
      return 'commercial';
    }
    if (all.includes('mixed')) return 'mixed';
    if (all.includes('residential') || all.includes('single family') || all.includes('duplex') ||
        all.includes('apartment') || all.includes('townhome')) {
      return 'residential';
    }
    return null;
  }
}

module.exports = BaseAdapter;
