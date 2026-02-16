// Ollama AI service wrapper for local LLM integration
// Features: retry with backoff, circuit breaker, keep-alive, runtime config, metrics

import axios from 'axios';

// Circuit breaker states
const CB_CLOSED = 'closed';       // Normal operation
const CB_OPEN = 'open';           // Failing, reject requests
const CB_HALF_OPEN = 'half-open'; // Testing if recovered

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.1';
    this.defaultTemperature = 0.7;

    // Will be replaced with keep-alive instance after construction
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
    });

    // Recommended models for specific tasks
    this.modelRecommendations = {
      chat: ['llama3.1', 'qwen2.5-coder:7b', 'deepseek-r1:1.5b'],
      coding: ['qwen2.5-coder:7b', 'deepseek-r1:1.5b'],
      reasoning: ['deepseek-r1:1.5b', 'llama3.1'],
      fast: ['sam860/phi4-mini:3.8b-Q4_K_S', 'deepseek-r1:1.5b'],
      scoring: ['llama3.1', 'qwen2.5-coder:7b'],
      analysis: ['qwen2.5-coder:7b', 'llama3.1', 'deepseek-r1:1.5b']
    };

    // Circuit breaker state
    this._cb = {
      state: CB_CLOSED,
      failures: 0,
      maxFailures: 5,
      resetTimeout: 30000, // 30s
      nextRetryAt: 0,
    };

    // Metrics
    this._metrics = {
      totalRequests: 0,
      successCount: 0,
      failCount: 0,
      totalResponseMs: 0,
      lastError: null,
      lastErrorAt: null,
      startedAt: Date.now(),
    };
  }

  // ── Runtime configuration ──

  configure({ baseUrl, defaultModel, temperature }) {
    if (baseUrl && baseUrl !== this.baseUrl) {
      this.baseUrl = baseUrl;
      this.client = axios.create({
        baseURL: baseUrl,
        timeout: 60000,
      });
      // Reset circuit breaker on URL change
      this._cbReset();
    }
    if (defaultModel) this.defaultModel = defaultModel;
    if (temperature !== undefined) this.defaultTemperature = temperature;
  }

  getConfig() {
    return {
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.defaultTemperature,
    };
  }

  getMetrics() {
    const uptime = Date.now() - this._metrics.startedAt;
    const avgResponseMs = this._metrics.successCount > 0
      ? Math.round(this._metrics.totalResponseMs / this._metrics.successCount)
      : 0;
    return {
      ...this._metrics,
      avgResponseMs,
      uptimeMs: uptime,
      circuitBreaker: this._cb.state,
    };
  }

  // ── Circuit breaker ──

  _cbRecordSuccess() {
    this._cb.failures = 0;
    this._cb.state = CB_CLOSED;
  }

  _cbRecordFailure(error) {
    this._cb.failures++;
    this._metrics.lastError = error?.message || String(error);
    this._metrics.lastErrorAt = new Date().toISOString();

    if (this._cb.failures >= this._cb.maxFailures) {
      this._cb.state = CB_OPEN;
      this._cb.nextRetryAt = Date.now() + this._cb.resetTimeout;
      console.warn(`[ollama] Circuit breaker OPEN after ${this._cb.failures} failures. Cooling down ${this._cb.resetTimeout / 1000}s`);
    }
  }

  _cbReset() {
    this._cb.state = CB_CLOSED;
    this._cb.failures = 0;
    this._cb.nextRetryAt = 0;
  }

  _cbCanRequest() {
    if (this._cb.state === CB_CLOSED) return true;
    if (this._cb.state === CB_OPEN) {
      if (Date.now() >= this._cb.nextRetryAt) {
        this._cb.state = CB_HALF_OPEN;
        return true; // Allow one test request
      }
      return false;
    }
    // half-open: allow
    return true;
  }

  // ── Retry with exponential backoff ──

  async _withRetry(fn, { retries = 2, baseDelay = 1000, label = 'request' } = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        const isLastAttempt = attempt === retries;
        if (isLastAttempt) throw error;

        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[ollama] ${label} attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // ── Core API methods ──

  async listAvailableModels() {
    try {
      const response = await this.client.get('/api/tags', { timeout: 5000 });
      return {
        success: true,
        models: response.data.models || []
      };
    } catch (error) {
      return {
        success: false,
        models: [],
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/api/tags', { timeout: 5000 });
      const models = response.data.models || [];
      const hasDefaultModel = models.some(m => m.name.includes(this.defaultModel));

      this._cbRecordSuccess();

      return {
        connected: true,
        model: this.defaultModel,
        available: hasDefaultModel,
        availableModels: models.map(m => ({
          name: m.name,
          size: m.size,
          modified: m.modified_at
        })),
        totalModels: models.length
      };
    } catch (error) {
      this._cbRecordFailure(error);
      return {
        connected: false,
        model: this.defaultModel,
        available: false,
        availableModels: [],
        totalModels: 0,
        error: error.message
      };
    }
  }

  getRecommendedModel(task = 'chat') {
    const recommendations = this.modelRecommendations[task] || [this.defaultModel];
    return recommendations[0];
  }

  // Non-streaming generation with retry + circuit breaker
  async generate(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      return {
        success: false,
        error: `Circuit breaker open — Ollama unreachable. Retrying in ${Math.max(0, Math.ceil((this._cb.nextRetryAt - Date.now()) / 1000))}s`
      };
    }

    const startTime = Date.now();
    const modelToUse = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;

    try {
      const result = await this._withRetry(async () => {
        const response = await this.client.post('/api/generate', {
          model: modelToUse,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: options.num_predict,
            top_k: options.top_k,
            top_p: options.top_p
          }
        }, {
          timeout: options.timeout || 60000
        });
        return response;
      }, { retries: 2, label: `generate(${modelToUse})` });

      const elapsed = Date.now() - startTime;
      this._metrics.successCount++;
      this._metrics.totalResponseMs += elapsed;
      this._cbRecordSuccess();

      return {
        success: true,
        response: result.data.response,
        model: modelToUse,
        durationMs: elapsed,
      };
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      console.error('[ollama] generate error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Streaming generation (no retry — streams can't restart cleanly)
  async *generateStream(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      yield `Error: Ollama circuit breaker open — service unreachable. Please wait and try again.`;
      return;
    }

    const modelToUse = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;
    const startTime = Date.now();

    try {
      const response = await this.client.post('/api/generate', {
        model: modelToUse,
        prompt,
        stream: true,
        options: {
          temperature,
          num_predict: options.num_predict,
          top_k: options.top_k,
          top_p: options.top_p
        }
      }, {
        responseType: 'stream',
        timeout: options.timeout || 60000
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
            if (data.done) {
              const elapsed = Date.now() - startTime;
              this._metrics.successCount++;
              this._metrics.totalResponseMs += elapsed;
              this._cbRecordSuccess();
              return;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      console.error('[ollama] stream error:', error.message);
      yield `Error: ${error.message}`;
    }
  }

  // ── Model management ──

  async pullModel(modelName, onProgress) {
    try {
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: true
      }, {
        responseType: 'stream',
        timeout: 600000 // 10 min for large models
      });

      let lastStatus = '';
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            lastStatus = data.status || lastStatus;
            if (onProgress) onProgress(data);
          } catch { /* skip */ }
        }
      }

      return { success: true, status: lastStatus };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteModel(modelName) {
    try {
      await this.client.delete('/api/delete', { data: { name: modelName } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ── Prompt templates ──

  getLeadScoringPrompt(lead) {
    return `You are an AI assistant for CTL Plumbing LLC, a commercial and multi-family plumbing contractor in the DFW Metroplex.

Analyze this lead and provide a score from 0-100 based on:
- Project value and size
- Location (DFW area is best)
- Company type (commercial/multi-family preferred)
- Project timeline and urgency

Lead Information:
- Name: ${lead.name}
- Company: ${lead.company}
- Location: ${lead.location || 'Not specified'}
- Project Type: ${lead.projectType || 'Not specified'}
- Estimated Value: $${lead.value?.toLocaleString() || '0'}
- Notes: ${lead.notes || 'None'}

Respond ONLY with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "status": "<hot|warm|cold>",
  "reasoning": "<brief explanation>"
}

Rules:
- Hot (80-100): High-value DFW commercial projects, qualified buyers, immediate timeline
- Warm (50-79): Good potential, may need nurturing, outside DFW or smaller projects
- Cold (0-49): Low value, unqualified, or poor fit

Respond with ONLY the JSON, no other text.`;
  }

  getBlueprintAnalysisPrompt(estimateData) {
    return `You are an expert plumbing estimator for CTL Plumbing LLC in the DFW area.

Analyze this project and provide detailed recommendations:

Project Details:
- Square Footage: ${estimateData.sqft}
- Bathrooms: ${estimateData.bathrooms}
- Units: ${estimateData.units}
- Stories: ${estimateData.stories}
- Pricing Tier: ${estimateData.tier}

Provide analysis including:
1. Material recommendations (pipe types, fixtures, water heaters)
2. Estimated labor hours per phase
3. Timeline estimate
4. Potential challenges or considerations
5. Code compliance notes for DFW area

Respond with detailed, actionable insights in a professional format.`;
  }

  getChatPrompt(message, conversationHistory = []) {
    const context = `You are an AI assistant for CTL Plumbing LLC, a commercial and multi-family plumbing contractor in the DFW Metroplex.

Company Information:
- Specialization: Commercial and multi-family plumbing
- Service Area: Dallas-Fort Worth Metroplex
- Pricing Tiers:
  * Production: $5,600/unit (18-22% margin) - High-volume standardized projects
  * Custom: $7,200/unit (25-30% margin) - Mid-rise custom layouts
  * Premium: $10,200/unit (30-38% margin) - Luxury high-end properties
- Project Phases: Rough-in (50%), Top-out (30%), Trim (20%)

You can help with:
- Lead qualification and analysis
- Pricing guidance and calculations
- Material recommendations
- Labor estimates
- Timeline projections
- Code compliance (Texas/DFW)
- Project planning

`;

    let prompt = context;

    if (conversationHistory.length > 0) {
      prompt += '\nConversation History:\n';
      conversationHistory.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    prompt += `\nUser: ${message}\nAssistant:`;

    return prompt;
  }

  // Score a lead using AI (use recommended model for scoring)
  async scoreLead(lead, modelOverride = null) {
    const modelToUse = modelOverride || this.getRecommendedModel('scoring');
    const prompt = this.getLeadScoringPrompt(lead);
    const result = await this.generate(prompt, {
      temperature: 0.3,
      model: modelToUse
    });

    if (!result.success) {
      return this.ruleBasedScoring(lead);
    }

    try {
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.max(0, Math.min(100, parsed.score)),
          status: parsed.status,
          reasoning: parsed.reasoning,
          modelUsed: modelToUse
        };
      }
    } catch (error) {
      console.error('[ollama] Failed to parse AI scoring response:', error.message);
    }

    return this.ruleBasedScoring(lead);
  }

  ruleBasedScoring(lead) {
    let score = 50;

    if (lead.value > 100000) score += 25;
    else if (lead.value > 50000) score += 15;
    else if (lead.value > 25000) score += 10;

    const dfwKeywords = ['dallas', 'fort worth', 'dfw', 'plano', 'frisco', 'arlington', 'irving'];
    const locationLower = (lead.location || '').toLowerCase();
    if (dfwKeywords.some(kw => locationLower.includes(kw))) score += 15;

    const commercialKeywords = ['commercial', 'multi-family', 'apartment', 'complex'];
    const typeLower = (lead.projectType || '').toLowerCase();
    if (commercialKeywords.some(kw => typeLower.includes(kw))) score += 10;

    score = Math.max(0, Math.min(100, score));

    let status = 'cold';
    if (score >= 80) status = 'hot';
    else if (score >= 50) status = 'warm';

    return { score, status, reasoning: 'Rule-based scoring (AI unavailable)' };
  }
}

// Top-level await for the http agent import
const http = await import('http');
const ollamaInstance = new OllamaService();
// Properly set the agent after construction
ollamaInstance.client = axios.create({
  baseURL: ollamaInstance.baseUrl,
  timeout: 60000,
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 4 }),
});

export const ollamaService = ollamaInstance;
