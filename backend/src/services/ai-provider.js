// AI Provider Manager — switches between Ollama (local) and Groq (cloud)
// Exposes the same interface regardless of active provider

import { ollamaService } from './ollama.js';
import { groqService } from './groq.js';
import { db } from './database.js';

class AIProviderManager {
  constructor() {
    this.providers = {
      ollama: ollamaService,
      groq: groqService,
    };
    this._activeProvider = 'ollama';
  }

  get activeProviderName() {
    return this._activeProvider;
  }

  get active() {
    return this.providers[this._activeProvider];
  }

  setProvider(name) {
    if (!this.providers[name]) {
      throw new Error(`Unknown AI provider: ${name}. Available: ${Object.keys(this.providers).join(', ')}`);
    }
    this._activeProvider = name;
    console.log(`[ai-provider] Switched to: ${name}`);
  }

  getProvider(name) {
    return this.providers[name] || null;
  }

  getAvailableProviders() {
    return Object.keys(this.providers).map(name => {
      const svc = this.providers[name];
      return {
        name,
        active: name === this._activeProvider,
        defaultModel: svc.defaultModel,
        hasApiKey: name === 'groq' ? !!svc.apiKey : true,
      };
    });
  }

  // Load saved provider preference from database
  loadFromSettings() {
    try {
      const provider = db.getSetting('ai_provider');
      if (provider && this.providers[provider]) {
        this._activeProvider = provider;
      }

      // Apply Groq settings
      const groqKey = db.getSetting('groq_api_key');
      const groqModel = db.getSetting('groq_model');
      const groqTemp = db.getSetting('groq_temperature');
      if (groqKey || groqModel || groqTemp) {
        groqService.configure({
          apiKey: groqKey || groqService.apiKey,
          defaultModel: groqModel || groqService.defaultModel,
          temperature: groqTemp ? parseFloat(groqTemp) : groqService.defaultTemperature,
        });
      }

      // Apply Ollama settings
      const ollamaUrl = db.getSetting('ollama_url');
      const ollamaModel = db.getSetting('ollama_model');
      const ollamaTemp = db.getSetting('ollama_temperature');
      const configUpdate = {};
      if (ollamaUrl) configUpdate.baseUrl = ollamaUrl;
      if (ollamaModel) configUpdate.defaultModel = ollamaModel;
      if (ollamaTemp) configUpdate.temperature = parseFloat(ollamaTemp);
      if (Object.keys(configUpdate).length > 0) {
        ollamaService.configure(configUpdate);
      }

      console.log(`[ai-provider] Loaded settings — active: ${this._activeProvider}`);
    } catch (err) {
      console.warn('[ai-provider] Could not load settings:', err.message);
    }
  }

  // Delegate core methods to active provider
  async listAvailableModels() { return this.active.listAvailableModels(); }
  async healthCheck() { return this.active.healthCheck(); }
  getRecommendedModel(task) { return this.active.getRecommendedModel(task); }
  async generate(prompt, options) { return this.active.generate(prompt, options); }
  async *generateStream(prompt, options) { yield* this.active.generateStream(prompt, options); }
  async pullModel(name, onProgress) { return this.active.pullModel(name, onProgress); }
  async deleteModel(name) { return this.active.deleteModel(name); }
  getLeadScoringPrompt(lead) { return this.active.getLeadScoringPrompt(lead); }
  getBlueprintAnalysisPrompt(data) { return this.active.getBlueprintAnalysisPrompt(data); }
  getChatPrompt(message, history) { return this.active.getChatPrompt(message, history); }
  async scoreLead(lead, model) { return this.active.scoreLead(lead, model); }
  getConfig() { return { ...this.active.getConfig(), provider: this._activeProvider }; }
  getMetrics() { return { ...this.active.getMetrics(), provider: this._activeProvider }; }

  get defaultModel() { return this.active.defaultModel; }
  get modelRecommendations() { return this.active.modelRecommendations; }
}

export const aiProvider = new AIProviderManager();
