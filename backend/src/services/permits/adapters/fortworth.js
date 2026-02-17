import axios from 'axios';
import { BaseAdapter } from './base.js';

/**
 * Fort Worth permit type priority map (from Accela dropdown values)
 * Used for scoring and classification across both datasets
 */
export const PERMIT_TYPES = {
  // ---- HIGH PRIORITY (new construction) ----
  'Residential New Building Permit':        { priority: 1, jobType: 'new_construction', label: 'Res New Build' },
  'Commercial New Building Permit':         { priority: 1, jobType: 'new_construction', label: 'Com New Build' },
  'Commercial New Accessory Structure':     { priority: 2, jobType: 'new_construction', label: 'Com New Acc' },
  'Residential Accessory New Permit':       { priority: 2, jobType: 'new_construction', label: 'Res New Acc' },

  // ---- MEDIUM PRIORITY (additions / remodels) ----
  'Residential Addition Permit':            { priority: 3, jobType: 'remodel', label: 'Res Addition' },
  'Commercial Addition Building Permit':    { priority: 3, jobType: 'remodel', label: 'Com Addition' },
  'Commercial Addition Accessory Structure':{ priority: 4, jobType: 'remodel', label: 'Com Add Acc' },
  'Residential Accessory Addition Permit':  { priority: 4, jobType: 'remodel', label: 'Res Add Acc' },
  'Residential Remodel Construction Permit':{ priority: 5, jobType: 'remodel', label: 'Res Remodel' },
  'Commercial Remodel Building Permit':     { priority: 5, jobType: 'remodel', label: 'Com Remodel' },
  'Commercial Remodel Accessory Structure': { priority: 6, jobType: 'remodel', label: 'Com Rem Acc' },
  'Residential Accessory Remodel Permit':   { priority: 6, jobType: 'remodel', label: 'Res Rem Acc' },

  // ---- PLUMBING SPECIFIC ----
  'Plumbing Standalone Permit':             { priority: 7, jobType: 'service_repair', label: 'Plumbing' },
  'Plumbing Umbrella Permit':               { priority: 7, jobType: 'service_repair', label: 'Plumb Umbrella' },
  'Plumbing Backflow Standalone Permit':    { priority: 8, jobType: 'service_repair', label: 'Backflow' },
  'Plumbing Temporary Gas':                 { priority: 8, jobType: 'service_repair', label: 'Temp Gas' },

  // ---- Legacy types from dataset 9c4v-ngai ----
  'Building Permit - New':                  { priority: 1, jobType: 'new_construction', label: 'Building New' },
  'Building Permit - Addition/Alteration':  { priority: 3, jobType: 'remodel', label: 'Building Add/Alt' },
  'Plumbing Permit':                        { priority: 7, jobType: 'service_repair', label: 'Plumbing' },
  'Plumbing Permit - New':                  { priority: 7, jobType: 'service_repair', label: 'Plumbing New' },
  'Mechanical Permit':                      { priority: 9, jobType: 'mechanical', label: 'Mechanical' },
  'Combo Permit':                           { priority: 5, jobType: 'remodel', label: 'Combo' },
};

/**
 * Fort Worth Issued Building Permits adapter
 * Fetches from two Socrata datasets:
 *   1. 9c4v-ngai — "Issued Building Permits" (primary, well-documented)
 *   2. quz7-xnsy — "Development Permits" (broader coverage, different field names)
 *
 * Deduplication happens via fingerprinting in BaseAdapter.
 */
