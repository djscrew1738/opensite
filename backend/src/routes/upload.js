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

// Build AI analysis prompt — focused on supply-house-ready takeoff + bid number
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
    {"item": "3/4\\" Type L Copper", "cat": "Supply", "qty": 340, "unit": "LF", "cost": 3.85, "total": 1309},
    {"item": "1/2\\" Type L Copper", "cat": "Supply", "qty": 600, "unit": "LF", "cost": 2.45, "total": 1470}
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
- Use real part descriptions a plumber would say at Ferguson: "3/4\\" Type L Copper" not "copper pipe", "1/2\\" PEX-A Uponor" not "PEX pipe", "4\\" Sch 40 PVC DWV" not "drain pipe"
- Standard trade units: LF (linear feet), EA (each), RL (roll), BX (box), PR (pair), SET
- Use realistic 2024-2025 DFW supply house pricing
- Categories: Supply, DWV, Fitting, Valve, Fixture, Support, Specialty
- Include EVERYTHING: all pipe sizes, fittings (elbows, tees, couplings, adapters, bushings), valves (ball, gate, check, PRV), fixtures, hangers, straps, test plugs, cleanouts, P-traps, wax rings, supply lines, flex connectors, gas components if applicable, water heater, expansion tank, insulation
- "fixtures" should confirm or correct the detected counts above
- "totals.laborMultiplier" = typical labor-to-material ratio (1.5-2.0x for plumbing)
- "totals.estimate" = material × laborMultiplier
- "notes" = 2-4 short bullets — only things a plumber needs to know to bid
- Return ONLY valid JSON. All numbers must be numbers, not strings.`;
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

// Map new concise AI format → structured analysis (backwards-compatible with frontend)
function structureAnalysis(parsed, complexityLevel, complexityScore) {
  // Handle new concise format (has "takeoff" array with "cat" field)
  const isNewFormat = Array.isArray(parsed.takeoff);

  // Normalize takeoff: new format uses "cat"/"qty"/"cost"/"total", old uses "category"/"quantity"/"unitCost"/"totalCost"
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
    // Preserve legacy fields if present (won't break old responses)
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

    // Structure the AI analysis — new concise format
    const structuredAnalysis = parsedAnalysis ? structureAnalysis(parsedAnalysis, complexityLevel, complexityScore) : defaultAnalysis(complexityLevel, complexityScore);

    // Override estimate with AI totals if available
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
      textExtracted: blueprintText.length > 0,
      warnings: buildWarnings(extractedData, aiResult)
    };

    progressCallback(100);

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

    // Structure the AI analysis — new concise format
    const structuredAnalysis = parsedAnalysis ? structureAnalysis(parsedAnalysis, complexityLevel, complexityScore) : defaultAnalysis(complexityLevel, complexityScore);

    // Override estimate with AI totals if available
    if (parsedAnalysis?.totals) {
      estimate = {
        ...(estimate || {}),
        total: parsedAnalysis.totals.estimate || estimate?.total || 0,
        materialTotal: parsedAnalysis.totals.material || 0,
        laborMultiplier: parsedAnalysis.totals.laborMultiplier || 1.65,
      };
    }

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
