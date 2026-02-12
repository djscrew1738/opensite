// File upload routes for blueprints

import express from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { blueprintService } from '../services/blueprint.js';
import { ollamaService } from '../services/ollama.js';
import { pricingService } from '../services/pricing.js';

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

// Upload and analyze blueprint
router.post('/blueprint', upload.single('file'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const fileName = req.file.originalname;
    const { tier, model } = req.body;

    // Validate inputs
    const validationErrors = validateInputs(tier, model);
    if (validationErrors.length > 0) {
      await blueprintService.deleteFile(filePath);
      return res.status(400).json({ error: validationErrors.join('; ') });
    }

    // Extract text from PDF using helper function (removes duplicate code)
    const pdfData = await processPdfExtraction(filePath, fileName);

    if (!pdfData.success) {
      await blueprintService.deleteFile(filePath);
      return res.status(400).json({
        error: 'Failed to extract text from PDF',
        details: pdfData.error
      });
    }

    const extractedData = pdfData.extractedData;
    const blueprintText = pdfData.relevantText;

    // Generate AI analysis prompt
    const aiModel = model || ollamaService.getRecommendedModel('analysis');
    const prompt = `You are an expert plumbing estimator for CTL Plumbing LLC analyzing a blueprint.

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

    // Get AI analysis (extended timeout for comprehensive blueprint analysis)
    const aiResult = await ollamaService.generate(prompt, { model: aiModel, timeout: 300000 }); // 5 minutes

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
        console.error('Estimate calculation error:', error);
        // Continue even if estimate fails - still return analysis
      }
    }

    // Clean up uploaded file
    await blueprintService.deleteFile(filePath);

    const response = {
      fileName,
      extractedData,
      aiAnalysis: aiResult.success ? aiResult.response : null,
      aiError: aiResult.success ? null : aiResult.error,
      modelUsed: aiModel,
      estimate,
      textExtracted: blueprintText.length > 0,
      warnings: []
    };

    // Add warnings for missing data
    if (!extractedData.sqft || !extractedData.units) {
      response.warnings.push('Could not extract enough data for automatic estimate. Manual review recommended.');
    }
    if (!aiResult.success) {
      response.warnings.push('AI analysis unavailable. Showing extracted data only.');
    }

    res.json(response);

  } catch (error) {
    // Clean up file on error (check filePath instead of req.file to avoid race condition)
    if (filePath) {
      await blueprintService.deleteFile(filePath);
    }
    console.error('Blueprint upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload for quick text extraction only
router.post('/extract', upload.single('file'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const fileName = req.file.originalname;

    // Process PDF extraction
    const result = await processPdfExtraction(filePath, fileName);

    // Clean up file
    await blueprintService.deleteFile(filePath);

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to extract text from PDF',
        details: result.error,
        fileName: result.fileName
      });
    }

    res.json(result);

  } catch (error) {
    // Clean up file on error
    if (filePath) {
      await blueprintService.deleteFile(filePath);
    }
    console.error('PDF extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
