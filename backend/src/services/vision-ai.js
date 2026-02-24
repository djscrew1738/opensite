// Vision AI Service — Multi-pass AI analysis for blueprint understanding

import { db } from './database.js';
import logger from './logger.js';
import sharp from 'sharp';
import fs from 'fs';
import { ollamaService } from './ollama.js';
import { routingService } from './routing.js';

/**
 * Vision AI Service — Multi-pass AI analysis for blueprint understanding
 * Enhanced with Deep Scan (tiled local AI analysis) and Run Tracing
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
    const anthropicKey = await db.getSetting('anthropic_api_key');
    const groqKey = await db.getSetting('groq_api_key');

    if (!anthropicKey && !groqKey) {
      // If no cloud keys, try local deep scan if model is provided
      if (options.model && (options.model.includes('llava') || options.model.includes('vision'))) {
        return this.deepScan(imagePath, options, progressCallback);
      }
      throw new Error('No AI API key configured. Add an Anthropic or Groq API key in Settings, or use a local vision model.');
    }

    if (progressCallback) progressCallback(10);

    // Read and resize image for API — Groq has 4MB base64 limit, Anthropic 20MB
    // Resize to max 2048px on longest side for analysis (keeps detail, reduces size)
    const maxDim = anthropicKey ? 4096 : 2048;
    const resizedBuffer = await sharp(imagePath)
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64Image = resizedBuffer.toString('base64');
    const mediaType = 'image/jpeg';

    if (progressCallback) progressCallback(20);

    // Route to correct provider based on selected model
    const selectedModel = options.model;
    const isAnthropicModel = selectedModel && (selectedModel.startsWith('claude-') || selectedModel.startsWith('claude_'));
    const isGroqModel = selectedModel && (selectedModel.includes('llama') || selectedModel.includes('meta-'));

    let result;
    if (isAnthropicModel && anthropicKey) {
      result = await this.analyzeWithAnthropic(base64Image, mediaType, anthropicKey, options);
    } else if (isGroqModel && groqKey) {
      result = await this.analyzeWithGroq(base64Image, mediaType, groqKey, options);
    } else if (anthropicKey) {
      result = await this.analyzeWithAnthropic(base64Image, mediaType, anthropicKey, options);
    } else {
      result = await this.analyzeWithGroq(base64Image, mediaType, groqKey, options);
    }

    if (progressCallback) progressCallback(80);

    return result;
  }

  /**
   * Perform deep tiled scan using local vision model (Ollama)
   * This handles high-resolution blueprints by processing smaller segments
   */
  async deepScan(imagePath, options = {}, progressCallback) {
    const model = options.model || 'llava:13b';
    const tileSize = options.tileSize || 1024;
    const overlap = options.overlap || 128;

    logger.info('Starting Vision Deep Scan', { imagePath, model, tileSize });

    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;

    const cols = Math.ceil(width / (tileSize - overlap));
    const rows = Math.ceil(height / (tileSize - overlap));
    const totalTiles = cols * rows;

    const aggregated = {
      overview: `Deep Scan analysis using ${model} (${totalTiles} tiles)`,
      systems: [
        { name: 'Plumbing', confidence: 0.8, regions: [] }
      ],
      notes: [],
      scale: null
    };

    let tilesProcessed = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = c * (tileSize - overlap);
        const top = r * (tileSize - overlap);
        const currentWidth = Math.min(tileSize, width - left);
        const currentHeight = Math.min(tileSize, height - top);

        if (currentWidth <= 0 || currentHeight <= 0) continue;

        // Extract tile
        const tileBuffer = await sharp(imagePath)
          .extract({ left, top, width: currentWidth, height: currentHeight })
          .jpeg({ quality: 90 })
          .toBuffer();

        const base64Tile = tileBuffer.toString('base64');

        // Analyze tile with Ollama
        const prompt = `Analyze this DFW-area residential blueprint tile. Identify common US plumbing fixtures and symbols.
Return JSON only:
{
  "fixtures": [
    {
      "type": "toilet|sink|shower|drain|hose_bib|water_heater|washing_machine",
      "x": 0.0-1.0,
      "y": 0.0-1.0,
      "label": "Description, e.g., 'Master bath toilet' or 'WH-1'"
    }
  ]
}`;

        try {
          const result = await ollamaService.generate(prompt, {
            model,
            images: [base64Tile],
            temperature: 0.1
          });

          if (result.success) {
            const parsed = this.parseAnalysisResult(result.response, model);
            if (parsed.success && parsed.data.fixtures) {
              for (const fix of parsed.data.fixtures) {
                // Transform local tile coordinates to global image coordinates
                const globalX = (left + (fix.x * currentWidth)) / width;
                const globalY = (top + (fix.y * currentHeight)) / height;

                aggregated.systems[0].regions.push({
                  label: fix.label || fix.type,
                  type: 'fixture',
                  x: globalX,
                  y: globalY,
                  width: 0.01,
                  height: 0.01,
                  details: `Detected in tile ${c},${r}`
                });
              }
            }
          }
        } catch (err) {
          logger.warn(`Tile analysis failed at ${c},${r}: ${err.message}`);
        }

        tilesProcessed++;
        if (progressCallback) {
          progressCallback(10 + Math.round((tilesProcessed / totalTiles) * 80));
        }
      }
    }

    aggregated.notes.push(`Deep Scan completed. Processed ${totalTiles} tiles.`);
    
    // Estimate pipe runs based on detected fixtures
    const allFixtures = aggregated.systems.find(s => s.name === 'Plumbing')?.regions || [];
    if (allFixtures.length > 1) {
      const { pipeRuns, materialEstimates } = routingService.estimatePipeRuns(allFixtures);
      aggregated.pipeRuns = pipeRuns;
      aggregated.materialEstimates = materialEstimates;
      aggregated.notes.push(`Estimated ${pipeRuns.length} pipe runs.`);
    }

    return {
      success: true,
      data: aggregated,
      model,
      raw: JSON.stringify(aggregated)
    };
  }

  /**
   * Perform deep tiled scan optimized for detecting linear runs (pipes, walls)
   */
  async traceRuns(imagePath, options = {}, progressCallback) {
    const model = options.model || 'llava:13b';
    const tileSize = options.tileSize || 1024;
    const overlap = options.overlap || 256; // Higher overlap for better run stitching

    logger.info('Starting Vision Run Tracing', { imagePath, model });

    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;

    const cols = Math.ceil(width / (tileSize - overlap));
    const rows = Math.ceil(height / (tileSize - overlap));
    const totalTiles = cols * rows;

    const aggregated = {
      overview: `Tracing analysis using ${model} (${totalTiles} tiles)`,
      systems: [
        { name: 'Pipe Runs', confidence: 0.7, regions: [] },
        { name: 'Walls', confidence: 0.7, regions: [] }
      ],
      notes: [],
      scale: null
    };

    let tilesProcessed = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = c * (tileSize - overlap);
        const top = r * (tileSize - overlap);
        const currentWidth = Math.min(tileSize, width - left);
        const currentHeight = Math.min(tileSize, height - top);

        if (currentWidth <= 0 || currentHeight <= 0) continue;

        const tileBuffer = await sharp(imagePath)
          .extract({ left, top, width: currentWidth, height: currentHeight })
          .jpeg({ quality: 90 })
          .toBuffer();

        const base64Tile = tileBuffer.toString('base64');

        const prompt = `Analyze this blueprint segment. Identify all pipe runs and interior wall segments.
Return JSON only:
{
  "runs": [
    {
      "type": "pipe|wall",
      "label": "Description (e.g. 4 inch PVC)",
      "points": [{"x": 0.0-1.0, "y": 0.0-1.0}, {"x": 0.0-1.0, "y": 0.0-1.0}]
    }
  ]
}`;

        try {
          const result = await ollamaService.generate(prompt, {
            model,
            images: [base64Tile],
            temperature: 0.1
          });

          if (result.success) {
            const parsed = this.parseAnalysisResult(result.response, model);
            const runs = parsed.data.runs || [];
            
            for (const run of runs) {
              const globalPoints = (run.points || []).map(p => ({
                x: (left + (p.x * currentWidth)) / width,
                y: (top + (p.y * currentHeight)) / height
              }));

              if (globalPoints.length >= 2) {
                const systemIdx = run.type === 'wall' ? 1 : 0;
                aggregated.systems[systemIdx].regions.push({
                  label: run.label || run.type,
                  type: 'path',
                  points: globalPoints,
                  details: `Segment in tile ${c},${r}`
                });
              }
            }
          }
        } catch (err) {
          logger.warn(`Run tracing failed at ${c},${r}: ${err.message}`);
        }

        tilesProcessed++;
        if (progressCallback) {
          progressCallback(10 + Math.round((tilesProcessed / totalTiles) * 80));
        }
      }
    }

    aggregated.notes.push(`Run tracing completed. Processed ${totalTiles} tiles.`);
    
    return {
      success: true,
      data: aggregated,
      model,
      raw: JSON.stringify(aggregated)
    };
  }

  async analyzeWithAnthropic(base64Image, mediaType, apiKey, options = {}) {
    const model = options.model || 'claude-haiku-4-5';

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
    const model = options.model || 'meta-llama/llama-4-scout-17b-16e-instruct';

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
      // Try each JSON code block individually (responses often have multiple blocks)
      const blockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
      let match;
      while ((match = blockRegex.exec(text)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.systems || parsed.overview || parsed.runs) {
            return { success: true, data: parsed, model, raw: text };
          }
        } catch (e2) { /* try next block */ }
      }

      // Try to find a standalone JSON object with expected keys
      const objRegex = /\{[^{}]*"(?:systems|overview|runs)"[^{}]*(?:\{[\s\S]*?\}[^{}]*)*\}/g;
      while ((match = objRegex.exec(text)) !== null) {
        try {
          const parsed = JSON.parse(match[0]);
          return { success: true, data: parsed, model, raw: text };
        } catch (e3) { /* try next */ }
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
      'Pipe Runs': '#00BCD4',
      'Walls': '#9E9E9E',
      'Electrical': '#FFC107',
      'HVAC': '#4CAF50',
      'Structural': '#9C27B0',
      'Fire Protection': '#F44336',
      'default': '#607D8B'
    };

    for (const system of analysisData.systems) {
      const color = colors[system.name] || colors.default;
      const annotations = (system.regions || []).map((region, i) => {
        const base = {
          id: `${system.name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
          type: region.type || 'other',
          label: region.label,
          details: region.details
        };

        if (region.type === 'path' || region.points) {
          return { ...base, points: region.points };
        }

        return {
          ...base,
          x: region.x,
          y: region.y,
          width: region.width || 0.02,
          height: region.height || 0.02
        };
      });

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
          strokeWidth: system.name === 'Walls' ? 4 : 2,
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