export class FortWorthAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    this.apiUrl = `${source.apiBaseUrl}/${source.datasetId}.json`;
    this.devDatasetId = 'quz7-xnsy';
    this.devApiUrl = `${source.apiBaseUrl}/${this.devDatasetId}.json`;
  }

  async fetchRawPermits(daysBack = 7) {
    const primaryResults = await this.fetchPrimaryDataset(daysBack);
    const devResults = await this.fetchDevDataset(daysBack);

    this.logger.info(`[fort_worth] Combined: ${primaryResults.length} primary + ${devResults.length} dev permits`);
    return [...primaryResults, ...devResults];
  }

  /**
   * Fetch from primary dataset: 9c4v-ngai (Issued Building Permits)
   */
  async fetchPrimaryDataset(daysBack) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];

    const allResults = [];
    let offset = 0;
    const limit = 1000;

    const permitTypes = [
      'Building Permit - New',
      'Building Permit - Addition/Alteration',
      'Plumbing Permit',
      'Plumbing Permit - New',
      'Mechanical Permit',
      'Combo Permit',
    ];

    const typeFilter = permitTypes.map(t => `'${t}'`).join(', ');

    while (true) {
      const params = {
        '$where': `issued_date >= '${startStr}' AND status = 'Issued' AND permit_type_mapped in (${typeFilter})`,
        '$order': 'issued_date DESC',
        '$limit': limit,
        '$offset': offset,
      };

      const appToken = process.env.SOCRATA_APP_TOKEN;
      if (appToken) {
        params['$$app_token'] = appToken;
      }

      try {
        const response = await axios.get(this.apiUrl, {
          params,
          timeout: 30000,
          headers: { 'Accept': 'application/json' },
        });

        const data = response.data;
        if (!data || data.length === 0) break;

        // Tag records with their source dataset
        for (const record of data) {
          record._dataset = 'primary';
        }

        allResults.push(...data);
        this.logger.debug(`[fort_worth] Primary batch: ${data.length} records (offset ${offset})`);

        if (data.length < limit) break;
        offset += limit;

        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        if (err.response?.status === 429) {
          this.logger.warn('[fort_worth] Rate limited, waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        this.logger.error(`[fort_worth] Primary API error at offset ${offset}: ${err.message}`);
        break;
      }
    }

    return allResults;
  }

  /**
   * Fetch from development dataset: quz7-xnsy (Development Permits)
   * Uses targeted SoQL queries for high-value permit types
   */
  async fetchDevDataset(daysBack) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const dateStr = cutoffDate.toISOString().split('T')[0];

    const queries = [
      {
        label: 'Residential New Builds',
        where: `permit_type='Residential New Building Permit' AND date_issued > '${dateStr}'`,
      },
      {
        label: 'Commercial New Builds',
        where: `permit_type='Commercial New Building Permit' AND date_issued > '${dateStr}'`,
      },
      {
        label: 'Residential Additions',
        where: `permit_type='Residential Addition Permit' AND date_issued > '${dateStr}'`,
      },
      {
        label: 'Plumbing Permits',
        where: `starts_with(permit_type, 'Plumbing') AND date_issued > '${dateStr}'`,
      },
    ];

    const allResults = [];

    for (const q of queries) {
      try {
        this.logger.debug(`[fort_worth] Dev query: ${q.label}`);

        const params = {
          '$where': q.where,
          '$order': 'date_issued DESC',
          '$limit': 500,
        };

        const appToken = process.env.SOCRATA_APP_TOKEN;
        if (appToken) {
          params['$$app_token'] = appToken;
        }

        const response = await axios.get(this.devApiUrl, {
          params,
          timeout: 15000,
          headers: { 'Accept': 'application/json' },
        });

        const data = response.data;
        this.logger.debug(`[fort_worth] Dev ${q.label}: ${data.length} records`);

        // Tag records with their source dataset
        for (const record of data) {
          record._dataset = 'dev';
        }

        allResults.push(...data);
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        this.logger.error(`[fort_worth] Dev query failed (${q.label}): ${err.message}`);
      }
    }

    // Also query for new builds with no plumbing reference (high-value leads)
    try {
      this.logger.debug('[fort_worth] Dev query: New builds missing plumbing contractor');

      const params = {
        '$where': `permit_type='Residential New Building Permit' AND date_issued > '${dateStr}'`,
        '$order': 'date_issued DESC',
        '$limit': 500,
      };

      const appToken = process.env.SOCRATA_APP_TOKEN;
      if (appToken) {
        params['$$app_token'] = appToken;
      }

      const response = await axios.get(this.devApiUrl, {
        params,
        timeout: 15000,
        headers: { 'Accept': 'application/json' },
      });

      const missingPlumber = response.data.filter(r => {
        const allText = JSON.stringify(r).toLowerCase();
        return !allText.includes('plumb');
      });

      this.logger.info(`[fort_worth] Dev: ${missingPlumber.length}/${response.data.length} new builds with no plumbing reference`);

      for (const record of missingPlumber) {
        record._dataset = 'dev';
        record._noPlumber = true;
      }

      allResults.push(...missingPlumber);
    } catch (err) {
      this.logger.error(`[fort_worth] Dev no-plumber query failed: ${err.message}`);
    }

    return allResults;
  }

  normalizeRecord(raw) {
    // Route to correct normalizer based on source dataset
    if (raw._dataset === 'dev') {
      return this.normalizeDevRecord(raw);
    }
    return this.normalizePrimaryRecord(raw);
  }

  /**
   * Normalize records from primary dataset (9c4v-ngai)
   */
  normalizePrimaryRecord(raw) {
    const description = raw.description || '';
    const permitType = raw.permit_type_mapped || raw.permit_type || '';
    const typeConfig = PERMIT_TYPES[permitType];

    const record = {
      sourcePermitId: raw.permit_number || raw.id,
      permitNumber: raw.permit_number,
      issuedDate: this.parseDate(raw.issued_date),
      appliedDate: this.parseDate(raw.applied_date),
      expiryDate: this.parseDate(raw.expiry_date),
      permitType: permitType,
      description: description,
      address: this.buildAddress(raw),
      city: raw.city || 'Fort Worth',
      zipCode: raw.zip_code,
      county: 'Tarrant',
      contractorName: raw.contractor_company_name || raw.contractor_name,
      contractorLicense: raw.contractor_license_number,
      applicantName: raw.applicant_name,
      ownerName: raw.owner_name,
      estimatedCost: this.parseNumber(raw.estimated_cost),
      squareFootage: this.parseNumber(raw.square_footage),
      stories: this.parseNumber(raw.stories),
      units: this.extractUnits(description),
      workType: raw.work_type,
      occupancyType: this.detectOccupancyType(permitType, description, raw.work_type),
      latitude: this.parseNumber(raw.latitude),
      longitude: this.parseNumber(raw.longitude),
    };

    // Add permit type intelligence
    if (typeConfig) {
      record.aiClassification = {
        permitPriority: typeConfig.priority,
        jobType: typeConfig.jobType,
        typeLabel: typeConfig.label,
        source: 'primary_9c4v',
      };
    }

    return record;
  }

  /**
   * Normalize records from dev dataset (quz7-xnsy)
   * Different field names: date_issued, contractor, valuation, etc.
   */
  normalizeDevRecord(raw) {
    const permitType = raw.permit_type || raw.type || '';
    const typeConfig = PERMIT_TYPES[permitType];
    const description = raw.description || raw.project_name || '';

    const address = raw.address ||
      [raw.street_number, raw.street_direction, raw.street_name, raw.street_type]
        .filter(Boolean).join(' ').trim() || null;

    const record = {
      sourcePermitId: raw.permit_number || raw.id,
      permitNumber: raw.permit_number,
      issuedDate: this.parseDate(raw.date_issued),
      appliedDate: this.parseDate(raw.date_applied),
      expiryDate: null,
      permitType: permitType,
      description: description,
      address: address,
      city: 'Fort Worth',
      zipCode: raw.zip_code || raw.zip || null,
      county: 'Tarrant',
      contractorName: raw.contractor || raw.contractor_name || null,
      contractorLicense: raw.contractor_license || null,
      applicantName: raw.applicant_name || null,
      ownerName: raw.owner_name || null,
      estimatedCost: this.parseNumber(raw.valuation || raw.estimated_cost),
      squareFootage: this.parseNumber(raw.square_footage),
      stories: this.parseNumber(raw.stories),
      units: this.extractUnits(description),
      workType: raw.work_type || null,
      occupancyType: this.detectOccupancyType(permitType, description, raw.work_type),
      latitude: this.parseNumber(raw.latitude),
      longitude: this.parseNumber(raw.longitude),
    };

    // Add permit type intelligence + no-plumber flag
    const classification = {
      source: 'dev_quz7',
    };

    if (typeConfig) {
      classification.permitPriority = typeConfig.priority;
      classification.jobType = typeConfig.jobType;
      classification.typeLabel = typeConfig.label;
    }

    if (raw._noPlumber) {
      classification.noPlumberAssigned = true;
      classification.flags = ['no_plumber_assigned'];
      record.description = (record.description ? record.description + ' | ' : '') +
        'No plumbing contractor listed on permit';
    }

    record.aiClassification = classification;

    return record;
  }

  /**
   * Build a clean address from available fields
   */
  buildAddress(raw) {
    if (raw.address && raw.address.trim()) {
      return raw.address.trim();
    }

    const parts = [
      raw.street_number,
      raw.street_direction,
      raw.street_name,
      raw.street_type,
      raw.suite_number ? `#${raw.suite_number}` : null,
    ].filter(Boolean);

    return parts.join(' ').trim() || null;
  }
}
