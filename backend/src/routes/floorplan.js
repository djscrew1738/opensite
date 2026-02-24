/**
 * Floorplan Dimension Extractor Routes
 * API endpoints for dimension and code extraction from floorplan PDFs
 */

import express from 'express';
import path from 'path';
import { floorplanClient, comprehensiveBlueprintService } from '../services/floorplan-client.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';
import fs from 'fs';

const router = express.Router();

/**
 * @route GET /api/floorplan/health
 * @desc Check Floorplan service health
 * @access Private
 */
router.get('/health', tryCatch(async (req, res) => {
  const health = await floorplanClient.health();
  res.success(health, 'Floorplan service health status');
}));

/**
 * @route GET /api/floorplan/patterns
 * @desc Get supported dimension and code patterns
 * @access Private
 */
router.get('/patterns', tryCatch(async (req, res) => {
  const patterns = await floorplanClient.getPatterns();
  res.success(patterns, 'Supported patterns');
}));

/**
 * @route POST /api/floorplan/extract
 * @desc Extract dimensions and codes from floorplan
 * @access Private
 */
router.post('/extract', tryCatch(async (req, res) => {
  const { filePath, method = 'auto', includeSummary = true } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  const results = await floorplanClient.extract(filePath, {
    method,
    includeSummary
  });
  
  res.success(results, 'Floorplan extraction completed');
}));

/**
 * @route POST /api/floorplan/dimensions
 * @desc Extract only dimensions
 * @access Private
 */
router.post('/dimensions', tryCatch(async (req, res) => {
  const { filePath, method = 'auto' } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  const results = await floorplanClient.extractDimensions(filePath, { method });
  res.success(results, 'Dimension extraction completed');
}));

/**
 * @route POST /api/floorplan/codes
 * @desc Extract cabinet/appliance codes
 * @access Private
 */
router.post('/codes', tryCatch(async (req, res) => {
  const { filePath, method = 'auto', plumbingOnly = false } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  const results = await floorplanClient.extractCodes(filePath, {
    method,
    plumbingOnly
  });
  
  res.success(results, 'Code extraction completed');
}));

/**
 * @route POST /api/floorplan/pipe-estimate
 * @desc Estimate pipe requirements from floorplan
 * @access Private
 */
router.post('/pipe-estimate', tryCatch(async (req, res) => {
  const { filePath, method = 'auto' } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Estimating pipes from floorplan', { filePath });
  
  const results = await floorplanClient.estimatePipes(filePath, { method });
  res.success(results, 'Pipe estimation completed');
}));

/**
 * @route POST /api/floorplan/comprehensive
 * @desc Comprehensive analysis with all services
 * @access Private
 */
router.post('/comprehensive', tryCatch(async (req, res) => {
  const { 
    filePath, 
    useDimensions = true,
    useVision = true,
    useAI = true
  } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Running comprehensive blueprint analysis', { 
    filePath, 
    useDimensions, 
    useVision, 
    useAI 
  });
  
  const startTime = Date.now();
  
  const results = await comprehensiveBlueprintService.analyze(filePath, {
    useDimensions,
    useVision,
    useAI
  });
  
  results.metadata.processingTimeMs = Date.now() - startTime;
  
  res.success(results, 'Comprehensive analysis completed');
}));

/**
 * @route POST /api/floorplan/compare
 * @desc Compare different analysis methods
 * @access Private
 */
router.post('/compare', tryCatch(async (req, res) => {
  const { filePath } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Running comparison analysis', { filePath });
  
  const results = {
    dimensions: null,
    vision: null,
    comprehensive: null,
    comparison: {}
  };

  // Test each service
  try {
    results.dimensions = await floorplanClient.extract(filePath);
  } catch (error) {
    results.dimensions = { error: error.message };
  }

  try {
    results.comprehensive = await comprehensiveBlueprintService.analyze(filePath);
  } catch (error) {
    results.comprehensive = { error: error.message };
  }

  // Generate comparison
  results.comparison = {
    dimensionsAvailable: !!results.dimensions?.success,
    totalDimensions: results.dimensions?.summary?.total_dimensions || 0,
    totalCodes: results.dimensions?.summary?.total_codes || 0,
    plumbingConnections: results.dimensions?.summary?.plumbing_codes || 0,
    roomTypes: results.dimensions?.summary?.room_types || [],
    servicesUsed: results.comprehensive?.metadata?.servicesUsed || []
  };

  res.success(results, 'Comparison analysis completed');
}));

export default router;
