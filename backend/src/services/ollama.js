// Ollama AI service wrapper for local LLM integration

import axios from 'axios';

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.1';

    // Recommended models for specific tasks
    this.modelRecommendations = {
      chat: ['llama3.1', 'qwen2.5-coder:7b', 'deepseek-r1:1.5b'],
      coding: ['qwen2.5-coder:7b', 'deepseek-r1:1.5b'],
      reasoning: ['deepseek-r1:1.5b', 'llama3.1'],
      fast: ['sam860/phi4-mini:3.8b-Q4_K_S', 'deepseek-r1:1.5b'],
      scoring: ['llama3.1', 'qwen2.5-coder:7b'],
      analysis: ['qwen2.5-coder:7b', 'llama3.1', 'deepseek-r1:1.5b']
    };
  }

  // Get list of available models from Ollama
  async listAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
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

  // Check if Ollama is available and get all models
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
      const models = response.data.models || [];
      const hasDefaultModel = models.some(m => m.name.includes(this.defaultModel));

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

  // Get recommended model for a specific task
  getRecommendedModel(task = 'chat') {
    const recommendations = this.modelRecommendations[task] || [this.defaultModel];
    return recommendations[0];
  }

  // Generate a single response (non-streaming)
  async generate(prompt, options = {}) {
    try {
      const modelToUse = options.model || this.defaultModel;
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: modelToUse,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.num_predict,
          top_k: options.top_k,
          top_p: options.top_p
        }
      }, {
        timeout: options.timeout || 60000
      });

      return {
        success: true,
        response: response.data.response,
        model: modelToUse
      };
    } catch (error) {
      console.error('Ollama generate error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate streaming response
  async *generateStream(prompt, options = {}) {
    try {
      const modelToUse = options.model || this.defaultModel;
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: modelToUse,
        prompt,
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
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
              return;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      console.error('Ollama stream error:', error.message);
      yield `Error: ${error.message}`;
    }
  }

  // Prompt template for lead scoring
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

  // Prompt template for blueprint/estimate analysis
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

  // Prompt template for chat with CTL context
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
      // Fallback to rule-based scoring
      return this.ruleBasedScoring(lead);
    }

    try {
      // Extract JSON from response
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
      console.error('Failed to parse AI scoring response:', error);
    }

    // Fallback to rule-based
    return this.ruleBasedScoring(lead);
  }

  // Fallback rule-based scoring
  ruleBasedScoring(lead) {
    let score = 50; // Start at neutral

    // Value scoring
    if (lead.value > 100000) score += 25;
    else if (lead.value > 50000) score += 15;
    else if (lead.value > 25000) score += 10;

    // Location scoring
    const dfwKeywords = ['dallas', 'fort worth', 'dfw', 'plano', 'frisco', 'arlington', 'irving'];
    const locationLower = (lead.location || '').toLowerCase();
    if (dfwKeywords.some(kw => locationLower.includes(kw))) {
      score += 15;
    }

    // Project type scoring
    const commercialKeywords = ['commercial', 'multi-family', 'apartment', 'complex'];
    const typeLower = (lead.projectType || '').toLowerCase();
    if (commercialKeywords.some(kw => typeLower.includes(kw))) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    let status = 'cold';
    if (score >= 80) status = 'hot';
    else if (score >= 50) status = 'warm';

    return {
      score,
      status,
      reasoning: 'Rule-based scoring (AI unavailable)'
    };
  }
}

export const ollamaService = new OllamaService();
