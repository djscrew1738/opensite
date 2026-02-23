// File upload routes for blueprints

import express from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { enhancedBlueprintService } from '../services/blueprint-enhanced.js';
import { aiProvider } from '../services/ai-provider.js';
import { pricingService } from '../services/pricing.js';
import { jobQueue, JOB_TYPES } from '../services/jobQueuePersistent.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';
import { authenticateToken } from '../middleware/auth-jwt.js';

const router = express.Router();

// Apply authentication to all upload routes
router.use(authenticateToken);

// Resolve base upload directory with safe default
const PROJECT_ROOT = process.cwd().includes('/backend') 
  ? path.join(process.cwd(), '..') 
  : process.cwd();
const BASE_UPLOAD_DIR = path.resolve(process.env.BASE_UPLOAD_DIR || path.join(PROJECT_ROOT, 'tool', 'uploads'));
const UPLOAD_DIR = BASE_UPLOAD_DIR;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Validate that a file path is within the allowed upload directory
 * Prevents path traversal attacks
 * @param {string} filePath - The path to validate
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(filePath) {
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(BASE_UPLOAD_DIR);
  return resolvedPath.startsWith(resolvedBase);
}

/**
 * Safely delete a file, handling errors gracefully
 * @param {string} filePath - Path to the file to delete
 */
async function safeDeleteFile(filePath) {
  if (!filePath) return;
  try {
    // Verify path is safe before deleting
    if (!isPathSafe(filePath)) {
      logger.warn('Attempted to delete file outside upload directory', { filePath });
      return;
    }
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.debug('Deleted temp file', { filePath });
    }
  } catch (err) {
    logger.warn('Failed to delete temp file', { filePath, error: err.message });
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = randomUUID();
    cb(null, `blueprint-${uniqueId}${path.extname(file.originalname)}`);
  }
});

const ALLOWED_MIMES = new Set(['application/pdf']);

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    if (ext === '.pdf' && ALLOWED_MIMES.has(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are currently supported.'));
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

// Build AI analysis prompt
function buildAnalysisPrompt(fileName, extractedData, blueprintText, tier) {
  const fixtureCount = (extractedData.toilets || 0) + (extractedData.lavatories || 0) +
    (extractedData.kitchenFaucets || 0) + (extractedData.barSinks || 0) +
    (extractedData.tubs || 0) + (extractedData.showerBases || 0) +
    (extractedData.mudPans || 0) + (extractedData.washingMachines || 0);

  return `You are a DFW plumbing estimator. Analyze this blueprint and return a supply-house-ready material takeoff.

PROJECT: ${fileName}
${extractedData.sqft ? `SQ FT: ${extractedData.sqft}` : ''}
${extractedData.units ? `UNITS: ${extractedData.units}` : ''}
${extractedData.stories ? `STORIES: ${extractedData.stories}` : ''}
${extractedData.bathrooms ? `BATHROOMS: ${extractedData.bathrooms}` : ''}
FIXTURES DETECTED: ${fixtureCount} total — ${extractedData.toilets || 0} toilets, ${extractedData.lavatories || 0} lavs, ${extractedData.kitchenFaucets || 0} kitchen, ${extractedData.barSinks || 0} bar, ${extractedData.tubs || 0} tubs, ${extractedData.showerBases || 0} showers, ${extractedData.mudPans || 0} mud pans, ${extractedData.washingMachines || 0} W/M, ${extractedData.waterSoftenerPreplumb || 0} WS pre-plumb

${blueprintText ? 'BLUEPRINT TEXT:\n' + blueprintText.substring(0, 6000) : ''}

Return ONLY this JSON — no text before or after:

{
  "fixtures": {
    "toilets": 0, "lavatories": 0, "kitchenFaucets": 0, "barSinks": 0,
    "tubs": 0, "showerBases": 0, "mudPans": 0, "washingMachines": 0,
    "waterSoftener": 0, "total": 0
  },
  "takeoff": [
    {"item": "3/4\\" Type L Copper", "cat": "Supply", "qty": 340, "unit": "LF", "cost": 3.85, "total": 1309}
  ],
  "totals": {
    "material": 18400,
    "laborMultiplier": 1.65,
    "estimate": 30360
  },
  "notes": ["47 fixtures total", "PEX-A recommended for 2nd floor"]
}

RULES:
- "takeoff" is the ONLY thing that matters. Make it SUPPLY HOUSE READY.
- Use real part descriptions a plumber would say at Ferguson
- Standard trade units: LF, EA, RL, BX, PR, SET
- Use realistic 2024-2025 DFW supply house pricing
- Categories: Supply, DWV, Fitting, Valve, Fixture, Support, Specialty
- Include EVERYTHING: all pipe sizes, fittings, valves, fixtures, hangers, etc.
- "fixtures" should confirm or correct the detected counts above
- "totals.laborMultiplier" = typical labor-to-material ratio (1.5-2.0x)
- "totals.estimate" = material × laborMultiplier
- "notes" = 2-4 short bullets — only things a plumber needs to know to bid
- Return ONLY valid JSON. All numbers must be numbers, not strings.`;
}

// Helper to safely parse JSON from AI response
function parseAIResponse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        // Continue
      }
    }
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (e3) {
        // Continue
      }
    }
    return null;
  }
}

