// Discovery Providers - Multi-provider lead discovery adapters
// Supports Google Places, SerpAPI, Serper.dev, and scraping fallback

import axios from 'axios';
import logger from '../logger.js';

/**
 * Google Places API adapter
 * Requires: GOOGLE_PLACES_API_KEY env variable
 */
export class GooglePlacesProvider {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.enabled = !!this.apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  isAvailable() {
    return this.enabled && !!this.apiKey;
  }

  async searchPlaces(keyword, city, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Google Places API not configured. Set GOOGLE_PLACES_API_KEY.');
    }

    const url = `${this.baseUrl}/textsearch/json`;
    const params = {
      query: `${keyword} in ${city}`,
      key: this.apiKey,
      type: options.type || undefined
    };

    try {
      const response = await axios.get(url, { params, timeout: 15000 });
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return (response.data.results || []).map(this.normalizePlace);
    } catch (err) {
      logger.error('[providers:google] Search failed:', err.message);
      throw err;
    }
  }

  async getPlaceDetails(placeId) {
    if (!this.isAvailable()) return null;

    const url = `${this.baseUrl}/details/json`;
    const params = {
      place_id: placeId,
      key: this.apiKey,
      fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours'
    };

    try {
      const response = await axios.get(url, { params, timeout: 10000 });
      
      if (response.data.status !== 'OK') {
        return null;
      }

      return this.normalizePlaceDetails(response.data.result);
    } catch (err) {
      logger.error('[providers:google] Place details failed:', err.message);
      return null;
    }
  }

  normalizePlace(place) {
    return {
      source: 'google_places',
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: place.geometry?.location,
      types: place.types,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      businessStatus: place.business_status
    };
  }

  normalizePlaceDetails(details) {
    return {
      source: 'google_places',
      placeId: details.place_id,
      name: details.name,
      address: details.formatted_address,
      phone: details.formatted_phone_number,
      website: details.website,
      rating: details.rating,
      reviewCount: details.user_ratings_total,
      hours: details.opening_hours?.weekday_text
    };
  }
}

/**
 * SerpAPI adapter
 * Requires: SERPAPI_KEY env variable
 */
export class SerpAPIProvider {
  constructor() {
    this.apiKey = process.env.SERPAPI_KEY;
    this.enabled = !!this.apiKey;
    this.baseUrl = 'https://serpapi.com/search.json';
  }

  isAvailable() {
    return this.enabled && !!this.apiKey;
  }

  async searchMaps(keyword, city, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('SerpAPI not configured. Set SERPAPI_KEY.');
    }

    const params = {
      engine: 'google_maps',
      q: `${keyword} in ${city}`,
      api_key: this.apiKey,
      type: 'search',
      num: options.limit || 20
    };

    try {
      const response = await axios.get(this.baseUrl, { 
        params, 
        timeout: 20000 
      });

      const results = response.data.local_results || response.data.places || [];
      return results.map(this.normalizeResult);
    } catch (err) {
      logger.error('[providers:serpapi] Search failed:', err.message);
      throw err;
    }
  }

  normalizeResult(result) {
    return {
      source: 'serpapi',
      placeId: result.place_id,
      name: result.title,
      address: result.address,
      phone: result.phone,
      website: result.website,
      rating: result.rating,
      reviewCount: result.reviews,
      type: result.type,
      thumbnail: result.thumbnail
    };
  }
}

/**
 * Serper.dev API adapter
 * Requires: SERPER_API_KEY env variable
 * This is the same provider used in the Python leadtools reference code
 */
export class SerperProvider {
  constructor() {
    this.apiKey = process.env.SERPER_API_KEY;
    this.enabled = !!this.apiKey;
    this.baseUrl = 'https://google.serper.dev/maps';
  }

  isAvailable() {
    return this.enabled && !!this.apiKey;
  }

