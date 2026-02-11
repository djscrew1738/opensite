// File upload routes for blueprints

import express from 'express';
import multer from 'multer';
import path from 'path';
import { blueprintService } from '../services/blueprint.js';
import { ollamaService } from '../services/ollama.js';
import { pricingService } from '../services/pricing.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blueprint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// Upload and analyze blueprint
router.post('/blueprint', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { tier, model } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    let extractedData = {};
    let blueprintText = '';

    // Extract text from PDF
    if (path.extname(fileName).toLowerCase() === '.pdf') {
      const pdfResult = await blueprintService.extractPdfText(filePath);

      if (pdfResult.success) {
        const analysis = blueprintService.analyzeBlueprint(pdfResult.text, fileName);
        extractedData = analysis.extractedInfo;
        blueprintText = analysis.relevantText;
      }
    }

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

    // Get AI analysis
    const aiResult = await ollamaService.generate(prompt, { model: aiModel, timeout: 120000 });

    // Calculate estimate if we have enough data
    let estimate = null;
    if (extractedData.sqft && extractedData.units) {
      const calcTier = tier || 'custom';
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
      }
    }

    // Clean up uploaded file
    await blueprintService.deleteFile(filePath);

    res.json({
      fileName,
      extractedData,
      aiAnalysis: aiResult.success ? aiResult.response : 'AI analysis unavailable',
      modelUsed: aiModel,
      estimate,
      textExtracted: blueprintText.length > 0
    });

  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await blueprintService.deleteFile(req.file.path);
    }
    console.error('Blueprint upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload for quick text extraction only
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    let result = { fileName };

    if (path.extname(fileName).toLowerCase() === '.pdf') {
      const pdfResult = await blueprintService.extractPdfText(filePath);
      if (pdfResult.success) {
        const analysis = blueprintService.analyzeBlueprint(pdfResult.text, fileName);
        result = {
          ...result,
          extractedData: analysis.extractedInfo,
          pages: pdfResult.pages,
          success: true
        };
      } else {
        result.error = pdfResult.error;
        result.success = false;
      }
    } else {
      result.message = 'Image files require AI vision model (future feature)';
      result.success = true;
    }

    await blueprintService.deleteFile(filePath);

    res.json(result);

  } catch (error) {
    if (req.file) {
      await blueprintService.deleteFile(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
