// Discovery Providers - Scaffolded API adapters for future use
// Currently disabled. The primary provider is Playwright-based Google Maps scraping.
// These can be enabled when API keys are configured.

/**
 * Google Places API adapter (DISABLED)
 * Requires: GOOGLE_PLACES_API_KEY env variable
 */
export class GooglePlacesProvider {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.enabled = false; // Set to true when API key is available
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  isAvailable() {
    return this.enabled && !!this.apiKey;
  }

  async searchPlaces(keyword, city, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Google Places API not configured. Set GOOGLE_PLACES_API_KEY.');
    }

    // TODO: Implement when API key is available
    // const url = `${this.baseUrl}/textsearch/json`;
    // const params = {
    //   query: `${keyword} in ${city}`,
    //   key: this.apiKey,
    //   type: options.type || undefined
    // };
    // const response = await axios.get(url, { params });
    // return response.data.results.map(normalizePlace);

    return [];
  }

  async getPlaceDetails(placeId) {
    if (!this.isAvailable()) return null;

    // TODO: Implement
    // const url = `${this.baseUrl}/details/json`;
    // const params = { place_id: placeId, key: this.apiKey, fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total' };

    return null;
  }
}

/**
 * SerpAPI adapter (DISABLED)
 * Requires: SERPAPI_KEY env variable
 */
export class SerpAPIProvider {
  constructor() {
    this.apiKey = process.env.SERPAPI_KEY;
    this.enabled = false; // Set to true when API key is available
    this.baseUrl = 'https://serpapi.com/search.json';
  }

  isAvailable() {
    return this.enabled && !!this.apiKey;
  }

  async searchMaps(keyword, city, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('SerpAPI not configured. Set SERPAPI_KEY.');
    }

    // TODO: Implement when API key is available
    // const params = {
    //   engine: 'google_maps',
    //   q: `${keyword} in ${city}`,
    //   api_key: this.apiKey,
    //   type: 'search'
    // };
    // const response = await axios.get(this.baseUrl, { params });
    // return response.data.local_results.map(normalizeResult);

    return [];
  }
}

/**
 * Serper.dev API adapter (DISABLED)
 * Requires: SERPER_API_KEY env variable
 * This is the same provider used in the Python leadtools reference code
 */
export class SerperProvider {
  constructor() {
    this.apiKey = process.env.SERPER_API_KEY;
    this.enabled = false;
    this.baseUrl = 'https://google.serper.dev/maps';
  }

  isAvailable() {
    return this.enabled && !!this.apiKey;
  }

  async searchMaps(keyword, city, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Serper API not configured. Set SERPER_API_KEY.');
    }

    // TODO: Implement when API key is available
    // const response = await axios.post(this.baseUrl, {
    //   q: `${keyword} in ${city}`,
    //   num: options.limit || 20
    // }, {
    //   headers: { 'X-API-KEY': this.apiKey, 'Content-Type': 'application/json' }
    // });
    // return response.data.places.map(normalizeSerperResult);

    return [];
  }
}

// Provider registry
export const providers = {
  googlePlaces: new GooglePlacesProvider(),
  serpApi: new SerpAPIProvider(),
  serper: new SerperProvider()
};
