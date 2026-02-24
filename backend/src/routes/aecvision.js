/**
 * AECVision Routes - Computer Vision Blueprint Analysis
 * Integrates YOLOv5 object detection for architectural elements
 */

import express from 'express';
import path from 'path';
import { aecvisionClient, enhancedCVBlueprintService } from '../services/aecvision-client.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';
import fs from 'fs';

const router = express.Router();

/**
 * @route GET /api/aecvision/health
 * @desc Check AECVision service health
 * @access Private
 */
router.get('/health', tryCatch(async (req, res) => {
  const health = await aecvisionClient.health();
  res.success(health, 'AECVision health status');
}));

/**
 * @route GET /api/aecvision/models
 * @desc Get available detection classes/models
 * @access Private
 */
router.get('/models', tryCatch(async (req, res) => {
  const models = await aecvisionClient.getAvailableModels();
  res.success(models, 'Available detection classes');
}));

/**
 * @route POST /api/aecvision/detect
 * @desc Run object detection on blueprint image/PDF
 * @access Private
 */
router.post('/detect', tryCatch(async (req, res) => {
  const { filePath, confidence = 0.5 } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  const results = await aecvisionClient.detect(filePath, { confidence });
  res.success(results, 'Object detection completed');
}));

/**
 * @route POST /api/aecvision/analyze
 * @desc Complete CV analysis with plumbing estimates
 * @access Private
 */
router.post('/analyze', tryCatch(async (req, res) => {
  const { 
    filePath, 
    confidence = 0.5,
    pixelToFeet = 0.5,
    includeMaterials = true
  } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Starting AECVision analysis', { filePath, confidence });
  
  const results = await aecvisionClient.analyze(filePath, {
    confidence,
    pixelToFeet,
    includeMaterials
  });
  
  res.success(results, 'Blueprint analysis completed');
}));

/**
 * @route POST /api/aecvision/walls
 * @desc Detect walls for pipe run estimation
 * @access Private
 */
router.post('/walls', tryCatch(async (req, res) => {
  const { filePath, confidence = 0.8, useSahi = false } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  const results = await aecvisionClient.detectWalls(filePath, {
    confidence,
    useSahi
  });
  
  res.success(results, 'Wall detection completed');
}));

/**
 * @route POST /api/aecvision/enhanced-analysis
 * @desc Combined CV + AI analysis (most comprehensive)
 * @access Private
 */
router.post('/enhanced-analysis', tryCatch(async (req, res) => {
  const { 
    filePath, 
    useCV = true,
    useAI = true,
    tier = 'custom',
    model = null
  } = req.body;
  
  if (!filePath) {
    return res.error('filePath is required', 'VALIDATION_ERROR', null, 400);
  }
  
  if (!fs.existsSync(filePath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  logger.info('Starting enhanced CV+AI analysis', { filePath, useCV, useAI });
  
  const startTime = Date.now();
  
  const results = await enhancedCVBlueprintService.analyzeBlueprint(filePath, {
    useCV,
    useAI,
    tier,
    model
  });
  
  results.metadata.processingTimeMs = Date.now() - startTime;
  
  res.success(results, 'Enhanced analysis completed');
}));

/**
 * @route POST /api/aecvision/compare
 * @desc Compare CV-only vs AI-only vs Combined analysis
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
    cvOnly: null,
    aiOnly: null,
    combined: null,
    comparison: {}
  };

  // CV Only
  try {
    results.cvOnly = await aecvisionClient.analyze(filePath, {
      confidence: 0.6,
      includeMaterials: true
    });
  } catch (error) {
    results.cvOnly = { error: error.message };
  }

  // Combined (CV + AI)
  try {
    results.combined = await enhancedCVBlueprintService.analyzeBlueprint(filePath, {
      useCV: true,
      useAI: true
    });
  } catch (error) {
    results.combined = { error: error.message };
  }

  // Generate comparison
  results.comparison = {
    cvAvailable: !!results.cvOnly?.success,
    cvFixtureCount: results.cvOnly?.fixtures?.total_fixtures || 0,
    combinedFixtureCount: results.combined?.combined?.fixtures?.total || 0,
    cvMaterialItems: results.cvOnly?.material_takeoff?.length || 0,
    combinedMaterialItems: results.combined?.combined?.materialTakeoff?.length || 0,
    recommendation: results.combined?.metadata?.cvAvailable 
      ? 'Use combined CV+AI for most accurate results'
      : 'AI-only analysis (CV unavailable)'
  };

  res.success(results, 'Comparison analysis completed');
}));

export default router;
