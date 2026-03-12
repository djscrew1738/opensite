/**
 * Blueprint Analysis Orchestrator
 * Unified service that coordinates AECVision, Floorplan, and AI analysis
 * Provides single-entry-point for comprehensive blueprint processing
 */

import { aecvisionClient } from './aecvision-client.js';
import { floorplanClient } from './floorplan-client.js';
import { structuralDetectorClient } from './structural-detector-client.js';
import { aiProvider } from './ai-provider.js';
import { enhancedBlueprintService } from './blueprint-enhanced.js';
import { jobQueue, JOB_TYPES } from './jobQueuePersistent.js';
import { db } from './database.js';
import logger from './logger.js';

/**
 * Analysis Job Status
 */
const JOB_STATUS = {
  PENDING: 'pending',
  EXTRACTING_TEXT: 'extracting_text',
  RUNNING_CV: 'running_cv',
  RUNNING_STRUCTURAL: 'running_structural',
  RUNNING_DIMENSIONS: 'running_dimensions',
  RUNNING_AI: 'running_ai',
  COMBINING: 'combining',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Blueprint Analysis Orchestrator
 * Manages the entire analysis pipeline
 */
class BlueprintOrchestrator {
  constructor() {
    this.subscribers = new Map(); // WebSocket/event subscribers
    
    // Register the job handler with the persistent queue
    jobQueue.registerHandler(JOB_TYPES.BLUEPRINT_ANALYSIS, this.handleQueuedJob.bind(this));
  }

  /**
   * Submit a blueprint for comprehensive analysis
   * @param {Object} options - Analysis options
   * @returns {Promise<string>} Job ID
   */
  async submitAnalysis(options) {
    const {
      filePath,
      blueprintId = null,
      projectId = null,
      userId = null,
      services = ['dimensions', 'vision', 'structural', 'ai'],
      priority = 'normal'
    } = options;

    // 1. Add to persistent job queue (jobs.db)
    const jobId = await jobQueue.addJob(JOB_TYPES.BLUEPRINT_ANALYSIS, {
      filePath,
      blueprintId,
      projectId,
      userId,
      services,
      priority
    });

    // 2. Create permanent record in analysis_jobs (opensite.db)
    try {
      await db.createAnalysisJob({
        id: jobId,
        blueprintId,
        jobType: JOB_TYPES.BLUEPRINT_ANALYSIS,
        status: JOB_STATUS.PENDING,
        progress: 0
      });
    } catch (error) {
      logger.error('Failed to create persistent analysis job record', { error: error.message, jobId });
      // We don't throw here as the job is already in the queue and will run
    }

    return jobId;
  }

  /**
   * Handler for jobs coming from the persistent queue
   */
  async handleQueuedJob(jobData, updateProgress) {
    const { jobId, filePath, projectId, blueprintId, services } = jobData;
    
    logger.info(`Processing queued blueprint analysis job ${jobId}`, { services, filePath });

    const results = {
      text: null,
      dimensions: null,
      vision: null,
      structural: null,
      ai: null,
      combined: null
    };

    try {
      // Step 1: Extract text (always)
      await this._updateJobStatus(jobId, JOB_STATUS.EXTRACTING_TEXT, 5, updateProgress);
      results.text = await this.extractText(filePath);
      await this._updateJobStatus(jobId, null, 15, updateProgress);

      // Step 2: Dimensions
      if (services.includes('dimensions')) {
        await this._updateJobStatus(jobId, JOB_STATUS.RUNNING_DIMENSIONS, 20, updateProgress);
        results.dimensions = await this.runDimensionAnalysis(filePath);
        await this._updateJobStatus(jobId, null, 40, updateProgress);
      }

      // Step 3: Computer Vision
      if (services.includes('vision')) {
        await this._updateJobStatus(jobId, JOB_STATUS.RUNNING_CV, 40, updateProgress);
        results.vision = await this.runVisionAnalysis(filePath);
        await this._updateJobStatus(jobId, null, 55, updateProgress);
      }

      // Step 4: Structural
      if (services.includes('structural')) {
        await this._updateJobStatus(jobId, JOB_STATUS.RUNNING_STRUCTURAL, 58, updateProgress);
        results.structural = await this.runStructuralAnalysis(filePath);
        await this._updateJobStatus(jobId, null, 68, updateProgress);
      }

      // Step 5: AI
      if (services.includes('ai')) {
        await this._updateJobStatus(jobId, JOB_STATUS.RUNNING_AI, 70, updateProgress);
        results.ai = await this.runAIAnalysis(filePath, results);
        await this._updateJobStatus(jobId, null, 85, updateProgress);
      }

      // Step 6: Combine
      await this._updateJobStatus(jobId, JOB_STATUS.COMBINING, 90, updateProgress);
      results.combined = this.combineResults(results);
      
      // Save results if projectId or blueprintId provided
      if (projectId || blueprintId) {
        await this.saveResults(projectId || blueprintId, results, blueprintId);
      }

      // Mark as completed in permanent record
      await db.updateAnalysisJob(jobId, {
        status: JOB_STATUS.COMPLETED,
        progress: 100,
        result: results
      });

      return results;

    } catch (error) {
      logger.error(`Job ${jobId} failed during processing:`, error);
      
      // Update permanent record
      await db.updateAnalysisJob(jobId, {
        status: JOB_STATUS.FAILED,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Internal helper to update both the queue progress and the persistent DB record
   */
  async _updateJobStatus(jobId, status, progress, updateProgress) {
    // Update the queue progress (calls the callback from jobQueue)
    if (updateProgress) updateProgress(progress);

    // Update the permanent record in opensite.db
    try {
      await db.updateAnalysisJob(jobId, { status, progress });
    } catch (e) {
      logger.debug(`Failed to update permanent job status for ${jobId}`);
    }

    // Notify memory subscribers (for real-time UI)
    this.notifySubscribers(jobId, { status, progress });
  }

  /**
   * Extract text from PDF
   */
  async extractText(filePath) {
    try {
      const result = await enhancedBlueprintService.extractPdfText(filePath);
      if (!result.success) throw new Error(result.error || 'Text extraction failed');
      
      const analysis = enhancedBlueprintService.analyzeBlueprint(result.text, filePath);
      
      return {
        text: result.text,
        extractedInfo: analysis.extractedInfo,
        confidenceScores: analysis.confidenceScores,
        pages: result.pages
      };
    } catch (error) {
      logger.warn('Text extraction failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Run dimension/code extraction
   */
  async runDimensionAnalysis(filePath) {
    try {
      if (!(await floorplanClient.isAvailable())) return null;
      const result = await floorplanClient.extract(filePath, { method: 'auto', includeSummary: true });
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
      if (!(await aecvisionClient.isAvailable())) return null;
      const result = await aecvisionClient.analyze(filePath, { confidence: 0.6, includeMaterials: true });
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
   * Run structural element detection
   */
  async runStructuralAnalysis(filePath) {
    try {
      if (!(await structuralDetectorClient.isAvailable())) return null;
      const result = await structuralDetectorClient.analyze(filePath, { confidence: 0.40, pixelToFeet: 0.5 });
      return {
        detections: result.detections,
        counts: result.counts,
        structuralSummary: result.structural_summary,
        spatialMetrics: result.spatial_metrics
      };
    } catch (error) {
      logger.warn('Structural analysis failed:', error.message);
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
      const result = await aiProvider.generate(prompt, { model, timeout: 300000 });
      if (!result.success) throw new Error(result.error || 'AI analysis failed');
      return this.parseAIResponse(result.response);
    } catch (error) {
      logger.warn('AI analysis failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Build AI prompt
   */
  buildAIPrompt(results) {
    const { text, dimensions, vision, structural } = results;
    let context = '';

    if (text?.extractedInfo) {
      context += `\nEXTRACTED DATA:\n`;
      Object.entries(text.extractedInfo).forEach(([k, v]) => context += `- ${k}: ${v}\n`);
    }

    if (dimensions?.summary) {
      const ds = dimensions.summary;
      context += `\nDIMENSION DATA:\n- Total measured: ${ds.dimension_stats?.total_feet?.toFixed(1)} feet\n- Room type: ${dimensions.roomType || 'unknown'}\n`;
    }

    if (vision?.fixtures) {
      context += `\nCV FIXTURES:\n`;
      Object.entries(vision.fixtures).forEach(([k, v]) => { if (typeof v === 'number') context += `- ${k}: ${v}\n`; });
    }

    if (structural?.structuralSummary) {
      const ss = structural.structuralSummary;
      context += `\nSTRUCTURAL ELEMENTS:\n- Walls: ${ss.walls}\n- Doors: ${ss.doors}\n- Windows: ${ss.windows}\n`;
    }

    return `You are an expert plumbing estimator for CTL Plumbing LLC in DFW.
Analyze this blueprint data and provide a material takeoff.

${context}

Provide results in JSON format with "fixtures", "pipeRuns", "takeoff", and "totals".`;
  }

  /**
   * Parse AI response
   */
  parseAIResponse(text) {
    try { return JSON.parse(text); } catch (e) {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return JSON.parse(Array.isArray(jsonMatch) ? jsonMatch[1] || jsonMatch[0] : jsonMatch); } catch (e2) {}
      }
      return { raw: text.substring(0, 1000) };
    }
  }

  /**
   * Combine results from all sources
   */
  combineResults(results) {
    const { text, dimensions, vision, structural, ai } = results;

    const combined = {
      fixtures: {},
      structural: structural?.structuralSummary || {},
      pipeRuns: {},
      materials: ai?.takeoff || vision?.materialTakeoff || [],
      totals: ai?.totals || {},
      sources: [],
      confidence: 0
    };

    // Fixture counting logic
    const fixtureSources = [text?.extractedInfo, dimensions?.fixtures, vision?.fixtures, ai?.fixtures].filter(Boolean);
    const keys = new Set(fixtureSources.flatMap(s => Object.keys(s)));
    keys.forEach(key => {
      const values = fixtureSources.map(s => s[key]).filter(v => typeof v === 'number');
      if (values.length > 0) combined.fixtures[key] = Math.max(...values);
    });

    // Pipe run logic
    const pipeSources = [
      dimensions?.summary?.dimension_stats?.total_feet,
      vision?.pipeRuns?.total_wall_length_feet,
      structural?.spatialMetrics?.total_wall_length_feet
    ].filter(v => typeof v === 'number');

    if (pipeSources.length > 0) {
      const avg = pipeSources.reduce((a, b) => a + b, 0) / pipeSources.length;
      combined.pipeRuns.estimatedFeet = Math.round(avg * 0.4);
    }

    // Confidence
    if (dimensions) combined.sources.push('dimensions');
    if (vision) combined.sources.push('vision');
    if (structural && !structural.error) combined.sources.push('structural');
    if (ai) combined.sources.push('ai');
    combined.confidence = Math.min(95, combined.sources.length * 25 + 10);

    return combined;
  }

  /**
   * Save results to database
   */
  async saveResults(projectId, results, blueprintId = null) {
    try {
      const current = await db.get('SELECT id, version FROM blueprint_analysis WHERE project_id = ? OR blueprint_id = ?', [projectId, blueprintId]);
      const nextVersion = (current?.version || 0) + 1;
      const analysisId = current?.id || `ba-${Date.now()}`;
      const now = new Date().toISOString();

      if (current) {
        // Update
        await db.run('UPDATE blueprint_analysis SET results = ?, analyzed_at = ?, version = ?, blueprint_id = COALESCE(?, blueprint_id) WHERE id = ?',
          [JSON.stringify(results), now, nextVersion, blueprintId, analysisId]);
      } else {
        // Insert
        await db.run('INSERT INTO blueprint_analysis (id, project_id, blueprint_id, results, analyzed_at, version) VALUES (?, ?, ?, ?, ?, ?)',
          [analysisId, projectId, blueprintId, JSON.stringify(results), now, 1]);
      }
      logger.info(`Saved analysis results for project ${projectId} (v${nextVersion})`);
    } catch (error) {
      logger.error('Failed to save analysis results:', error);
    }
  }

  /**
   * Get analysis results
   */
  async getProjectAnalysis(projectId) {
    const row = await db.get('SELECT * FROM blueprint_analysis WHERE project_id = ? OR blueprint_id = ?', [projectId, projectId]);
    return row ? JSON.parse(row.results) : null;
  }

  /**
   * Real-time notification helpers
   */
  notifySubscribers(jobId, data) {
    const subs = this.subscribers.get(jobId);
    if (subs) subs.forEach(cb => cb(data));
  }

  subscribe(jobId, callback) {
    if (!this.subscribers.has(jobId)) this.subscribers.set(jobId, new Set());
    this.subscribers.get(jobId).add(callback);
    return () => this.subscribers.get(jobId)?.delete(callback);
  }

  getJob(jobId) {
    // This now checks both active queue and permanent record
    return jobQueue.getJobStatus(jobId);
  }

  getUserJobs(userId) {
    // Ideally we'd query the DB for this
    return [];
  }
}

export const blueprintOrchestrator = new BlueprintOrchestrator();
export { JOB_STATUS };
