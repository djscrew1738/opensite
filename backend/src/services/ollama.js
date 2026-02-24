/**
 * Ollama Local AI Service
 * Direct integration with local Ollama instance
 */

import axios from 'axios';
import { db } from './database.js';
import logger from './logger.js';

// Circuit breaker states
const CB_STATE = { CLOSED: 0, OPEN: 1, HALF_OPEN: 2 };

class OllamaService {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || 'llama3.1';
    this.temperature = config.temperature ?? 0.7;
    this.timeout = config.timeout || 120000;
    this.maxRetries = config.maxRetries || 2;

    // Circuit breaker
    this._cbState = CB_STATE.CLOSED;
    this._cbFailCount = 0;
    this._cbThreshold = 5;
    this._cbTimeout = 30000;
    this._cbNextAttempt = 0;

    // Metrics
    this._metrics = {
      requests: 0,
      errors: 0,
      totalLatency: 0,
      lastError: null,
    };

    this._initClient();
  }

  /**
   * Initialize axios client
   */
  _initClient() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: this.timeout,
    });

    this.client.interceptors.request.use(config => {
      config._startTime = Date.now();
      return config;
    });

    this.client.interceptors.response.use(
      response => {
        this._metrics.requests++;
        if (response.config._startTime) {
          this._metrics.totalLatency += Date.now() - response.config._startTime;
        }
        return response;
      },
      error => {
        this._metrics.requests++;
        this._metrics.errors++;
        this._metrics.lastError = error.message;
        throw error;
      }
    );
  }

  /**
   * Circuit breaker methods
   */
  _cbCanRequest() {
    if (this._cbState === CB_STATE.CLOSED) return true;
    if (this._cbState === CB_STATE.OPEN) {
      if (Date.now() >= this._cbNextAttempt) {
        this._cbState = CB_STATE.HALF_OPEN;
        return true;
      }
      return false;
    }
    return true;
  }

  _cbRecordSuccess() {
    this._cbFailCount = 0;
    this._cbState = CB_STATE.CLOSED;
  }

  _cbRecordFailure() {
    this._cbFailCount++;
    if (this._cbFailCount >= this._cbThreshold) {
      this._cbState = CB_STATE.OPEN;
      this._cbNextAttempt = Date.now() + this._cbTimeout;
      logger.warn(`[ollama] Circuit breaker opened, retry in 30s`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/api/tags', { timeout: 5000 });
      
      const models = response.data?.models || [];
      const hasDefault = models.some(m => m.name === this.defaultModel);
      
      return {
        connected: true,
        model: this.defaultModel,
        available: models.length,
        hasDefault,
        models: models.map(m => m.name).slice(0, 10),
      };
    } catch (error) {
      return {
        connected: false,
        model: null,
        error: error.message,
      };
    }
  }

  /**
   * Generate text
   */
  async generate(prompt, options = {}) {
    if (!this._cbCanRequest()) {
      return { success: false, error: 'Circuit breaker open' };
    }

    const model = options.model || this.defaultModel;
    const retries = options.retries ?? this.maxRetries;

    return this._withRetry(async () => {
      try {
        const payload = {
          model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? this.temperature,
            num_predict: options.maxTokens || 2048,
          },
        };

        // Add support for images (vision models like llava)
        if (options.images && Array.isArray(options.images)) {
          payload.images = options.images;
        }

        const response = await this.client.post('/api/generate', payload);

        this._cbRecordSuccess();

        return {
          success: true,
          response: response.data.response,
          model: response.data.model,
          provider: 'ollama',
        };
      } catch (error) {
        this._cbRecordFailure();
        
        if (error.response?.status === 404) {
          return { success: false, error: `Model "${model}" not found. Run: ollama pull ${model}` };
        }
        if (error.code === 'ECONNABORTED') {
          return { success: false, error: 'Request timeout' };
        }
        if (error.code === 'ECONNREFUSED') {
          return { success: false, error: 'Ollama not running' };
        }
        
        throw error;
      }
    }, retries);
  }

  /**
   * Stream generation
   */
  async *generateStream(prompt, options = {}) {
    if (!this._cbCanRequest()) {
      yield 'Error: Circuit breaker open';
      return;
    }

    const model = options.model || this.defaultModel;

    try {
      const response = await this.client.post('/api/generate', {
        model,
        prompt,
        stream: true,
        options: {
          temperature: options.temperature ?? this.temperature,
          num_predict: options.maxTokens || 2048,
        },
      }, { responseType: 'stream' });

      this._cbRecordSuccess();

      for await (const chunk of this._parseStream(response.data)) {
        if (chunk.response) yield chunk.response;
      }
    } catch (error) {
      this._cbRecordFailure();
      logger.error('[ollama] Stream error:', error.message);
      yield `Error: ${error.message}`;
    }
  }

  /**
   * Parse NDJSON stream
   */
  async *_parseStream(stream) {
    let buffer = '';
    
    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            yield JSON.parse(line);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer);
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  async _withRetry(fn, retries) {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i < retries) {
          const delay = Math.pow(2, i) * 1000;
          logger.debug(`[ollama] Retry ${i + 1}/${retries} after ${delay}ms`);
          await this._sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /**
   * List available models
   * Returns standardized format matching other AI providers
   */
  async listAvailableModels() {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data?.models || [];
      
      return {
        success: true,
        models: models.map(m => ({
          id: m.name,
          name: m.name,
          size: m.size,
          modified: m.modified_at,
          parameterSize: m.details?.parameter_size,
          provider: 'ollama',
        })),
        defaultModel: this.defaultModel,
        provider: 'ollama',
      };
    } catch (error) {
      logger.warn('[ollama] Failed to list models:', error.message);
      return {
        success: true,
        models: [
          { id: 'llama3.1', name: 'Llama 3.1', parameterSize: '8B', provider: 'ollama' },
          { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B', parameterSize: '7B', provider: 'ollama' },
        ],
        defaultModel: this.defaultModel,
        provider: 'ollama',
        cached: true,
      };
    }
  }

  /**
   * Get recommended model for task
   */
  getRecommendedModel(task) {
    const recommendations = {
      code: 'qwen2.5-coder:7b',
      chat: 'llama3.1',
      analysis: 'llama3.1',
      scoring: 'llama3.1',
    };
    return recommendations[task] || this.defaultModel;
  }

  getChatPrompt(message, history = []) {
    let prompt = `You are an AI assistant for a construction leads management system.\n\n`;
    for (const h of history) {
      prompt += `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}\n\n`;
    }
    prompt += `User: ${message}\nAssistant:`;
    return prompt;
  }

  /**
   * Get chat messages in standardized format
   * Ollama uses prompt-based format but this method provides consistency
   * with other providers for the AI provider manager
   */
  getChatMessages(message, history = []) {
    const prompt = this.getChatPrompt(message, history);
    return { system: '', messages: [{ role: 'user', content: prompt }] };
  }

  getLeadScoringPrompt(lead) {
    return `Score this construction lead (0-100) and classify as hot/warm/cold:\n
Project: ${lead.title}\nType: ${lead.projectType}\nValue: $${lead.value || 'Unknown'}\nLocation: ${lead.location || 'Unknown'}\n
Return JSON: {"score": number, "status": "hot|warm|cold", "reasoning": "..."}`;
  }

  getBlueprintAnalysisPrompt(data) {
    return `Analyze this construction blueprint.\n\nFilename: ${data.filename}\nSize: ${data.size} bytes\n\nExtract key details and return a structured analysis.`;
  }

  /**
   * Pull a model
   */
  async pullModel(name, onProgress) {
    try {
      const response = await this.client.post('/api/pull', { name }, {
        responseType: 'stream',
      });

      for await (const chunk of this._parseStream(response.data)) {
        if (onProgress && chunk.status) {
          onProgress(chunk);
        }
      }

      return { success: true, model: name };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(name) {
    try {
      await this.client.delete('/api/delete', { data: { name } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  configure(config) {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.defaultModel) this.defaultModel = config.defaultModel;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    this._initClient();
  }

  getConfig() {
    return {
      provider: 'ollama',
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.temperature,
      configured: true,
    };
  }

  getMetrics() {
    const avgLatency = this._metrics.requests > 0
      ? Math.round(this._metrics.totalLatency / this._metrics.requests)
      : 0;
    
    return {
      ...this._metrics,
      avgLatency,
      circuitBreaker: this._cbState === CB_STATE.CLOSED ? 'closed' : 'open',
    };
  }

  clearMetrics() {
    this._metrics = {
      requests: 0,
      errors: 0,
      totalLatency: 0,
      lastError: null,
    };
  }
}

export const ollamaService = new OllamaService();
export default ollamaService;
