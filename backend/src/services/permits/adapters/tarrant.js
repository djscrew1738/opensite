import { BaseAdapter } from './base.js';

/**
 * Tarrant County adapter (TEMPLATE - Not yet implemented)
 *
 * TODO: Implement when Tarrant County API details are available
 * This is a placeholder for future implementation.
 */
export class TarrantCountyAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    this.logger.warn('[tarrant_county] Adapter not yet implemented');
  }

  async fetchRawPermits(daysBack = 7) {
    this.logger.warn('[tarrant_county] Fetch not implemented, returning empty array');
    return [];
  }

  normalizeRecord(raw) {
    // TODO: Implement normalization for Tarrant County data
    return {
      sourcePermitId: raw.id || raw.permit_number,
      permitNumber: raw.permit_number,
      issuedDate: this.parseDate(raw.issue_date || raw.issued_date),
      permitType: raw.permit_type,
      description: raw.description,
      address: raw.address,
      city: raw.city,
      zipCode: raw.zip_code || raw.zip,
      county: 'Tarrant',
      contractorName: raw.contractor_name,
      estimatedCost: this.parseNumber(raw.estimated_cost || raw.value),
      latitude: this.parseNumber(raw.latitude || raw.lat),
      longitude: this.parseNumber(raw.longitude || raw.lng),
    };
  }
}
