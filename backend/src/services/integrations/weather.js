/**
 * Weather API Integration
 * Local DFW weather forecasts for project planning
 */

import axios from 'axios';
import logger from '../logger.js';

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.enabled = !!this.apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    // Default to Fort Worth, TX coordinates
    this.defaultLat = 32.7555;
    this.defaultLng = -97.3308;
  }

  isAvailable() {
    return this.enabled;
  }

  /**
   * Get current weather
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  async getCurrentWeather(lat = this.defaultLat, lng = this.defaultLng) {
    if (!this.isAvailable()) {
      throw new Error('Weather API not configured. Set OPENWEATHER_API_KEY.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: this.apiKey,
          units: 'imperial' // Fahrenheit
        },
        timeout: 10000
      });

      return this.normalizeWeather(response.data);

    } catch (err) {
      logger.error('[weather] Current weather failed:', err.message);
      throw err;
    }
  }

  /**
   * Get 5-day forecast
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  async getForecast(lat = this.defaultLat, lng = this.defaultLng) {
    if (!this.isAvailable()) {
      throw new Error('Weather API not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon: lng,
          appid: this.apiKey,
          units: 'imperial'
        },
        timeout: 10000
      });

      return {
        city: response.data.city,
        forecast: response.data.list.map(item => ({
          datetime: new Date(item.dt * 1000).toISOString(),
          temperature: item.main.temp,
          feelsLike: item.main.feels_like,
          humidity: item.main.humidity,
          description: item.weather[0]?.description,
          icon: item.weather[0]?.icon,
          windSpeed: item.wind?.speed,
          rainChance: item.pop ? Math.round(item.pop * 100) : 0,
          // Construction-relevant conditions
          isGoodForWork: this.isGoodForConstruction(item)
        }))
      };

    } catch (err) {
      logger.error('[weather] Forecast failed:', err.message);
      throw err;
    }
  }

  /**
   * Check if weather is good for construction work
   */
  isGoodForConstruction(weatherItem) {
    const temp = weatherItem.main.temp;
    const windSpeed = weatherItem.wind?.speed || 0;
    const description = weatherItem.weather[0]?.description?.toLowerCase() || '';
    
    // Check for bad conditions
    const badConditions = [
      'rain', 'thunderstorm', 'snow', 'sleet', 'hail',
      'tornado', 'hurricane', 'extreme'
    ];
    
    const hasBadWeather = badConditions.some(c => description.includes(c));
    const isTooCold = temp < 32; // Freezing
    const isTooHot = temp > 105; // Extreme heat
    const isTooWindy = windSpeed > 25; // mph
    
    return !hasBadWeather && !isTooCold && !isTooHot && !isTooWindy;
  }

  /**
   * Get construction work recommendations
   */
  async getWorkRecommendations(days = 5) {
    const forecast = await this.getForecast();
    
    const recommendations = {
      goodDays: [],
      badDays: [],
      summary: ''
    };

    const dailyForecast = this.groupByDay(forecast.forecast);
    
    for (const [date, items] of Object.entries(dailyForecast).slice(0, days)) {
      const daySummary = items[Math.floor(items.length / 2)]; // Midday weather
      
      if (daySummary.isGoodForWork) {
        recommendations.goodDays.push({
          date,
          temp: daySummary.temperature,
          conditions: daySummary.description
        });
      } else {
        recommendations.badDays.push({
          date,
          temp: daySummary.temperature,
          conditions: daySummary.description,
          reason: this.getBadWeatherReason(daySummary)
        });
      }
    }

    recommendations.summary = this.generateSummary(recommendations);
    
    return recommendations;
  }

  groupByDay(forecast) {
    return forecast.reduce((acc, item) => {
      const date = item.datetime.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  }

  getBadWeatherReason(item) {
    if (item.rainChance > 50) return 'High rain probability';
    if (item.temperature < 32) return 'Freezing temperatures';
    if (item.temperature > 100) return 'Extreme heat';
    if (item.windSpeed > 20) return 'High winds';
    return 'Adverse conditions';
  }

  generateSummary(rec) {
    if (rec.goodDays.length === 0) return 'Poor weather conditions expected. Consider rescheduling outdoor work.';
    if (rec.badDays.length === 0) return 'Excellent weather conditions for the forecast period.';
    return `${rec.goodDays.length} of ${rec.goodDays.length + rec.badDays.length} days suitable for construction work.`;
  }

  normalizeWeather(data) {
    return {
      location: {
        name: data.name,
        lat: data.coord?.lat,
        lng: data.coord?.lon
      },
      temperature: data.main?.temp,
      feelsLike: data.main?.feels_like,
      humidity: data.main?.humidity,
      pressure: data.main?.pressure,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon,
      windSpeed: data.wind?.speed,
      windDirection: data.wind?.deg,
      visibility: data.visibility,
      clouds: data.clouds?.all,
      sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toISOString() : null,
      sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toISOString() : null,
      fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Get weather icon URL
   * @param {string} iconCode - Weather icon code
   */
  getIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}

export const weatherService = new WeatherService();
export default WeatherService;
