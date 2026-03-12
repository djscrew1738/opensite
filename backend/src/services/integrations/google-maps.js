/**
 * Google Maps API Integration
 * Static maps and geocoding for lead visualization
 */

import axios from 'axios';
import logger from '../logger.js';

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.enabled = !!this.apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  isAvailable() {
    return this.enabled;
  }

  /**
   * Generate static map image URL
   * @param {Object} options
   * @param {number} options.lat - Latitude
   * @param {number} options.lng - Longitude
   * @param {number} options.zoom - Zoom level (1-20)
   * @param {string} options.size - Image size (default: 600x400)
   * @param {string} options.marker - Marker style
   */
  getStaticMapUrl(options) {
    if (!this.isAvailable()) {
      return null;
    }

    const { lat, lng, zoom = 15, size = '600x400', marker = 'red' } = options;

    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: zoom.toString(),
      size,
      key: this.apiKey,
      markers: `color:${marker}|${lat},${lng}`,
      maptype: 'roadmap'
    });

    return `${this.baseUrl}/staticmap?${params.toString()}`;
  }

  /**
   * Geocode address to coordinates
   * @param {string} address - Full address
   */
  async geocode(address) {
    if (!this.isAvailable()) {
      throw new Error('Google Maps API not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      return {
        formattedAddress: result.formatted_address,
        location: result.geometry.location,
        placeId: result.place_id,
        types: result.types
      };

    } catch (err) {
      logger.error('[google-maps] Geocoding failed:', err.message);
      throw err;
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  async reverseGeocode(lat, lng) {
    if (!this.isAvailable()) {
      throw new Error('Google Maps API not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Reverse geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      return {
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components,
        placeId: result.place_id
      };

    } catch (err) {
      logger.error('[google-maps] Reverse geocoding failed:', err.message);
      throw err;
    }
  }

  /**
   * Calculate distance between two points
   * @param {string} origin - Origin address or coords
   * @param {string} destination - Destination address or coords
   */
  async getDistance(origin, destination) {
    if (!this.isAvailable()) {
      throw new Error('Google Maps API not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: origin,
          destinations: destination,
          mode: 'driving',
          key: this.apiKey
        },
        timeout: 10000
      });

      const element = response.data.rows[0]?.elements[0];
      if (!element || element.status !== 'OK') {
        return null;
      }

      return {
        distance: element.distance,
        duration: element.duration
      };

    } catch (err) {
      logger.error('[google-maps] Distance calculation failed:', err.message);
      throw err;
    }
  }

  /**
   * Generate map image for lead
   * @param {Object} lead - Lead with address
   */
  async generateLeadMap(lead) {
    if (!lead.latitude || !lead.longitude) {
      // Try to geocode
      try {
        const geocoded = await this.geocode(
          `${lead.address}, ${lead.city}, ${lead.state}`
        );
        lead.latitude = geocoded.location.lat;
        lead.longitude = geocoded.location.lng;
      } catch {
        return null;
      }
    }

    return this.getStaticMapUrl({
      lat: lead.latitude,
      lng: lead.longitude,
      zoom: 16,
      size: '400x300',
      marker: 'blue'
    });
  }
}

export const googleMapsService = new GoogleMapsService();
export default GoogleMapsService;
