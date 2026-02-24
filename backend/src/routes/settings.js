// Settings API routes - CRUD for app configuration

import express from 'express';
import { db } from '../services/database.js';
import { ollamaService } from '../services/ollama.js';
import { groqService } from '../services/groq.js';
import { openclawService } from '../services/openclaw.js';
import { anthropicService } from '../services/anthropic.js';
import { openaiService } from '../services/openai.js';
import { aiProvider } from '../services/ai-provider.js';
import { tryCatch } from '../utils/response.js';
import { authenticateToken, requireRole } from '../middleware/auth-jwt.js';
import logger from '../services/logger.js';

const router = express.Router();

// Apply authentication to all settings routes
router.use(authenticateToken);

/**
 * Validate temperature value
 */
function validateTemperature(value) {
  const temp = parseFloat(value);
  if (isNaN(temp)) return { valid: false, error: 'Temperature must be a number' };
  if (temp < 0 || temp > 2) return { valid: false, error: 'Temperature must be between 0.0 and 2.0' };
  return { valid: true, value: temp };
}

// Get all settings
router.get('/', tryCatch(async (req, res) => {
  const settings = await db.getAllSettings();

  // Mask API keys for security
  const keysToMask = [
    'serper_api_key', 'google_places_api_key', 'groq_api_key', 
    'openclaw_token', 'anthropic_api_key', 'openai_api_key', 
    'twilio_auth_token', 'sendgrid_api_key', 'stripe_api_key', 
    'google_maps_api_key', 'microsoft_client_secret', 
    'google_client_secret', 'telegram_bot_token'
  ];

  for (const keyName of keysToMask) {
    if (settings[keyName]) {
      const key = settings[keyName];
      settings[`${keyName}_masked`] = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
      settings[`${keyName}_configured`] = key.length > 0;
      delete settings[keyName];
    }
  }

  // Add current provider info
  settings.ai_provider = aiProvider.activeProviderName;
  settings.ai_providers = await aiProvider.getAvailableProviders();

  res.success(settings);
}));

// Update settings (partial merge) - Allow admin and editor
router.put('/', requireRole(['admin', 'editor']), tryCatch(async (req, res) => {
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res.error('No settings provided', 'VALIDATION_ERROR', null, 400);
  }

  // Validate temperature settings
  const tempFields = ['ollama_temperature', 'groq_temperature', 'openclaw_temperature', 'anthropic_temperature', 'openai_temperature'];
  for (const field of tempFields) {
    if (updates[field] !== undefined) {
      const result = validateTemperature(updates[field]);
      if (!result.valid) return res.error(result.error, 'VALIDATION_ERROR', null, 400);
      updates[field] = String(result.value);
    }
  }

  // Validate URLs
  for (const urlField of ['openclaw_url', 'ollama_url']) {
    if (updates[urlField]) {
      try { new URL(updates[urlField]); } catch { return res.error(`Invalid ${urlField}`, 'VALIDATION_ERROR', null, 400); }
    }
  }

  // Save to database
  await db.setSettings(updates);

  // Runtime configuration updates
  if (updates.ollama_url || updates.ollama_model || updates.ollama_temperature) {
    ollamaService.configure({
      baseUrl: updates.ollama_url,
      defaultModel: updates.ollama_model,
      temperature: updates.ollama_temperature ? parseFloat(updates.ollama_temperature) : undefined
    });
  }

  if (updates.groq_api_key || updates.groq_model || updates.groq_temperature) {
    groqService.configure({
      apiKey: updates.groq_api_key,
      defaultModel: updates.groq_model,
      temperature: updates.groq_temperature ? parseFloat(updates.groq_temperature) : undefined
    });
  }

  if (updates.openai_api_key || updates.openai_model || updates.openai_temperature) {
    openaiService.configure({
      apiKey: updates.openai_api_key,
      defaultModel: updates.openai_model,
      temperature: updates.openai_temperature ? parseFloat(updates.openai_temperature) : undefined
    });
  }

  if (updates.anthropic_api_key || updates.anthropic_model || updates.anthropic_temperature) {
    anthropicService.configure({
      apiKey: updates.anthropic_api_key,
      defaultModel: updates.anthropic_model,
      temperature: updates.anthropic_temperature ? parseFloat(updates.anthropic_temperature) : undefined
    });
  }

  if (updates.openclaw_url || updates.openclaw_token || updates.openclaw_model || updates.openclaw_temperature) {
    openclawService.configure({
      baseUrl: updates.openclaw_url,
      apiKey: updates.openclaw_token,
      defaultModel: updates.openclaw_model,
      temperature: updates.openclaw_temperature ? parseFloat(updates.openclaw_temperature) : undefined
    });
  }

  // Switch provider if requested
  if (updates.ai_provider) {
    try {
      await aiProvider.setProvider(updates.ai_provider);
    } catch (err) {
      logger.warn('[settings] Provider switch failed:', err.message);
    }
  }

  const finalSettings = await db.getAllSettings();
  res.success(finalSettings, 'Settings updated');
}));

