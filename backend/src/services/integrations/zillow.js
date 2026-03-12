/**
 * Zillow API Integration
 * Fetches property details for lead enrichment
 */

import axios from 'axios';
import logger from '../logger.js';

const ZILLOW_API_BASE = 'https://api.bridgedataoutput.com/api/v2/zestimates';

class ZillowService {
  constructor() {
    this.apiKey = process.env.ZILLOW_API_KEY;
    this.enabled = !!this.apiKey;
  }

  isAvailable() {
    return this.enabled;
  }

  /**
   * Search for property by address
   * @param {string} address - Street address
   * @param {string} city - City
   * @param {string} state - State (default: TX)
   * @param {string} zip - ZIP code
   */
  async searchProperty(address, city, state = 'TX', zip = null) {
    if (!this.isAvailable()) {
      throw new Error('Zillow API not configured. Set ZILLOW_API_KEY environment variable.');
    }

    try {
      const searchQuery = zip 
        ? `${address}, ${city}, ${state} ${zip}`
        : `${address}, ${city}, ${state}`;

      const response = await axios.get(ZILLOW_API_BASE, {
        params: {
          api_key: this.apiKey,
          address: searchQuery,
          limit: 1
        },
        timeout: 10000
      });

      if (!response.data.bundle || response.data.bundle.length === 0) {
        return null;
      }

      const property = response.data.bundle[0];
      return this.normalizeProperty(property);

    } catch (err) {
      logger.error('[zillow] Property search failed:', err.message);
      throw err;
    }
  }

  /**
   * Normalize Zillow property data
   */
  normalizeProperty(property) {
    return {
      source: 'zillow',
      zpid: property.zpid,
      address: {
        street: property.address?.street,
        city: property.address?.city,
        state: property.address?.state,
        zip: property.address?.zipcode
      },
      yearBuilt: property.yearBuilt,
      lotSize: property.lotSize,
      livingArea: property.livingAreaValue || property.livingArea,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      stories: property.stories,
      zestimate: property.zestimate?.amount,
      lastSoldDate: property.lastSoldDate,
      lastSoldPrice: property.lastSoldPrice,
      taxAssessment: property.taxAssessment,
      propertyType: property.propertyType,
      photos: property.photos || [],
      fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Enrich lead data with Zillow info
   */
  async enrichLead(lead) {
    if (!lead.address) return null;

    try {
      const property = await this.searchProperty(
        lead.address, lead.city, lead.state, lead.zip
      );

      if (!property) return null;

      return {
        ...lead,
        zillowData: property,
        enrichedAt: new Date().toISOString(),
        estimatedValue: property.zestimate,
        propertyAge: property.yearBuilt 
          ? new Date().getFullYear() - property.yearBuilt 
          : null,
        squareFootage: property.livingArea
      };

    } catch (err) {
      logger.error('[zillow] Lead enrichment failed:', err.message);
      return lead;
    }
  }
}

export const zillowService = new ZillowService();
export default ZillowService;
