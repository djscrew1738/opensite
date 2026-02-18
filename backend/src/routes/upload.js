// File upload routes for blueprints

import express from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { blueprintService } from '../services/blueprint.js';
import { aiProvider } from '../services/ai-provider.js';
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

// Build AI analysis prompt - requests structured JSON output
function buildAnalysisPrompt(fileName, extractedData, blueprintText, tier) {
  return `You are an expert plumbing estimator for CTL Plumbing LLC analyzing a blueprint.

Blueprint File: ${fileName}
${Object.keys(extractedData).length > 0 ? 'Extracted Information:\n' + JSON.stringify(extractedData, null, 2) : ''}

${blueprintText ? 'Relevant Blueprint Text:\n' + blueprintText : 'No text extracted from blueprint.'}

Please analyze this blueprint and provide a comprehensive response in the following JSON structure:

{
  "overview": "2-3 sentence summary of the project",
  "projectComplexity": "simple|medium|complex",
  "complexityScore": 0-100,
  "complexityFactors": ["factor 1", "factor 2", ...],
  "requirements": {
    "pipes": [
      {"type": "Supply", "material": "PEX or Copper", "size": "3/4\" main, 1/2\" branches", "estimatedLength": "500 ft"}
    ],
    "fixtures": [
      {"category": "Toilets", "count": ${extractedData.toilets || 0}, "notes": "Standard efficiency"}
    ],
    "waterHeater": {
      "type": "Tankless or Tank",
      "capacity": "50+ gallons or appropriate GPM",
      "location": "utility room",
      "units": ${extractedData.units || 1}
    },
    "drainage": "Cast iron or PVC main lines, PVC branches",
    "specialFeatures": ["luxury fixtures", "accessibility features", etc.]
  },
  "laborEstimate": {
    "roughIn": {"hours": 40, "duration": "5 days"},
    "topOut": {"hours": 16, "duration": "2 days"},
    "trim": {"hours": 24, "duration": "3 days"}
  },
  "timeline": {
    "estimatedDuration": "10-12 days",
    "phases": [
      {"name": "Rough-in", "duration": "5 days", "tasks": ["Install supply lines", "Install drain lines", "Pressure test"]},
      {"name": "Top-out", "duration": "2 days", "tasks": ["Install risers", "Inspection"]},
      {"name": "Trim", "duration": "3 days", "tasks": ["Install fixtures", "Final inspection"]}
    ],
    "criticalPath": ["Rough-in inspection", "Top-out inspection"]
  },
  "codeCompliance": {
    "notes": ["DFW area requirements", "Texas plumbing code considerations", "Inspection checkpoints"]
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "risks": [
    {"risk": "Description", "mitigation": "How to address"},
    {"risk": "Description", "mitigation": "How to address"}
  ],
  "materialBreakdown": {
    "pipes": 5000,
    "fixtures": 8000,
    "valves": 1500,
    "other": 2000
  },
  "materialTakeoff": [
    {
      "item": "3/4\" PEX Pipe",
      "category": "Pipe",
      "description": "Main supply line",
      "quantity": 500,
      "unit": "LF",
      "unitCost": 2.50,
      "totalCost": 1250
    },
    {
      "item": "1/2\" PEX Pipe",
      "category": "Pipe",
      "description": "Branch supply lines to fixtures",
      "quantity": 800,
      "unit": "LF",
      "unitCost": 1.75,
      "totalCost": 1400
    },
    {
      "item": "4\" PVC DWV Pipe",
      "category": "Pipe",
      "description": "Main drain line",
      "quantity": 200,
      "unit": "LF",
      "unitCost": 8.00,
      "totalCost": 1600
    },
    {
      "item": "2\" PVC DWV Pipe",
      "category": "Pipe",
      "description": "Branch drain lines",
      "quantity": 400,
      "unit": "LF",
      "unitCost": 4.50,
      "totalCost": 1800
    },
    {
      "item": "Toilet (Standard)",
      "category": "Fixture",
      "description": "1.28 GPF water closet",
      "quantity": 10,
      "unit": "EA",
      "unitCost": 250,
      "totalCost": 2500
    },
    {
      "item": "Lavatory Faucet",
      "category": "Fixture",
      "description": "Chrome single-handle",
      "quantity": 10,
      "unit": "EA",
      "unitCost": 85,
      "totalCost": 850
    }
  ],
  "pricingRecommendation": {
    "tier": "Production|Custom|Premium",
    "factors": ["factor 1", "factor 2"],
    "adjustments": "Any suggested adjustments"
  }
}

IMPORTANT:
- Return ONLY valid JSON. Do not include any text before or after the JSON. Ensure all numeric values are numbers, not strings.
- The "materialTakeoff" array is CRITICAL. Include EVERY material needed for the project: all pipe types/sizes, fittings (elbows, tees, couplings, adapters), valves (shut-offs, ball valves, check valves), fixtures (toilets, faucets, tubs, showers), connectors, hangers/supports, sealants, test plugs, cleanouts, P-traps, wax rings, supply lines, water heater components, and any specialty items. Be specific with sizes and materials. Use realistic current pricing. Categories should be: Pipe, Fitting, Valve, Fixture, Support, Connector, Specialty, or Other.`;
}

