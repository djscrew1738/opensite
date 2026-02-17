// Settings API routes - CRUD for app configuration

import express from 'express';
import { db } from '../services/database.js';
import { ollamaService } from '../services/ollama.js';
import { tryCatch } from '../utils/response.js';

const router = express.Router();

// Get all settings
router.get('/', tryCatch(async (req, res) => {
  const settings = db.getAllSettings();
  // Mask API keys for security
  if (settings.serper_api_key) {
    const key = settings.serper_api_key;
    settings.serper_api_key_masked = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
    settings.serper_api_key_configured = key.length > 0;
    delete settings.serper_api_key;
  }
  if (settings.google_places_api_key) {
    const key = settings.google_places_api_key;
    settings.google_places_api_key_masked = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
    settings.google_places_api_key_configured = key.length > 0;
    delete settings.google_places_api_key;
  }
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

  if (updates.ollama_url) {
    try {
      new URL(updates.ollama_url);
    } catch {
      return res.error('Invalid Ollama URL', 'VALIDATION_ERROR', null, 400);
    }
  }

  // Save to database
  db.setSettings(updates);

  // Apply AI-related settings to the Ollama service at runtime
  const configUpdate = {};
  if (updates.ollama_url) configUpdate.baseUrl = updates.ollama_url;
  if (updates.ollama_model) configUpdate.defaultModel = updates.ollama_model;
  if (updates.ollama_temperature !== undefined) configUpdate.temperature = parseFloat(updates.ollama_temperature);

  if (Object.keys(configUpdate).length > 0) {
    ollamaService.configure(configUpdate);
  }

  const settings = db.getAllSettings();
  // Mask API keys
  if (settings.serper_api_key) {
    const key = settings.serper_api_key;
    settings.serper_api_key_masked = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
    settings.serper_api_key_configured = key.length > 0;
    delete settings.serper_api_key;
  }
  if (settings.google_places_api_key) {
    const key = settings.google_places_api_key;
    settings.google_places_api_key_masked = key ? `${key.slice(0, 4)}...${key.slice(-4)}` : '';
    settings.google_places_api_key_configured = key.length > 0;
    delete settings.google_places_api_key;
  }

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

// Get Ollama metrics
router.get('/metrics', tryCatch(async (req, res) => {
  const metrics = ollamaService.getMetrics();
  const config = ollamaService.getConfig();
  res.success({ metrics, config });
}));

export default router;