// Test Ollama connection
router.post('/test-ollama', tryCatch(async (req, res) => {
  const { url } = req.body;
  const testUrl = url || ollamaService.baseUrl;
  try {
    const { default: axios } = await import('axios');
    const response = await axios.get(`${testUrl}/api/tags`, { timeout: 5000 });
    const models = response.data.models || [];
    res.success({ connected: true, url: testUrl, modelCount: models.length, models: models.map(m => m.name) });
  } catch (error) {
    res.success({ connected: false, url: testUrl, error: error.message });
  }
}));

// Test Groq API key
router.post('/test-groq', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('groq_api_key'));
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  try {
    const { default: axios } = await import('axios');
    const response = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const models = response.data?.data || [];
    res.success({ valid: true, modelCount: models.length, models: models.map(m => m.id).slice(0, 20) });
  } catch (error) {
    res.success({ valid: false, error: error.response?.status === 401 ? 'Invalid API key' : error.message });
  }
}));

// Test OpenAI API key
router.post('/test-openai', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('openai_api_key'));
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  try {
    const { default: axios } = await import('axios');
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const models = response.data?.data || [];
    res.success({ valid: true, modelCount: models.length });
  } catch (error) {
    res.success({ valid: false, error: error.response?.status === 401 ? 'Invalid API key' : error.message });
  }
}));

// Test OpenClaw connection
router.post('/test-openclaw', tryCatch(async (req, res) => {
  try {
    const health = await openclawService.healthCheck();
    res.success({ connected: health.connected, url: openclawService.baseUrl, model: health.model, error: health.error });
  } catch (error) {
    res.success({ connected: false, error: error.message });
  }
}));

// Test Serper API key
router.post('/test-serper', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('serper_api_key'));
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  try {
    const { default: axios } = await import('axios');
    const response = await axios.post('https://google.serper.dev/search', { q: 'test', num: 1 }, {
      headers: { 'X-API-KEY': apiKey }, timeout: 5000
    });
    res.success({ valid: true, credits: response.headers['x-credits-remaining'] || 'unknown' });
  } catch (error) {
    res.success({ valid: false, error: error.response?.status === 403 ? 'Invalid API key' : error.message });
  }
}));

// Test Anthropic API key
router.post('/test-anthropic', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('anthropic_api_key'));
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  try {
    const { default: axios } = await import('axios');
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }],
    }, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    res.success({ valid: true, model: response.data?.model || 'claude' });
  } catch (error) {
    const status = error.response?.status;
    res.success({ valid: false, error: (status === 401 || status === 403) ? 'Invalid API key' : error.message });
  }
}));

// Get metrics from active provider
router.get('/metrics', tryCatch(async (req, res) => {
  const metrics = aiProvider.getMetrics();
  const config = aiProvider.getConfig();
  res.success({ metrics, config });
}));

// Other test endpoints (Twilio, Microsoft, etc.) preserved
router.post('/test-twilio', tryCatch(async (req, res) => {
  const { sid, token } = req.body;
  const accountSid = sid || (await db.getSetting('twilio_account_sid'));
  const authToken = token || (await db.getSetting('twilio_auth_token'));
  if (!accountSid || !authToken) return res.success({ valid: false, error: 'Account SID and Auth Token required' });
  try {
    const { default: axios } = await import('axios');
    const response = await axios.get(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      auth: { username: accountSid, password: authToken }, timeout: 10000,
    });
    res.success({ valid: true, friendlyName: response.data?.friendly_name || accountSid });
  } catch (error) {
    res.success({ valid: false, error: error.response?.status === 401 ? 'Invalid credentials' : error.message });
  }
}));

router.post('/test-telegram', tryCatch(async (req, res) => {
  const { token } = req.body;
  const botToken = token || (await db.getSetting('telegram_bot_token'));
  if (!botToken) return res.success({ valid: false, error: 'Bot token is required' });
  try {
    const { default: axios } = await import('axios');
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 10000 });
    if (response.data?.ok) {
      const bot = response.data.result;
      res.success({ valid: true, botUsername: bot.username });
    } else {
      res.success({ valid: false, error: 'Invalid bot token' });
    }
  } catch (error) {
    res.success({ valid: false, error: error.message });
  }
}));

