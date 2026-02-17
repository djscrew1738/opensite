// Settings API routes - CRUD for app configuration

import express from 'express';
import { db } from '../services/database.js';
import { ollamaService } from '../services/ollama.js';
import { groqService } from '../services/groq.js';
import { aiProvider } from '../services/ai-provider.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// Get all settings
router.get('/', tryCatch(async (req, res) => {
  const settings = db.getAllSettings();

  // Mask API keys for security
  for (const keyName of ['serper_api_key', 'google_places_api_key', 'groq_api_key']) {
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
  for (const keyName of ['serper_api_key', 'google_places_api_key', 'groq_api_key']) {
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

// Get metrics from active provider
router.get('/metrics', tryCatch(async (req, res) => {
  const metrics = aiProvider.getMetrics();
  const config = aiProvider.getConfig();
  res.success({ metrics, config });
}));

export default router;
