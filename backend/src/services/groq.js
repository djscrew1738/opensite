/**
 * Groq Cloud AI Service
 * Optimized for fast inference with OpenAI-compatible API
 */

import axios from 'axios';
import http from 'http';
import https from 'https';
import { db } from './database.js';
import logger from './logger.js';

// Circuit breaker states
const CB_STATE = { CLOSED: 0, OPEN: 1, HALF_OPEN: 2 };

class GroqService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.groq.com/openai/v1';
    this.defaultModel = config.defaultModel || 'llama-3.3-70b-versatile';
    this.temperature = config.temperature ?? 0.7;
    this.timeout = config.timeout || 30000;
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
      tokensIn: 0,
      tokensOut: 0,
      lastError: null,
    };

    this._initClient();
  }

  /**
   * Initialize axios client with connection pooling
   */
  _initClient() {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
    };

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers,
      timeout: this.timeout,
      // Enable HTTP keep-alive for connection reuse
      httpAgent: new http.Agent({ 
        keepAlive: true, 
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 60000,
      }),
      httpsAgent: new https.Agent({ 
        keepAlive: true, 
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 60000,
      }),
    });

    // Model list cache
    this._modelCache = null;
    this._modelCacheTime = 0;
    this._modelCacheTTL = 300000; // 5min - models don't change often

    // Request interceptor for metrics
    this.client.interceptors.request.use(config => {
      config._startTime = Date.now();
      return config;
    });

    // Response interceptor for metrics
    this.client.interceptors.response.use(
      response => {
        this._metrics.requests++;
        if (response.config._startTime) {
          this._metrics.totalLatency += Date.now() - response.config._startTime;
        }
        if (response.data?.usage) {
          this._metrics.tokensIn += response.data.usage.prompt_tokens || 0;
          this._metrics.tokensOut += response.data.usage.completion_tokens || 0;
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
   * Circuit breaker check
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

  /**
   * Update circuit breaker on success/failure
   */
  _cbRecordSuccess() {
    this._cbFailCount = 0;
    this._cbState = CB_STATE.CLOSED;
  }

  _cbRecordFailure() {
    this._cbFailCount++;
    if (this._cbFailCount >= this._cbThreshold) {
      this._cbState = CB_STATE.OPEN;
      this._cbNextAttempt = Date.now() + this._cbTimeout;
      logger.warn(`[groq] Circuit breaker opened (5 failures), retry in 30s`);
    }
  }

  /**
   * Get cached model list
   */
  async _getCachedModels() {
    const now = Date.now();
    if (!this._modelCache || (now - this._modelCacheTime) > this._modelCacheTTL) {
      try {
        const response = await this.client.get('/models', { timeout: 5000 });
        this._modelCache = response.data?.data || [];
        this._modelCacheTime = now;
      } catch (error) {
        // Return cached models even if expired, or fallback
        return this._modelCache || this._getFallbackModels();
      }
    }
    return this._modelCache;
  }

  _getFallbackModels() {
    return [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', context_window: 128000 },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', context_window: 128000 },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', context_window: 8192 },
    ];
  }

  /**
   * Health check - uses cached models
   */
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return { connected: false, model: null, error: 'API key not configured' };
      }

      // Use cached models for faster health check
      const models = await this._getCachedModels();
      
      return {
        connected: models.length > 0,
        model: this.defaultModel,
        available: models.length,
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
   * Generate text (non-streaming)
   */
  async generate(prompt, options = {}) {
    if (!this._cbCanRequest()) {
      return { success: false, error: 'Circuit breaker open' };
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.temperature;
    
    // Support both flat prompt and structured messages
    let messages;
    if (options.messages) {
      messages = options.system
        ? [{ role: 'system', content: options.system }, ...options.messages]
        : options.messages;
    } else {
      messages = [
        ...(options.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: prompt }
      ];
    }

    const retries = options.retries ?? this.maxRetries;

    return this._withRetry(async () => {
      try {
        const response = await this.client.post('/chat/completions', {
          model,
          messages,
          temperature,
          stream: false,
          max_tokens: options.maxTokens || 4096,
        });

        this._cbRecordSuccess();

        return {
          success: true,
          response: response.data.choices[0].message.content,
          model: response.data.model,
          usage: response.data.usage,
          provider: 'groq',
        };
      } catch (error) {
        this._cbRecordFailure();
        
        if (error.response?.status === 429) {
          return { success: false, error: 'Rate limit exceeded', rateLimited: true };
        }
        if (error.response?.status === 401) {
          return { success: false, error: 'Invalid API key' };
        }
        if (error.code === 'ECONNABORTED') {
          return { success: false, error: 'Request timeout' };
        }
        
        throw error;
      }
    }, retries);
  }

  /**
   * Stream generation (Server-Sent Events)
   */
  async *generateStream(prompt, options = {}) {
    if (!this._cbCanRequest()) {
      yield 'Error: Circuit breaker open';
      return;
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.temperature;

    let messages;
    if (options.messages) {
      messages = options.system
        ? [{ role: 'system', content: options.system }, ...options.messages]
        : options.messages;
    } else {
      messages = [
        ...(options.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: prompt }
      ];
    }

    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        temperature,
        stream: true,
        max_tokens: options.maxTokens || 4096,
      }, { responseType: 'stream' });

      this._cbRecordSuccess();

      for await (const chunk of this._parseSSE(response.data)) {
        if (chunk.choices?.[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } catch (error) {
      this._cbRecordFailure();
      logger.error('[groq] Stream error:', error.message);
      yield `Error: ${error.message}`;
    }
  }

  /**
   * Parse Server-Sent Events
   */
  async *_parseSSE(stream) {
    let buffer = '';
    
    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            yield JSON.parse(data);
          } catch (e) {
            // Ignore parse errors
          }
        }
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
        
        // Don't retry on auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }
        
        // Don't retry on client errors
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        if (i < retries) {
          const delay = Math.pow(2, i) * 1000;
          logger.debug(`[groq] Retry ${i + 1}/${retries} after ${delay}ms`);
          await this._sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /**
   * List available models - uses cache for performance
   */
  async listAvailableModels() {
    try {
      const models = await this._getCachedModels();
      return {
        success: true,
        models: models.map(m => ({
          id: m.id,
          name: m.id,
          contextWindow: m.context_window || 8192,
          ownedBy: m.owned_by,
        })),
        provider: 'groq',
        cached: Date.now() - this._modelCacheTime < this._modelCacheTTL,
      };
    } catch (error) {
      // Return fallback model list on error
      return {
        success: true,
        models: this._getFallbackModels().map(m => ({
          id: m.id,
          name: m.name,
          contextWindow: m.context_window,
        })),
        provider: 'groq',
        cached: true,
        fallback: true,
      };
    }
  }

  /**
   * Get recommended model for task
   */
  getRecommendedModel(task) {
    const recommendations = {
      code: 'llama-3.3-70b-versatile',
      chat: 'llama-3.1-8b-instant',
      analysis: 'llama-3.3-70b-versatile',
      scoring: 'llama-3.1-8b-instant',
    };
    return recommendations[task] || this.defaultModel;
  }

  /**
   * Get chat messages (for unified interface)
   */
  getChatMessages(message, history = []) {
    return {
      system: this.getSystemPrompt(),
      messages: [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ]
    };
  }

  /**
   * Get chat prompt
   */
  getChatPrompt(message, history = []) {
    let prompt = this.getSystemPrompt() + '\n\n';
    for (const h of history) {
      prompt += `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}\n\n`;
    }
    prompt += `User: ${message}\nAssistant:`;
    return prompt;
  }

  getSystemPrompt() {
    return `You are an AI assistant for a construction leads management system.`;
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
   * Configure service
   */
  configure(config) {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.defaultModel) this.defaultModel = config.defaultModel;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    this._initClient();
  }

  getConfig() {
    return {
      provider: 'groq',
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.temperature,
      configured: !!this.apiKey,
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
      tokensIn: 0,
      tokensOut: 0,
      lastError: null,
    };
  }
}

export const groqService = new GroqService();
export default groqService;
