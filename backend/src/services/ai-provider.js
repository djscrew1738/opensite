/**
 * AI Provider Manager — Enhanced with unified interface and intelligent fallback
 * Switches between Ollama, Groq, Anthropic, OpenClaw, and OpenAI with automatic failover
 */

import { ollamaService } from './ollama.js';
import { groqService } from './groq.js';
import { openclawService } from './openclaw.js';
import { anthropicService } from './anthropic.js';
import { openaiService } from './openai.js';
import { db } from './database.js';
import { aiOptimizer } from './ai-optimizer.js';
import logger from './logger.js';

class AIProviderManager {
  constructor() {
    this.providers = {
      ollama:    ollamaService,
      groq:      groqService,
      anthropic: anthropicService,
      openclaw:  openclawService,
      openai:    openaiService,
    };
    this._activeProvider = 'openclaw';
    // Fallback order: Premium local first, then fast cloud, then quality cloud, then basic local
    this._fallbackOrder = ['openclaw', 'groq', 'openai', 'anthropic', 'ollama'];
    this._healthCache = new Map();
    this._lastHealthCheck = 0;
    this._healthCheckInterval = 60000; // 60s
    this._healthMonitorId = null;
    
    // Start periodic health monitoring
    this._startHealthMonitor();
  }

  get activeProviderName() { return this._activeProvider; }
  get active() { return this.providers[this._activeProvider] || this.providers.ollama; }
  get fallbackOrder() { return this._fallbackOrder; }

  /**
   * Set active provider with validation and persistence
   */
  async setProvider(name) {
    if (!this.providers[name]) {
      throw new Error(`Unknown AI provider: "${name}". Available: ${Object.keys(this.providers).join(', ')}`);
    }
    
    // Test connection before switching if it's not the current one
    if (this._activeProvider !== name) {
      try {
        const health = await this.providers[name].healthCheck();
        if (!health.connected) {
          logger.warn(`[ai-provider] Switching to potentially unhealthy provider: ${name}`, { error: health.error });
        }
      } catch (err) {
        logger.error(`[ai-provider] Health check failed during switch to ${name}:`, err.message);
      }
    }

    this._activeProvider = name;
    await db.setSetting('ai_provider', name);
    logger.info(`[ai-provider] Active provider set to: ${name}`);
    
    // Sync with optimizer
    if (aiOptimizer) {
      aiOptimizer.fallbackOrder = this._getProviderChain();
    }
  }

  setFallbackOrder(order) {
    const valid = order.filter(p => this.providers[p]);
    this._fallbackOrder = valid;
    logger.info(`[ai-provider] Fallback order updated: ${valid.join(' -> ')}`);
  }

  getProvider(name) { return this.providers[name] || null; }

  /**
   * Get detailed provider status with health info
   */
  async getAvailableProviders() {
    const groqKey = await db.getSetting('groq_api_key');
    const anthropicKey = await db.getSetting('anthropic_api_key');
    const openaiKey = await db.getSetting('openai_api_key');
    const openclawUrl = (await db.getSetting('openclaw_url')) || process.env.OPENCLAW_URL;

    const providerList = [];
    for (const [name, service] of Object.entries(this.providers)) {
      const health = this._healthCache.get(name);
      const isCloud = ['groq', 'anthropic', 'openai'].includes(name);
      const isLocal = ['ollama', 'openclaw'].includes(name);
      
      let hasApiKey = false;
      if (name === 'groq') hasApiKey = !!(service.apiKey || groqKey);
      else if (name === 'anthropic') hasApiKey = !!(service.apiKey || anthropicKey);
      else if (name === 'openai') hasApiKey = !!(service.apiKey || openaiKey);
      else if (name === 'openclaw') hasApiKey = !!openclawUrl;
      else if (name === 'ollama') hasApiKey = true; // Ollama is local, no key needed by default

      providerList.push({
        name,
        label: this._getProviderLabel(name),
        active: this._activeProvider === name,
        defaultModel: service.defaultModel,
        hasApiKey,
        health: health || { status: 'unknown', lastCheck: null },
        description: this._getProviderDescription(name),
        metrics: service.getMetrics ? service.getMetrics() : null,
        category: isCloud ? 'cloud' : 'local',
        priority: this._getProviderPriority(name),
      });
    }
    
    return providerList.sort((a, b) => a.priority - b.priority);
  }

  _getProviderPriority(name) {
    const priorities = {
      openclaw: 1,  // Best local
      groq: 2,      // Best cloud speed
      openai: 3,    // Standard cloud
      anthropic: 4, // High quality cloud
      ollama: 5,    // Basic local
    };
    return priorities[name] || 99;
  }

  _getProviderLabel(name) {
    const labels = {
      ollama: 'Ollama (Local)',
      groq: 'Groq Cloud',
      anthropic: 'Anthropic Claude',
      openai: 'OpenAI (GPT)',
      openclaw: 'OpenClaw Gateway',
    };
    return labels[name] || name;
  }