// Helper to safely parse JSON from AI response
function parseAIResponse(text) {
  try {
    // Try direct JSON parse first
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        // Ignore and continue
      }
    }

    // Try to find JSON object in the text
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (e3) {
        // Ignore and continue
      }
    }

    return null;
  }
}

// Calculate project complexity score (0-100)
function calculateComplexityScore(extractedData, aiAnalysis) {
  let score = 0;

  // Base complexity from units and size
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

  // Fixture complexity
  const fixtureCount = (extractedData.toilets || 0) +
                       (extractedData.lavatories || 0) +
                       (extractedData.tubs || 0) +
                       (extractedData.showerBases || 0);

  if (fixtureCount > 100) score += 20;
  else if (fixtureCount > 50) score += 15;
  else if (fixtureCount > 20) score += 10;
  else score += 5;

  // Story complexity
  const stories = extractedData.stories || 1;
  if (stories > 5) score += 15;
  else if (stories > 3) score += 10;
  else score += 5;

  // Special features
  const hasSpecialFeatures = extractedData.waterSoftenerPreplumb ||
                            extractedData.washingMachines ||
                            extractedData.barSinks;
  if (hasSpecialFeatures) score += 10;

  return Math.min(100, score);
}

// Determine complexity level
function getComplexityLevel(score) {
  if (score >= 70) return 'complex';
  if (score >= 40) return 'medium';
  return 'simple';
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
    const aiModel = model || aiProvider.getRecommendedModel('analysis');
    const prompt = buildAnalysisPrompt(fileName, extractedData, blueprintText, tier);

    progressCallback(20); // Prompt built

    const aiResult = await aiProvider.generate(prompt, { model: aiModel, timeout: 300000 });

    progressCallback(70); // AI analysis complete

    // Parse AI response as JSON
    let parsedAnalysis = null;
    let aiAnalysisText = aiResult.response;
    if (aiResult.success) {
      parsedAnalysis = parseAIResponse(aiResult.response);
      if (!parsedAnalysis) {
        logger.warn('Could not parse AI response as JSON, using text format');
      }
    }

    // Calculate complexity score
    const complexityScore = calculateComplexityScore(extractedData, parsedAnalysis);
    const complexityLevel = getComplexityLevel(complexityScore);

    // Calculate estimate if we have enough data
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

        // Enhance estimate with material and labor breakdowns
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

    progressCallback(90); // Estimate calculated

    // Clean up uploaded file
    await blueprintService.deleteFile(filePath);

    progressCallback(95); // File cleanup

    // Structure the AI analysis data
    const structuredAnalysis = parsedAnalysis ? {
      overview: parsedAnalysis.overview || 'Analysis complete',
      projectComplexity: parsedAnalysis.projectComplexity || complexityLevel,
      complexityScore: parsedAnalysis.complexityScore || complexityScore,
      complexityFactors: parsedAnalysis.complexityFactors || [],
      requirements: parsedAnalysis.requirements || {},
      laborEstimate: parsedAnalysis.laborEstimate || {
        roughIn: { hours: 40, duration: '5 days' },
        topOut: { hours: 16, duration: '2 days' },
        trim: { hours: 24, duration: '3 days' }
      },
      timeline: parsedAnalysis.timeline || {
        estimatedDuration: '10-14 days',
        phases: [],
        criticalPath: []
      },
      codeCompliance: parsedAnalysis.codeCompliance || { notes: [] },
      recommendations: parsedAnalysis.recommendations || [],
      risks: parsedAnalysis.risks || [],
      materialTakeoff: parsedAnalysis.materialTakeoff || []
    } : {
      overview: 'Analysis complete',
      projectComplexity: complexityLevel,
      complexityScore,
      complexityFactors: [],
      requirements: {},
      laborEstimate: {
        roughIn: { hours: 40, duration: '5 days' },
        topOut: { hours: 16, duration: '2 days' },
        trim: { hours: 24, duration: '3 days' }
      },
      timeline: {
        estimatedDuration: '10-14 days',
        phases: [],
        criticalPath: []
      },
      codeCompliance: { notes: [] },
      recommendations: [],
      risks: [],
      materialTakeoff: []
    };

    const result = {
      fileName,
      extractedData,
      aiAnalysis: structuredAnalysis,
      aiAnalysisText: aiAnalysisText, // Keep original text as fallback
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
    const aiModel = model || aiProvider.getRecommendedModel('analysis');
    const prompt = buildAnalysisPrompt(fileName, extractedData, blueprintText, tier);

    const aiResult = await aiProvider.generate(prompt, { model: aiModel, timeout: 300000 });

    // Parse AI response as JSON
    let parsedAnalysis = null;
    let aiAnalysisText = aiResult.response;
    if (aiResult.success) {
      parsedAnalysis = parseAIResponse(aiResult.response);
      if (!parsedAnalysis) {
        logger.warn('Could not parse AI response as JSON, using text format');
      }
    }

    // Calculate complexity score
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

        // Enhance estimate with material and labor breakdowns
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

    await blueprintService.deleteFile(filePath);

    // Structure the AI analysis data
    const structuredAnalysis = parsedAnalysis ? {
      overview: parsedAnalysis.overview || 'Analysis complete',
      projectComplexity: parsedAnalysis.projectComplexity || complexityLevel,
      complexityScore: parsedAnalysis.complexityScore || complexityScore,
      complexityFactors: parsedAnalysis.complexityFactors || [],
      requirements: parsedAnalysis.requirements || {},
      laborEstimate: parsedAnalysis.laborEstimate || {
        roughIn: { hours: 40, duration: '5 days' },
        topOut: { hours: 16, duration: '2 days' },
        trim: { hours: 24, duration: '3 days' }
      },
      timeline: parsedAnalysis.timeline || {
        estimatedDuration: '10-14 days',
        phases: [],
        criticalPath: []
      },
      codeCompliance: parsedAnalysis.codeCompliance || { notes: [] },
      recommendations: parsedAnalysis.recommendations || [],
      risks: parsedAnalysis.risks || [],
      materialTakeoff: parsedAnalysis.materialTakeoff || []
    } : {
      overview: 'Analysis complete',
      projectComplexity: complexityLevel,
      complexityScore,
      complexityFactors: [],
      requirements: {},
      laborEstimate: {
        roughIn: { hours: 40, duration: '5 days' },
        topOut: { hours: 16, duration: '2 days' },
        trim: { hours: 24, duration: '3 days' }
      },
      timeline: {
        estimatedDuration: '10-14 days',
        phases: [],
        criticalPath: []
      },
      codeCompliance: { notes: [] },
      recommendations: [],
      risks: [],
      materialTakeoff: []
    };

    const response = {
      fileName,
      extractedData,
      aiAnalysis: structuredAnalysis,
      aiAnalysisText: aiAnalysisText,
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
