import { BaseAdapter } from './base.js';

/**
 * Arlington adapter (TEMPLATE - Not yet implemented)
 *
 * TODO: Implement when Arlington API details are available
 * This is a placeholder for future implementation.
 */
export class ArlingtonAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    this.logger.warn('[arlington] Adapter not yet implemented');
  }

  async fetchRawPermits(daysBack = 7) {
    this.logger.warn('[arlington] Fetch not implemented, returning empty array');
    return [];
  }

  normalizeRecord(raw) {
    // TODO: Implement normalization for Arlington data
    return {
      sourcePermitId: raw.id || raw.permit_number,
      permitNumber: raw.permit_number,
      issuedDate: this.parseDate(raw.issue_date || raw.issued_date),
      permitType: raw.permit_type,
      description: raw.description,
      address: raw.address,
      city: 'Arlington',
      zipCode: raw.zip_code || raw.zip,
      county: 'Tarrant',
      contractorName: raw.contractor_name,
      estimatedCost: this.parseNumber(raw.estimated_cost || raw.value),
      latitude: this.parseNumber(raw.latitude || raw.lat),
      longitude: this.parseNumber(raw.longitude || raw.lng),
    };
  }
}
