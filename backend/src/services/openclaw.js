// OpenClaw AI service — routes through the local Ollama backend using the model
// configured in OpenClaw's gateway. Health checks verify the OpenClaw gateway is
// running; actual inference goes through Ollama's API for reliable chat without
// the agent tool layer.

import axios from 'axios';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const CB_CLOSED = 'closed';
const CB_OPEN = 'open';
const CB_HALF_OPEN = 'half-open';

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || '/home/djscrew/.npm-global/bin/openclaw';

class OpenClawService {
  constructor() {
    this.baseUrl = process.env.OPENCLAW_URL || 'http://localhost:18789';
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.apiKey = process.env.OPENCLAW_TOKEN || '';
    this.defaultModel = process.env.OPENCLAW_MODEL || 'qwen2.5-coder:7b';
    this.defaultTemperature = 0.7;

    // Ollama client for actual inference
    this.client = axios.create({
      baseURL: this.ollamaUrl,
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.modelRecommendations = {
      chat: ['qwen2.5-coder:7b'],
      coding: ['qwen2.5-coder:7b'],
      reasoning: ['qwen2.5-coder:7b'],
      fast: ['qwen2.5-coder:7b'],
      scoring: ['qwen2.5-coder:7b'],
      analysis: ['qwen2.5-coder:7b'],
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
    if (baseUrl) this.baseUrl = baseUrl;
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (defaultModel) this.defaultModel = defaultModel;
    if (temperature !== undefined) this.defaultTemperature = temperature;
    this._cbReset();
  }

  getConfig() {
    return {
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      temperature: this.defaultTemperature,
      provider: 'openclaw',
      hasApiKey: true, // No key needed for local gateway
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

  /**
   * Query the OpenClaw gateway for status info via CLI.
   */
  async _gatewayStatus() {
    try {
      const { stdout } = await execFileAsync(OPENCLAW_BIN, ['gateway', 'call', 'status', '--json'], {
        timeout: 15000,
        env: { ...process.env, NO_COLOR: '1' },
      });
      const idx = stdout.indexOf('{');
      return idx >= 0 ? JSON.parse(stdout.slice(idx)) : {};
    } catch {
      return null;
    }
  }

  async listAvailableModels() {
    try {
      // Get models from Ollama (the actual inference backend)
      const response = await this.client.get('/api/tags', { timeout: 10000 });
      const ollamaModels = response.data?.models || [];

      const models = ollamaModels.map(m => ({
        name: m.name,
        label: `OpenClaw — ${m.name}`,
        size: m.size,
        context: 128000,
        speed: 'fast',
      }));

      if (models.length === 0) {
        models.push({
          name: this.defaultModel,
          label: `OpenClaw — ${this.defaultModel}`,
          context: 128000,
          speed: 'fast',
        });
      }

      return { success: true, models };
    } catch {
      return {
        success: true,
        models: [{
          name: this.defaultModel,
          label: `OpenClaw — ${this.defaultModel}`,
          context: 128000,
          speed: 'fast',
        }],
      };
    }
  }

  async healthCheck() {
    try {
      // Check the OpenClaw gateway via CLI
      const { stdout } = await execFileAsync(OPENCLAW_BIN, ['health'], {
        timeout: 15000,
        env: { ...process.env, NO_COLOR: '1' },
      });

      // Also verify Ollama is reachable (the inference backend)
      await this.client.get('/api/tags', { timeout: 5000 });

      this._cbRecordSuccess();
      const result = await this.listAvailableModels();

      return {
        connected: true,
        model: this.defaultModel,
        available: true,
        availableModels: result.models,
        totalModels: result.models.length,
        details: stdout.trim(),
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

  /**
   * Build a prompt string from flat prompt or structured messages.
   */
  _buildPrompt(prompt, options = {}) {
    if (options.messages && Array.isArray(options.messages)) {
      let out = '';
      if (options.system) {
        out += options.system + '\n\n';
      }
      for (const msg of options.messages) {
        if (msg.role === 'system') {
          out += msg.content + '\n\n';
        } else {
          out += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }
      }
      out += 'Assistant:';
      return out.trim();
    }
    return prompt;
  }

  // Non-streaming generation via Ollama /api/generate
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
    const message = this._buildPrompt(prompt, options);

    try {
      const response = await this.client.post('/api/generate', {
        model: modelToUse,
        prompt: message,
        stream: false,
        options: {
          temperature,
          num_predict: options.num_predict || 4096,
        },
      }, {
        timeout: options.timeout || 120000,
      });

      const elapsed = Date.now() - startTime;
      this._metrics.successCount++;
      this._metrics.totalResponseMs += elapsed;
      this._cbRecordSuccess();

      return {
        success: true,
        response: response.data?.response || '',
        model: modelToUse,
        durationMs: elapsed,
        usage: {
          prompt_tokens: response.data?.prompt_eval_count || 0,
          completion_tokens: response.data?.eval_count || 0,
          total_tokens: (response.data?.prompt_eval_count || 0) + (response.data?.eval_count || 0),
        },
      };
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      const msg = error.response?.data?.error || error.message;
      console.error('[openclaw] generate error:', msg);
      return { success: false, error: msg };
    }
  }

  // Streaming generation via Ollama /api/generate with stream=true
  async *generateStream(prompt, options = {}) {
    this._metrics.totalRequests++;

    if (!this._cbCanRequest()) {
      this._metrics.failCount++;
      yield 'Error: OpenClaw circuit breaker open — service unreachable.';
      return;
    }

    const modelToUse = options.model || this.defaultModel;
    const temperature = options.temperature ?? this.defaultTemperature;
    const message = this._buildPrompt(prompt, options);
    const startTime = Date.now();

    try {
      const response = await this.client.post('/api/generate', {
        model: modelToUse,
        prompt: message,
        stream: true,
        options: {
          temperature,
          num_predict: options.num_predict || 4096,
        },
      }, {
        responseType: 'stream',
        timeout: options.timeout || 120000,
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.done) {
              const elapsed = Date.now() - startTime;
              this._metrics.successCount++;
              this._metrics.totalResponseMs += elapsed;
              this._cbRecordSuccess();
              return;
            }
            if (data.response) {
              yield data.response;
            }
          } catch { /* skip invalid lines */ }
        }
      }
    } catch (error) {
      this._metrics.failCount++;
      this._cbRecordFailure(error);
      const msg = error.response?.data?.error || error.message;
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

  // Prompt templates
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
    const { system, messages } = this.getChatMessages(message, conversationHistory);
    let prompt = system + '\n\n';

    if (conversationHistory.length > 0) {
      prompt += 'Conversation History:\n';
      conversationHistory.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    prompt += `\nUser: ${message}\nAssistant:`;
    return prompt;
  }

  getChatMessages(message, conversationHistory = []) {
    const system = `You are an AI assistant for CTL Plumbing LLC, a commercial and multi-family plumbing contractor in the DFW Metroplex.

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
- Project planning`;

    const messages = [];
    if (conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: message });

    return { system, messages };
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
