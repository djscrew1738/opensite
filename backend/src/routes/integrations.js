/**
 * External Integrations Routes
 * Zillow, Google Maps, Weather API endpoints
 */

import express from 'express';
import { zillowService } from '../services/integrations/zillow.js';
import { googleMapsService } from '../services/integrations/google-maps.js';
import { weatherService } from '../services/integrations/weather.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * Get integration status
 * GET /api/integrations/status
 */
router.get('/status', tryCatch(async (req, res) => {
  res.success({
    zillow: {
      available: zillowService.isAvailable(),
      name: 'Zillow Property Data'
    },
    googleMaps: {
      available: googleMapsService.isAvailable(),
      name: 'Google Maps'
    },
    weather: {
      available: weatherService.isAvailable(),
      name: 'OpenWeather'
    }
  });
}));

// ═══════════════════════════════════════════════════════════════
// Zillow Routes
// ═══════════════════════════════════════════════════════════════

/**
 * Search property by address
 * GET /api/integrations/zillow/search
 */
router.get('/zillow/search', tryCatch(async (req, res) => {
  const { address, city, state = 'TX', zip } = req.query;

  if (!address || !city) {
    return res.error('Address and city are required', 'VALIDATION_ERROR', null, 400);
  }

  if (!zillowService.isAvailable()) {
    return res.error('Zillow API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const property = await zillowService.searchProperty(address, city, state, zip);

  if (!property) {
    return res.error('Property not found', 'NOT_FOUND', null, 404);
  }

  res.success({ property });
}));

/**
 * Enrich lead with Zillow data
 * POST /api/integrations/zillow/enrich-lead
 */
router.post('/zillow/enrich-lead', tryCatch(async (req, res) => {
  const { leadId } = req.body;

  if (!zillowService.isAvailable()) {
    return res.error('Zillow API not configured', 'NOT_CONFIGURED', null, 503);
  }

  // Get lead from database
  const { db } = await import('../services/database.js');
  const lead = await db.getLead(leadId);

  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', null, 404);
  }

  const enriched = await zillowService.enrichLead(lead);

  if (!enriched.zillowData) {
    return res.error('Could not find property data for this address', 'NOT_FOUND', null, 404);
  }

  // Store enrichment data
  await db.updateLead(leadId, {
    zillowData: JSON.stringify(enriched.zillowData),
    estimatedValue: enriched.estimatedValue,
    squareFootage: enriched.squareFootage
  });

  logger.info('Lead enriched with Zillow data', { leadId, zpid: enriched.zillowData.zpid });

  res.success({
    lead: enriched,
    property: enriched.zillowData
  });
}));

// ═══════════════════════════════════════════════════════════════
// Google Maps Routes
// ═══════════════════════════════════════════════════════════════

/**
 * Get static map for lead
 * GET /api/integrations/maps/lead-map/:leadId
 */
router.get('/maps/lead-map/:leadId', tryCatch(async (req, res) => {
  if (!googleMapsService.isAvailable()) {
    return res.error('Google Maps API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const { db } = await import('../services/database.js');
  const lead = await db.getLead(req.params.leadId);

  if (!lead) {
    return res.error('Lead not found', 'NOT_FOUND', null, 404);
  }

  const mapUrl = await googleMapsService.generateLeadMap(lead);

  if (!mapUrl) {
    return res.error('Could not generate map', 'ERROR', null, 500);
  }

  res.success({
    mapUrl,
    leadId: lead.id,
    address: `${lead.address}, ${lead.city}`
  });
}));

/**
 * Geocode address
 * GET /api/integrations/maps/geocode
 */
router.get('/maps/geocode', tryCatch(async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.error('Address is required', 'VALIDATION_ERROR', null, 400);
  }

  if (!googleMapsService.isAvailable()) {
    return res.error('Google Maps API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const result = await googleMapsService.geocode(address);

  res.success({
    address: result.formattedAddress,
    location: result.location,
    placeId: result.placeId
  });
}));

/**
 * Calculate distance
 * GET /api/integrations/maps/distance
 */
router.get('/maps/distance', tryCatch(async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.error('Origin and destination are required', 'VALIDATION_ERROR', null, 400);
  }

  if (!googleMapsService.isAvailable()) {
    return res.error('Google Maps API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const result = await googleMapsService.getDistance(origin, destination);

  if (!result) {
    return res.error('Could not calculate distance', 'ERROR', null, 500);
  }

  res.success({
    origin,
    destination,
    distance: result.distance,
    duration: result.duration
  });
}));

// ═══════════════════════════════════════════════════════════════
// Weather Routes
// ═══════════════════════════════════════════════════════════════

/**
 * Get current weather
 * GET /api/integrations/weather/current
 */
router.get('/weather/current', tryCatch(async (req, res) => {
  const { lat, lng } = req.query;

  if (!weatherService.isAvailable()) {
    return res.error('Weather API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const weather = await weatherService.getCurrentWeather(
    lat ? parseFloat(lat) : undefined,
    lng ? parseFloat(lng) : undefined
  );

  res.success({ weather });
}));

/**
 * Get 5-day forecast
 * GET /api/integrations/weather/forecast
 */
router.get('/weather/forecast', tryCatch(async (req, res) => {
  const { lat, lng } = req.query;

  if (!weatherService.isAvailable()) {
    return res.error('Weather API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const forecast = await weatherService.getForecast(
    lat ? parseFloat(lat) : undefined,
    lng ? parseFloat(lng) : undefined
  );

  res.success({ forecast });
}));

/**
 * Get work recommendations
 * GET /api/integrations/weather/work-recommendations
 */
router.get('/weather/work-recommendations', tryCatch(async (req, res) => {
  const { days = 5 } = req.query;

  if (!weatherService.isAvailable()) {
    return res.error('Weather API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const recommendations = await weatherService.getWorkRecommendations(parseInt(days));

  res.success({
    recommendations,
    location: 'DFW Metroplex'
  });
}));

/**
 * Get weather dashboard data
 * GET /api/integrations/weather/dashboard
 */
router.get('/weather/dashboard', tryCatch(async (req, res) => {
  if (!weatherService.isAvailable()) {
    return res.error('Weather API not configured', 'NOT_CONFIGURED', null, 503);
  }

  const [current, forecast, recommendations] = await Promise.all([
    weatherService.getCurrentWeather(),
    weatherService.getForecast(),
    weatherService.getWorkRecommendations(5)
  ]);

  res.success({
    current,
    today: forecast.forecast.slice(0, 8), // Next 24 hours (3-hour intervals)
    week: forecast.forecast.filter((_, i) => i % 8 === 0).slice(0, 5), // Daily
    recommendations
  });
}));

export default router;