  _getProviderDescription(name) {
    const descriptions = {
      ollama: 'Local LLM — privacy-first, no API cost',
      groq: 'Fast cloud inference — Llama 3.3, 70B',
      anthropic: 'Claude 3.5 — excellent reasoning, 200k context',
      openai: 'GPT-4o — the industry standard',
      openclaw: 'Premium local AI gateway — persistent models, high context',
    };
    return descriptions[name] || '';
  }

  /**
   * Load all provider settings from the database.
   */
  async loadFromSettings() {
    try {
      const savedProvider = await db.getSetting('ai_provider');
      const openclawUrl = (await db.getSetting('openclaw_url')) || process.env.OPENCLAW_URL;
      const groqKey = await db.getSetting('groq_api_key');
      
      // If we have a saved provider, respect it. 
      // Otherwise, pick the best available one.
      if (savedProvider && this.providers[savedProvider]) {
        this._activeProvider = savedProvider;
      } else if (openclawUrl) {
        this._activeProvider = 'openclaw';
      } else if (groqKey) {
        this._activeProvider = 'groq';
      } else {
        this._activeProvider = 'ollama';
      }

      await this._configureProviders();
      
      if (aiOptimizer) {
        aiOptimizer.fallbackOrder = this._fallbackOrder;
      }

      logger.info(`[ai-provider] Initialization complete. Active: ${this._activeProvider}`);
    } catch (err) {
      logger.warn('[ai-provider] Initialization error:', err.message);
    }
  }

  async _configureProviders() {
    const settings = await db.getAllSettings();
    
    const configs = {
      groq: {
        apiKey: settings.groq_api_key || process.env.GROQ_API_KEY,
        defaultModel: settings.groq_model,
        temperature: settings.groq_temperature ? parseFloat(settings.groq_temperature) : undefined
      },
      anthropic: {
        apiKey: settings.anthropic_api_key || process.env.ANTHROPIC_API_KEY,
        defaultModel: settings.anthropic_model,
        temperature: settings.anthropic_temperature ? parseFloat(settings.anthropic_temperature) : undefined
      },
      openai: {
        apiKey: settings.openai_api_key || process.env.OPENAI_API_KEY,
        defaultModel: settings.openai_model,
        temperature: settings.openai_temperature ? parseFloat(settings.openai_temperature) : undefined
      },
      ollama: {
        baseUrl: settings.ollama_url || process.env.OLLAMA_URL,
        defaultModel: settings.ollama_model,
        temperature: settings.ollama_temperature ? parseFloat(settings.ollama_temperature) : undefined
      },
      openclaw: {
        baseUrl: settings.openclaw_url || process.env.OPENCLAW_URL,
        apiKey: settings.openclaw_token || process.env.OPENCLAW_TOKEN,
        defaultModel: settings.openclaw_model,
        temperature: settings.openclaw_temperature ? parseFloat(settings.openclaw_temperature) : undefined
      }
    };

    for (const [name, config] of Object.entries(configs)) {
      if (this.providers[name]) {
        // Only configure if we have some data or it's a local default
        if (config.apiKey || config.baseUrl || name === 'ollama') {
          this.providers[name].configure(config);
        }
      }
    }
  }

  async listAvailableModels(fromAll = false) {
    if (!fromAll) {
      return this.active.listAvailableModels();
    }
    
    const allModels = [];
    const providers = await this.getAvailableProviders();
    
    for (const p of providers) {
      try {
        const result = await this.providers[p.name].listAvailableModels();
        if (result.success && result.models) {
          allModels.push(...result.models.map(m => ({ ...m, provider: p.name })));
        }
      } catch (err) {
        logger.debug(`[ai-provider] Skipping models from ${p.name}: ${err.message}`);
      }
    }
    
    return {
      success: true,
      models: allModels,
      activeProvider: this._activeProvider,
      total: allModels.length,
    };
  }
  
  async healthCheck() { 
    const result = await this.active.healthCheck();
    this._updateHealthCache(this._activeProvider, result);
    return result;
  }

  async healthCheckAll() {
    const results = {};
    for (const name of Object.keys(this.providers)) {
      try {
        results[name] = await this.providers[name].healthCheck();
      } catch (err) {
        results[name] = { connected: false, error: err.message };
      }
      this._updateHealthCache(name, results[name]);
    }
    return results;
  }

  _updateHealthCache(name, result) {
    this._healthCache.set(name, {
      status: result.connected ? 'healthy' : 'unhealthy',
      lastCheck: Date.now(),
      ...result,
    });
  }

  _startHealthMonitor() {
    if (this._healthMonitorId) return;
    this._healthMonitorId = setInterval(() => this.healthCheckAll().catch(() => {}), this._healthCheckInterval);
  }

  stopHealthMonitor() {
    if (this._healthMonitorId) {
      clearInterval(this._healthMonitorId);
      this._healthMonitorId = null;
    }
  }

