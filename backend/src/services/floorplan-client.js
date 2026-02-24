/**
 * Floorplan Dimension Extractor Client
 * Node.js wrapper for the Floorplan-Dimractor Python service
 * Provides dimension and code extraction from floorplan PDFs
 */

import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import logger from './logger.js';

const FLOORPLAN_URL = process.env.FLOORPLAN_URL || 'http://localhost:8003';
const DEFAULT_TIMEOUT = 60000; // 1 minute for PDF processing

/**
 * Floorplan Dimension Extractor Client
 */
class FloorplanClient {
  constructor(baseURL = FLOORPLAN_URL) {
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
   * Check if Floorplan service is healthy
   * @returns {Promise<Object>} Health status
   */
  async health() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Floorplan service health check failed', { error: error.message });
      return {
        status: 'unavailable',
        capabilities: [],
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
    return health.status === 'healthy';
  }

  /**
   * Extract dimensions and codes from floorplan PDF
   * @param {string} filePath - Path to PDF file
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction results
   */
  async extract(filePath, options = {}) {
    const {
      method = 'auto',
      includeSummary = true
    } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));

    try {
      const response = await this.client.post('/extract', form, {
        headers: form.getHeaders(),
        params: { method, include_summary: includeSummary }
      });
      return response.data;
    } catch (error) {
      logger.error('Floorplan extraction failed', { 
        filePath, 
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract only dimensions
   * @param {string} filePath - Path to PDF file
   * @param {Object} options - Options
   * @returns {Promise<Object>} Dimensions
   */
  async extractDimensions(filePath, options = {}) {
    const { method = 'auto' } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));

    try {
      const response = await this.client.post('/extract/dimensions', form, {
        headers: form.getHeaders(),
        params: { method }
      });
      return response.data;
    } catch (error) {
      logger.error('Dimension extraction failed', { filePath, error: error.message });
      throw new Error(`Dimension extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract cabinet/appliance codes
   * @param {string} filePath - Path to PDF file
   * @param {Object} options - Options
   * @returns {Promise<Object>} Codes
   */
  async extractCodes(filePath, options = {}) {
    const { method = 'auto', plumbingOnly = false } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));

    try {
      const response = await this.client.post('/extract/codes', form, {
        headers: form.getHeaders(),
        params: { method, plumbing_only: plumbingOnly }
      });
      return response.data;
    } catch (error) {
      logger.error('Code extraction failed', { filePath, error: error.message });
      throw new Error(`Code extraction failed: ${error.message}`);
    }
  }

  /**
   * Create visualization of extracted elements
   * @param {string} filePath - Path to PDF file
   * @param {Object} options - Options
   * @returns {Promise<Buffer>} Image buffer
   */
  async createVisualization(filePath, options = {}) {
    const { page = 1, scale = 2.0 } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));

    try {
      const response = await this.client.post('/visualize', form, {
        headers: form.getHeaders(),
        params: { page, scale },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Visualization failed', { filePath, error: error.message });
      throw new Error(`Visualization failed: ${error.message}`);
    }
  }

  /**
   * Get pipe estimate based on floorplan analysis
   * @param {string} filePath - Path to PDF file
   * @param {Object} options - Options
   * @returns {Promise<Object>} Pipe estimate
   */
  async estimatePipes(filePath, options = {}) {
    const { method = 'auto' } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));

    try {
      const response = await this.client.post('/analyze/pipe-estimate', form, {
        headers: form.getHeaders(),
        params: { method }
      });
      return response.data;
    } catch (error) {
      logger.error('Pipe estimation failed', { filePath, error: error.message });
      throw new Error(`Pipe estimation failed: ${error.message}`);
    }
  }

  /**
   * Get supported patterns
   * @returns {Promise<Object>} Supported patterns
   */
  async getPatterns() {
    try {
      const response = await this.client.get('/patterns');
      return response.data;
    } catch (error) {
      logger.error('Failed to get patterns', { error: error.message });
      return { dimension_patterns: [], code_patterns: [] };
    }
  }
}

/**
 * Combined Blueprint Analysis Service
 * Integrates Floorplan-Dimractor with AECVision and AI analysis
 */
class ComprehensiveBlueprintService {
  constructor() {
    this.floorplanClient = new FloorplanClient();
    this.aecvisionClient = null; // Will be loaded dynamically
    this.aiProvider = null;
  }

  async init() {
    // Dynamically import AECVision client if available
    try {
      const { aecvisionClient } = await import('./aecvision-client.js');
      this.aecvisionClient = aecvisionClient;
    } catch (e) {
      logger.warn('AECVision client not available');
    }

    // Dynamically import AI provider
    try {
      const { aiProvider } = await import('./ai-provider.js');
      this.aiProvider = aiProvider;
    } catch (e) {
      logger.warn('AI provider not available');
    }
  }

  /**
   * Comprehensive blueprint analysis combining all sources
   * @param {string} filePath - Path to blueprint PDF
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Combined analysis
   */
  async analyze(filePath, options = {}) {
    const {
      useDimensions = true,
      useVision = true,
      useAI = true
    } = options;

    await this.init();

    const results = {
      dimensions: null,
      vision: null,
      ai: null,
      combined: null,
      metadata: {
        timestamp: new Date().toISOString(),
        filePath,
        servicesUsed: []
      }
    };

    // 1. Dimension Extraction (Floorplan-Dimractor)
    if (useDimensions) {
      try {
        const floorplanAvailable = await this.floorplanClient.isAvailable();
        if (floorplanAvailable) {
          logger.info('Running Floorplan dimension extraction', { filePath });
          results.dimensions = await this.floorplanClient.extract(filePath);
          results.metadata.servicesUsed.push('floorplan-dimractor');
        }
      } catch (error) {
        logger.warn('Floorplan extraction failed', { error: error.message });
      }
    }

    // 2. Computer Vision (AECVision)
    if (useVision && this.aecvisionClient) {
      try {
        const visionAvailable = await this.aecvisionClient.isAvailable();
        if (visionAvailable) {
          logger.info('Running AECVision analysis', { filePath });
          results.vision = await this.aecvisionClient.analyze(filePath);
          results.metadata.servicesUsed.push('aecvision');
        }
      } catch (error) {
        logger.warn('AECVision analysis failed', { error: error.message });
      }
    }

    // 3. AI Analysis
    if (useAI && this.aiProvider) {
      try {
        // Import existing blueprint service
        const { enhancedBlueprintService } = await import('./blueprint-enhanced.js');
        const pdfResult = await enhancedBlueprintService.extractPdfText(filePath);
        
        if (pdfResult.success) {
          const extraction = enhancedBlueprintService.extractWithConfidence(
            pdfResult.text,
            filePath
          );

          // Build enhanced prompt with dimension data
          const prompt = this.buildComprehensivePrompt(
            extraction.extractedInfo,
            pdfResult.text,
            results.dimensions,
            results.vision
          );

          const aiResult = await this.aiProvider.generate(prompt, { timeout: 300000 });
          
          if (aiResult.success) {
            results.ai = this.parseAIResponse(aiResult.response);
            results.metadata.servicesUsed.push('ai');
          }
        }
      } catch (error) {
        logger.warn('AI analysis failed', { error: error.message });
      }
    }

    // 4. Combine Results
    results.combined = this.combineAllResults(
      results.dimensions,
      results.vision,
      results.ai
    );

    return results;
  }

  /**
   * Build comprehensive prompt with all data sources
   */
  buildComprehensivePrompt(extractedData, blueprintText, dimensionData, visionData) {
    let dimensionContext = '';
    if (dimensionData?.summary) {
      const summary = dimensionData.summary;
      dimensionContext = `
FLOORPLAN DIMENSION DATA (extracted from PDF):
- Total dimensions found: ${summary.total_dimensions}
- Total measured length: ${summary.dimension_stats?.total_feet?.toFixed(1) || 0} feet
- Cabinet/appliance codes: ${summary.total_codes}
- Plumbing connections detected: ${summary.plumbing_codes}
- Room types: ${summary.room_types?.join(', ') || 'unknown'}
`;
    }

    let visionContext = '';
    if (visionData?.fixtures) {
      visionContext = `
COMPUTER VISION DETECTION:
- Walls detected: ${visionData.detections?.counts?.wall || 0}
- Fixtures: ${JSON.stringify(visionData.fixtures)}
`;
    }

    const fixtureCount = (extractedData.toilets || 0) + (extractedData.lavatories || 0) +
      (extractedData.kitchenFaucets || 0) + (extractedData.barSinks || 0);

    return `You are a DFW plumbing estimator. Analyze this blueprint with comprehensive data.

PROJECT DATA:
${extractedData.sqft ? `SQ FT: ${extractedData.sqft}` : ''}
${extractedData.units ? `UNITS: ${extractedData.units}` : ''}
${extractedData.stories ? `STORIES: ${extractedData.stories}` : ''}
TEXT-EXTRACTED FIXTURES: ${fixtureCount} total

${dimensionContext}
${visionContext}

${blueprintText ? 'BLUEPRINT TEXT:\n' + blueprintText.substring(0, 4000) : ''}

Use the dimension data to estimate pipe run lengths more accurately.
Use cabinet codes to identify fixture locations.

Return JSON with:
{
  "fixtures": {...},
  "takeoff": [...],
  "pipe_runs": {"estimated_feet": 0, "by_system": {...}},
  "totals": {...}
}`;
  }

  parseAIResponse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {}
      }
      return null;
    }
  }

  combineAllResults(dimensions, vision, ai) {
    const combined = {
      fixtures: {},
      pipeRuns: {},
      materialTakeoff: [],
      sources: []
    };

    // Combine fixture counts from all sources
    if (dimensions?.summary?.plumbing_codes) {
      combined.sources.push('dimensions');
    }
    if (vision?.fixtures) {
      combined.fixtures = { ...combined.fixtures, ...vision.fixtures };
      combined.sources.push('vision');
    }
    if (ai?.fixtures) {
      combined.fixtures = { ...combined.fixtures, ...ai.fixtures };
      combined.sources.push('ai');
    }

    // Use AI material takeoff if available (most detailed)
    if (ai?.takeoff) {
      combined.materialTakeoff = ai.takeoff;
    }

    // Add pipe run estimates from dimensions
    if (dimensions?.summary?.dimension_stats?.total_feet) {
      combined.pipeRuns.fromDimensions = {
        totalFeet: dimensions.summary.dimension_stats.total_feet,
        estimatedPipeFeet: dimensions.summary.dimension_stats.total_feet * 0.4
      };
    }

    return combined;
  }
}

// Export singleton instances
export const floorplanClient = new FloorplanClient();
export const comprehensiveBlueprintService = new ComprehensiveBlueprintService();
export { FloorplanClient, ComprehensiveBlueprintService };
