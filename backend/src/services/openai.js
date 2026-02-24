/**
 * OpenAI Cloud AI Service
 * Standard OpenAI API integration
 */

import axios from 'axios';
import logger from './logger.js';

// Circuit breaker states
const CB_STATE = { CLOSED: 0, OPEN: 1, HALF_OPEN: 2 };

class OpenAIService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = config.defaultModel || 'gpt-4o-mini';
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
   * Initialize axios client
   */
  _initClient() {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers,
      timeout: this.timeout,
    });

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
    if (this._cbState === CB_OPEN) {
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
      logger.warn(`[openai] Circuit breaker opened (5 failures), retry in 30s`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return { connected: false, model: null, error: 'API key not configured' };
      }

      // Quick models endpoint check
      const response = await this.client.get('/models', { timeout: 5000 });
      
      return {
        connected: response.status === 200,
        model: this.defaultModel,
        available: response.data?.data?.length || 0,
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
          provider: 'openai',
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
   * Stream generation
   */
  async *generateStream(prompt, options = {}) {
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
      logger.error('[openai] Stream error:', error.message);
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
            // Ignore
          }
        }
      }
    }
  }

  /**
   * Retry wrapper
   */
  async _withRetry(fn, retries) {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (error.response?.status === 401 || error.response?.status === 403) throw error;
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) throw error;
        
        if (i < retries) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * List available models
   */
  async listAvailableModels() {
    try {
      const response = await this.client.get('/models');
      const models = response.data?.data || [];
      return {
        success: true,
        models: models.filter(m => m.id.startsWith('gpt-')).map(m => ({
          id: m.id,
          name: m.id,
          ownedBy: m.owned_by,
        })),
        provider: 'openai',
      };
    } catch (error) {
      return {
        success: true,
        models: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
          { id: 'o1-preview', name: 'o1 Preview' },
          { id: 'o1-mini', name: 'o1 mini' },
        ],
        provider: 'openai',
        cached: true,
      };
    }
  }

  /**
   * Standardized task-to-model mapping
   */
  getRecommendedModel(task) {
    const recommendations = {
      code: 'gpt-4o',
      chat: 'gpt-4o-mini',
      analysis: 'gpt-4o',
      scoring: 'gpt-4o-mini',
    };
    return recommendations[task] || this.defaultModel;
  }

  /**
   * Get chat messages (for unified interface)
   */
  getChatMessages(message, history = [], system = null) {
    return {
      system: system || this.getSystemPrompt(),
      messages: [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ]
    };
  }

  /**
   * Get chat prompt
   */
  getChatPrompt(message, history = [], system = null) {
    let prompt = (system || this.getSystemPrompt()) + '\n\n';
    for (const h of history) {
      prompt += `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}\n\n`;
    }
    prompt += `User: ${message}\nAssistant:`;
    return prompt;
  }

  getSystemPrompt() {
    return `You are an AI assistant for a construction leads management system.`;
  }

  configure(config) {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.defaultModel) this.defaultModel = config.defaultModel;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    this._initClient();
  }

  getConfig() {
    return {
      provider: 'openai',
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.temperature,
      configured: !!this.apiKey,
    };
  }

  getMetrics() {
    return { ...this._metrics, circuitBreaker: this._cbState === CB_STATE.CLOSED ? 'closed' : 'open' };
  }
}

export const openaiService = new OpenAIService();
export default openaiService;