// Calculate project complexity score
function calculateComplexityScore(extractedData, aiAnalysis) {
  let score = 0;
  const units = extractedData.units || 1;
  const sqft = extractedData.sqft || 0;

  if (units > 50) score += 30;
  else if (units > 20) score += 20;
  else if (units > 5) score += 10;
  else score += 5;

  if (sqft > 50000) score += 20;
  else if (sqft > 20000) score += 15;
  else if (sqft > 5000) score += 10;
  else score += 5;

  const fixtureCount = (extractedData.toilets || 0) +
                       (extractedData.lavatories || 0) +
                       (extractedData.tubs || 0) +
                       (extractedData.showerBases || 0);

  if (fixtureCount > 100) score += 20;
  else if (fixtureCount > 50) score += 15;
  else if (fixtureCount > 20) score += 10;
  else score += 5;

  const stories = extractedData.stories || 1;
  if (stories > 5) score += 15;
  else if (stories > 3) score += 10;
  else score += 5;

  const hasSpecialFeatures = extractedData.waterSoftenerPreplumb ||
                            extractedData.washingMachines ||
                            extractedData.barSinks;
  if (hasSpecialFeatures) score += 10;

  return Math.min(100, score);
}

function getComplexityLevel(score) {
  if (score >= 70) return 'complex';
  if (score >= 40) return 'medium';
  return 'simple';
}

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

function structureAnalysis(parsed, complexityLevel, complexityScore) {
  const isNewFormat = Array.isArray(parsed.takeoff);

  let materialTakeoff = [];
  if (isNewFormat && parsed.takeoff.length > 0) {
    materialTakeoff = parsed.takeoff.map(t => ({
      item: t.item,
      category: t.cat || t.category || 'Other',
      description: t.desc || t.description || '',
      quantity: t.qty ?? t.quantity ?? 0,
      unit: t.unit || 'EA',
      unitCost: t.cost ?? t.unitCost ?? 0,
      totalCost: t.total ?? t.totalCost ?? 0,
    }));
  } else if (Array.isArray(parsed.materialTakeoff)) {
    materialTakeoff = parsed.materialTakeoff;
  }

  return {
    overview: parsed.overview || null,
    projectComplexity: parsed.projectComplexity || complexityLevel,
    complexityScore: parsed.complexityScore || complexityScore,
    fixtures: parsed.fixtures || null,
    materialTakeoff,
    totals: parsed.totals || {
      material: materialTakeoff.reduce((s, m) => s + (m.totalCost || 0), 0),
      laborMultiplier: 1.65,
      estimate: materialTakeoff.reduce((s, m) => s + (m.totalCost || 0), 0) * 1.65,
    },
    notes: parsed.notes || [],
    requirements: parsed.requirements || null,
    laborEstimate: parsed.laborEstimate || null,
    timeline: parsed.timeline || null,
    recommendations: parsed.recommendations || null,
    risks: parsed.risks || null,
    codeCompliance: parsed.codeCompliance || null,
  };
}

