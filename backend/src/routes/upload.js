// File upload routes for blueprints

import express from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { blueprintService } from '../services/blueprint.js';
import { ollamaService } from '../services/ollama.js';
import { pricingService } from '../services/pricing.js';
import { jobQueue, JOB_TYPES } from '../services/jobQueue.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

// Create uploads directory if it doesn't exist - store in tool folder
const TOOL_DIR = path.join(process.cwd(), '../../tool');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(TOOL_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Use crypto.randomUUID() for unpredictable file names
    const uniqueId = randomUUID();
    cb(null, `blueprint-${uniqueId}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Only accept PDFs for now (images require vision model - future feature)
    const allowedTypes = ['.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are currently supported. Image analysis requires vision model (coming soon).'));
    }
  }
});

// Validation helper
const VALID_TIERS = ['production', 'custom', 'premium'];
function validateInputs(tier, model) {
  const errors = [];

  if (tier && !VALID_TIERS.includes(tier.toLowerCase())) {
    errors.push(`Invalid tier "${tier}". Must be one of: ${VALID_TIERS.join(', ')}`);
  }

  return errors;
}

// Helper function to process PDF and extract data (DRY - removes duplicate code)
async function processPdfExtraction(filePath, fileName) {
  const pdfResult = await blueprintService.extractPdfText(filePath);

  if (!pdfResult.success) {
    return {
      success: false,
      error: pdfResult.error,
      fileName
    };
  }

  const analysis = blueprintService.analyzeBlueprint(pdfResult.text, fileName);

  return {
    success: true,
    fileName,
    extractedData: analysis.extractedInfo,
    relevantText: analysis.relevantText,
    pages: pdfResult.pages
  };
}

// Build AI analysis prompt
function buildAnalysisPrompt(fileName, extractedData, blueprintText, tier) {
  return `You are an expert plumbing estimator for CTL Plumbing LLC analyzing a blueprint.

Blueprint File: ${fileName}
${Object.keys(extractedData).length > 0 ? 'Extracted Information:\n' + JSON.stringify(extractedData, null, 2) : ''}

${blueprintText ? 'Relevant Blueprint Text:\n' + blueprintText : 'No text extracted from blueprint.'}

Please provide a comprehensive analysis including:

1. **Project Overview**:
   - Estimated square footage${extractedData.sqft ? ` (detected: ${extractedData.sqft} sqft)` : ''}
   - Number of units${extractedData.units ? ` (detected: ${extractedData.units})` : ''}
   - Number of bathrooms${extractedData.bathrooms ? ` (detected: ${extractedData.bathrooms})` : ''}
   - Number of stories${extractedData.stories ? ` (detected: ${extractedData.stories})` : ''}

2. **Plumbing Requirements**:
   - Recommended pipe materials and sizes
   - Fixture types and quantities
   - Water heater specifications
   - Drainage system requirements

3. **Labor Estimate**:
   - Estimated labor hours per phase
   - Rough-in hours
   - Top-out hours
   - Trim-out hours

4. **Timeline Projection**:
   - Estimated project duration
   - Critical path considerations

5. **Pricing Recommendation**:
   - Suggested tier (Production/Custom/Premium)${tier ? ` (requested: ${tier})` : ''}
   - Factors affecting pricing
   - Potential cost adjustments

6. **Code Compliance Notes**:
   - DFW area specific requirements
   - Texas plumbing code considerations
   - Inspection checkpoints

Provide detailed, actionable insights formatted professionally.`;
}

// Build warnings array
function buildWarnings(extractedData, aiResult) {
  const warnings = [];
  if (!extractedData.sqft || !extractedData.units) {
    warnings.push('Could not extract enough data for automatic estimate. Manual review recommended.');
  }
  if (!aiResult.success) {
    warnings.push('AI analysis unavailable. Showing extracted data only.');
  }
  return warnings;
}

// Background job handler for blueprint analysis
async function performBlueprintAnalysis(jobData, progressCallback) {
  const { filePath, fileName, extractedData, blueprintText, tier, model } = jobData;

  try {
    progressCallback(10); // Started

    // Generate AI analysis
    const aiModel = model || ollamaService.getRecommendedModel('analysis');
    const prompt = buildAnalysisPrompt(fileName, extractedData, blueprintText, tier);

    progressCallback(20); // Prompt built

    const aiResult = await ollamaService.generate(prompt, { model: aiModel, timeout: 300000 });

    progressCallback(70); // AI analysis complete

    // Calculate estimate if we have enough data
    let estimate = null;
    if (extractedData.sqft && extractedData.units) {
      const calcTier = tier ? tier.toLowerCase() : 'custom';
      try {
        estimate = pricingService.calculateEstimate({
          sqft: extractedData.sqft,
          bathrooms: extractedData.bathrooms || Math.ceil(extractedData.units * 2),
          units: extractedData.units,
          stories: extractedData.stories || 2,
          tier: calcTier
        });
      } catch (error) {
        logger.error('Estimate calculation error', { error: error.message });
      }
    }

    progressCallback(90); // Estimate calculated

    // Clean up uploaded file
    await blueprintService.deleteFile(filePath);

    progressCallback(95); // File cleanup

    const result = {
      fileName,
      extractedData,
      aiAnalysis: aiResult.success ? aiResult.response : null,
      aiError: aiResult.success ? null : aiResult.error,
      modelUsed: aiModel,
      estimate,
      textExtracted: blueprintText.length > 0,
      warnings: buildWarnings(extractedData, aiResult)
    };

    progressCallback(100); // Complete

    return result;

  } catch (error) {
    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      await blueprintService.deleteFile(filePath);
    }
    throw error;
  }
}

// Upload and analyze blueprint (non-blocking with job queue)
router.post('/blueprint', upload.single('file'), tryCatch(async (req, res) => {
  if (!req.file) {
    return res.error('No file uploaded', 'MISSING_FILE', null, 400);
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const { tier, model, async: asyncMode } = req.body;

  // Validate inputs
  const validationErrors = validateInputs(tier, model);
  if (validationErrors.length > 0) {
    await blueprintService.deleteFile(filePath);
    return res.error('Validation failed', 'VALIDATION_ERROR', { errors: validationErrors }, 400);
  }

  // Extract text from PDF immediately
  const pdfData = await processPdfExtraction(filePath, fileName);

  if (!pdfData.success) {
    await blueprintService.deleteFile(filePath);
    return res.error('Failed to extract text from PDF', 'PDF_EXTRACT_ERROR', { details: pdfData.error }, 400);
  }

  const extractedData = pdfData.extractedData;
  const blueprintText = pdfData.relevantText;

  // If async mode is explicitly false, do synchronous processing (legacy behavior)
  if (asyncMode === 'false' || asyncMode === false) {
    // Synchronous mode - original behavior
    const aiModel = model || ollamaService.getRecommendedModel('analysis');
    const prompt = buildAnalysisPrompt(fileName, extractedData, blueprintText, tier);

    const aiResult = await ollamaService.generate(prompt, { model: aiModel, timeout: 300000 });

    let estimate = null;
    if (extractedData.sqft && extractedData.units) {
      const calcTier = tier ? tier.toLowerCase() : 'custom';
      try {
        estimate = pricingService.calculateEstimate({
          sqft: extractedData.sqft,
          bathrooms: extractedData.bathrooms || Math.ceil(extractedData.units * 2),
          units: extractedData.units,
          stories: extractedData.stories || 2,
          tier: calcTier
        });
      } catch (error) {
        logger.error('Estimate calculation error', { error: error.message });
      }
    }

    await blueprintService.deleteFile(filePath);

    const response = {
      fileName,
      extractedData,
      aiAnalysis: aiResult.success ? aiResult.response : null,
      aiError: aiResult.success ? null : aiResult.error,
      modelUsed: aiModel,
      estimate,
      textExtracted: blueprintText.length > 0,
      warnings: buildWarnings(extractedData, aiResult)
    };

    return res.success(response, 'Blueprint analyzed successfully');
  }

  // Async mode (default) - queue the AI analysis job
  const jobData = {
    filePath,
    fileName,
    extractedData,
    blueprintText,
    tier,
    model,
    pages: pdfData.pages
  };

  const jobId = await jobQueue.addJob(
    JOB_TYPES.BLUEPRINT_ANALYSIS,
    jobData,
    performBlueprintAnalysis
  );

  logger.info('Blueprint analysis job queued', { jobId, fileName });

  // Return job ID immediately for polling
  res.success(
    {
      jobId,
      fileName,
      extractedData,
      textExtracted: blueprintText.length > 0,
      status: 'processing',
      pollUrl: `/api/jobs/${jobId}`
    },
    'Blueprint uploaded successfully. AI analysis in progress.'
  );
}));

// Upload for quick text extraction only
router.post('/extract', upload.single('file'), tryCatch(async (req, res) => {
  if (!req.file) {
    return res.error('No file uploaded', 'MISSING_FILE', null, 400);
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;

  // Process PDF extraction
  const result = await processPdfExtraction(filePath, fileName);

  // Clean up file
  await blueprintService.deleteFile(filePath);

  if (!result.success) {
    return res.error('Failed to extract text from PDF', 'PDF_EXTRACT_ERROR', {
      details: result.error,
      fileName: result.fileName
    }, 400);
  }

  res.success(result, 'PDF text extracted successfully');
}));

export default router;
