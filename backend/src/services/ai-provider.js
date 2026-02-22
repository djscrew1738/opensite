/**
 * AI Provider Manager — Enhanced with unified interface and intelligent fallback
 * Switches between Ollama, Groq, Anthropic, and OpenClaw with automatic failover
 */

import { ollamaService } from './ollama.js';
import { groqService } from './groq.js';
import { openclawService } from './openclaw.js';
import { anthropicService } from './anthropic.js';
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
    };
    this._activeProvider = 'groq';
    this._fallbackOrder = ['groq', 'anthropic', 'openclaw', 'ollama'];
    this._healthCache = new Map();
    this._lastHealthCheck = 0;
    
    // Start periodic health monitoring
    this._startHealthMonitor();
  }

  get activeProviderName() { return this._activeProvider; }
  get active() { return this.providers[this._activeProvider]; }
  get fallbackOrder() { return this._fallbackOrder; }

  /**
   * Set active provider with validation
   */
  setProvider(name) {
    if (!this.providers[name]) {
      throw new Error(`Unknown AI provider: "${name}". Available: ${Object.keys(this.providers).join(', ')}`);
    }
    this._activeProvider = name;
    db.setSetting('ai_provider', name);
    logger.info(`[ai-provider] Switched to: ${name}`);
  }

  setFallbackOrder(order) {
    const valid = order.filter(p => this.providers[p]);
    this._fallbackOrder = valid;
    logger.info(`[ai-provider] Fallback order: ${valid.join(' -> ')}`);
  }

  getProvider(name) { return this.providers[name] || null; }

  /**
   * Get detailed provider status with health info
   */
  getAvailableProviders() {
    const groqKey = db.getSetting('groq_api_key');
    const anthropicKey = db.getSetting('anthropic_api_key');

    return Object.entries(this.providers).map(([name, service]) => {
      const health = this._healthCache.get(name);
      const isCloud = name === 'groq' || name === 'anthropic';
      
      return {
        name,
        label: this._getProviderLabel(name),
        active: this._activeProvider === name,
        defaultModel: service.defaultModel,
        hasApiKey: isCloud 
          ? !!(service.apiKey || (name === 'groq' ? groqKey : anthropicKey))
          : true,
        health: health || { status: 'unknown', lastCheck: null },
        description: this._getProviderDescription(name),
        metrics: service.getMetrics ? service.getMetrics() : null,
      };
    });
  }

  _getProviderLabel(name) {
    const labels = {
      ollama: 'Ollama (Local)',
      groq: 'Groq Cloud',
      anthropic: 'Anthropic (Claude)',
      openclaw: 'OpenClaw Gateway',
    };
    return labels[name] || name;
  }

  _getProviderDescription(name) {
    const descriptions = {
      ollama: 'Local LLM — privacy-first, no API cost',
      groq: 'Fast cloud inference — Llama 4, 3.3 70B',
      anthropic: 'Claude Haiku / Sonnet — 200k context',
      openclaw: 'Local AI gateway — OpenAI-compatible, 200k context',
    };
    return descriptions[name] || '';
  }

  /**
   * Load all provider settings from the database.
   * Called on server startup after DB is ready.
   */
  loadFromSettings() {
    try {
      // Active provider
      const savedProvider = db.getSetting('ai_provider');
      if (savedProvider && this.providers[savedProvider]) {
        this._activeProvider = savedProvider;
      } else {
        // Auto-select best configured provider
        const groqKey = db.getSetting('groq_api_key');
        const anthropicKey = db.getSetting('anthropic_api_key');
        if (groqKey) this._activeProvider = 'groq';
        else if (anthropicKey) this._activeProvider = 'anthropic';
        else this._activeProvider = 'openclaw';
      }

      // Configure all providers
      this._configureProviders();

      // Initialize optimizer with fallback order
      aiOptimizer.fallbackOrder = this._fallbackOrder;

      logger.info(`[ai-provider] Loaded settings — active: ${this._activeProvider}`);
      logger.info(`[ai-provider] Fallback chain: ${this._fallbackOrder.join(' -> ')}`);
    } catch (err) {
      logger.warn('[ai-provider] Could not load settings:', err.message);
    }
  }

  _configureProviders() {
    // Groq
    const groqKey = db.getSetting('groq_api_key');
    const groqModel = db.getSetting('groq_model');
    const groqTemp = db.getSetting('groq_temperature');
    if (groqKey || groqModel || groqTemp) {
      groqService.configure({
        apiKey: groqKey || groqService.apiKey,
        defaultModel: groqModel || groqService.defaultModel,
        temperature: groqTemp ? parseFloat(groqTemp) : undefined,
      });
    }

    // Anthropic
    const anthropicKey = db.getSetting('anthropic_api_key');
    const anthropicModel = db.getSetting('anthropic_model');
    const anthropicTemp = db.getSetting('anthropic_temperature');
    if (anthropicKey || anthropicModel || anthropicTemp) {
      anthropicService.configure({
        apiKey: anthropicKey || anthropicService.apiKey,
        defaultModel: anthropicModel || anthropicService.defaultModel,
        temperature: anthropicTemp ? parseFloat(anthropicTemp) : undefined,
      });
    }

    // Ollama
    const ollamaUrl = db.getSetting('ollama_url');
    const ollamaModel = db.getSetting('ollama_model');
    const ollamaTemp = db.getSetting('ollama_temperature');
    const ollamaConfig = {};
    if (ollamaUrl) ollamaConfig.baseUrl = ollamaUrl;
    if (ollamaModel) ollamaConfig.defaultModel = ollamaModel;
    if (ollamaTemp) ollamaConfig.temperature = parseFloat(ollamaTemp);
    if (Object.keys(ollamaConfig).length > 0) ollamaService.configure(ollamaConfig);

    // OpenClaw
    const openclawUrl = db.getSetting('openclaw_url');
    const openclawToken = db.getSetting('openclaw_token');
    const openclawModel = db.getSetting('openclaw_model');
    const openclawTemp = db.getSetting('openclaw_temperature');
    const ocConfig = {};
    if (openclawUrl) ocConfig.baseUrl = openclawUrl;
    if (openclawToken) ocConfig.apiKey = openclawToken;
    if (openclawModel) ocConfig.defaultModel = openclawModel;
    if (openclawTemp) ocConfig.temperature = parseFloat(openclawTemp);
    if (Object.keys(ocConfig).length > 0) openclawService.configure(ocConfig);
  }

  // ── Core delegation with fallback ──

  async listAvailableModels() { return this.active.listAvailableModels(); }
  
  async healthCheck() { 
    const result = await this.active.healthCheck();
    this._updateHealthCache(this._activeProvider, result);
    return result;
  }

  async healthCheckAll() {
    const results = {};
    for (const [name, service] of Object.entries(this.providers)) {
      try {
        results[name] = await service.healthCheck();
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
    // Periodic health checks every 60 seconds
    setInterval(async () => {
      for (const name of Object.keys(this.providers)) {
        try {
          const health = await this.providers[name].healthCheck();
          this._updateHealthCache(name, health);
        } catch (err) {
          this._healthCache.set(name, {
            status: 'error',
            error: err.message,
            lastCheck: Date.now(),
          });
        }
      }
    }, 60000);
  }

  getRecommendedModel(task) { return this.active.getRecommendedModel(task); }
  get defaultModel() { return this.active.defaultModel; }
  get modelRecommendations() { return this.active.modelRecommendations; }

  /**
   * Generate with automatic fallback on failure
   */
  async generate(prompt, options = {}) {
    const providers = this._getProviderChain(options.provider);
    const errors = [];

    for (const providerName of providers) {
      try {
        const service = this.providers[providerName];
        const result = await service.generate(prompt, options);

        if (result.success) {
          this._updateHealthCache(providerName, { connected: true });
          return {
            ...result,
            provider: providerName,
            isFallback: providerName !== this._activeProvider,
          };
        } else {
          errors.push(`${providerName}: ${result.error}`);
          this._updateHealthCache(providerName, { connected: false, error: result.error });
        }
      } catch (error) {
        errors.push(`${providerName}: ${error.message}`);
        this._updateHealthCache(providerName, { connected: false, error: error.message });
        logger.warn(`[ai-provider] ${providerName} failed:`, error.message);
      }
    }

    throw new Error(`All AI providers failed: ${errors.join('; ')}`);
  }

  /**
   * Stream with fallback
   */
  async *generateStream(prompt, options = {}) {
    const providers = this._getProviderChain(options.provider);

    for (const providerName of providers) {
      try {
        const service = this.providers[providerName];
        let success = false;

        for await (const chunk of service.generateStream(prompt, options)) {
          if (chunk && !chunk.startsWith('Error:')) {
            success = true;
            yield {
              chunk,
              provider: providerName,
              isFallback: providerName !== this._activeProvider,
            };
          }
        }

        if (success) {
          this._updateHealthCache(providerName, { connected: true });
          return;
        }
      } catch (error) {
        this._updateHealthCache(providerName, { connected: false, error: error.message });
        logger.warn(`[ai-provider] ${providerName} stream failed:`, error.message);
      }
    }

    yield { error: 'All providers failed', chunk: '' };
  }

  /**
   * Get provider chain for fallback
   */
  _getProviderChain(preferred = null) {
    const chain = [];

    if (preferred && this.providers[preferred]) {
      chain.push(preferred);
    }

    if (!chain.includes(this._activeProvider)) {
      chain.push(this._activeProvider);
    }

    for (const name of this._fallbackOrder) {
      if (!chain.includes(name) && this.providers[name]) {
        chain.push(name);
      }
    }

    return chain;
  }

  /**
   * Chat-optimized generation with fallback
   */
  async generateChat(message, history = [], options = {}) {
    const providers = this._getProviderChain(options.provider);
    const errors = [];

    for (const providerName of providers) {
      try {
        const service = this.providers[providerName];
        let result;

        if (typeof service.getChatMessages === 'function') {
          const { system, messages } = service.getChatMessages(message, history);
          result = await service.generate('', { ...options, system, messages });
        } else {
          const prompt = service.getChatPrompt(message, history);
          result = await service.generate(prompt, options);
        }

        if (result.success) {
          this._updateHealthCache(providerName, { connected: true });
          return {
            ...result,
            provider: providerName,
            isFallback: providerName !== this._activeProvider,
          };
        } else {
          errors.push(`${providerName}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${providerName}: ${error.message}`);
        logger.warn(`[ai-provider] ${providerName} chat failed:`, error.message);
      }
    }

    throw new Error(`All providers failed: ${errors.join('; ')}`);
  }

  async *generateChatStream(message, history = [], options = {}) {
    const providers = this._getProviderChain(options.provider);

    for (const providerName of providers) {
      try {
        const service = this.providers[providerName];
        let success = false;

        let stream;
        if (typeof service.getChatMessages === 'function') {
          const { system, messages } = service.getChatMessages(message, history);
          stream = service.generateStream('', { ...options, system, messages });
        } else {
          const prompt = service.getChatPrompt(message, history);
          stream = service.generateStream(prompt, options);
        }

        for await (const chunk of stream) {
          if (chunk && !chunk.startsWith('Error:')) {
            success = true;
            yield {
              chunk,
              provider: providerName,
              isFallback: providerName !== this._activeProvider,
            };
          }
        }

        if (success) return;
      } catch (error) {
        logger.warn(`[ai-provider] ${providerName} chat stream failed:`, error.message);
      }
    }

    yield { error: 'All providers failed', chunk: '' };
  }

  // ── Model management ──

  async pullModel(name, onProgress) { return this.active.pullModel(name, onProgress); }
  async deleteModel(name) { return this.active.deleteModel(name); }

  // ── Prompt helpers ──

  getLeadScoringPrompt(lead) { return this.active.getLeadScoringPrompt(lead); }
  getBlueprintAnalysisPrompt(data) { return this.active.getBlueprintAnalysisPrompt(data); }
  getChatPrompt(message, history) { return this.active.getChatPrompt(message, history); }

  async scoreLead(lead, model) {
    const providers = this._getProviderChain();
    const errors = [];

    for (const providerName of providers) {
      try {
        const service = this.providers[providerName];
        if (typeof service.scoreLead !== 'function') continue;

        const result = await service.scoreLead(lead, model);
        if (result.score !== undefined) {
          return {
            ...result,
            provider: providerName,
            isFallback: providerName !== this._activeProvider,
          };
        }
      } catch (error) {
        errors.push(`${providerName}: ${error.message}`);
      }
    }

    // Rule-based fallback
    return this._ruleBasedScoring(lead);
  }

  _ruleBasedScoring(lead) {
    let score = 50;
    if (lead.value > 100000) score += 25;
    else if (lead.value > 50000) score += 15;
    else if (lead.value > 25000) score += 10;

    const dfw = ['dallas', 'fort worth', 'dfw', 'plano', 'frisco', 'arlington', 'irving'];
    if (dfw.some(k => (lead.location || '').toLowerCase().includes(k))) score += 15;

    const com = ['commercial', 'multi-family', 'apartment', 'complex'];
    if (com.some(k => (lead.projectType || '').toLowerCase().includes(k))) score += 10;

    score = Math.max(0, Math.min(100, score));
    return {
      score,
      status: score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold',
      reasoning: 'Rule-based scoring (AI unavailable)',
      provider: 'rules',
    };
  }

  // ── Config/Metrics ──

  getConfig() {
    return {
      ...this.active.getConfig(),
      provider: this._activeProvider,
      fallbackOrder: this._fallbackOrder,
    };
  }

  getMetrics() {
    return {
      active: {
        provider: this._activeProvider,
        ...this.active.getMetrics(),
      },
      all: Object.fromEntries(
        Object.entries(this.providers).map(([name, service]) => [
          name,
          service.getMetrics ? service.getMetrics() : null,
        ])
      ),
      health: Object.fromEntries(this._healthCache),
    };
  }

  getCacheStats() {
    return aiOptimizer.getStats();
  }
}

export const aiProvider = new AIProviderManager();
export default aiProvider;