function defaultAnalysis(complexityLevel, complexityScore) {
  return {
    overview: null,
    projectComplexity: complexityLevel,
    complexityScore,
    fixtures: null,
    materialTakeoff: [],
    totals: { material: 0, laborMultiplier: 1.65, estimate: 0 },
    notes: [],
    requirements: null,
    laborEstimate: null,
    timeline: null,
    recommendations: null,
    risks: null,
    codeCompliance: null,
  };
}

// Background job handler for blueprint analysis
async function performBlueprintAnalysis(jobData, progressCallback) {
  const { filePath, fileName, extractedData, blueprintText, tier, model } = jobData;

  // Validate file path is within upload directory (path traversal check)
  if (!isPathSafe(filePath)) {
    throw new Error('Invalid file path - path traversal detected');
  }

  try {
    progressCallback(10);

    const aiModel = model || aiProvider.getRecommendedModel('analysis');
    const prompt = buildAnalysisPrompt(fileName, extractedData, blueprintText, tier);

    progressCallback(20);

    const aiResult = await aiProvider.generate(prompt, { model: aiModel, timeout: 300000 });

    progressCallback(70);

    let parsedAnalysis = null;
    let aiAnalysisText = aiResult.response;
    if (aiResult.success) {
      parsedAnalysis = parseAIResponse(aiResult.response);
      if (!parsedAnalysis) {
        logger.warn('Could not parse AI response as JSON, using text format');
      }
    }

    const complexityScore = calculateComplexityScore(extractedData, parsedAnalysis);
    const complexityLevel = getComplexityLevel(complexityScore);

    let estimate = null;
    if (extractedData.sqft && extractedData.units) {
      const calcTier = tier ? tier.toLowerCase() : 'custom';
      try {
        const baseEstimate = pricingService.calculateEstimate({
          sqft: extractedData.sqft,
          bathrooms: extractedData.bathrooms || Math.ceil(extractedData.units * 2),
          units: extractedData.units,
          stories: extractedData.stories || 2,
          tier: calcTier
        });

        estimate = {
          ...baseEstimate,
          materials: parsedAnalysis?.materialBreakdown || {
            pipes: Math.round(baseEstimate.total * 0.15),
            fixtures: Math.round(baseEstimate.total * 0.25),
            valves: Math.round(baseEstimate.total * 0.05),
            other: Math.round(baseEstimate.total * 0.05)
          },
          labor: {
            roughIn: baseEstimate.breakdown.roughIn.amount,
            topOut: baseEstimate.breakdown.topOut.amount,
            trim: baseEstimate.breakdown.trim.amount
          }
        };
      } catch (error) {
        logger.error('Estimate calculation error', { error: error.message });
      }
    }

    progressCallback(90);

    // Use safe delete to ensure file is within upload directory
    await safeDeleteFile(filePath);

    progressCallback(95);

    const structuredAnalysis = parsedAnalysis ? structureAnalysis(parsedAnalysis, complexityLevel, complexityScore) : defaultAnalysis(complexityLevel, complexityScore);

    if (parsedAnalysis?.totals) {
      estimate = {
        ...(estimate || {}),
        total: parsedAnalysis.totals.estimate || estimate?.total || 0,
        materialTotal: parsedAnalysis.totals.material || 0,
        laborMultiplier: parsedAnalysis.totals.laborMultiplier || 1.65,
      };
    }

    const result = {
      fileName,
      extractedData,
      aiAnalysis: structuredAnalysis,
      aiAnalysisText: aiAnalysisText,
      aiError: aiResult.success ? null : aiResult.error,
      modelUsed: aiModel,
      estimate,
      textExtracted: blueprintText?.length > 0,
      warnings: buildWarnings(extractedData, aiResult)
    };

    progressCallback(100);

    return result;

  } catch (error) {
    // Use safe delete to ensure cleanup even on error
    await safeDeleteFile(filePath);
    throw error;
  }
}