  async searchMaps(keyword, city, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Serper API not configured. Set SERPER_API_KEY.');
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          q: `${keyword} in ${city}`,
          num: options.limit || 20
        },
        {
          headers: { 
            'X-API-KEY': this.apiKey, 
            'Content-Type': 'application/json' 
          },
          timeout: 15000
        }
      );

      return (response.data.places || []).map(this.normalizeResult);
    } catch (err) {
      logger.error('[providers:serper] Search failed:', err.message);
      throw err;
    }
  }

  normalizeResult(place) {
    return {
      source: 'serper',
      placeId: place.placeId,
      name: place.title,
      address: place.address,
      phone: place.phoneNumber,
      website: place.website,
      rating: place.rating,
      reviewCount: place.ratingCount,
      type: place.category,
      hours: place.hours,
      cid: place.cid
    };
  }
}

/**
 * Yelp Fusion API adapter
 * Requires: YELP_API_KEY env variable
 */
export class YelpProvider {
  constructor() {
    this.apiKey = process.env.YELP_API_KEY;
    this.enabled = !!this.apiKey;
    this.baseUrl = 'https://api.yelp.com/v3';
  }

  isAvailable() {
    return this.enabled && !!this.apiKey;
  }

  async searchBusinesses(keyword, city, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Yelp API not configured. Set YELP_API_KEY.');
    }

    const url = `${this.baseUrl}/businesses/search`;
    const params = {
      term: keyword,
      location: city,
      limit: options.limit || 20,
      categories: options.categories || 'home_services,construction'
    };

    try {
      const response = await axios.get(url, {
        params,
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 15000
      });

      return (response.data.businesses || []).map(this.normalizeBusiness);
    } catch (err) {
      logger.error('[providers:yelp] Search failed:', err.message);
      throw err;
    }
  }

  normalizeBusiness(business) {
    return {
      source: 'yelp',
      placeId: business.id,
      name: business.name,
      address: `${business.location.address1}, ${business.location.city}, ${business.location.state} ${business.location.zip_code}`,
      phone: business.phone,
      website: business.url,
      rating: business.rating,
      reviewCount: business.review_count,
      imageUrl: business.image_url,
      coordinates: business.coordinates,
      categories: business.categories?.map(c => c.title)
    };
  }
}

/**
 * Multi-provider discovery manager
 * Tries multiple providers in order of preference
 */
export class DiscoveryProviderManager {
  constructor() {
    this.providers = [
      new GooglePlacesProvider(),
      new SerperProvider(),
      new SerpAPIProvider(),
      new YelpProvider()
    ];
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return this.providers.filter(p => p.isAvailable());
  }

  /**
   * Search using the first available provider
   */
  async search(keyword, city, options = {}) {
    const available = this.getAvailableProviders();
    
    if (available.length === 0) {
      logger.warn('[providers] No discovery providers configured. Set API keys for Google Places, Serper, SerpAPI, or Yelp.');
      return {
        results: [],
        provider: null,
        total: 0,
        message: 'No discovery providers configured. Using fallback scraping method.'
      };
    }

    // Try each provider in order
    for (const provider of available) {
      try {
        logger.info(`[providers] Searching with ${provider.constructor.name}...`);
        
        let results;
        if (provider.constructor.name === 'YelpProvider') {
          results = await provider.searchBusinesses(keyword, city, options);
        } else {
          results = await provider.searchMaps(keyword, city, options);
        }

        logger.info(`[providers] ${provider.constructor.name} returned ${results.length} results`);

        return {
          results,
          provider: provider.constructor.name,
          total: results.length,
          message: `Found ${results.length} results via ${provider.constructor.name}`
        };
      } catch (err) {
        logger.warn(`[providers] ${provider.constructor.name} failed:`, err.message);
        continue;
      }
    }

    throw new Error('All discovery providers failed');
  }

  /**
   * Get provider status
   */
  getStatus() {
    return this.providers.map(p => ({
      name: p.constructor.name,
      available: p.isAvailable(),
      enabled: p.enabled
    }));
  }
}

// Export singleton instance
export const discoveryManager = new DiscoveryProviderManager();

// Legacy provider registry (for backward compatibility)
export const providers = {
  googlePlaces: new GooglePlacesProvider(),
  serpApi: new SerpAPIProvider(),
  serper: new SerperProvider(),
  yelp: new YelpProvider()
};

export default {
  GooglePlacesProvider,
  SerpAPIProvider,
  SerperProvider,
  YelpProvider,
  DiscoveryProviderManager,
  discoveryManager,
  providers
};
