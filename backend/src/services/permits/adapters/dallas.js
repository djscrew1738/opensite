import axios from 'axios';
import { BaseAdapter } from './base.js';

/**
 * Dallas Building Permits Adapter
 * Uses Dallas OpenData Socrata endpoints for permit data
 * Primary dataset: building-permits (construction permits)
 * Secondary: plumbing-permits (if available)
 *
 * API Docs: https://dev.socrata.com/foundry/www.dallasopendata.com
 */

const PERMIT_TYPE_MAP = {
  // New construction
  'New Building': { priority: 1, jobType: 'new_construction', label: 'New Build' },
  'New Commercial': { priority: 1, jobType: 'new_construction', label: 'Com New' },
  'New Residential': { priority: 1, jobType: 'new_construction', label: 'Res New' },
  'Foundation': { priority: 2, jobType: 'new_construction', label: 'Foundation' },

  // Additions/Remodels
  'Addition': { priority: 3, jobType: 'remodel', label: 'Addition' },
  'Remodel': { priority: 3, jobType: 'remodel', label: 'Remodel' },
  'Alteration': { priority: 4, jobType: 'remodel', label: 'Alteration' },
  'Renovation': { priority: 4, jobType: 'remodel', label: 'Renovation' },

  // Plumbing specific
  'Plumbing': { priority: 5, jobType: 'plumbing', label: 'Plumbing' },
  'Plumbing New': { priority: 5, jobType: 'plumbing', label: 'Plumb New' },
  'Plumbing Repair': { priority: 6, jobType: 'service_repair', label: 'Plumb Repair' },
  'Water Heater': { priority: 6, jobType: 'service_repair', label: 'Water Heater' },
  'Gas': { priority: 7, jobType: 'service_repair', label: 'Gas' },

  // Other
  'Electrical': { priority: 8, jobType: 'other', label: 'Electrical' },
  'HVAC': { priority: 8, jobType: 'mechanical', label: 'HVAC' },
  'Mechanical': { priority: 8, jobType: 'mechanical', label: 'Mechanical' },
  'Roof': { priority: 9, jobType: 'other', label: 'Roof' },
  'Fence': { priority: 9, jobType: 'other', label: 'Fence' },
  'Pool': { priority: 5, jobType: 'plumbing', label: 'Pool' },
};

export class DallasAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    // Dallas OpenData Socrata endpoint
    this.apiUrl = 'https://www.dallasopendata.com/resource/s4yx-4c7t.json';
  }

  async fetchRawPermits(daysBack = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];

    const allResults = [];
    let offset = 0;
    const limit = 1000;

    // High-value permit types for plumbing business
    const priorityTypes = [
      'New Building',
      'New Commercial',
      'New Residential',
      'Foundation',
      'Addition',
      'Remodel',
      'Alteration',
      'Renovation',
      'Plumbing',
      'Plumbing New',
      'Pool',
    ];

    const typeFilter = priorityTypes.map(t => `permit_type LIKE '%${t}%'`).join(' OR ');

    while (true) {
      const params = {
        '$where': `issued_date >= '${startStr}' AND (${typeFilter})`,
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

        // Tag records with source
        for (const record of data) {
          record._dataset = 'dallas';
        }

        allResults.push(...data);
        this.logger.debug(`[dallas] Batch: ${data.length} records (offset ${offset})`);

        if (data.length < limit) break;
        offset += limit;

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        if (err.response?.status === 429) {
          this.logger.warn('[dallas] Rate limited, waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        this.logger.error(`[dallas] API error at offset ${offset}: ${err.message}`);
        break;
      }
    }

    this.logger.info(`[dallas] Fetched ${allResults.length} permits`);
    return allResults;
  }

  normalizeRecord(raw) {
    const permitType = raw.permit_type || '';
    const description = raw.description || raw.job_description || raw.project_name || '';

    // Map permit type to our categories
    let typeConfig = null;
    for (const [key, config] of Object.entries(PERMIT_TYPE_MAP)) {
      if (permitType.toLowerCase().includes(key.toLowerCase())) {
        typeConfig = config;
        break;
      }
    }

    // Extract contractor info - Dallas format varies
    const contractorName = raw.contractor_name || raw.contractor || raw.applicant_name || null;
    const contractorLicense = raw.contractor_license || raw.license_number || null;

    // Parse address components
    const address = this.buildAddress(raw);

    // Extract valuation/cost
    const estimatedCost = this.parseNumber(raw.estimated_cost || raw.valuation || raw.job_cost);

    // Extract square footage
    const squareFootage = this.parseNumber(raw.square_footage || raw.square_feet || raw.sqft);

    // Parse dates
    const issuedDate = this.parseDate(raw.issued_date || raw.issue_date);
    const appliedDate = this.parseDate(raw.applied_date || raw.application_date);

    const record = {
      sourcePermitId: raw.permit_number || raw.permit_id || raw.id,
      permitNumber: raw.permit_number || raw.permit_id,
      issuedDate,
      appliedDate,
      expiryDate: null,
      permitType,
      description,
      address,
      city: 'Dallas',
      zipCode: raw.zip_code || raw.zip || null,
      county: 'Dallas',
      contractorName,
      contractorLicense,
      applicantName: raw.applicant_name || null,
      ownerName: raw.owner_name || raw.property_owner || null,
      estimatedCost,
      squareFootage,
      stories: this.parseNumber(raw.stories || raw.number_of_stories),
      units: this.extractUnits(description) || this.parseNumber(raw.units || raw.number_of_units),
      workType: raw.work_type || raw.type_of_work || null,
      occupancyType: this.detectOccupancyType(permitType, description, raw.work_type),
      latitude: this.parseNumber(raw.latitude || raw.y_coord),
      longitude: this.parseNumber(raw.longitude || raw.x_coord),
    };

    // Add AI classification
    const classification = {
      source: 'dallas_opendata',
    };

    if (typeConfig) {
      classification.permitPriority = typeConfig.priority;
      classification.jobType = typeConfig.jobType;
      classification.typeLabel = typeConfig.label;
    }

    // Flag high-value indicators
    const flags = [];
    if (estimatedCost && estimatedCost >= 500000) flags.push('high_value');
    if (record.units && record.units >= 4) flags.push('multi_family');
    if (!contractorName) flags.push('no_contractor');

    if (flags.length > 0) {
      classification.flags = flags;
    }

    record.aiClassification = classification;

    return record;
  }

  buildAddress(raw) {
    // Dallas has various address formats
    if (raw.full_address) return raw.full_address.trim();
    if (raw.address) return raw.address.trim();

    const parts = [
      raw.street_number,
      raw.street_prefix,
      raw.street_name,
      raw.street_suffix,
      raw.suite ? `Suite ${raw.suite}` : null,
    ].filter(Boolean);

    return parts.join(' ').trim() || null;
  }
}
