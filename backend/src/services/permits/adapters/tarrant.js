import axios from 'axios';
import { BaseAdapter } from './base.js';
import * as cheerio from 'cheerio';

/**
 * Tarrant County Permit Adapter
 * 
 * Fetches permits from Tarrant County's unincorporated areas and smaller municipalities.
 * Note: Major cities in Tarrant County (Fort Worth, Arlington) have their own adapters.
 * 
 * Data Sources:
 * 1. Tarrant County Public Improvement Districts (PIDs)
 * 2. Unincorporated Tarrant County permits
 * 
 * Website: https://www.tarrantcounty.com/en/constituent-services/online-services.html
 */
export class TarrantCountyAdapter extends BaseAdapter {
  constructor(source, logger) {
    super(source, logger);
    this.baseUrl = source.apiBaseUrl || 'https://www.tarrantcounty.com';
    this.searchUrl = `${this.baseUrl}/en/constituent-services/online-services/online-permits.html`;
  }

  /**
   * Fetch permits from Tarrant County
   * Note: Tarrant County doesn't have a public API, so we return an empty array
   * with instructions on manual data sources.
   */
  async fetchRawPermits(daysBack = 7) {
    this.logger.info(`[tarrant_county] Checking for available permit data sources...`);
    
    const permits = [];
    
    // Try to fetch from Tarrant County's open data if available
    const socrataPermits = await this.fetchSocrataData(daysBack);
    if (socrataPermits.length > 0) {
      permits.push(...socrataPermits);
    }
    
    // Note: Tarrant County proper doesn't have a comprehensive public permit API
    // The major cities (Fort Worth, Arlington) have their own adapters
    this.logger.info(`[tarrant_county] Found ${permits.length} permits from county sources`);
    
    if (permits.length === 0) {
      this.logger.info(`[tarrant_county] Note: Major Tarrant County cities use separate adapters (Fort Worth, Arlington)`);
    }
    
    return permits;
  }

  /**
   * Try to fetch from Socrata open data portal
   * Tarrant County may publish some permit data here
   */
  async fetchSocrataData(daysBack) {
    const results = [];
    
    // Tarrant County's Socrata domain (if they have one)
    // Currently no known comprehensive permit dataset
    const possibleDatasets = [
      // Add dataset IDs here if discovered
      // { domain: 'data.tarrantcounty.com', datasetId: 'xxxx-xxxx' }
    ];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];
    
    for (const dataset of possibleDatasets) {
      try {
        const url = `https://${dataset.domain}/resource/${dataset.datasetId}.json`;
        const params = {
          '$where': `date_issued >= '${startStr}'`,
          '$limit': 1000,
        };
        
        const appToken = process.env.SOCRATA_APP_TOKEN;
        if (appToken) {
          params['$$app_token'] = appToken;
        }
        
        const response = await axios.get(url, {
          params,
          timeout: 15000,
          headers: { 'Accept': 'application/json' },
        });
        
        if (response.data && Array.isArray(response.data)) {
          results.push(...response.data.map(r => ({ ...r, _source: 'socrata' })));
          this.logger.info(`[tarrant_county] Socrata dataset ${dataset.datasetId}: ${response.data.length} records`);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          this.logger.warn(`[tarrant_county] Socrata fetch failed: ${err.message}`);
        }
      }
    }
    
    return results;
  }

  /**
   * Normalize a raw permit record to standard schema
   */
  normalizeRecord(raw) {
    const record = {
      sourcePermitId: raw.permit_number || raw.id || raw.permit_id,
      permitNumber: raw.permit_number || raw.permit_id,
      issuedDate: this.parseDate(raw.issued_date || raw.date_issued || raw.issue_date),
      appliedDate: this.parseDate(raw.applied_date || raw.date_applied),
      permitType: raw.permit_type || raw.type || 'Unknown',
      description: raw.description || raw.project_description || raw.work_description || '',
      address: this.buildAddress(raw),
      city: raw.city || this.extractCityFromAddress(raw.address) || 'Tarrant County',
      zipCode: raw.zip_code || raw.zip || null,
      county: 'Tarrant',
      contractorName: raw.contractor_name || raw.contractor || raw.contractor_company || null,
      contractorLicense: raw.contractor_license || raw.license_number || null,
      applicantName: raw.applicant_name || raw.applicant || null,
      ownerName: raw.owner_name || raw.property_owner || null,
      estimatedCost: this.parseNumber(raw.estimated_cost || raw.valuation || raw.project_value),
      squareFootage: this.parseNumber(raw.square_footage || raw.square_feet || raw.sqft),
      latitude: this.parseNumber(raw.latitude || raw.lat),
      longitude: this.parseNumber(raw.longitude || raw.lng || raw.long),
    };

    // Add metadata about source
    record._meta = {
      source: raw._source || 'tarrant_county',
      fetchDate: new Date().toISOString(),
    };

    return record;
  }

  /**
   * Build a clean address from available fields
   */
  buildAddress(raw) {
    if (raw.address && typeof raw.address === 'string') {
      return raw.address.trim();
    }
    
    // Try to construct from components
    const parts = [
      raw.street_number,
      raw.street_direction,
      raw.street_name,
      raw.street_type,
      raw.unit || raw.suite ? `#${raw.unit || raw.suite}` : null,
    ].filter(Boolean);
    
    if (parts.length > 0) {
      return parts.join(' ').trim();
    }
    
    return raw.property_address || raw.location || null;
  }

  /**
   * Try to extract city from full address string
   */
  extractCityFromAddress(address) {
    if (!address) return null;
    
    // Common Tarrant County cities
    const cities = [
      'Arlington', 'Fort Worth', 'Grand Prairie', 'Mansfield',
      'Keller', 'Hurst', 'Euless', 'Bedford', 'Grapevine',
      'Colleyville', 'Southlake', 'North Richland Hills',
      'Watauga', 'Haltom City', 'Richland Hills', 'Blue Mound',
      'Saginaw', 'Lake Worth', 'River Oaks', 'Sansom Park',
      'Forest Hill', 'Everman', 'Edgecliff Village', 'Westover Hills',
      'Westworth Village', 'White Settlement', 'Benbrook', 'Crowley',
      'Burleson', 'Dalworthington Gardens', 'Pantego'
    ];
    
    const addressLower = address.toLowerCase();
    for (const city of cities) {
      if (addressLower.includes(city.toLowerCase())) {
        return city;
      }
    }
    
    return null;
  }
}

/**
 * Tarrant County Cities Coverage Note:
 * 
 * The following cities in Tarrant County have their own permit systems
 * and are (or should be) covered by separate adapters:
 * 
 * - Fort Worth: ✅ Has dedicated adapter (fortworth.js)
 * - Arlington: ✅ Has dedicated adapter (arlington.js)
 * - Grand Prairie: Partially in Dallas County
 * - Mansfield: Partially in Johnson/Ellis Counties
 * - Keller: May need dedicated adapter
 * - Hurst/Euless/Bedford: HEB area, may need dedicated adapter
 * - Grapevine: Partially in Denton County
 * - Southlake: Partially in Denton County
 * - Colleyville: May need dedicated adapter
 * 
 * This adapter focuses on:
 * - Unincorporated Tarrant County
 * - Smaller municipalities without dedicated adapters
 * - Any county-wide permit aggregation if available
 */

export default TarrantCountyAdapter;
