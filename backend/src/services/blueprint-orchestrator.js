/**
 * Blueprint Analysis Orchestrator
 * Unified service that coordinates AECVision, Floorplan, and AI analysis
 * Provides single-entry-point for comprehensive blueprint processing
 */

import { aecvisionClient } from './aecvision-client.js';
import { floorplanClient } from './floorplan-client.js';
import { aiProvider } from './ai-provider.js';
import { enhancedBlueprintService } from './blueprint-enhanced.js';
import logger from './logger.js';
import { db } from './database.js';

/**
 * Analysis Job Status
 */
const JOB_STATUS = {
  PENDING: 'pending',
  EXTRACTING_TEXT: 'extracting_text',
  RUNNING_CV: 'running_cv',
  RUNNING_DIMENSIONS: 'running_dimensions',
  RUNNING_AI: 'running_ai',
  COMBINING: 'combining',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Blueprint Analysis Orchestrator
 * Manages the entire analysis pipeline
 */
class BlueprintOrchestrator {
  constructor() {
    this.jobs = new Map(); // In-memory job storage
    this.subscribers = new Map(); // WebSocket/event subscribers
  }

  /**
   * Submit a blueprint for comprehensive analysis
   * @param {Object} options - Analysis options
   * @returns {Promise<string>} Job ID
   */
  async submitAnalysis(options) {
    const {
      filePath,
      projectId = null,
      userId = null,
      services = ['dimensions', 'vision', 'ai'],
      priority = 'normal',
      callback = null
    } = options;

    const jobId = `blueprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      filePath,
      projectId,
      userId,
      services,
      priority,
      status: JOB_STATUS.PENDING,
      progress: 0,
      results: {},
      errors: [],
      startedAt: new Date(),
      completedAt: null,
      callback
    };

    this.jobs.set(jobId, job);

    // Start analysis asynchronously
    this.processJob(jobId).catch(error => {
      logger.error(`Job ${jobId} failed:`, error);
      this.updateJob(jobId, { status: JOB_STATUS.FAILED, errors: [error.message] });
    });

    return jobId;
  }

  /**
   * Process analysis job
   */
  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    logger.info(`Starting blueprint analysis job ${jobId}`, {
      services: job.services,
      filePath: job.filePath
    });

    const results = {
      text: null,
      dimensions: null,
      vision: null,
      ai: null,
      combined: null
    };

    try {
      // Step 1: Extract text from PDF (always)
      this.updateJob(jobId, { status: JOB_STATUS.EXTRACTING_TEXT, progress: 5 });
      results.text = await this.extractText(job.filePath);
      this.updateJob(jobId, { progress: 15, results: { text: results.text } });

      // Step 2: Run dimension extraction (if requested)
      if (job.services.includes('dimensions')) {
        this.updateJob(jobId, { status: JOB_STATUS.RUNNING_DIMENSIONS, progress: 20 });
        results.dimensions = await this.runDimensionAnalysis(job.filePath);
        this.updateJob(jobId, { progress: 40, results: { dimensions: results.dimensions } });
      }

      // Step 3: Run computer vision (if requested)
      if (job.services.includes('vision')) {
        this.updateJob(jobId, { status: JOB_STATUS.RUNNING_CV, progress: 45 });
        results.vision = await this.runVisionAnalysis(job.filePath);
        this.updateJob(jobId, { progress: 65, results: { vision: results.vision } });
      }

      // Step 4: Run AI analysis (if requested)
      if (job.services.includes('ai')) {
        this.updateJob(jobId, { status: JOB_STATUS.RUNNING_AI, progress: 70 });
        results.ai = await this.runAIAnalysis(job.filePath, results);
        this.updateJob(jobId, { progress: 85, results: { ai: results.ai } });
      }

      // Step 5: Combine results
      this.updateJob(jobId, { status: JOB_STATUS.COMBINING, progress: 90 });
      results.combined = this.combineResults(results);
      
      // Final update
      this.updateJob(jobId, {
        status: JOB_STATUS.COMPLETED,
        progress: 100,
        completedAt: new Date(),
        results
      });

      // Save to database if projectId provided
      if (job.projectId) {
        await this.saveResults(job.projectId, results);
      }

      // Execute callback if provided
      if (job.callback) {
        await job.callback(results);
      }

      logger.info(`Job ${jobId} completed successfully`);

    } catch (error) {
      logger.error(`Job ${jobId} processing error:`, error);
      this.updateJob(jobId, {
        status: JOB_STATUS.FAILED,
        errors: [...job.errors, error.message],
        completedAt: new Date()
      });
      throw error;
    }
  }

  /**
   * Extract text from PDF
   */
  async extractText(filePath) {
    try {
      const result = await enhancedBlueprintService.extractPdfText(filePath);
      if (!result.success) {
        throw new Error(result.error || 'Text extraction failed');
      }
      
      const analysis = enhancedBlueprintService.analyzeBlueprint(
        result.text,
        filePath
      );
      
      return {
        text: result.text,
        extractedInfo: analysis.extractedInfo,
        confidenceScores: analysis.confidenceScores,
        pages: result.pages
      };
    } catch (error) {
      logger.warn('Text extraction failed:', error.message);
      return { text: '', extractedInfo: {}, error: error.message };
    }
  }

  /**
   * Run dimension/code extraction
   */
  async runDimensionAnalysis(filePath) {
    try {
      const available = await floorplanClient.isAvailable();
      if (!available) {
        logger.warn('Floorplan service not available, skipping');
        return null;
      }

      const result = await floorplanClient.extract(filePath, {
        method: 'auto',
        includeSummary: true
      });

      return {
        dimensions: result.pages?.[0]?.dimensions || [],
        codes: result.pages?.[0]?.codes || [],
        summary: result.summary,
        roomType: result.pages?.[0]?.room_type
      };
    } catch (error) {
      logger.warn('Dimension analysis failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Run computer vision analysis
   */
  async runVisionAnalysis(filePath) {
    try {
      const available = await aecvisionClient.isAvailable();
      if (!available) {
        logger.warn('AECVision service not available, skipping');
        return null;
      }

      const result = await aecvisionClient.analyze(filePath, {
        confidence: 0.6,
        includeMaterials: true
      });

      return {
        detections: result.detections,
        fixtures: result.fixtures,
        pipeRuns: result.pipe_runs,
        materialTakeoff: result.material_takeoff
      };
    } catch (error) {
      logger.warn('Vision analysis failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Run AI analysis
   */
  async runAIAnalysis(filePath, previousResults) {
    try {
      const prompt = this.buildAIPrompt(previousResults);
      
      const model = aiProvider.getRecommendedModel('analysis');
      const result = await aiProvider.generate(prompt, {
        model,
        timeout: 300000
      });

      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed');
      }

      return this.parseAIResponse(result.response);
    } catch (error) {
      logger.warn('AI analysis failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Build AI prompt with all available data
   */
  buildAIPrompt(results) {
    const { text, dimensions, vision } = results;
    
    let context = '';
    
    // Add text extraction data
    if (text?.extractedInfo) {
      context += `\nEXTRACTED DATA:\n`;
      Object.entries(text.extractedInfo).forEach(([key, value]) => {
        context += `- ${key}: ${value}\n`;
      });
    }

    // Add dimension data
    if (dimensions?.summary) {
      context += `\nDIMENSION DATA:\n`;
      context += `- Total dimensions: ${dimensions.summary.total_dimensions}\n`;
      context += `- Total measured length: ${dimensions.summary.dimension_stats?.total_feet?.toFixed(1)} feet\n`;
      context += `- Plumbing connections: ${dimensions.summary.plumbing_codes}\n`;
      context += `- Room type: ${dimensions.roomType || 'unknown'}\n`;
      
      if (dimensions.codes?.length > 0) {
        context += `- Cabinet codes: ${dimensions.codes.map(c => c.code).join(', ')}\n`;
      }
    }

    // Add vision data
    if (vision?.fixtures) {
      context += `\nCOMPUTER VISION DETECTION:\n`;
      Object.entries(vision.fixtures).forEach(([key, value]) => {
        if (typeof value === 'number') {
          context += `- ${key}: ${value}\n`;
        }
      });
    }

    if (vision?.pipeRuns) {
      context += `\nCV PIPE RUN ESTIMATES:\n`;
      context += `- Total wall length: ${vision.pipeRuns.total_wall_length_feet} feet\n`;
    }

    return `You are an expert plumbing estimator for CTL Plumbing LLC in DFW.

Analyze this blueprint and provide a comprehensive material takeoff.

${context}

${text?.text ? `BLUEPRINT TEXT:\n${text.text.substring(0, 5000)}` : ''}

Provide a complete estimate including:
1. Fixture counts (validated across all sources)
2. Pipe runs (use dimension data for accuracy)
3. Material takeoff with DFW pricing
4. Labor estimates
5. Code compliance notes

Return JSON:
{
  "fixtures": { "toilets": 0, "sinks": 0, ... },
  "pipeRuns": { "supplyFeet": 0, "dwvFeet": 0 },
  "takeoff": [{ "item": "", "qty": 0, "unit": "", "cost": 0 }],
  "labor": { "hours": 0, "rate": 85 },
  "totals": { "material": 0, "labor": 0, "total": 0 },
  "notes": ["..."]
}`;
  }

  /**
   * Parse AI response
   */
  parseAIResponse(text) {
    try {
      // Try direct JSON parse
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from markdown
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {}
      }
      
      // Try to find JSON object
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch (e3) {}
      }
      
      return { raw: text.substring(0, 1000) };
    }
  }

  /**
   * Combine results from all sources
   */
  combineResults(results) {
    const { text, dimensions, vision, ai } = results;
    
    const combined = {
      fixtures: {},
      pipeRuns: {},
      materials: [],
      totals: {},
      sources: [],
      confidence: 0
    };

    // Combine fixture counts (take maximum from all sources)
    const fixtureSources = [
      text?.extractedInfo,
      dimensions?.fixtures,
      vision?.fixtures,
      ai?.fixtures
    ].filter(Boolean);

    const fixtureKeys = new Set();
    fixtureSources.forEach(source => {
      Object.keys(source).forEach(key => fixtureKeys.add(key));
    });

    fixtureKeys.forEach(key => {
      const values = fixtureSources
        .map(s => s[key])
        .filter(v => typeof v === 'number');
      
      if (values.length > 0) {
        combined.fixtures[key] = Math.max(...values);
      }
    });

    // Combine pipe runs
    if (dimensions?.summary?.dimension_stats?.total_feet) {
      combined.pipeRuns.fromDimensions = {
        totalFeet: dimensions.summary.dimension_stats.total_feet,
        estimatedPipeFeet: dimensions.summary.dimension_stats.total_feet * 0.4
      };
    }

    if (vision?.pipeRuns?.total_wall_length_feet) {
      combined.pipeRuns.fromVision = {
        totalFeet: vision.pipeRuns.total_wall_length_feet,
        estimatedPipeFeet: vision.pipeRuns.total_wall_length_feet * 0.4
      };
    }

    // Average the two estimates if both available
    if (combined.pipeRuns.fromDimensions && combined.pipeRuns.fromVision) {
      const dimEst = combined.pipeRuns.fromDimensions.estimatedPipeFeet;
      const visEst = combined.pipeRuns.fromVision.estimatedPipeFeet;
      combined.pipeRuns.combined = {
        estimatedFeet: Math.round((dimEst + visEst) / 2),
        method: 'average'
      };
    }

    // Use AI materials if available
    if (ai?.takeoff) {
      combined.materials = ai.takeoff;
    } else if (vision?.materialTakeoff) {
      combined.materials = vision.materialTakeoff;
    }

    // Use AI totals
    if (ai?.totals) {
      combined.totals = ai.totals;
    }

    // Track sources used
    if (dimensions) combined.sources.push('dimensions');
    if (vision) combined.sources.push('vision');
    if (ai) combined.sources.push('ai');

    // Calculate confidence based on number of sources
    combined.confidence = Math.min(95, combined.sources.length * 30 + 5);

    return combined;
  }

  /**
   * Update job status and notify subscribers
   */
  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    Object.assign(job, updates);

    // Notify subscribers
    const subscribers = this.subscribers.get(jobId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(job);
        } catch (e) {
          logger.error('Subscriber callback error:', e);
        }
      });
    }

    logger.debug(`Job ${jobId} updated:`, { status: job.status, progress: job.progress });
  }

  /**
   * Subscribe to job updates
   */
  subscribe(jobId, callback) {
    if (!this.subscribers.has(jobId)) {
      this.subscribers.set(jobId, new Set());
    }
    this.subscribers.get(jobId).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(jobId)?.delete(callback);
    };
  }

  /**
   * Get job status
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId) {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Save results to database with versioning
   */
  async saveResults(projectId, results) {
    try {
      // Get current version if exists
      const current = await db.get(
        'SELECT id, version FROM blueprint_analysis WHERE project_id = ?',
        [projectId]
      );

      const nextVersion = (current?.version || 0) + 1;
      const analysisId = current?.id || `ba-${Date.now()}`;
      const now = new Date().toISOString();

      if (current) {
        // Archive current to history
        const oldResults = await db.get('SELECT results, analyzed_at, metadata FROM blueprint_analysis WHERE id = ?', [analysisId]);
        await db.run(
          `INSERT INTO blueprint_analysis_history (id, analysis_id, results, analyzed_at, version, metadata)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`bah-${Date.now()}`, analysisId, oldResults.results, oldResults.analyzed_at, current.version, oldResults.metadata]
        );

        // Update current
        await db.run(
          `UPDATE blueprint_analysis 
           SET results = ?, analyzed_at = ?, version = ?
           WHERE id = ?`,
          [JSON.stringify(results), now, nextVersion, analysisId]
        );
      } else {
        // Insert new
        await db.run(
          `INSERT INTO blueprint_analysis (id, project_id, results, analyzed_at, version)
           VALUES (?, ?, ?, ?, ?)`,
          [analysisId, projectId, JSON.stringify(results), now, 1]
        );
      }

      logger.info(`Saved analysis results for project ${projectId} (v${nextVersion})`);
    } catch (error) {
      logger.error('Failed to save results:', error);
    }
  }

  /**
   * Get analysis results for a project
   */
  async getProjectAnalysis(projectId) {
    try {
      const row = await db.get(
        'SELECT * FROM blueprint_analysis WHERE project_id = ?',
        [projectId]
      );
      return row ? JSON.parse(row.results) : null;
    } catch (error) {
      logger.error('Failed to get project analysis:', error);
      return null;
    }
  }
}

// Export singleton
export const blueprintOrchestrator = new BlueprintOrchestrator();
export { JOB_STATUS };
