// Anthropic (Claude) AI service — native Messages API
// Implements the same interface as OllamaService / GroqService

import axios from 'axios';
import logger from './logger.js';

const CB_CLOSED = 'closed';
const CB_OPEN = 'open';
const CB_HALF_OPEN = 'half-open';

// CTL Plumbing system context shared across all prompts
const CTL_SYSTEM = `You are an expert AI assistant for CTL Plumbing LLC, a commercial and multi-family plumbing contractor in the Dallas-Fort Worth Metroplex.

Company details:
- Specialization: Commercial and multi-family new-construction plumbing
- Service area: Dallas-Fort Worth Metroplex (DFW)
- Pricing tiers:
  * Production: $5,600/unit (18-22% margin) — high-volume standardized projects
  * Custom: $7,200/unit (25-30% margin) — mid-rise custom layouts
  * Premium: $10,200/unit (30-38% margin) — luxury high-end properties
- Project phases: Rough-in (50%), Top-out (30%), Trim (20%)
- Owner: Cory

You help with lead qualification, pricing guidance, material recommendations, labor estimates, timeline projections, code compliance (Texas/DFW), and project planning. Be concise, professional, and specific to DFW commercial plumbing.`;

class AnthropicService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = 'https://api.anthropic.com';
    this.apiVersion = '2023-06-01';
    this.defaultModel = 'claude-haiku-4-5';
    this.defaultTemperature = 0.7;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 90000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Current Claude models — updated 2025
    this.knownModels = [
      { name: 'claude-haiku-4-5',    label: 'Claude Haiku 4.5',   context: 200000, speed: 'fastest', owned_by: 'Anthropic' },
      { name: 'claude-sonnet-4-5',   label: 'Claude Sonnet 4.5',  context: 200000, speed: 'fast',    owned_by: 'Anthropic' },
      { name: 'claude-sonnet-4-6',   label: 'Claude Sonnet 4.6',  context: 200000, speed: 'fast',    owned_by: 'Anthropic' },
      { name: 'claude-opus-4-5',     label: 'Claude Opus 4.5',    context: 200000, speed: 'medium',  owned_by: 'Anthropic' },
    ];

    this.modelRecommendations = {
      chat:     ['claude-haiku-4-5', 'claude-sonnet-4-6'],
      coding:   ['claude-sonnet-4-6', 'claude-haiku-4-5'],
      reasoning: ['claude-sonnet-4-6', 'claude-opus-4-5'],
      fast:     ['claude-haiku-4-5'],
      scoring:  ['claude-haiku-4-5', 'claude-sonnet-4-6'],
      analysis: ['claude-sonnet-4-6', 'claude-haiku-4-5'],
    };

    this._cb = {
      state: CB_CLOSED, failures: 0,
      maxFailures: 5, resetTimeout: 30000, nextRetryAt: 0,
    };

    this._metrics = {
      totalRequests: 0, successCount: 0, failCount: 0,
      totalResponseMs: 0, lastError: null, lastErrorAt: null,
      startedAt: Date.now(),
    };
  }

  configure({ apiKey, defaultModel, temperature } = {}) {
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (defaultModel) this.defaultModel = defaultModel;
    if (temperature !== undefined) this.defaultTemperature = temperature;
  }

  getConfig() {
    return {
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.defaultTemperature,
      provider: 'anthropic',
      hasApiKey: !!this.apiKey,
    };
  }

  getMetrics() {
    const uptime = Date.now() - this._metrics.startedAt;
    const avgResponseMs = this._metrics.successCount > 0
      ? Math.round(this._metrics.totalResponseMs / this._metrics.successCount)
      : 0;
    return { ...this._metrics, avgResponseMs, uptimeMs: uptime, circuitBreaker: this._cb.state };
  }

  _cbRecordSuccess() { this._cb.failures = 0; this._cb.state = CB_CLOSED; }
  _cbReset() { this._cb.state = CB_CLOSED; this._cb.failures = 0; this._cb.nextRetryAt = 0; }
  _cbRecordFailure(error) {
    this._cb.failures++;
    this._metrics.lastError = error?.message || String(error);
    this._metrics.lastErrorAt = new Date().toISOString();
    if (this._cb.failures >= this._cb.maxFailures) {
      this._cb.state = CB_OPEN;
      this._cb.nextRetryAt = Date.now() + this._cb.resetTimeout;
    }
  }
  _cbCanRequest() {
    if (this._cb.state === CB_CLOSED) return true;
    if (this._cb.state === CB_OPEN) {
      if (Date.now() >= this._cb.nextRetryAt) { this._cb.state = CB_HALF_OPEN; return true; }
      return false;
    }
    return true;
  }

  _getAuthHeaders() {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': this.apiVersion,
      'Content-Type': 'application/json',
    };
  }

  async listAvailableModels() {
    if (!this.apiKey) {
      return { success: false, models: [], error: 'Anthropic API key not configured' };
    }
    // Anthropic doesn't have a public /models endpoint — return known list
    return { success: true, models: this.knownModels };
  }

  async healthCheck() {
    if (!this.apiKey) {
      return {
        connected: false, model: this.defaultModel, available: false,
        availableModels: [], totalModels: 0,
        error: 'Anthropic API key not configured',
      };
    }

    try {
      // Quick ping with minimal tokens
      const result = await this.generate('Reply with: OK', {
        model: this.defaultModel,
        num_predict: 5,
        timeout: 15000,
      });
      if (!result.success) throw new Error(result.error);
      this._cbRecordSuccess();
      return {
        connected: true, model: this.defaultModel, available: true,
        availableModels: this.knownModels, totalModels: this.knownModels.length,
      };
    } catch (error) {
      this._cbRecordFailure(error);
      return {
        connected: false, model: this.defaultModel, available: false,
        availableModels: this.knownModels, totalModels: this.knownModels.length,
        error: error.message,
      };
    }
  }

  getRecommendedModel(task = 'chat') {
    return (this.modelRecommendations[task] || [this.defaultModel])[0];
  }

  /**
   * Non-streaming generation.
   * Accepts either:
   *   - generate(promptString, options)  — prompt becomes single user message
   *   - generate(_, { messages, system }) — uses messages array directly
   */
  async generate(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this.apiKey) {
      this._metrics.failCount++;
      return { success: false, error: 'Anthropic API key not configured. Add it in Settings.' };
    }

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      const wait = Math.max(0, Math.ceil((this._cb.nextRetryAt - Date.now()) / 1000));
      return { success: false, error: `Circuit breaker open — Anthropic unreachable. Retrying in ${wait}s` };
    }

    const startTime = Date.now();
    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxTokens = options.num_predict || 4096;

    // Build messages array
    const messages = options.messages || [{ role: 'user', content: prompt }];
    const system = options.system || CTL_SYSTEM;

    try {
      const response = await this.client.post('/v1/messages', {
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
      }, {
        headers: this._getAuthHeaders(),
        timeout: options.timeout || 90000,
      });

      const elapsed = Date.now() - startTime;
      this._metrics.successCount++;
      this._metrics.totalResponseMs += elapsed;
      this._cbRecordSuccess();

      const text = response.data?.content?.[0]?.text || '';
      return {
        success: true,
        response: text,
        model,
        durationMs: elapsed,
        usage: response.data?.usage,
      };
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      const msg = error.response?.data?.error?.message || error.message;
      logger.error('[anthropic] generate error:', msg);
      return { success: false, error: msg };
    }
  }

  /**
   * Streaming generation via Anthropic SSE.
   * Yields text chunks as they arrive.
   */
  async *generateStream(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this.apiKey) {
      this._metrics.failCount++;
      yield 'Error: Anthropic API key not configured. Add it in Settings.';
      return;
    }

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      yield 'Error: Anthropic circuit breaker open — service unreachable.';
      return;
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;
    const maxTokens = options.num_predict || 4096;
    const messages = options.messages || [{ role: 'user', content: prompt }];
    const system = options.system || CTL_SYSTEM;
    const startTime = Date.now();

    try {
      const response = await this.client.post('/v1/messages', {
        model, max_tokens: maxTokens, temperature, system, messages, stream: true,
      }, {
        headers: this._getAuthHeaders(),
        responseType: 'stream',
        timeout: options.timeout || 90000,
      });

      let buffer = '';
      for await (const rawChunk of response.data) {
        buffer += rawChunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // last line may be incomplete

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              yield event.delta.text;
            } else if (event.type === 'message_stop') {
              const elapsed = Date.now() - startTime;
              this._metrics.successCount++;
              this._metrics.totalResponseMs += elapsed;
              this._cbRecordSuccess();
              return;
            } else if (event.type === 'error') {
              throw new Error(event.error?.message || 'Anthropic stream error');
            }
          } catch (parseErr) {
            // skip malformed SSE line
          }
        }
      }
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      const msg = error.response?.data?.error?.message || error.message;
      logger.error('[anthropic] stream error:', msg);
      yield `Error: ${msg}`;
    }
  }

  // Cloud-hosted — no local model management
  async pullModel() {
    return { success: false, error: 'Anthropic models are cloud-hosted and cannot be pulled' };
  }

  async deleteModel() {
    return { success: false, error: 'Anthropic models are cloud-hosted and cannot be deleted' };
  }

  // ── Prompt helpers (identical interface to other providers) ──

  getChatMessages(message, history = []) {
    const messages = [];
    // Add conversation history in proper format
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: message });
    return { system: CTL_SYSTEM, messages };
  }

  // Legacy string format for backwards compat with analysis/scoring callers
  getChatPrompt(message, history = []) {
    let prompt = CTL_SYSTEM + '\n\n';
    if (history.length > 0) {
      prompt += 'Conversation History:\n';
      history.forEach(m => { prompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`; });
      prompt += '\n';
    }
    prompt += `User: ${message}\nAssistant:`;
    return prompt;
  }

  getLeadScoringPrompt(lead) {
    return `Analyze this lead for CTL Plumbing LLC and score it 0-100.

Lead:
- Name: ${lead.name}
- Company: ${lead.company || 'N/A'}
- Location: ${lead.location || 'Not specified'}
- Project Type: ${lead.projectType || 'Not specified'}
- Estimated Value: $${lead.value?.toLocaleString() || '0'}
- Notes: ${lead.notes || 'None'}

Score criteria:
- Hot (80-100): High-value DFW commercial, qualified buyer, immediate timeline
- Warm (50-79): Good potential, needs nurturing, smaller or outside DFW
- Cold (0-49): Low value, unqualified, poor fit

Respond ONLY with valid JSON:
{"score":<0-100>,"status":"<hot|warm|cold>","reasoning":"<brief>"}`;
  }

  getBlueprintAnalysisPrompt(estimateData) {
    return `You are an expert plumbing estimator for CTL Plumbing LLC (DFW). Analyze this project:

- Square Footage: ${estimateData.sqft}
- Bathrooms: ${estimateData.bathrooms}
- Units: ${estimateData.units}
- Stories: ${estimateData.stories}
- Pricing Tier: ${estimateData.tier}

Provide: material recommendations, labor hours per phase, timeline estimate, potential challenges, DFW code compliance notes.`;
  }

  async scoreLead(lead, modelOverride = null) {
    const model = modelOverride || this.getRecommendedModel('scoring');
    const prompt = this.getLeadScoringPrompt(lead);
    const result = await this.generate(prompt, {
      temperature: 0.2,
      model,
      system: 'You are a lead scoring assistant. Respond with only valid JSON.',
    });

    if (!result.success) return this._ruleBasedScoring(lead);

    try {
      const match = result.response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          score: Math.max(0, Math.min(100, parsed.score)),
          status: parsed.status,
          reasoning: parsed.reasoning,
          modelUsed: model,
        };
      }
    } catch { /* fall through */ }
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
    return { score, status: score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold', reasoning: 'Rule-based scoring' };
  }
}

export const anthropicService = new AnthropicService();
