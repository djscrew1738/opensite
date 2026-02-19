// Groq Cloud AI service — OpenAI-compatible fast inference
// Provides the same interface as OllamaService for seamless provider switching

import axios from 'axios';

const CB_CLOSED = 'closed';
const CB_OPEN = 'open';
const CB_HALF_OPEN = 'half-open';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.defaultModel = 'llama-3.3-70b-versatile';
    this.defaultTemperature = 0.7;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Available Groq models (updated 2025 — Llama 4 era)
    this.knownModels = [
      { name: 'meta-llama/llama-4-scout-17b-16e-instruct',    label: 'Llama 4 Scout 17B',   context: 131072, speed: 'fast',    owned_by: 'Meta' },
      { name: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B', context: 131072, speed: 'fast',    owned_by: 'Meta' },
      { name: 'llama-3.3-70b-versatile',                       label: 'Llama 3.3 70B',        context: 128000, speed: 'fast',    owned_by: 'Meta' },
      { name: 'llama-3.1-8b-instant',                          label: 'Llama 3.1 8B Instant', context: 128000, speed: 'fastest', owned_by: 'Meta' },
      { name: 'gemma2-9b-it',                                  label: 'Gemma 2 9B',           context: 8192,   speed: 'fast',    owned_by: 'Google' },
      { name: 'moonshotai/kimi-k2-instruct',                   label: 'Kimi K2',              context: 131072, speed: 'fast',    owned_by: 'Moonshot AI' },
      { name: 'qwen/qwen3-32b',                                label: 'Qwen 3 32B',           context: 131072, speed: 'fast',    owned_by: 'Alibaba' },
    ];

    this.modelRecommendations = {
      chat:     ['meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      coding:   ['meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.3-70b-versatile'],
      reasoning: ['meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.3-70b-versatile'],
      fast:     ['llama-3.1-8b-instant', 'meta-llama/llama-4-scout-17b-16e-instruct'],
      scoring:  ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.1-8b-instant'],
      analysis: ['meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.3-70b-versatile'],
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

  configure({ apiKey, defaultModel, temperature }) {
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (defaultModel) this.defaultModel = defaultModel;
    if (temperature !== undefined) this.defaultTemperature = temperature;
  }

  getConfig() {
    return {
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.defaultTemperature,
      provider: 'groq',
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

  // Circuit breaker methods (same as OllamaService)
  _cbRecordSuccess() { this._cb.failures = 0; this._cb.state = CB_CLOSED; }

  _cbRecordFailure(error) {
    this._cb.failures++;
    this._metrics.lastError = error?.message || String(error);
    this._metrics.lastErrorAt = new Date().toISOString();
    if (this._cb.failures >= this._cb.maxFailures) {
      this._cb.state = CB_OPEN;
      this._cb.nextRetryAt = Date.now() + this._cb.resetTimeout;
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
        console.warn(`[groq] ${label} attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  _getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async listAvailableModels() {
    if (!this.apiKey) {
      return { success: false, models: [], error: 'Groq API key not configured' };
    }

    try {
      const response = await this.client.get('/models', {
        headers: this._getAuthHeaders(),
        timeout: 10000,
      });

      const models = (response.data?.data || [])
        .filter(m => m.object === 'model' && m.active !== false)
        .map(m => {
          const known = this.knownModels.find(km => km.name === m.id);
          return {
            name: m.id,
            label: known?.label || m.id,
            context: known?.context || m.context_window || 8192,
            speed: known?.speed || 'fast',
            owned_by: m.owned_by,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return { success: true, models };
    } catch (error) {
      return { success: false, models: [], error: error.message };
    }
  }

  async healthCheck() {
    if (!this.apiKey) {
      return {
        connected: false,
        model: this.defaultModel,
        available: false,
        availableModels: [],
        totalModels: 0,
        error: 'Groq API key not configured',
      };
    }

    try {
      const result = await this.listAvailableModels();
      if (!result.success) throw new Error(result.error);

      const hasDefault = result.models.some(m => m.name === this.defaultModel);
      this._cbRecordSuccess();

      return {
        connected: true,
        model: this.defaultModel,
        available: hasDefault,
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

  // Non-streaming generation (OpenAI chat completions format)
  async generate(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this.apiKey) {
      this._metrics.failCount++;
      return { success: false, error: 'Groq API key not configured. Add it in Settings.' };
    }

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      return {
        success: false,
        error: `Circuit breaker open — Groq unreachable. Retrying in ${Math.max(0, Math.ceil((this._cb.nextRetryAt - Date.now()) / 1000))}s`,
      };
    }

    const startTime = Date.now();
    const modelToUse = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;

    // Build messages: prefer structured messages if provided, else wrap prompt
    const messages = options.messages || [{ role: 'user', content: prompt }];
    // Prepend system message if provided and not already in messages array
    const finalMessages = options.system
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;

    try {
      const result = await this._withRetry(async () => {
        return this.client.post('/chat/completions', {
          model: modelToUse,
          messages: finalMessages,
          temperature,
          max_tokens: options.num_predict || 4096,
          top_p: options.top_p,
          stream: false,
        }, {
          headers: this._getAuthHeaders(),
          timeout: options.timeout || 60000,
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
      console.error('[groq] generate error:', msg);
      return { success: false, error: msg };
    }
  }

  // Streaming generation (SSE via OpenAI-compatible streaming)
  async *generateStream(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this.apiKey) {
      this._metrics.failCount++;
      yield 'Error: Groq API key not configured. Add it in Settings.';
      return;
    }

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      yield 'Error: Groq circuit breaker open — service unreachable.';
      return;
    }

    const modelToUse = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;
    const startTime = Date.now();

    const messages = options.messages || [{ role: 'user', content: prompt }];
    const finalMessages = options.system
      ? [{ role: 'system', content: options.system }, ...messages]
      : messages;

    try {
      const response = await this.client.post('/chat/completions', {
        model: modelToUse,
        messages: finalMessages,
        temperature,
        max_tokens: options.num_predict || 4096,
        top_p: options.top_p,
        stream: true,
      }, {
        headers: this._getAuthHeaders(),
        responseType: 'stream',
        timeout: options.timeout || 60000,
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
      console.error('[groq] stream error:', msg);
      yield `Error: ${msg}`;
    }
  }

  // Model management — Groq is cloud-based, no pull/delete
  async pullModel() {
    return { success: false, error: 'Groq models are cloud-hosted and cannot be pulled locally' };
  }

  async deleteModel() {
    return { success: false, error: 'Groq models are cloud-hosted and cannot be deleted' };
  }

  // Structured messages format for multi-turn chat (preferred over getChatPrompt)
  getChatMessages(message, history = []) {
    const systemMsg = `You are an AI assistant for CTL Plumbing LLC, a commercial and multi-family plumbing contractor in the DFW Metroplex.

Company: CTL Plumbing LLC | Service area: Dallas-Fort Worth | Owner: Cory
Pricing: Production $5,600/unit • Custom $7,200/unit • Premium $10,200/unit
Phases: Rough-in (50%) • Top-out (30%) • Trim (20%)

Help with: lead qualification, pricing, material recommendations, labor estimates, code compliance (Texas/DFW), project planning.`;

    const messages = [];
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: message });
    return { system: systemMsg, messages };
  }

  // Prompt templates (identical to OllamaService)
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
      console.error('[groq] Failed to parse AI scoring response:', error.message);
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

export const groqService = new GroqService();
