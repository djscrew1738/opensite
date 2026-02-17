// OpenClaw AI service — local AI gateway with OpenAI-compatible Chat Completions API
// Connects to OpenClaw Gateway running at localhost:18789
// Provides the same interface as OllamaService/GroqService for seamless provider switching

import axios from 'axios';

const CB_CLOSED = 'closed';
const CB_OPEN = 'open';
const CB_HALF_OPEN = 'half-open';

class OpenClawService {
  constructor() {
    this.baseUrl = process.env.OPENCLAW_URL || 'http://localhost:18789';
    this.apiKey = process.env.OPENCLAW_TOKEN || '';
    this.defaultModel = process.env.OPENCLAW_MODEL || 'openclaw:main';
    this.defaultTemperature = 0.7;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // OpenClaw agent tasks can take longer
      headers: { 'Content-Type': 'application/json' },
    });

    this.modelRecommendations = {
      chat: ['openclaw:main'],
      coding: ['openclaw:main'],
      reasoning: ['openclaw:main'],
      fast: ['openclaw:main'],
      scoring: ['openclaw:main'],
      analysis: ['openclaw:main'],
    };

    this._cb = {
      state: CB_CLOSED,
      failures: 0,
      maxFailures: 5,
      resetTimeout: 30000,
      nextRetryAt: 0,
    };

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

  configure({ baseUrl, apiKey, defaultModel, temperature }) {
    if (baseUrl && baseUrl !== this.baseUrl) {
      this.baseUrl = baseUrl;
      this.client = axios.create({
        baseURL: baseUrl,
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' },
      });
      this._cbReset();
    }
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (defaultModel) this.defaultModel = defaultModel;
    if (temperature !== undefined) this.defaultTemperature = temperature;
  }

  getConfig() {
    return {
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.defaultTemperature,
      provider: 'openclaw',
      hasApiKey: !!this.apiKey,
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

  // Circuit breaker
  _cbRecordSuccess() { this._cb.failures = 0; this._cb.state = CB_CLOSED; }

  _cbRecordFailure(error) {
    this._cb.failures++;
    this._metrics.lastError = error?.message || String(error);
    this._metrics.lastErrorAt = new Date().toISOString();
    if (this._cb.failures >= this._cb.maxFailures) {
      this._cb.state = CB_OPEN;
      this._cb.nextRetryAt = Date.now() + this._cb.resetTimeout;
      console.warn(`[openclaw] Circuit breaker OPEN after ${this._cb.failures} failures`);
    }
  }

  _cbReset() { this._cb.state = CB_CLOSED; this._cb.failures = 0; this._cb.nextRetryAt = 0; }

  _cbCanRequest() {
    if (this._cb.state === CB_CLOSED) return true;
    if (this._cb.state === CB_OPEN) {
      if (Date.now() >= this._cb.nextRetryAt) {
        this._cb.state = CB_HALF_OPEN;
        return true;
      }
      return false;
    }
    return true;
  }

  async _withRetry(fn, { retries = 2, baseDelay = 1000, label = 'request' } = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === retries) throw error;
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[openclaw] ${label} attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  _getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async listAvailableModels() {
    try {
      // OpenClaw exposes OpenAI-compatible /v1/models when available
      const response = await this.client.get('/v1/models', {
        headers: this._getAuthHeaders(),
        timeout: 10000,
      });

      const models = (response.data?.data || []).map(m => ({
        name: m.id,
        label: m.id.replace('openclaw:', 'OpenClaw ').replace('agent:', 'Agent '),
        context: m.context_window || 200000,
        speed: 'fast',
      }));

      if (models.length === 0) {
        // Fallback: always show the default agent
        models.push({
          name: this.defaultModel,
          label: 'OpenClaw Main Agent',
          context: 200000,
          speed: 'fast',
        });
      }

      return { success: true, models };
    } catch (error) {
      // If /v1/models isn't available, return the default agent
      return {
        success: true,
        models: [{
          name: this.defaultModel,
          label: 'OpenClaw Main Agent',
          context: 200000,
          speed: 'fast',
        }],
      };
    }
  }

  async healthCheck() {
    try {
      // Try a lightweight request to the gateway
      const response = await this.client.post('/v1/chat/completions', {
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }, {
        headers: this._getAuthHeaders(),
        timeout: 15000,
      });

      this._cbRecordSuccess();
      const result = await this.listAvailableModels();

      return {
        connected: true,
        model: this.defaultModel,
        available: true,
        availableModels: result.models,
        totalModels: result.models.length,
      };
    } catch (error) {
      this._cbRecordFailure(error);
      return {
        connected: false,
        model: this.defaultModel,
        available: false,
        availableModels: [],
        totalModels: 0,
        error: error.message,
      };
    }
  }

  getRecommendedModel(task = 'chat') {
    const recommendations = this.modelRecommendations[task] || [this.defaultModel];
    return recommendations[0];
  }

  // Non-streaming generation via OpenAI Chat Completions
  async generate(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      return {
        success: false,
        error: `Circuit breaker open — OpenClaw unreachable. Retrying in ${Math.max(0, Math.ceil((this._cb.nextRetryAt - Date.now()) / 1000))}s`,
      };
    }

    const startTime = Date.now();
    const modelToUse = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;

    try {
      const result = await this._withRetry(async () => {
        return this.client.post('/v1/chat/completions', {
          model: modelToUse,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: options.num_predict || 4096,
          stream: false,
        }, {
          headers: this._getAuthHeaders(),
          timeout: options.timeout || 120000,
        });
      }, { retries: 2, label: `generate(${modelToUse})` });

      const elapsed = Date.now() - startTime;
      this._metrics.successCount++;
      this._metrics.totalResponseMs += elapsed;
      this._cbRecordSuccess();

      const responseText = result.data?.choices?.[0]?.message?.content || '';
      return {
        success: true,
        response: responseText,
        model: modelToUse,
        durationMs: elapsed,
        usage: result.data?.usage,
      };
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      const msg = error.response?.data?.error?.message || error.message;
      console.error('[openclaw] generate error:', msg);
      return { success: false, error: msg };
    }
  }

  // Streaming generation via SSE
  async *generateStream(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      yield 'Error: OpenClaw circuit breaker open — service unreachable.';
      return;
    }

    const modelToUse = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;
    const startTime = Date.now();

    try {
      const response = await this.client.post('/v1/chat/completions', {
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: options.num_predict || 4096,
        stream: true,
      }, {
        headers: this._getAuthHeaders(),
        responseType: 'stream',
        timeout: options.timeout || 120000,
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim().startsWith('data:'));
        for (const line of lines) {
          const jsonStr = line.replace(/^data:\s*/, '');
          if (jsonStr === '[DONE]') {
            const elapsed = Date.now() - startTime;
            this._metrics.successCount++;
            this._metrics.totalResponseMs += elapsed;
            this._cbRecordSuccess();
            return;
          }
          try {
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch { /* skip invalid lines */ }
        }
      }
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      const msg = error.response?.data?.error?.message || error.message;
      console.error('[openclaw] stream error:', msg);
      yield `Error: ${msg}`;
    }
  }

  // Model management — OpenClaw manages its own agents
  async pullModel() {
    return { success: false, error: 'OpenClaw agents are managed via the OpenClaw CLI' };
  }

  async deleteModel() {
    return { success: false, error: 'OpenClaw agents are managed via the OpenClaw CLI' };
  }

  // Prompt templates (identical to other providers)
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

  async scoreLead(lead, modelOverride = null) {
    const modelToUse = modelOverride || this.getRecommendedModel('scoring');
    const prompt = this.getLeadScoringPrompt(lead);
    const result = await this.generate(prompt, { temperature: 0.3, model: modelToUse });

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
          modelUsed: modelToUse,
        };
      }
    } catch (error) {
      console.error('[openclaw] Failed to parse AI scoring response:', error.message);
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

export const openclawService = new OpenClawService();
