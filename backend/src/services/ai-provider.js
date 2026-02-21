// AI Provider Manager — switches between Ollama, Groq, Anthropic, and OpenClaw
// Exposes a unified interface regardless of active provider

import { ollamaService } from './ollama.js';
import { groqService } from './groq.js';
import { openclawService } from './openclaw.js';
import { anthropicService } from './anthropic.js';
import { db } from './database.js';
import { aiOptimizer } from './ai-optimizer.js';

class AIProviderManager {
  constructor() {
    this.providers = {
      ollama:    ollamaService,
      groq:      groqService,
      anthropic: anthropicService,
      openclaw:  openclawService,
    };
    this._activeProvider = 'groq'; // Default to Groq (most likely to be configured)
  }

  get activeProviderName() { return this._activeProvider; }
  get active() { return this.providers[this._activeProvider]; }

  setProvider(name) {
    if (!this.providers[name]) {
      throw new Error(`Unknown AI provider: "${name}". Available: ${Object.keys(this.providers).join(', ')}`);
    }
    this._activeProvider = name;
    console.log(`[ai-provider] Switched to: ${name}`);
  }

  getProvider(name) { return this.providers[name] || null; }

  /**
   * Return provider status list with accurate key/availability info.
   */
  getAvailableProviders() {
    const groqKey = db.getSetting('groq_api_key');
    const anthropicKey = db.getSetting('anthropic_api_key');

    return [
      {
        name: 'groq',
        label: 'Groq Cloud',
        active: this._activeProvider === 'groq',
        defaultModel: groqService.defaultModel,
        hasApiKey: !!(groqService.apiKey || groqKey),
        description: 'Fast cloud inference — Llama 4, 3.3 70B',
      },
      {
        name: 'anthropic',
        label: 'Anthropic (Claude)',
        active: this._activeProvider === 'anthropic',
        defaultModel: anthropicService.defaultModel,
        hasApiKey: !!(anthropicService.apiKey || anthropicKey),
        description: 'Claude Haiku / Sonnet — 200k context',
      },
      {
        name: 'ollama',
        label: 'Ollama (Local)',
        active: this._activeProvider === 'ollama',
        defaultModel: ollamaService.defaultModel,
        hasApiKey: true,  // No key needed
        description: 'Local LLM — privacy-first, no API cost',
      },
      {
        name: 'openclaw',
        label: 'OpenClaw Gateway',
        active: this._activeProvider === 'openclaw',
        defaultModel: openclawService.defaultModel,
        hasApiKey: true,
        description: 'Local AI gateway — OpenAI-compatible, 200k context, no API cost',
      },
    ];
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

      // Initialize optimizer with current configuration
      aiOptimizer.fallbackOrder = ['openclaw', 'ollama', 'groq', 'anthropic'];
      
      console.log(`[ai-provider] Loaded settings — active: ${this._activeProvider}`);
      console.log(`[ai-provider] Optimizer initialized with cache and connection pooling`);
    } catch (err) {
      console.warn('[ai-provider] Could not load settings:', err.message);
    }
  }

  // ── Core delegation ──

  async listAvailableModels() { return this.active.listAvailableModels(); }
  async healthCheck() { return this.active.healthCheck(); }
  getRecommendedModel(task) { return this.active.getRecommendedModel(task); }
  get defaultModel() { return this.active.defaultModel; }
  get modelRecommendations() { return this.active.modelRecommendations; }

  async generate(prompt, options = {}) { return this.active.generate(prompt, options); }

  async *generateStream(prompt, options = {}) {
    yield* this.active.generateStream(prompt, options);
  }

  /**
   * Chat-optimized generation.
   * Uses structured messages array (system + history + new message) when the
   * active provider supports it (Anthropic, Groq). Falls back to prompt string
   * for Ollama/OpenClaw which use flat prompts.
   */
  async generateChat(message, history = [], options = {}) {
    if (typeof this.active.getChatMessages === 'function') {
      const { system, messages } = this.active.getChatMessages(message, history);
      return this.active.generate('', { ...options, system, messages });
    }
    // Fallback for providers without getChatMessages
    const prompt = this.active.getChatPrompt(message, history);
    return this.active.generate(prompt, options);
  }

  async *generateChatStream(message, history = [], options = {}) {
    if (typeof this.active.getChatMessages === 'function') {
      const { system, messages } = this.active.getChatMessages(message, history);
      yield* this.active.generateStream('', { ...options, system, messages });
    } else {
      const prompt = this.active.getChatPrompt(message, history);
      yield* this.active.generateStream(prompt, options);
    }
  }

  async pullModel(name, onProgress) { return this.active.pullModel(name, onProgress); }
  async deleteModel(name) { return this.active.deleteModel(name); }
  getLeadScoringPrompt(lead) { return this.active.getLeadScoringPrompt(lead); }
  getBlueprintAnalysisPrompt(data) { return this.active.getBlueprintAnalysisPrompt(data); }
  getChatPrompt(message, history) { return this.active.getChatPrompt(message, history); }
  async scoreLead(lead, model) { return this.active.scoreLead(lead, model); }
  getConfig() { return { ...this.active.getConfig(), provider: this._activeProvider }; }
  getMetrics() { return { ...this.active.getMetrics(), provider: this._activeProvider }; }
}

export const aiProvider = new AIProviderManager();
