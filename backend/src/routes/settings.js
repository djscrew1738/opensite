// Settings API routes - CRUD for app configuration

import express from 'express';
import axios from 'axios';
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

// Sensitive keys that should be masked in responses
const SENSITIVE_KEYS = [
  'serper_api_key', 'google_places_api_key', 'groq_api_key', 
  'openclaw_token', 'anthropic_api_key', 'openai_api_key', 
  'twilio_auth_token', 'sendgrid_api_key', 'stripe_api_key', 
  'google_maps_api_key', 'microsoft_client_secret', 
  'google_client_secret', 'telegram_bot_token', 'encryption_key'
];

/**
 * Mask sensitive string values
 */
function maskValue(value) {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/**
 * SSRF protection: check if a hostname is private/internal
 */
function isPrivateAddress(hostname) {
  const blockedPatterns = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^0\./,
    /^169\.254\./,
    /^::1$/,
    /^localhost$/i,
  ];
  return blockedPatterns.some(p => p.test(hostname));
}

/**
 * Validate temperature value
 */
function validateTemperature(value) {
  const temp = parseFloat(value);
  if (isNaN(temp)) return { valid: false, error: 'Temperature must be a number' };
  if (temp < 0 || temp > 2) return { valid: false, error: 'Temperature must be between 0.0 and 2.0' };
  return { valid: true, value: temp };
}

// Apply authentication to all settings routes
router.use(authenticateToken);

/**
 * GET /settings - Get all application settings
 * Optimized with ETag caching and efficient provider fetching
 */
router.get('/', tryCatch(async (req, res) => {
  const settings = await db.getAllSettings();

  // Mask API keys for security
  for (const key of SENSITIVE_KEYS) {
    if (settings[key]) {
      const originalValue = settings[key];
      settings[`${key}_masked`] = maskValue(originalValue);
      settings[`${key}_configured`] = true;
      delete settings[key];
    } else if (settings[key] === '') {
      settings[`${key}_configured`] = false;
    }
  }

  // Add current provider info
  settings.ai_provider = aiProvider.activeProviderName;
  settings.ai_providers = await aiProvider.getAvailableProviders();

  // Add cache headers for settings (they change infrequently)
  const etag = `"${Buffer.from(JSON.stringify(settings)).toString('base64').slice(0, 16)}"`;
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'private, no-cache'); // Must revalidate but can use ETag
  
  // Check If-None-Match for 304 response
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.success(settings);
}));

/**
 * PUT /settings/batch - Batch update multiple settings efficiently
 */
router.put('/batch', requireRole(['admin']), tryCatch(async (req, res) => {
  const { updates } = req.body;
  
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.error('No updates provided', 'VALIDATION_ERROR', null, 400);
  }
  
  // Validate all updates first
  const validatedUpdates = {};
  const tempFields = ['ollama_temperature', 'groq_temperature', 'openclaw_temperature', 'anthropic_temperature', 'openai_temperature'];
  const urlFields = ['openclaw_url', 'ollama_url'];
  
  for (const update of updates) {
    const { key, value } = update;
    if (!key) continue;
    
    // Validate temperature
    if (tempFields.includes(key) && value !== undefined && value !== null && value !== '') {
      const temp = parseFloat(value);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        return res.error(`${key}: Temperature must be between 0.0 and 2.0`, 'VALIDATION_ERROR', null, 400);
      }
      validatedUpdates[key] = String(temp);
    }
    // Validate URLs
    else if (urlFields.includes(key) && value) {
      try { 
        new URL(value); 
        validatedUpdates[key] = value;
      } catch { 
        return res.error(`Invalid ${key} URL`, 'VALIDATION_ERROR', null, 400); 
      }
    }
    else {
      validatedUpdates[key] = value;
    }
  }
  
  // Save all at once
  await db.setSettings(validatedUpdates);
  
  // Invalidate AI provider cache
  aiProvider.notifySettingsChanged();
  
  // Apply runtime configuration updates in parallel
  const serviceConfigs = [
    { service: ollamaService, updates: ['ollama_url', 'ollama_model', 'ollama_temperature'], configMap: { baseUrl: 'ollama_url', defaultModel: 'ollama_model', temperature: 'ollama_temperature' } },
    { service: groqService, updates: ['groq_api_key', 'groq_model', 'groq_temperature'], configMap: { apiKey: 'groq_api_key', defaultModel: 'groq_model', temperature: 'groq_temperature' } },
    { service: openaiService, updates: ['openai_api_key', 'openai_model', 'openai_temperature'], configMap: { apiKey: 'openai_api_key', defaultModel: 'openai_model', temperature: 'openai_temperature' } },
    { service: anthropicService, updates: ['anthropic_api_key', 'anthropic_model', 'anthropic_temperature'], configMap: { apiKey: 'anthropic_api_key', defaultModel: 'anthropic_model', temperature: 'anthropic_temperature' } },
    { service: openclawService, updates: ['openclaw_url', 'openclaw_token', 'openclaw_model', 'openclaw_temperature'], configMap: { baseUrl: 'openclaw_url', apiKey: 'openclaw_token', defaultModel: 'openclaw_model', temperature: 'openclaw_temperature' } }
  ];
  
  await Promise.all(
    serviceConfigs.map(async (cfg) => {
      const hasUpdates = cfg.updates.some(field => validatedUpdates[field] !== undefined);
      if (hasUpdates) {
        const config = {};
        for (const [serviceKey, updateKey] of Object.entries(cfg.configMap)) {
          if (validatedUpdates[updateKey] !== undefined) {
            config[serviceKey] = serviceKey === 'temperature' ? parseFloat(validatedUpdates[updateKey]) : validatedUpdates[updateKey];
          }
        }
        cfg.service.configure(config);
      }
    })
  );
  
  // Handle provider switch if included
  if (validatedUpdates.ai_provider) {
    aiProvider.setProvider(validatedUpdates.ai_provider).catch(err => {
      logger.warn('[settings] Provider switch failed:', err.message);
    });
  }
  
  res.success({ updated: Object.keys(validatedUpdates) }, `Updated ${Object.keys(validatedUpdates).length} settings`);
}));

