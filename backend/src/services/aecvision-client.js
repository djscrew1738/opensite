/**
 * AECVision Client Service
 * Node.js wrapper for the AECVision Python CV service
 * Provides blueprint analysis using YOLOv5 object detection
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { createReadStream } from 'fs';
import logger from './logger.js';

const AECVISION_URL = process.env.AECVISION_URL || 'http://localhost:8002';
const DEFAULT_TIMEOUT = 120000; // 2 minutes for CV processing

/**
 * AECVision Client for blueprint computer vision analysis
 */
class AECVisionClient {
  constructor(baseURL = AECVISION_URL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Check if AECVision service is healthy
   * @returns {Promise<Object>} Health status
   */
  async health() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('AECVision health check failed', { error: error.message });
      return {
        status: 'unavailable',
        model_loaded: false,
        device: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Check if service is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    const health = await this.health();
    return health.status === 'healthy' && health.model_loaded;
  }

  /**
   * Run object detection on blueprint
   * @param {string} filePath - Path to image or PDF file
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Detection results
   */
  async detect(filePath, options = {}) {
    const {
      confidence = 0.5,
      size = 1280
    } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('confidence', confidence.toString());
    form.append('size', size.toString());

    try {
      const response = await this.client.post('/detect', form, {
        headers: form.getHeaders()
      });
      return response.data;
    } catch (error) {
      logger.error('AECVision detection failed', { 
        filePath, 
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Detection failed: ${error.message}`);
    }
  }

  /**
   * Complete blueprint analysis with plumbing estimates
   * @param {string} filePath - Path to image or PDF file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(filePath, options = {}) {
    const {
      confidence = 0.5,
      pixelToFeet = 0.5,
      includeMaterials = true
    } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('confidence', confidence.toString());
    form.append('pixel_to_feet', pixelToFeet.toString());
    form.append('include_materials', includeMaterials.toString());

    try {
      const response = await this.client.post('/analyze', form, {
        headers: form.getHeaders()
      });
      return response.data;
    } catch (error) {
      logger.error('AECVision analysis failed', { 
        filePath, 
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Detect walls only (optimized for pipe run estimation)
   * @param {string} filePath - Path to image or PDF file
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Wall detection results
   */
  async detectWalls(filePath, options = {}) {
    const {
      confidence = 0.8,
      useSahi = false
    } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('confidence', confidence.toString());
    form.append('use_sahi', useSahi.toString());

    try {
      const response = await this.client.post('/detect/walls', form, {
        headers: form.getHeaders()
      });
      return response.data;
    } catch (error) {
      logger.error('AECVision wall detection failed', { 
        filePath, 
        error: error.message 
      });
      throw new Error(`Wall detection failed: ${error.message}`);
    }
  }

  /**
   * Convert PDF to image
   * @param {string} pdfPath - Path to PDF file
   * @param {number} pageNum - Page number (0-indexed)
   * @returns {Promise<Buffer>} Image buffer
   */
  async convertPDF(pdfPath, pageNum = 0) {
    const form = new FormData();
    form.append('file', createReadStream(pdfPath));
    form.append('page_num', pageNum.toString());

    try {
      const response = await this.client.post('/convert/pdf', form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('AECVision PDF conversion failed', { 
        pdfPath, 
        error: error.message 
      });
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Get available detection classes
   * @returns {Promise<Object>} Available models/classes
   */
  async getAvailableModels() {
    try {
      const response = await this.client.get('/models/available');
      return response.data;
    } catch (error) {
      logger.error('Failed to get available models', { error: error.message });
      return { classes: [] };
    }
  }
}

/**
 * Enhanced Blueprint Service combining AECVision CV with AI analysis
 */
class EnhancedCVBlueprintService {
  constructor() {
    this.cvClient = new AECVisionClient();
  }

  /**
   * Comprehensive blueprint analysis combining CV and AI
   * @param {string} filePath - Path to blueprint file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Combined analysis results
   */
  async analyzeBlueprint(filePath, options = {}) {
    const {
      useCV = true,
      useAI = true,
      tier = 'custom',
      model = null
    } = options;

    const results = {
      cvAnalysis: null,
      aiAnalysis: null,
      combined: null,
      metadata: {
        cvAvailable: false,
        aiAvailable: useAI,
        processingSteps: []
      }
    };

    // Step 1: Computer Vision Analysis (if available)
    if (useCV) {
      try {
        const cvAvailable = await this.cvClient.isAvailable();
        results.metadata.cvAvailable = cvAvailable;

        if (cvAvailable) {
          logger.info('Running AECVision CV analysis', { filePath });
          results.metadata.processingSteps.push('cv_detection');
          
          const cvResults = await this.cvClient.analyze(filePath, {
            confidence: 0.6,
            includeMaterials: true
          });
          
          results.cvAnalysis = cvResults;
          results.metadata.processingSteps.push('cv_analysis');
        }
      } catch (error) {
        logger.warn('CV analysis failed, continuing without', { error: error.message });
        results.metadata.cvError = error.message;
      }
    }

    // Step 2: AI Analysis (via existing service)
    if (useAI) {
      // Import existing blueprint service
      const { enhancedBlueprintService } = await import('./blueprint-enhanced.js');
      const { aiProvider } = await import('./ai-provider.js');

      try {
        logger.info('Running AI text analysis', { filePath });
        results.metadata.processingSteps.push('ai_extraction');

        // Extract PDF text
        const pdfResult = await enhancedBlueprintService.extractPdfText(filePath);
        
        if (pdfResult.success) {
          const extraction = enhancedBlueprintService.extractWithConfidence(
            pdfResult.text, 
            filePath
          );

          // Build AI prompt with CV data if available
          const prompt = this.buildAnalysisPrompt(
            extraction.extractedInfo,
            pdfResult.text,
            results.cvAnalysis,
            tier
          );

          results.metadata.processingSteps.push('ai_analysis');

          // Get AI analysis
          const aiModel = model || aiProvider.getRecommendedModel('analysis');
          const aiResult = await aiProvider.generate(prompt, { 
            model: aiModel, 
            timeout: 300000 
          });

          if (aiResult.success) {
            results.aiAnalysis = this.parseAIResponse(aiResult.response);
          }
        }
      } catch (error) {
        logger.warn('AI analysis failed', { error: error.message });
        results.metadata.aiError = error.message;
      }
    }

    // Step 3: Combine Results
    results.combined = this.combineResults(results.cvAnalysis, results.aiAnalysis);

    return results;
  }

  /**
   * Build AI analysis prompt incorporating CV data
   */
  buildAnalysisPrompt(extractedData, blueprintText, cvData, tier) {
    let cvContext = '';
    
    if (cvData) {
      const fixtures = cvData.fixtures || {};
      const detections = cvData.detections?.counts || {};
      
      cvContext = `
COMPUTER VISION DETECTION (from blueprint image analysis):
- Walls detected: ${detections.wall || 0}
- Rooms detected: ${detections.room || 0}
- Doors detected: ${detections.door || 0}
- Windows detected: ${detections.window || 0}
- Toilets detected: ${fixtures.toilets || detections.toilet || 0}
- Sinks detected: ${fixtures.sinks || detections.sink || 0}
- Showers detected: ${fixtures.showers || detections.shower || 0}
- Bathtubs detected: ${fixtures.bathtubs || detections.bathtub || 0}

CV Pipe Run Estimate:
${cvData.pipe_runs ? JSON.stringify(cvData.pipe_runs, null, 2) : 'N/A'}
`;
    }

    const fixtureCount = (extractedData.toilets || 0) + (extractedData.lavatories || 0) +
      (extractedData.kitchenFaucets || 0) + (extractedData.barSinks || 0) +
      (extractedData.tubs || 0) + (extractedData.showerBases || 0);

    return `You are a DFW plumbing estimator. Analyze this blueprint and return a supply-house-ready material takeoff.

PROJECT DATA:
${extractedData.sqft ? `SQ FT: ${extractedData.sqft}` : ''}
${extractedData.units ? `UNITS: ${extractedData.units}` : ''}
${extractedData.stories ? `STORIES: ${extractedData.stories}` : ''}
${extractedData.bathrooms ? `BATHROOMS: ${extractedData.bathrooms}` : ''}
TEXT-EXTRACTED FIXTURES: ${fixtureCount} total — ${extractedData.toilets || 0} toilets, ${extractedData.lavatories || 0} lavs, ${extractedData.kitchenFaucets || 0} kitchen, ${extractedData.barSinks || 0} bar, ${extractedData.tubs || 0} tubs, ${extractedData.showerBases || 0} showers

${cvContext}

${blueprintText ? 'BLUEPRINT TEXT:\n' + blueprintText.substring(0, 4000) : ''}

IMPORTANT: Cross-reference the computer vision detections with extracted text. Use the higher count when they differ. CV detections are from direct image analysis and may be more accurate for fixture counts.

Return ONLY this JSON — no text before or after:

{
  "fixtures": {
    "toilets": 0, "lavatories": 0, "kitchenFaucets": 0, "barSinks": 0,
    "tubs": 0, "showerBases": 0, "total": 0
  },
  "takeoff": [
    {"item": "3/4\\" Type L Copper", "cat": "Supply", "qty": 340, "unit": "LF", "cost": 3.85}
  ],
  "totals": {
    "material": 18400,
    "laborMultiplier": 1.65,
    "estimate": 30360
  },
  "notes": ["47 fixtures total", "PEX-A recommended for 2nd floor"]
}

RULES:
- If CV detected walls, factor pipe runs along walls into quantities
- "takeoff" must be SUPPLY HOUSE READY with realistic part descriptions
- Use CV fixture counts if higher than text-extracted counts
- Include hanger straps, supports, and rough-in materials
- Return ONLY valid JSON`;
  }

  /**
   * Parse AI response JSON
   */
  parseAIResponse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from markdown
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          // Continue
        }
      }
      
      // Try to find JSON object
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch (e3) {
          // Continue
        }
      }
      
      return null;
    }
  }

  /**
   * Combine CV and AI analysis results
   */
  combineResults(cvData, aiData) {
    const combined = {
      fixtures: {},
      materialTakeoff: [],
      totals: {},
      cvEnhanced: false
    };

    // Merge fixture counts (use maximum)
    if (cvData?.fixtures && aiData?.fixtures) {
      combined.cvEnhanced = true;
      for (const key of Object.keys(aiData.fixtures)) {
        const cvCount = cvData.fixtures[key] || 0;
        const aiCount = aiData.fixtures[key] || 0;
        combined.fixtures[key] = Math.max(cvCount, aiCount);
      }
    } else if (aiData?.fixtures) {
      combined.fixtures = aiData.fixtures;
    } else if (cvData?.fixtures) {
      combined.fixtures = cvData.fixtures;
    }

    // Use AI material takeoff (more detailed)
    if (aiData?.takeoff) {
      combined.materialTakeoff = aiData.takeoff;
    } else if (cvData?.material_takeoff) {
      combined.materialTakeoff = cvData.material_takeoff;
    }

    // Use AI totals
    if (aiData?.totals) {
      combined.totals = aiData.totals;
    } else if (cvData?.totals) {
      combined.totals = cvData.totals;
    }

    // Merge notes
    combined.notes = [
      ...(aiData?.notes || []),
      ...(cvData?.cvEnhanced ? ['Enhanced with computer vision analysis'] : [])
    ];

    return combined;
  }
}

// Export singleton instances
export const aecvisionClient = new AECVisionClient();
export const enhancedCVBlueprintService = new EnhancedCVBlueprintService();
export { AECVisionClient, EnhancedCVBlueprintService };