// Test SendGrid API key
router.post('/test-sendgrid', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('sendgrid_api_key'));
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  try {
    const { default: axios } = await import('axios');
    // SendGrid API v3 - validate by fetching user profile
    const response = await axios.get('https://api.sendgrid.com/v3/user/profile', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    res.success({ valid: true, user: response.data?.first_name || 'Valid' });
  } catch (error) {
    res.success({ valid: false, error: error.response?.status === 401 ? 'Invalid API key' : error.message });
  }
}));

// Test Stripe API key
router.post('/test-stripe', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('stripe_api_key'));
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  try {
    const { default: axios } = await import('axios');
    // Stripe API - validate by fetching account info
    const response = await axios.get('https://api.stripe.com/v1/account', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    res.success({ 
      valid: true, 
      account: response.data?.settings?.dashboard?.display_name || 'Valid',
      mode: response.data?.charges_enabled ? 'Live' : 'Test'
    });
  } catch (error) {
    res.success({ valid: false, error: error.response?.status === 401 ? 'Invalid API key' : error.message });
  }
}));

// Test Google Maps API key
router.post('/test-google-maps', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('google_maps_api_key'));
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  try {
    const { default: axios } = await import('axios');
    // Test with a simple geocoding request
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: 'New York, NY', key: apiKey },
      timeout: 10000,
    });
    if (response.data?.status === 'OK') {
      res.success({ valid: true, status: 'OK' });
    } else if (response.data?.status === 'REQUEST_DENIED') {
      res.success({ valid: false, error: 'Invalid API key or API not enabled' });
    } else {
      res.success({ valid: false, error: response.data?.status || 'Unknown error' });
    }
  } catch (error) {
    res.success({ valid: false, error: error.message });
  }
}));

// Test Microsoft OAuth credentials
router.post('/test-microsoft', tryCatch(async (req, res) => {
  const { clientId, clientSecret } = req.body;
  const msClientId = clientId || (await db.getSetting('microsoft_client_id'));
  const msClientSecret = clientSecret || (await db.getSetting('microsoft_client_secret'));
  
  if (!msClientId || !msClientSecret) {
    return res.success({ valid: false, error: 'Client ID and Client Secret required' });
  }
  
  try {
    const { default: axios } = await import('axios');
    // Microsoft Graph - get access token using client credentials flow
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: msClientId,
        client_secret: msClientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }),
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000 
      }
    );
    
    if (tokenResponse.data?.access_token) {
      // Token obtained - credentials are valid
      res.success({ valid: true, tokenType: tokenResponse.data?.token_type || 'Bearer' });
    } else {
      res.success({ valid: false, error: 'Could not obtain access token' });
    }
  } catch (error) {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error;
    if (status === 401 || errorCode === 'invalid_client') {
      res.success({ valid: false, error: 'Invalid client credentials' });
    } else {
      res.success({ valid: false, error: error.response?.data?.error_description || error.message });
    }
  }
}));

// Test Google OAuth credentials  
router.post('/test-google', tryCatch(async (req, res) => {
  const { clientId, clientSecret } = req.body;
  const googleClientId = clientId || (await db.getSetting('google_client_id'));
  const googleClientSecret = clientSecret || (await db.getSetting('google_client_secret'));
  
  if (!googleClientId || !googleClientSecret) {
    return res.success({ valid: false, error: 'Client ID and Client Secret required' });
  }
  
  try {
    const { default: axios } = await import('axios');
    // Google OAuth - we can't fully test without user consent, but we can validate
    // the client credentials format by attempting a token refresh (which will fail
    // without a refresh token, but tells us if credentials are recognized)
    
    // Alternatively, check if we can fetch the OAuth 2.0 configuration
    // We'll validate by making a request to Google's token endpoint with invalid grant
    // which should return "invalid_grant" (credentials valid) vs "invalid_client" (credentials invalid)
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        grant_type: 'refresh_token',
        refresh_token: 'invalid_token_for_testing'
      }),
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000 
      }
    );
    
    // If we somehow got here, credentials worked
    res.success({ valid: true, message: 'Google OAuth credentials format is valid' });
  } catch (error) {
    const errorCode = error.response?.data?.error;
    // "invalid_grant" means client_id/secret are valid, but refresh token is bad
    // "unauthorized_client" or "invalid_client" means bad credentials
    if (errorCode === 'invalid_grant') {
      res.success({ valid: true, message: 'Google OAuth credentials are valid' });
    } else if (errorCode === 'invalid_client' || errorCode === 'unauthorized_client') {
      res.success({ valid: false, error: 'Invalid client credentials' });
    } else {
      res.success({ valid: false, error: error.response?.data?.error_description || error.message });
    }
  }
}));

export default router;