/**
 * PUT /settings - Update settings (partial merge) - Require admin
 */
router.put('/', requireRole(['admin']), tryCatch(async (req, res) => {
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res.error('No settings provided', 'VALIDATION_ERROR', null, 400);
  }

  // Validate temperature settings
  const tempFields = ['ollama_temperature', 'groq_temperature', 'openclaw_temperature', 'anthropic_temperature', 'openai_temperature'];
  for (const field of tempFields) {
    if (updates[field] !== undefined && updates[field] !== null && updates[field] !== '') {
      const result = validateTemperature(updates[field]);
      if (!result.valid) return res.error(`${field}: ${result.error}`, 'VALIDATION_ERROR', null, 400);
      updates[field] = String(result.value);
    }
  }

  // Validate URLs
  const urlFields = ['openclaw_url', 'ollama_url'];
  for (const field of urlFields) {
    if (updates[field]) {
      try { 
        new URL(updates[field]); 
      } catch { 
        return res.error(`Invalid ${field} URL`, 'VALIDATION_ERROR', null, 400); 
      }
    }
  }

  // Save to database
  await db.setSettings(updates);
  
  // Invalidate AI provider cache since settings changed
  aiProvider.notifySettingsChanged();

  // Runtime configuration mapping
  const serviceConfigs = [
    { service: ollamaService, updates: ['ollama_url', 'ollama_model', 'ollama_temperature'], configMap: { baseUrl: 'ollama_url', defaultModel: 'ollama_model', temperature: 'ollama_temperature' } },
    { service: groqService, updates: ['groq_api_key', 'groq_model', 'groq_temperature'], configMap: { apiKey: 'groq_api_key', defaultModel: 'groq_model', temperature: 'groq_temperature' } },
    { service: openaiService, updates: ['openai_api_key', 'openai_model', 'openai_temperature'], configMap: { apiKey: 'openai_api_key', defaultModel: 'openai_model', temperature: 'openai_temperature' } },
    { service: anthropicService, updates: ['anthropic_api_key', 'anthropic_model', 'anthropic_temperature'], configMap: { apiKey: 'anthropic_api_key', defaultModel: 'anthropic_model', temperature: 'anthropic_temperature' } },
    { service: openclawService, updates: ['openclaw_url', 'openclaw_token', 'openclaw_model', 'openclaw_temperature'], configMap: { baseUrl: 'openclaw_url', apiKey: 'openclaw_token', defaultModel: 'openclaw_model', temperature: 'openclaw_temperature' } }
  ];

  for (const cfg of serviceConfigs) {
    const hasUpdates = cfg.updates.some(field => updates[field] !== undefined);
    if (hasUpdates) {
      const config = {};
      for (const [serviceKey, updateKey] of Object.entries(cfg.configMap)) {
        if (updates[updateKey] !== undefined) {
          config[serviceKey] = serviceKey === 'temperature' ? parseFloat(updates[updateKey]) : updates[updateKey];
        }
      }
      cfg.service.configure(config);
    }
  }

  // Switch provider if requested (with optimistic response)
  if (updates.ai_provider) {
    try {
      // Don't await - let it run in background for faster response
      aiProvider.setProvider(updates.ai_provider).catch(err => {
        logger.warn('[settings] Provider switch failed:', err.message);
      });
    } catch (err) {
      logger.warn('[settings] Provider switch failed:', err.message);
    }
  }

  const finalSettings = await db.getAllSettings();
  res.success(finalSettings, 'Settings updated successfully');
}));

/**
 * POST /test-ollama - Test Ollama connection
 */
