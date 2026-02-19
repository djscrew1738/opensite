const axios = require('axios');
const BaseAdapter = require('./base');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Tarrant County Permit Adapter
 *
 * NOTE: Tarrant County's open data availability varies.
 * This adapter is structured as a Socrata adapter but may need
 * adjustment once the actual dataset ID and field names are confirmed.
 *
 * To activate:
 *   1. Find the dataset at https://data.tarrantcounty.com or county GIS portal
 *   2. Update the dataset_id in the data_sources table
 *   3. Update the field_mapping in data_sources to match actual fields
 *   4. Set is_active = TRUE
 *
 * Alternative approach: Some county data is accessible via the
 * Tarrant Appraisal District (TAD) property records or the
 * county clerk's office records.
 */
class TarrantCountyAdapter extends BaseAdapter {
  constructor(source) {
    super(source);
    // Will be configured once dataset is identified
    this.apiUrl = source.dataset_id
      ? `${source.api_base_url}/${source.dataset_id}.json`
      : null;
  }

  async fetchRawPermits(daysBack = 7) {
    if (!this.apiUrl) {
      logger.warn('[tarrant_county] No dataset_id configured. Skipping.');
      return [];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];

    const allResults = [];
    let offset = 0;
    const limit = 1000;

    // Adjust the $where clause based on actual field names
    // Common Socrata field patterns for county data:
    //   - permit_date, issue_date, date_issued
    //   - permit_type, type, category
    //   - status, permit_status
    const dateField = this.fieldMapping.issued_date || 'issue_date';
    const statusField = this.fieldMapping.status || 'status';

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
        const response = await axios.get(this.apiUrl, {
          params,
          timeout: 30000,
        });

        const data = response.data;
        if (!data || data.length === 0) break;

        allResults.push(...data);
        if (data.length < limit) break;
        offset += limit;
        await new Promise(r => setTimeout(r, 300));

      } catch (err) {
        if (err.response?.status === 404) {
          logger.warn('[tarrant_county] Dataset not found. Check dataset_id configuration.');
          break;
        }
        logger.error(`[tarrant_county] API error: ${err.message}`);
        break;
      }
    }

    return allResults;
  }

  normalizeRecord(raw) {
    // Use field mapping from data_sources table
    // This allows updating field mappings in DB without code changes
    return {
      source_permit_id: this.getMappedField(raw, 'permit_number') || raw.id,
      permit_number: this.getMappedField(raw, 'permit_number'),
      issued_date: this.parseDate(this.getMappedField(raw, 'issued_date')),
      applied_date: this.parseDate(this.getMappedField(raw, 'applied_date')),
      expiry_date: null,
      permit_type: this.getMappedField(raw, 'permit_type'),
      description: this.getMappedField(raw, 'description'),
      address: this.getMappedField(raw, 'address'),
      city: this.getMappedField(raw, 'city'),
      zip_code: this.getMappedField(raw, 'zip_code'),
      county: 'Tarrant',
      contractor_name: this.getMappedField(raw, 'contractor_name'),
      contractor_license: this.getMappedField(raw, 'contractor_license'),
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

module.exports = TarrantCountyAdapter;
