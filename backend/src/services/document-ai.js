/**
 * Document AI Service
 * AI-powered document classification and OCR
 * Uses multi-provider AI system with Tesseract.js for OCR
 */

import path from 'path';
import fs from 'fs/promises';
import { aiProvider } from './ai-provider.js';
import logger from './logger.js';

// OCR engine (lazy loaded)
let tesseract = null;

/**
 * Lazy load Tesseract.js
 */
async function getTesseract() {
  if (!tesseract) {
    try {
      const { createWorker } = await import('tesseract.js');
      tesseract = { createWorker };
    } catch (err) {
      logger.error('[document-ai] Failed to load Tesseract.js:', err.message);
      throw new Error('OCR engine not available. Install tesseract.js: npm install tesseract.js');
    }
  }
  return tesseract;
}

/**
 * Extract text sample from PDF for classification
 * For PDFs, we'll extract the first few KB of text content
 */
async function extractTextSample(filePath, maxBytes = 5000) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.txt') {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.slice(0, maxBytes);
    }
    
    if (ext === '.pdf') {
      // Try to extract text from PDF using pdf-parse
      try {
        const pdfParse = await import('pdf-parse');
        const buffer = await fs.readFile(filePath);
        const data = await pdfParse.default(buffer);
        return data.text.slice(0, maxBytes);
      } catch (err) {
        logger.debug('[document-ai] PDF text extraction failed, will use OCR:', err.message);
        return null;
      }
    }
    
    // For images, we'll need OCR - return null to trigger OCR path
    return null;
  } catch (err) {
    logger.error('[document-ai] Text sample extraction failed:', err.message);
    return null;
  }
}

/**
 * Classify document using AI
 * @param {string} filePath - Path to document
 * @param {string} ext - File extension
 * @param {Object} options
 * @returns {Promise<{category: string, confidence: number, reasoning: string}>}
 */
export async function classifyDocument(filePath, ext, options = {}) {
  const startTime = Date.now();
  
  try {
    // Get text sample for classification
    let textSample = await extractTextSample(filePath);
    const filename = path.basename(filePath);
    
    // If no text extracted and it's an image/PDF, use OCR to get sample
    if (!textSample && ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp'].includes(ext.toLowerCase())) {
      try {
        const ocrResult = await runOCR(filePath, ext, { maxPages: 1 });
        textSample = ocrResult.text.slice(0, 3000);
      } catch (err) {
        logger.debug('[document-ai] OCR for classification failed:', err.message);
      }
    }
    
    // Build classification prompt
    const prompt = buildClassificationPrompt(filename, ext, textSample);
    
    // Get AI classification
    const response = await aiProvider.active.chat([
      { 
        role: 'system', 
        content: `You are a document classification AI for a plumbing contractor (CTL Plumbing LLC). 
Classify documents into categories based on filename and content.
Respond with ONLY a JSON object in this format:
{"category": "one_of_the_categories", "confidence": 0.0_to_1.0, "reasoning": "brief_explanation"}

Categories:
- blueprint: Construction plans, architectural drawings, site plans, floor plans
- permit: Building permits, inspection reports, approval documents
- contract: Service agreements, work contracts, proposals, terms
- invoice: Bills, receipts, invoices, payment records
- w9: Tax forms, W-9, EIN documents, contractor forms
- specification: Material specs, product sheets, technical docs
- correspondence: Emails, letters, general communication
- photo: Site photos, progress pictures, inspection photos
- other: Anything that doesn't fit above

Be precise. High confidence only when clearly identifiable.`
      },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.1,
      maxTokens: 200,
      ...options
    });
    
    // Parse AI response
    let result;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      // Fallback to keyword classification
      logger.warn('[document-ai] AI classification parsing failed, using fallback:', parseErr.message);
      result = fallbackClassification(filename, ext, textSample);
    }
    
    // Validate result
    const validCategories = ['blueprint', 'permit', 'contract', 'invoice', 'w9', 'specification', 'correspondence', 'photo', 'other'];
    if (!validCategories.includes(result.category)) {
      result.category = 'other';
    }
    
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5;
    }
    
    const duration = Date.now() - startTime;
    logger.info('[document-ai] Document classified', {
      file: filename,
      category: result.category,
      confidence: result.confidence,
      duration: `${duration}ms`
    });
    
    return {
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning || 'AI classification',
      method: 'ai',
      processingTime: duration
    };
    
  } catch (err) {
    logger.error('[document-ai] Classification failed:', err.message);
    
    // Final fallback
    const fallback = fallbackClassification(path.basename(filePath), ext, null);
    return {
      ...fallback,
      method: 'fallback',
      error: err.message
    };
  }
}

/**
 * Build classification prompt
 */
function buildClassificationPrompt(filename, ext, textSample) {
  let prompt = `Classify this document:\n\nFilename: ${filename}\nType: ${ext}\n`;
  
  if (textSample) {
    prompt += `\nContent sample:\n${textSample.slice(0, 2000)}\n`;
  }
  
  return prompt;
}

/**
 * Fallback classification based on keywords
 */
