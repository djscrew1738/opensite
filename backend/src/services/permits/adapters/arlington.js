import axios from 'axios';
import { BaseAdapter } from './base.js';

/**
 * Arlington, TX Building Permits Adapter
 * Uses Arlington OpenData portal (Socrata-based)
 *
 * Arlington is a major DFW city with significant construction activity
 * Focus on new residential and commercial construction
 */

const PERMIT_TYPE_MAP = {
  'New Residential': { priority: 1, jobType: 'new_construction', label: 'Res New' },
  'New Commercial': { priority: 1, jobType: 'new_construction', label: 'Com New' },
  'New Building': { priority: 1, jobType: 'new_construction', label: 'New Build' },
  'Residential Addition': { priority: 3, jobType: 'remodel', label: 'Res Add' },
  'Commercial Addition': { priority: 3, jobType: 'remodel', label: 'Com Add' },
  'Residential Remodel': { priority: 4, jobType: 'remodel', label: 'Res Remodel' },
  'Commercial Remodel': { priority: 4, jobType: 'remodel', label: 'Com Remodel' },
  'Plumbing': { priority: 5, jobType: 'plumbing', label: 'Plumbing' },
  'Irrigation': { priority: 6, jobType: 'plumbing', label: 'Irrigation' },
  'Pool': { priority: 5, jobType: 'plumbing', label: 'Pool' },
};

export class ArlingtonAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    // Arlington OpenData endpoint
    this.apiUrl = source.apiBaseUrl
      ? `${source.apiBaseUrl}/${source.datasetId || 'yama-qmmy'}.json`
      : 'https://data.arlingtontx.gov/resource/yama-qmmy.json';
  }

  async fetchRawPermits(daysBack = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];

    const allResults = [];
    let offset = 0;
    const limit = 1000;

    // Priority permit types for plumbing business
    const priorityTypes = [
      'New Residential',
      'New Commercial',
      'New Building',
      'Residential Addition',
      'Commercial Addition',
      'Residential Remodel',
      'Commercial Remodel',
      'Plumbing',
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

        for (const record of data) {
          record._dataset = 'arlington';
        }

        allResults.push(...data);
        this.logger.debug(`[arlington] Batch: ${data.length} records (offset ${offset})`);

        if (data.length < limit) break;
        offset += limit;

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        if (err.response?.status === 429) {
          this.logger.warn('[arlington] Rate limited, waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        this.logger.error(`[arlington] API error at offset ${offset}: ${err.message}`);
        break;
      }
    }

    this.logger.info(`[arlington] Fetched ${allResults.length} permits`);
    return allResults;
  }

  normalizeRecord(raw) {
    const permitType = raw.permit_type || raw.type || '';
    const description = raw.description || raw.job_description || raw.project_description || '';

    // Map permit type
    let typeConfig = null;
    for (const [key, config] of Object.entries(PERMIT_TYPE_MAP)) {
      if (permitType.toLowerCase().includes(key.toLowerCase())) {
        typeConfig = config;
        break;
      }
    }

    const record = {
      sourcePermitId: raw.permit_number || raw.permit_id || raw.id,
      permitNumber: raw.permit_number || raw.permit_id,
      issuedDate: this.parseDate(raw.issued_date || raw.issue_date),
      appliedDate: this.parseDate(raw.applied_date || raw.application_date),
      expiryDate: this.parseDate(raw.expiration_date),
      permitType,
      description,
      address: this.buildAddress(raw),
      city: 'Arlington',
      zipCode: raw.zip_code || raw.zip || null,
      county: 'Tarrant',
      contractorName: raw.contractor_name || raw.contractor || raw.applicant_name || null,
      contractorLicense: raw.contractor_license || raw.license_number || null,
      applicantName: raw.applicant_name || null,
      ownerName: raw.owner_name || raw.property_owner || null,
      estimatedCost: this.parseNumber(raw.estimated_cost || raw.valuation || raw.job_value),
      squareFootage: this.parseNumber(raw.square_footage || raw.square_feet),
      stories: this.parseNumber(raw.stories || raw.number_of_stories),
      units: this.extractUnits(description) || this.parseNumber(raw.units || raw.number_of_units),
      workType: raw.work_type || raw.type_of_work || null,
      occupancyType: this.detectOccupancyType(permitType, description, raw.work_type),
      latitude: this.parseNumber(raw.latitude),
      longitude: this.parseNumber(raw.longitude),
    };

    // AI classification
    const classification = {
      source: 'arlington_opendata',
    };

    if (typeConfig) {
      classification.permitPriority = typeConfig.priority;
      classification.jobType = typeConfig.jobType;
      classification.typeLabel = typeConfig.label;
    }

    // Flag high-value leads
    const flags = [];
    if (record.estimatedCost && record.estimatedCost >= 300000) flags.push('high_value');
    if (record.units && record.units >= 2) flags.push('multi_family');
    if (!record.contractorName) flags.push('no_contractor');

    if (flags.length > 0) {
      classification.flags = flags;
    }

    record.aiClassification = classification;

    return record;
  }

  buildAddress(raw) {
    if (raw.full_address) return raw.full_address.trim();
    if (raw.address) return raw.address.trim();

    const parts = [
      raw.street_number,
      raw.street_direction,
      raw.street_name,
      raw.street_type,
      raw.unit ? `Unit ${raw.unit}` : null,
    ].filter(Boolean);

    return parts.join(' ').trim() || null;
  }
}
