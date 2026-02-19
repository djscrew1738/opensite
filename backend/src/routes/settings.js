// Settings API routes - CRUD for app configuration

import express from 'express';
import { db } from '../services/database.js';
import { ollamaService } from '../services/ollama.js';
import { groqService } from '../services/groq.js';
import { openclawService } from '../services/openclaw.js';
import { anthropicService } from '../services/anthropic.js';
import { aiProvider } from '../services/ai-provider.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// Get all settings
router.get('/', tryCatch(async (req, res) => {
  const settings = db.getAllSettings();

  // Mask API keys for security
  for (const keyName of ['serper_api_key', 'google_places_api_key', 'groq_api_key', 'openclaw_token', 'anthropic_api_key', 'openai_api_key', 'twilio_account_sid', 'twilio_auth_token', 'sendgrid_api_key', 'stripe_api_key', 'google_maps_api_key']) {
    if (settings[keyName]) {
      const key = settings[keyName];
      settings[`${keyName}_masked`] = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
      settings[`${keyName}_configured`] = key.length > 0;
      delete settings[keyName];
    }
  }

  // Add current provider info
  settings.ai_provider = aiProvider.activeProviderName;
  settings.ai_providers = aiProvider.getAvailableProviders();

  res.success(settings);
}));

// Update settings (partial merge)
router.put('/', tryCatch(async (req, res) => {
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res.error('No settings provided', 'VALIDATION_ERROR', null, 400);
  }

  // Validate specific settings
  if (updates.ollama_temperature !== undefined) {
    const temp = parseFloat(updates.ollama_temperature);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      return res.error('Temperature must be between 0.0 and 1.0', 'VALIDATION_ERROR', null, 400);
    }
    updates.ollama_temperature = String(temp);
  }

  if (updates.groq_temperature !== undefined) {
    const temp = parseFloat(updates.groq_temperature);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      return res.error('Temperature must be between 0.0 and 1.0', 'VALIDATION_ERROR', null, 400);
    }
    updates.groq_temperature = String(temp);
  }

  if (updates.openclaw_temperature !== undefined) {
    const temp = parseFloat(updates.openclaw_temperature);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      return res.error('Temperature must be between 0.0 and 1.0', 'VALIDATION_ERROR', null, 400);
    }
    updates.openclaw_temperature = String(temp);
  }

  if (updates.anthropic_temperature !== undefined) {
    const temp = parseFloat(updates.anthropic_temperature);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      return res.error('Temperature must be between 0.0 and 1.0', 'VALIDATION_ERROR', null, 400);
    }
    updates.anthropic_temperature = String(temp);
  }

  if (updates.openclaw_url) {
    try {
      new URL(updates.openclaw_url);
    } catch {
      return res.error('Invalid OpenClaw URL', 'VALIDATION_ERROR', null, 400);
    }
  }

  if (updates.ollama_url) {
    try {
      new URL(updates.ollama_url);
    } catch {
      return res.error('Invalid Ollama URL', 'VALIDATION_ERROR', null, 400);
    }
  }

  // Save to database
  db.setSettings(updates);

  // Apply Ollama settings at runtime
  const ollamaConfig = {};
  if (updates.ollama_url) ollamaConfig.baseUrl = updates.ollama_url;
  if (updates.ollama_model) ollamaConfig.defaultModel = updates.ollama_model;
  if (updates.ollama_temperature !== undefined) ollamaConfig.temperature = parseFloat(updates.ollama_temperature);
  if (Object.keys(ollamaConfig).length > 0) {
    ollamaService.configure(ollamaConfig);
  }

  // Apply Groq settings at runtime
  const groqConfig = {};
  if (updates.groq_api_key) groqConfig.apiKey = updates.groq_api_key;
  if (updates.groq_model) groqConfig.defaultModel = updates.groq_model;
  if (updates.groq_temperature !== undefined) groqConfig.temperature = parseFloat(updates.groq_temperature);
  if (Object.keys(groqConfig).length > 0) {
    groqService.configure(groqConfig);
  }

  // Apply Anthropic settings at runtime
  const anthropicConfig = {};
  if (updates.anthropic_api_key) anthropicConfig.apiKey = updates.anthropic_api_key;
  if (updates.anthropic_model) anthropicConfig.defaultModel = updates.anthropic_model;
  if (updates.anthropic_temperature !== undefined) anthropicConfig.temperature = parseFloat(updates.anthropic_temperature);
  if (Object.keys(anthropicConfig).length > 0) {
    anthropicService.configure(anthropicConfig);
  }

  // Apply OpenClaw settings at runtime
  const openclawConfig = {};
  if (updates.openclaw_url) openclawConfig.baseUrl = updates.openclaw_url;
  if (updates.openclaw_token) openclawConfig.apiKey = updates.openclaw_token;
  if (updates.openclaw_model) openclawConfig.defaultModel = updates.openclaw_model;
  if (updates.openclaw_temperature !== undefined) openclawConfig.temperature = parseFloat(updates.openclaw_temperature);
  if (Object.keys(openclawConfig).length > 0) {
    openclawService.configure(openclawConfig);
  }

  // Switch provider if requested
  if (updates.ai_provider) {
    try {
      aiProvider.setProvider(updates.ai_provider);
    } catch (err) {
      // Don't fail the whole request over this
      console.warn('Provider switch failed:', err.message);
    }
  }

  const settings = db.getAllSettings();
  // Mask API keys
  for (const keyName of ['serper_api_key', 'google_places_api_key', 'groq_api_key', 'openclaw_token', 'anthropic_api_key', 'openai_api_key', 'twilio_account_sid', 'twilio_auth_token', 'sendgrid_api_key', 'stripe_api_key', 'google_maps_api_key']) {
    if (settings[keyName]) {
      const key = settings[keyName];
      settings[`${keyName}_masked`] = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
      settings[`${keyName}_configured`] = key.length > 0;
      delete settings[keyName];
    }
  }

  settings.ai_provider = aiProvider.activeProviderName;
  res.success(settings, 'Settings updated');
}));