function fallbackClassification(filename, ext, textSample) {
  const name = filename.toLowerCase();
  const content = (textSample || '').toLowerCase();
  
  const keywords = {
    blueprint: ['blueprint', 'plan', 'drawing', 'layout', 'site', 'floor plan', 'elevation', 'section', 'architectural'],
    permit: ['permit', 'license', 'approval', 'inspection', 'certificate', 'authorized'],
    contract: ['contract', 'agreement', 'terms', 'proposal', 'scope of work', 'sow'],
    invoice: ['invoice', 'receipt', 'bill', 'payment', 'quote', 'estimate', 'pricing'],
    w9: ['w9', 'w-9', 'tax', 'ein', 'ssn', 'taxpayer', 'irs'],
    specification: ['spec', 'specification', 'datasheet', 'product', 'material', 'cut sheet'],
    photo: ['photo', 'image', 'picture', 'site visit', 'progress'],
  };
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(w => name.includes(w) || content.includes(w))) {
      return { category, confidence: 0.7, reasoning: 'Keyword match fallback' };
    }
  }
  
  if (ext === '.pdf') {
    return { category: 'document', confidence: 0.6, reasoning: 'PDF document default' };
  }
  
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
    return { category: 'photo', confidence: 0.6, reasoning: 'Image file' };
  }
  
  return { category: 'other', confidence: 0.5, reasoning: 'No clear indicators' };
}

/**
 * Run OCR on document
 * @param {string} filePath - Path to document
 * @param {string} fileType - File extension
 * @param {Object} options
 * @returns {Promise<{text: string, pages: number, confidence: number}>}
 */
export async function runOCR(filePath, fileType, options = {}) {
  const startTime = Date.now();
  const { maxPages = 10, language = 'eng' } = options;
  
  try {
    const ext = (fileType || path.extname(filePath)).toLowerCase();
    
    // Only process supported formats
    const supportedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp', '.gif'];
    if (!supportedExts.includes(ext)) {
      return {
        text: `[Unsupported file type for OCR: ${ext}]`,
        pages: 0,
        confidence: 0,
        error: 'Unsupported file type'
      };
    }
    
    logger.info('[document-ai] Starting OCR', { file: path.basename(filePath), type: ext });
    
    let fullText = '';
    let pageCount = 0;
    let avgConfidence = 0;
    
    if (ext === '.pdf') {
      // For PDFs, convert to images first or use pdf2pic
      const result = await processPDFWithOCR(filePath, { maxPages, language });
      fullText = result.text;
      pageCount = result.pages;
      avgConfidence = result.confidence;
    } else {
      // Direct image OCR
      const result = await processImageWithOCR(filePath, language);
      fullText = result.text;
      pageCount = 1;
      avgConfidence = result.confidence;
    }
    
    const duration = Date.now() - startTime;
    logger.info('[document-ai] OCR completed', {
      file: path.basename(filePath),
      pages: pageCount,
      confidence: avgConfidence.toFixed(2),
      duration: `${duration}ms`,
      textLength: fullText.length
    });
    
    return {
      text: fullText,
      pages: pageCount,
      confidence: avgConfidence,
      processingTime: duration
    };
    
  } catch (err) {
    logger.error('[document-ai] OCR failed:', err.message);
    
    return {
      text: ``,
      pages: 0,
      confidence: 0,
      error: err.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Process image with Tesseract OCR
 */
async function processImageWithOCR(imagePath, language = 'eng') {
  const { createWorker } = await getTesseract();
  
  const worker = await createWorker(language);
  
  try {
    const result = await worker.recognize(imagePath);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Process PDF with OCR
 * Converts PDF pages to images and runs OCR
 */
async function processPDFWithOCR(pdfPath, options = {}) {
  const { maxPages = 10, language = 'eng' } = options;
  
  try {
    // Try pdf-parse first for text-based PDFs
    const pdfParse = await import('pdf-parse');
    const buffer = await fs.readFile(pdfPath);
    const parseResult = await pdfParse.default(buffer);
    
    // If PDF has extractable text with good confidence, use it
    if (parseResult.text && parseResult.text.trim().length > 100) {
      const pages = Math.min(parseResult.numpages, maxPages);
      return {
        text: parseResult.text,
        pages: pages,
        confidence: 0.95 // Text extraction is high confidence
      };
    }
    
    // If PDF is image-based, we need to convert to images
    // For now, return placeholder noting OCR needed
    logger.warn('[document-ai] PDF appears to be image-based, OCR conversion not implemented');
    
    return {
      text: `[Image-based PDF detected. Full OCR for scanned PDFs requires pdf2pic integration.]\n\nExtractable text found:\n${parseResult.text.slice(0, 500)}`,
      pages: parseResult.numpages,
      confidence: 0.3
    };
    
  } catch (err) {
    logger.error('[document-ai] PDF processing failed:', err.message);
    throw err;
  }
}

/**
 * Extract key information from document using AI
 * @param {string} text - Document text content
 * @param {string} docType - Document category
 */
export async function extractKeyInformation(text, docType) {
  try {
    const prompt = `Extract key information from this ${docType} document:\n\n${text.slice(0, 4000)}\n\nRespond with JSON containing relevant fields for a ${docType}.`;
    
    const response = await aiProvider.active.chat([
      {
        role: 'system',
        content: 'You extract structured information from documents. Respond with valid JSON only.'
      },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.1,
      maxTokens: 500
    });
    
    // Try to parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { raw: response.content };
  } catch (err) {
    logger.error('[document-ai] Information extraction failed:', err.message);
    return { error: err.message };
  }
}

export default {
  classifyDocument,
  runOCR,
  extractKeyInformation
};