  async autoSelectProvider() {
    const providers = await this.getAvailableProviders();
    for (const p of providers) {
      const health = await this.providers[p.name].healthCheck();
      if (health.connected) {
        if (this._activeProvider !== p.name) {
          logger.info(`[ai-provider] Auto-switched to healthy provider: ${p.name}`);
          this._activeProvider = p.name;
        }
        return p.name;
      }
    }
    return this._activeProvider;
  }

  getRecommendedModel(task) { return this.active.getRecommendedModel(task); }
  get defaultModel() { return this.active.defaultModel; }
  get modelRecommendations() { return this.active.modelRecommendations; }

  async generate(prompt, options = {}) {
    const chain = this._getProviderChain(options.provider);
    const errors = [];

    for (const pName of chain) {
      try {
        const result = await this.providers[pName].generate(prompt, options);
        if (result.success) {
          this._updateHealthCache(pName, { connected: true });
          return { ...result, provider: pName, isFallback: pName !== this._activeProvider };
        }
        errors.push(`${pName}: ${result.error}`);
      } catch (err) {
        errors.push(`${pName}: ${err.message}`);
        this._updateHealthCache(pName, { connected: false, error: err.message });
      }
    }
    throw new Error(`AI generation failed on all providers: ${errors.join('; ')}`);
  }

  async *generateStream(prompt, options = {}) {
    const chain = this._getProviderChain(options.provider);
    for (const pName of chain) {
      try {
        let hasContent = false;
        for await (const chunk of this.providers[pName].generateStream(prompt, options)) {
          if (chunk && !chunk.startsWith('Error:')) {
            hasContent = true;
            yield { chunk, provider: pName, isFallback: pName !== this._activeProvider };
          }
        }
        if (hasContent) {
          this._updateHealthCache(pName, { connected: true });
          return;
        }
      } catch (err) {
        this._updateHealthCache(pName, { connected: false, error: err.message });
      }
    }
    yield { error: 'All providers failed', chunk: '' };
  }

  async generateChat(message, history = [], options = {}) {
    const chain = this._getProviderChain(options.provider);
    const errors = [];

    for (const pName of chain) {
      try {
        const service = this.providers[pName];
        let result;
        if (typeof service.generateChat === 'function') {
          result = await service.generateChat(message, history, options);
        } else {
          const { system, messages } = service.getChatMessages ? service.getChatMessages(message, history) : { messages: [{role:'user', content: message}] };
          result = await service.generate('', { ...options, system, messages });
        }

        if (result.success) {
          this._updateHealthCache(pName, { connected: true });
          return { ...result, provider: pName, isFallback: pName !== this._activeProvider };
        }
        errors.push(`${pName}: ${result.error}`);
      } catch (err) {
        errors.push(`${pName}: ${err.message}`);
      }
    }
    throw new Error(`AI Chat failed: ${errors.join('; ')}`);
  }

  async *generateChatStream(message, history = [], options = {}) {
    const chain = this._getProviderChain(options.provider);
    for (const pName of chain) {
      try {
        const service = this.providers[pName];
        let hasContent = false;
        const stream = service.generateChatStream ? service.generateChatStream(message, history, options) : service.generateStream(message, options);
        
        for await (const chunk of stream) {
          if (chunk && !chunk.startsWith('Error:')) {
            hasContent = true;
            yield { chunk, provider: pName, isFallback: pName !== this._activeProvider };
          }
        }
        if (hasContent) return;
      } catch (err) {
        logger.debug(`[ai-provider] Chat stream failed on ${pName}:`, err.message);
      }
    }
    yield { error: 'All providers failed', chunk: '' };
  }

  _getProviderChain(preferred = null) {
    const chain = [];
    if (preferred && this.providers[preferred]) chain.push(preferred);
    if (!chain.includes(this._activeProvider)) chain.push(this._activeProvider);
    for (const name of this._fallbackOrder) {
      if (!chain.includes(name)) chain.push(name);
    }
    return chain;
  }

  async pullModel(name, onProgress) { return this.active.pullModel(name, onProgress); }
  async deleteModel(name) { return this.active.deleteModel(name); }

  getLeadScoringPrompt(lead) { return this.active.getLeadScoringPrompt(lead); }
  getBlueprintAnalysisPrompt(data) { return this.active.getBlueprintAnalysisPrompt(data); }
  getChatPrompt(message, history) { return this.active.getChatPrompt(message, history); }

  getConfig() {
    return {
      ...this.active.getConfig(),
      activeProvider: this._activeProvider,
      fallbackOrder: this._fallbackOrder,
    };
  }

  getMetrics() {
    return {
      active: { provider: this._activeProvider, ...this.active.getMetrics() },
      all: Object.fromEntries(Object.entries(this.providers).map(([n, s]) => [n, s.getMetrics ? s.getMetrics() : null])),
      health: Object.fromEntries(this._healthCache),
    };
  }
}

export const aiProvider = new AIProviderManager();
export default aiProvider;