router.post('/test-ollama', tryCatch(async (req, res) => {
  const { url } = req.body;
  const testUrl = url || ollamaService.baseUrl;

  if (!testUrl) return res.success({ connected: false, error: 'Ollama URL not configured' });

  try {
    const parsed = new URL(testUrl);
    if (isPrivateAddress(parsed.hostname) && process.env.NODE_ENV === 'production') {
      return res.success({ connected: false, url: testUrl, error: 'Cannot test connections to private addresses in production' });
    }
  } catch {
    return res.success({ connected: false, url: testUrl, error: 'Invalid URL format' });
  }

  try {
    const response = await axios.get(`${testUrl}/api/tags`, { timeout: 5000 });
    const models = response.data.models || [];
    res.success({ 
      connected: true, 
      url: testUrl, 
      modelCount: models.length, 
      models: models.map(m => m.name) 
    });
  } catch (error) {
    res.success({ connected: false, url: testUrl, error: error.message });
  }
}));

/**
 * POST /test-groq - Test Groq API key
 */
router.post('/test-groq', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('groq_api_key'));
  
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  
  try {
    const response = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const models = response.data?.data || [];
    res.success({ 
      valid: true, 
      modelCount: models.length, 
      models: models.map(m => m.id).slice(0, 20) 
    });
  } catch (error) {
    res.success({ 
      valid: false, 
      error: error.response?.status === 401 ? 'Invalid API key' : error.message 
    });
  }
}));

/**
 * POST /test-openai - Test OpenAI API key
 */
router.post('/test-openai', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('openai_api_key'));
  
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const models = response.data?.data || [];
    res.success({ valid: true, modelCount: models.length });
  } catch (error) {
    res.success({ 
      valid: false, 
      error: error.response?.status === 401 ? 'Invalid API key' : error.message 
    });
  }
}));

/**
 * POST /test-openclaw - Test OpenClaw connection
 */
router.post('/test-openclaw', tryCatch(async (req, res) => {
  try {
    const health = await openclawService.healthCheck();
    res.success({ 
      connected: health.connected, 
      url: openclawService.baseUrl, 
      model: health.model, 
      error: health.error 
    });
  } catch (error) {
    res.success({ connected: false, error: error.message });
  }
}));

/**
 * POST /test-serper - Test Serper API key
 */
router.post('/test-serper', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('serper_api_key'));
  
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  
  try {
    const response = await axios.post('https://google.serper.dev/search', { q: 'test', num: 1 }, {
      headers: { 'X-API-KEY': apiKey }, 
      timeout: 5000
    });
    res.success({ 
      valid: true, 
      credits: response.headers['x-credits-remaining'] || 'unknown' 
    });
  } catch (error) {
    res.success({ 
      valid: false, 
      error: error.response?.status === 403 ? 'Invalid API key' : error.message 
    });
  }
}));

/**
 * POST /test-anthropic - Test Anthropic API key
 */
router.post('/test-anthropic', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || (await db.getSetting('anthropic_api_key'));
  
  if (!apiKey) return res.success({ valid: false, error: 'No API key provided' });
  
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307', 
      max_tokens: 5, 
      messages: [{ role: 'user', content: 'hi' }],
    }, {
      headers: { 
        'x-api-key': apiKey, 
        'anthropic-version': '2023-06-01', 
        'Content-Type': 'application/json' 
      },
      timeout: 15000,
    });
    res.success({ valid: true, model: response.data?.model || 'claude' });
  } catch (error) {
    const status = error.response?.status;
    res.success({ 
      valid: false, 
      error: (status === 401 || status === 403) ? 'Invalid API key' : error.message 
    });
  }
}));

/**
 * GET /settings/metrics - Get metrics from active AI provider
 */
router.get('/metrics', tryCatch(async (req, res) => {
  const metrics = aiProvider.getMetrics();
  const config = aiProvider.getConfig();
  res.success({ metrics, config });
}));

/**
 * POST /test-twilio - Test Twilio credentials
 */
router.post('/test-twilio', tryCatch(async (req, res) => {
  const { sid, token } = req.body;
  const accountSid = sid || (await db.getSetting('twilio_account_sid'));
  const authToken = token || (await db.getSetting('twilio_auth_token'));
  
  if (!accountSid || !authToken) {
    return res.success({ valid: false, error: 'Account SID and Auth Token required' });
  }
  
  try {
    const response = await axios.get(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      auth: { username: accountSid, password: authToken }, 
      timeout: 10000,
    });
    res.success({ valid: true, friendlyName: response.data?.friendly_name || accountSid });
  } catch (error) {
    res.success({ 
      valid: false, 
      error: error.response?.status === 401 ? 'Invalid credentials' : error.message 
    });
  }
}));

/**
 * POST /test-telegram - Test Telegram Bot Token
 */
router.post('/test-telegram', tryCatch(async (req, res) => {
  const { token } = req.body;
  const botToken = token || (await db.getSetting('telegram_bot_token'));
  
  if (!botToken) return res.success({ valid: false, error: 'Bot token is required' });
  
  try {
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

export default router;