// Test Ollama connection
router.post('/test-ollama', tryCatch(async (req, res) => {
  const { url } = req.body;
  const testUrl = url || ollamaService.baseUrl;

  try {
    const { default: axios } = await import('axios');
    const response = await axios.get(`${testUrl}/api/tags`, { timeout: 5000 });
    const models = response.data.models || [];
    res.success({
      connected: true,
      url: testUrl,
      modelCount: models.length,
      models: models.map(m => m.name)
    });
  } catch (error) {
    res.success({
      connected: false,
      url: testUrl,
      error: error.message
    });
  }
}));

// Test Groq API key
router.post('/test-groq', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || db.getSetting('groq_api_key') || groqService.apiKey;

  if (!apiKey) {
    return res.success({ valid: false, error: 'No API key provided' });
  }

  try {
    const { default: axios } = await import('axios');
    const response = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const models = response.data?.data || [];
    res.success({
      valid: true,
      modelCount: models.length,
      models: models.filter(m => m.active !== false).map(m => m.id).slice(0, 20),
    });
  } catch (error) {
    const status = error.response?.status;
    res.success({
      valid: false,
      error: status === 401 ? 'Invalid API key' : error.message,
    });
  }
}));

// Test OpenClaw connection
router.post('/test-openclaw', tryCatch(async (req, res) => {
  const { url, token } = req.body;
  const testUrl = url || openclawService.baseUrl;
  const testToken = token || db.getSetting('openclaw_token') || openclawService.apiKey;

  try {
    const { default: axios } = await import('axios');
    const headers = { 'Content-Type': 'application/json' };
    if (testToken) headers['Authorization'] = `Bearer ${testToken}`;

    const response = await axios.post(`${testUrl}/v1/chat/completions`, {
      model: 'openclaw:main',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
    }, {
      headers,
      timeout: 15000,
    });

    const hasResponse = !!response.data?.choices?.[0]?.message?.content;
    res.success({
      connected: hasResponse,
      url: testUrl,
      model: response.data?.model || 'openclaw:main',
    });
  } catch (error) {
    res.success({
      connected: false,
      url: testUrl,
      error: error.response?.status === 401 ? 'Invalid token' : error.message,
    });
  }
}));

