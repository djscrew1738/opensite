/**
 * OpenClaw Gateway Service
 * Routes to locally-hosted Ollama with optional gateway features
 */

import axios from 'axios';
import { db } from './database.js';
import logger from './logger.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Circuit breaker states
const CB_STATE = { CLOSED: 0, OPEN: 1, HALF_OPEN: 2 };

class OpenClawService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENCLAW_TOKEN || '';
    this.baseUrl = config.baseUrl || process.env.OPENCLAW_URL || 'http://localhost:10000';
    this.defaultModel = config.defaultModel || 'llama3.1';
    this.temperature = config.temperature ?? 0.7;
    this.timeout = config.timeout || 60000;
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
      headers: {
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        'Content-Type': 'application/json',
      },
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
      logger.warn(`[openclaw] Circuit breaker opened, retry in 30s`);
    }
  }

  /**
   * Health check - try API first, fallback to CLI
   */
  async healthCheck() {
    // Try API health endpoint first
    try {
      const response = await this.client.get('/api/tags', { timeout: 5000 });
      return {
        connected: true,
        model: this.defaultModel,
        available: response.data?.models?.length || 0,
        method: 'api',
      };
    } catch (apiError) {
      logger.debug('[openclaw] API health check failed:', apiError.message);
    }

    // Fallback to CLI health check
    try {
      const { stdout } = await execFileAsync('openclaw', ['health'], { timeout: 10000 });
      const status = JSON.parse(stdout);
      
      // Verify Ollama is still accessible
      await this.client.get('/api/tags', { timeout: 5000 });
      
      return {
        connected: true,
        model: status.model || this.defaultModel,
        version: status.version,
        method: 'cli',
      };
    } catch (cliError) {
      logger.debug('[openclaw] CLI health check failed:', cliError.message);
    }

    // Try basic Ollama connectivity
    try {
      await this.client.get('/api/tags', { timeout: 3000 });
      return {
        connected: true,
        model: this.defaultModel,
        partial: true,
        note: 'Ollama accessible but OpenClaw gateway may not be fully initialized',
        method: 'direct',
      };
    } catch (directError) {
      return {
        connected: false,
        model: null,
        error: 'OpenClaw gateway not accessible',
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
    const message = this._buildPrompt(prompt, options);
    const retries = options.retries ?? this.maxRetries;

    return this._withRetry(async () => {
      try {
        const response = await this.client.post('/api/generate', {
          model,
          prompt: message,
          stream: false,
          options: {
            temperature: options.temperature ?? this.temperature,
            num_predict: options.maxTokens || 2048,
          },
        });

        this._cbRecordSuccess();

        return {
          success: true,
          response: response.data.response,
          model: response.data.model,
          provider: 'openclaw',
        };
      } catch (error) {
        this._cbRecordFailure();
        
        if (error.response?.status === 404) {
          return { success: false, error: `Model "${model}" not found` };
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
    if (!this._cbCanRequest()) {
      yield 'Error: Circuit breaker open';
      return;
    }

    const model = options.model || this.defaultModel;
    const message = this._buildPrompt(prompt, options);

    try {
      const response = await this.client.post('/api/generate', {
        model,
        prompt: message,
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
      logger.error('[openclaw] Stream error:', error.message);
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
   * Build prompt from options
   */
  _buildPrompt(prompt, options) {
    let message = prompt;
    
    if (options.system) {
      message = `System: ${options.system}\n\nUser: ${prompt}`;
    }
    
    if (options.messages) {
      message = options.messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      message += '\n\nAssistant:';
    }
    
    return message;
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
        
        if (i < retries) {
          const delay = Math.pow(2, i) * 1000;
          await this._sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /**
   * List available models
   */
  async listAvailableModels() {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models.map(m => ({
        id: m.name,
        name: m.name,
        size: m.size,
        modified: m.modified_at,
      }));
    } catch (error) {
      return [
        { id: 'llama3.1', name: 'Llama 3.1' },
        { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B' },
      ];
    }
  }

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
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.defaultModel) this.defaultModel = config.defaultModel;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    this._initClient();
  }

  getConfig() {
    return {
      provider: 'openclaw',
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

export const openclawService = new OpenClawService();
export default openclawService;