// Enhanced extraction endpoint
router.post('/extract', upload.single('file'), tryCatch(async (req, res) => {
  if (!req.file) {
    return res.error('No file uploaded', 'MISSING_FILE', null, 400);
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;

  // Validate file path is within upload directory (path traversal check)
  if (!isPathSafe(filePath)) {
    await safeDeleteFile(filePath);
    return res.error('Invalid file path', 'PATH_VALIDATION_ERROR', null, 400);
  }

  try {
    // Detect PDF type first
    const pdfType = await enhancedBlueprintService.detectPdfType(filePath);

    // Extract text
    const pdfResult = await enhancedBlueprintService.extractPdfText(filePath);

    if (!pdfResult.success) {
      // Provide specific error messages
      if (pdfResult.isEncrypted) {
        return res.error('PDF is password protected', 'ENCRYPTED_PDF', null, 400);
      }
      if (pdfResult.isCorrupted) {
        return res.error('PDF appears to be corrupted', 'CORRUPT_PDF', null, 400);
      }
      
      return res.error('Failed to extract text from PDF', 'PDF_EXTRACT_ERROR', { 
        details: pdfResult.error 
      }, 400);
    }

    // Analyze with confidence scoring
    const analysis = enhancedBlueprintService.extractWithConfidence(pdfResult.text, fileName);
    
    // Validate and get suggestions
    const validation = enhancedBlueprintService.validateAndSuggest(
      analysis.extractedInfo, 
      analysis.confidenceScores
    );

    res.success({
      fileName,
      extractedData: analysis.extractedInfo,
      confidenceScores: analysis.confidenceScores,
      extractionSources: analysis.extractionSources,
      hasLowConfidence: analysis.hasLowConfidence,
      averageConfidence: analysis.averageConfidence,
      isScanned: pdfType.isScanned,
      textExtracted: pdfResult.text.length > 0,
      pages: pdfResult.pages,
      warnings: validation.warnings,
      suggestions: validation.suggestions
    }, 'PDF extracted successfully');

  } finally {
    // Always clean up temp file using safe delete
    await safeDeleteFile(filePath);
  }
}));

// Upload and analyze blueprint (with optional pre-extracted data)
router.post('/blueprint', upload.single('file'), tryCatch(async (req, res) => {
  if (!req.file) {
    return res.error('No file uploaded', 'MISSING_FILE', null, 400);
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const { tier, model, extractedData: extractedDataJson } = req.body;
  
  // Parse pre-extracted data if provided
  let clientExtractedData = {};
  if (extractedDataJson) {
    try {
      clientExtractedData = JSON.parse(extractedDataJson);
    } catch (e) {
      logger.warn('Failed to parse client extracted data', { error: e.message });
    }
  }

  // Validate inputs
  const validationErrors = validateInputs(tier, model);
  if (validationErrors.length > 0) {
    await enhancedBlueprintService.deleteFile(filePath);
    return res.error('Validation failed', 'VALIDATION_ERROR', { errors: validationErrors }, 400);
  }

  let extractedData = clientExtractedData;
  let blueprintText = '';

  // If no client data provided, extract from PDF
  if (Object.keys(clientExtractedData).length === 0) {
    const pdfResult = await enhancedBlueprintService.extractPdfText(filePath);

    if (!pdfResult.success) {
      await enhancedBlueprintService.deleteFile(filePath);
      return res.error('Failed to extract text from PDF', 'PDF_EXTRACT_ERROR', { details: pdfResult.error }, 400);
    }

    const analysis = enhancedBlueprintService.analyzeBlueprint(pdfResult.text, fileName);
    extractedData = analysis.extractedInfo;
    blueprintText = analysis.relevantText;
  } else {
    // Still extract text for AI context even if data was provided
    const pdfResult = await enhancedBlueprintService.extractPdfText(filePath);
    if (pdfResult.success) {
      blueprintText = enhancedBlueprintService.extractRelevantSections(pdfResult.text);
    }
  }

  // Queue the AI analysis job
  const jobData = {
    filePath,
    fileName,
    extractedData,
    blueprintText,
    tier,
    model
  };

  const jobId = await jobQueue.addJob(
    JOB_TYPES.BLUEPRINT_ANALYSIS,
    jobData,
    performBlueprintAnalysis
  );

  logger.info('Blueprint analysis job queued', { jobId, fileName });

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

export default router;