// Test Serper API key
router.post('/test-serper', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || db.getSetting('serper_api_key');

  if (!apiKey) {
    return res.success({ valid: false, error: 'No API key provided' });
  }

  try {
    const { default: axios } = await import('axios');
    const response = await axios.post('https://google.serper.dev/search', {
      q: 'test', num: 1
    }, {
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

// Test Anthropic API key
router.post('/test-anthropic', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || db.getSetting('anthropic_api_key');

  if (!apiKey) {
    return res.success({ valid: false, error: 'No API key provided' });
  }

  try {
    const { default: axios } = await import('axios');
    // Use a minimal message with the smallest model to validate the key
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-haiku-4-5',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'hi' }],
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    res.success({ valid: true, model: response.data?.model || 'claude' });
  } catch (error) {
    const status = error.response?.status;
    // 401/403 = bad key; 429 = rate limited (key is valid); 400 = model issue (key may be valid)
    if (status === 429) {
      return res.success({ valid: true, error: 'Rate limited — key is valid but temporarily throttled' });
    }
    if (status === 400) {
      // Bad request often means the key authenticated but the request was malformed or model unavailable
      const errMsg = error.response?.data?.error?.message || error.message;
      return res.success({ valid: true, error: `Key accepted — ${errMsg}` });
    }
    res.success({
      valid: false,
      error: status === 401 || status === 403 ? 'Invalid API key' : error.message,
    });
  }
}));

// Test OpenAI API key
router.post('/test-openai', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || db.getSetting('openai_api_key');

  if (!apiKey) {
    return res.success({ valid: false, error: 'No API key provided' });
  }

  try {
    const { default: axios } = await import('axios');
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const models = response.data?.data || [];
    res.success({
      valid: true,
      modelCount: models.length,
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      return res.success({ valid: true, error: 'Rate limited — key is valid but temporarily throttled' });
    }
    res.success({
      valid: false,
      error: status === 401 ? 'Invalid API key' : error.message,
    });
  }
}));

// Test Twilio credentials
router.post('/test-twilio', tryCatch(async (req, res) => {
  const { sid, token } = req.body;
  const accountSid = sid || db.getSetting('twilio_account_sid');
  const authToken = token || db.getSetting('twilio_auth_token');

  if (!accountSid || !authToken) {
    return res.success({ valid: false, error: 'Account SID and Auth Token are both required' });
  }

  try {
    const { default: axios } = await import('axios');
    const response = await axios.get(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      auth: { username: accountSid, password: authToken },
      timeout: 10000,
    });
    res.success({
      valid: true,
      friendlyName: response.data?.friendly_name || accountSid,
    });
  } catch (error) {
    const status = error.response?.status;
    res.success({
      valid: false,
      error: status === 401 ? 'Invalid credentials' : error.message,
    });
  }
}));

// Test SendGrid API key
router.post('/test-sendgrid', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || db.getSetting('sendgrid_api_key');

  if (!apiKey) {
    return res.success({ valid: false, error: 'No API key provided' });
  }

  try {
    const { default: axios } = await import('axios');
    const response = await axios.get('https://api.sendgrid.com/v3/user/profile', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    res.success({
      valid: true,
      username: response.data?.username || 'unknown',
    });
  } catch (error) {
    const status = error.response?.status;
    res.success({
      valid: false,
      error: status === 401 || status === 403 ? 'Invalid API key' : error.message,
    });
  }
}));

// Test Stripe API key
router.post('/test-stripe', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || db.getSetting('stripe_api_key');

  if (!apiKey) {
    return res.success({ valid: false, error: 'No API key provided' });
  }

  try {
    const { default: axios } = await import('axios');
    const response = await axios.get('https://api.stripe.com/v1/balance', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const balance = response.data?.available?.[0];
    res.success({
      valid: true,
      currency: balance?.currency?.toUpperCase() || 'USD',
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      return res.success({ valid: true, error: 'Rate limited — key is valid' });
    }
    res.success({
      valid: false,
      error: status === 401 ? 'Invalid API key' : error.message,
    });
  }
}));

// Test Google Maps API key
router.post('/test-google-maps', tryCatch(async (req, res) => {
  const { key } = req.body;
  const apiKey = key || db.getSetting('google_maps_api_key');

  if (!apiKey) {
    return res.success({ valid: false, error: 'No API key provided' });
  }

  try {
    const { default: axios } = await import('axios');
    // Use Geocoding API with a known address to validate the key
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: 'Dallas, TX', key: apiKey },
      timeout: 10000,
    });
    if (response.data?.status === 'OK') {
      res.success({ valid: true });
    } else if (response.data?.status === 'REQUEST_DENIED') {
      res.success({ valid: false, error: response.data?.error_message || 'Invalid or restricted API key' });
    } else {
      res.success({ valid: true, status: response.data?.status });
    }
  } catch (error) {
    res.success({
      valid: false,
      error: error.message,
    });
  }
}));

// Get metrics from active provider
router.get('/metrics', tryCatch(async (req, res) => {
  const metrics = aiProvider.getMetrics();
  const config = aiProvider.getConfig();
  res.success({ metrics, config });
}));

export default router;
