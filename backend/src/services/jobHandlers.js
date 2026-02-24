// Central registry for persistent job handlers
// Ensures handlers are registered at startup for all job types

import { jobQueue, JOB_TYPES } from './jobQueuePersistent.js';
import { performBlueprintAnalysis } from '../routes/upload.js'; // We might want to move the logic to a service later
import logger from './logger.js';

/**
 * Initialize and register all job handlers
 */
export function initializeJobHandlers() {
  logger.info('Initializing job handlers...');

  // Register Blueprint Analysis handler
  jobQueue.registerHandler(JOB_TYPES.BLUEPRINT_ANALYSIS, performBlueprintAnalysis);
  
  // Register other handlers as they are implemented
  // jobQueue.registerHandler(JOB_TYPES.LEAD_SCORING, performLeadScoring);
  
  logger.info('All job handlers registered');
}
