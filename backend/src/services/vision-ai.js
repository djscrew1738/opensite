// Vision AI Service — Multi-pass AI analysis for blueprint understanding

import { db } from './database.js';
import logger from './logger.js';
import fs from 'fs';

/**
 * Run AI vision analysis on a blueprint image
 * Uses Anthropic API (Claude) with vision capabilities
 * Falls back to Groq if Anthropic key not available
 */
class VisionAIService {
  /**
   * Perform global scan analysis of a blueprint image
   * @param {string} imagePath - Path to image file
   * @param {object} options - { projectId, model }
   * @param {Function} progressCallback - Progress callback
   * @returns {object} Analysis result with spatial annotations
   */
  async analyzeBlueprint(imagePath, options = {}, progressCallback) {
    const anthropicKey = db.getSetting('anthropic_api_key');
    const groqKey = db.getSetting('groq_api_key');

    if (!anthropicKey && !groqKey) {
      throw new Error('No AI API key configured. Add an Anthropic or Groq API key in Settings.');
    }

    if (progressCallback) progressCallback(10);

    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = imagePath.split('.').pop().toLowerCase();
    const mediaType = ext === 'png' ? 'image/png' :
                      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                      ext === 'tiff' || ext === 'tif' ? 'image/tiff' :
                      ext === 'webp' ? 'image/webp' : 'image/jpeg';

    if (progressCallback) progressCallback(20);

    let result;
    if (anthropicKey) {
      result = await this.analyzeWithAnthropic(base64Image, mediaType, anthropicKey, options);
    } else {
      result = await this.analyzeWithGroq(base64Image, mediaType, groqKey, options);
    }

    if (progressCallback) progressCallback(80);

    return result;
  }

  async analyzeWithAnthropic(base64Image, mediaType, apiKey, options = {}) {
    const model = options.model || 'claude-haiku-4-5-20251001';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image
              }
            },
            {
              type: 'text',
              text: this.getAnalysisPrompt()
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error('Anthropic vision API error', { status: response.status, error: err });
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return this.parseAnalysisResult(text, model);
  }

  async analyzeWithGroq(base64Image, mediaType, apiKey, options = {}) {
    const model = options.model || 'llama-3.2-90b-vision-preview';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: this.getAnalysisPrompt()
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error('Groq vision API error', { status: response.status, error: err });
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return this.parseAnalysisResult(text, model);
  }

  getAnalysisPrompt() {
    return `You are an expert construction blueprint analyst specializing in plumbing systems. Analyze this blueprint image and identify all major systems and components.

Return your analysis as JSON with this structure:
{
  "overview": "Brief description of what this blueprint shows",
  "systems": [
    {
      "name": "System name (e.g., Plumbing, Electrical, HVAC, Structural)",
      "confidence": 0.0-1.0,
      "regions": [
        {
          "label": "Component label",
          "type": "fixture|pipe|valve|connection|label|dimension|other",
          "x": 0.0-1.0,
          "y": 0.0-1.0,
          "width": 0.0-1.0,
          "height": 0.0-1.0,
          "details": "Additional details about this component"
        }
      ]
    }
  ],
  "dimensions": [
    {
      "label": "Dimension label",
      "value": "Measurement value",
      "x": 0.0-1.0,
      "y": 0.0-1.0
    }
  ],
  "notes": ["Any important observations"],
  "scale": "Detected scale if visible (e.g., 1/4\" = 1'-0\")"
}

IMPORTANT: All coordinates (x, y, width, height) must be normalized between 0 and 1, where (0,0) is the top-left corner and (1,1) is the bottom-right corner. Return ONLY valid JSON.`;
  }

  parseAnalysisResult(text, model) {
    try {
      // Try direct parse
      const parsed = JSON.parse(text);
      return { success: true, data: parsed, model, raw: text };
    } catch (e) {
      // Try extracting JSON from markdown blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return { success: true, data: parsed, model, raw: text };
        } catch (e2) { /* fall through */ }
      }

      // Try to find JSON object
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          const parsed = JSON.parse(objMatch[0]);
          return { success: true, data: parsed, model, raw: text };
        } catch (e3) { /* fall through */ }
      }

      logger.warn('Could not parse vision AI response as JSON', { text: text.substring(0, 200) });
      return {
        success: false,
        data: {
          overview: text.substring(0, 500),
          systems: [],
          dimensions: [],
          notes: ['AI response could not be parsed as structured data'],
          scale: null
        },
        model,
        raw: text
      };
    }
  }

  /**
   * Convert AI analysis result into annotation layers
   */
  analysisToLayers(analysisData) {
    const layers = [];

    if (!analysisData || !analysisData.systems) return layers;

    // Color palette for systems
    const colors = {
      'Plumbing': '#2196F3',
      'Electrical': '#FFC107',
      'HVAC': '#4CAF50',
      'Structural': '#9C27B0',
      'Fire Protection': '#F44336',
      'default': '#607D8B'
    };

    for (const system of analysisData.systems) {
      const color = colors[system.name] || colors.default;
      const annotations = (system.regions || []).map((region, i) => ({
        id: `${system.name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        type: region.type || 'other',
        label: region.label,
        x: region.x,
        y: region.y,
        width: region.width || 0.02,
        height: region.height || 0.02,
        details: region.details
      }));

      layers.push({
        name: system.name,
        type: 'ai-detected',
        visible: true,
        minZoom: 0,
        maxZoom: 20,
        data: annotations,
        style: {
          color,
          opacity: 0.6,
          strokeWidth: 2,
          confidence: system.confidence
        }
      });
    }

    // Add dimensions layer if present
    if (analysisData.dimensions && analysisData.dimensions.length > 0) {
      layers.push({
        name: 'Dimensions',
        type: 'ai-detected',
        visible: true,
        minZoom: 3,
        maxZoom: 20,
        data: analysisData.dimensions.map((dim, i) => ({
          id: `dim-${i}`,
          type: 'dimension',
          label: `${dim.label}: ${dim.value}`,
          x: dim.x,
          y: dim.y,
          width: 0.01,
          height: 0.01
        })),
        style: {
          color: '#FF5722',
          opacity: 0.8,
          strokeWidth: 1
        }
      });
    }

    return layers;
  }
}

export const visionAIService = new VisionAIService();
export default visionAIService;
