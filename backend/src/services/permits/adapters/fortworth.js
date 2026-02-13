import axios from 'axios';
import { BaseAdapter } from './base.js';

/**
 * Fort Worth Issued Building Permits adapter
 * API: Socrata (data.fortworthtexas.gov)
 * Dataset: 9c4v-ngai
 *
 * This is the most complete and reliable source.
 * Fields are well-documented and consistently populated.
 */
export class FortWorthAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    this.apiUrl = `${source.apiBaseUrl}/${source.datasetId}.json`;
  }

  async fetchRawPermits(daysBack = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];

    const allResults = [];
    let offset = 0;
    const limit = 1000;

    // Permit types we care about for plumbing leads
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

      // Add app token if configured from environment
      const appToken = process.env.SOCRATA_APP_TOKEN;
      if (appToken) {
        params['$$app_token'] = appToken;
      }

      try {
        const response = await axios.get(this.apiUrl, {
          params,
          timeout: 30000,
          headers: {
            'Accept': 'application/json',
          }
        });

        const data = response.data;
        if (!data || data.length === 0) break;

        allResults.push(...data);
        this.logger.debug(`[fort_worth] Fetched batch: ${data.length} records (offset ${offset})`);

        if (data.length < limit) break;
        offset += limit;

        // Rate limit politeness
        await new Promise(r => setTimeout(r, 300));

      } catch (err) {
        if (err.response?.status === 429) {
          this.logger.warn('[fort_worth] Rate limited, waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        this.logger.error(`[fort_worth] API error at offset ${offset}: ${err.message}`);
        break;
      }
    }

    return allResults;
  }

  normalizeRecord(raw) {
    const description = raw.description || '';

    return {
      sourcePermitId: raw.permit_number || raw.id,
      permitNumber: raw.permit_number,
      issuedDate: this.parseDate(raw.issued_date),
      appliedDate: this.parseDate(raw.applied_date),
      expiryDate: this.parseDate(raw.expiry_date),
      permitType: raw.permit_type_mapped || raw.permit_type,
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
      occupancyType: this.detectOccupancyType(
        raw.permit_type_mapped, description, raw.work_type
      ),
      latitude: this.parseNumber(raw.latitude),
      longitude: this.parseNumber(raw.longitude),
    };
  }

  /**
   * Build a clean address from available fields
   */
  buildAddress(raw) {
    const parts = [
      raw.address,
      raw.street_number,
      raw.street_direction,
      raw.street_name,
      raw.street_type,
      raw.suite_number ? `#${raw.suite_number}` : null,
    ].filter(Boolean);

    // If 'address' field exists and has data, prefer it
    if (raw.address && raw.address.trim()) {
      return raw.address.trim();
    }

    // Otherwise build from components
    return parts.join(' ').trim() || null;
  }
}
