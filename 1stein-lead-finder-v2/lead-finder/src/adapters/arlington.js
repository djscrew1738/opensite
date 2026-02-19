const axios = require('axios');
const BaseAdapter = require('./base');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * City of Arlington Permit Adapter
 *
 * Arlington uses a Socrata-based open data portal.
 * Activate by finding the building permits dataset and
 * updating data_sources with the correct dataset_id and field_mapping.
 *
 * Known portal: https://data.arlingtontx.gov
 * Look for datasets under "Development Services" or "Building Permits"
 */
class ArlingtonAdapter extends BaseAdapter {
  constructor(source) {
    super(source);
    this.apiUrl = source.dataset_id
      ? `${source.api_base_url}/${source.dataset_id}.json`
      : null;
  }

  async fetchRawPermits(daysBack = 7) {
    if (!this.apiUrl) {
      logger.warn('[arlington] No dataset_id configured. Skipping.');
      return [];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];

    const allResults = [];
    let offset = 0;
    const limit = 1000;

    const dateField = this.fieldMapping.issued_date || 'issued_date';

    while (true) {
      const params = {
        '$where': `${dateField} >= '${startStr}'`,
        '$order': `${dateField} DESC`,
        '$limit': limit,
        '$offset': offset,
      };

      if (config.socrata.appToken) {
        params['$$app_token'] = config.socrata.appToken;
      }

      try {
        const response = await axios.get(this.apiUrl, { params, timeout: 30000 });
        const data = response.data;
        if (!data || data.length === 0) break;

        allResults.push(...data);
        if (data.length < limit) break;
        offset += limit;
        await new Promise(r => setTimeout(r, 300));

      } catch (err) {
        if (err.response?.status === 404) {
          logger.warn('[arlington] Dataset not found. Check dataset_id.');
          break;
        }
        logger.error(`[arlington] API error: ${err.message}`);
        break;
      }
    }

    return allResults;
  }

  normalizeRecord(raw) {
    return {
      source_permit_id: this.getMappedField(raw, 'permit_number') || raw.id,
      permit_number: this.getMappedField(raw, 'permit_number'),
      issued_date: this.parseDate(this.getMappedField(raw, 'issued_date')),
      applied_date: this.parseDate(this.getMappedField(raw, 'applied_date')),
      expiry_date: null,
      permit_type: this.getMappedField(raw, 'permit_type'),
      description: this.getMappedField(raw, 'description'),
      address: this.getMappedField(raw, 'address'),
      city: this.getMappedField(raw, 'city') || 'Arlington',
      zip_code: this.getMappedField(raw, 'zip_code'),
      county: 'Tarrant',
      contractor_name: this.getMappedField(raw, 'contractor_name'),
      contractor_license: null,
      applicant_name: this.getMappedField(raw, 'applicant_name'),
      owner_name: this.getMappedField(raw, 'owner_name'),
      estimated_cost: this.parseNumber(this.getMappedField(raw, 'estimated_cost')),
      square_footage: this.parseNumber(this.getMappedField(raw, 'square_footage')),
      stories: null,
      units: this.extractUnits(this.getMappedField(raw, 'description')),
      work_type: this.getMappedField(raw, 'work_type'),
      occupancy_type: this.detectOccupancyType(
        this.getMappedField(raw, 'permit_type'),
        this.getMappedField(raw, 'description'),
        this.getMappedField(raw, 'work_type')
      ),
      latitude: this.parseNumber(this.getMappedField(raw, 'latitude')),
      longitude: this.parseNumber(this.getMappedField(raw, 'longitude')),
    };
  }
}

module.exports = ArlingtonAdapter;
