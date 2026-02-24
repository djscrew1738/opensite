// OCR Service using Tesseract.js for blueprint page classification

import { createWorker } from 'tesseract.js';
import logger from './logger.js';
import sharp from 'sharp';

class OCRService {
  constructor() {
    this.worker = null;
  }

  async initialize() {
    if (this.worker) return;
    try {
      this.worker = await createWorker({
        logger: m => logger.debug(`[tesseract] ${m.status}: ${Math.round(m.progress * 100)}%`),
      });
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      logger.info('[ocr] Tesseract worker initialized');
    } catch (error) {
      logger.error('[ocr] Tesseract initialization failed:', error);
      this.worker = null;
    }
  }

  /**
   * Perform OCR on an image buffer
   * @param {Buffer} imageBuffer - Image data as a buffer
   * @returns {string} Extracted text
   */
  async ocr(imageBuffer) {
    if (!this.worker) {
      await this.initialize();
      if (!this.worker) throw new Error('Tesseract worker not available');
    }

    const { data: { text } } = await this.worker.recognize(imageBuffer);
    return text;
  }

  /**
   * Classify a blueprint page (e.g., floor plan, elevation, electrical)
   * @param {string} ocrText - Text extracted from the page
   * @returns {string} Page type
   */
  classifyPage(ocrText) {
    const text = ocrText.toLowerCase();
    
    if (text.includes('floor plan')) return 'floor_plan';
    if (text.includes('elevation')) return 'elevation';
    if (text.includes('electrical')) return 'electrical_plan';
    if (text.includes('foundation')) return 'foundation_plan';
    if (text.includes('plumbing') || text.includes('dwv risers')) return 'plumbing_plan';
    if (text.includes('site plan')) return 'site_plan';
    
    // Fallback based on keywords
    if (text.includes('kitchen') && text.includes('living room')) return 'floor_plan';
    if (text.includes('front view') || text.includes('side view')) return 'elevation';
    if (text.includes('lighting') || text.includes('outlets')) return 'electrical_plan';

    return 'unknown';
  }

  /**
   * Extract text from all pages of a PDF and generate thumbnails.
   * @param {string} pdfPath - Path to the PDF file
   * @returns {Promise<Array<{pageNumber: number, text: string, thumbnail: Buffer, classification: string}>>}
   */
  async processPdf(pdfPath) {
    if (!this.worker) await this.initialize();
    
    const { PDFDocument } = await import('pdf-lib');
    const fs = await import('fs/promises');
    
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    const results = [];

    for (let i = 0; i < pageCount; i++) {
      // Create a new PDF with just one page for rendering
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
      singlePagePdf.addPage(copiedPage);
      const pageBytes = await singlePagePdf.save();
      
      // Render page to image using pdfjs-dist (as in vision.js)
      const imageBuffer = await this.renderPageToImage(pageBytes);
      
      // Generate thumbnail
      const thumbnailBuffer = await sharp(imageBuffer).resize(200, 280, { fit: 'inside' }).png().toBuffer();

      // Perform OCR
      const text = await this.ocr(imageBuffer);
      const classification = this.classifyPage(text);
      
      results.push({
        pageNumber: i + 1,
        text,
        thumbnail: thumbnailBuffer,
        classification,
      });
    }

    return results;
  }

  /**
   * Renders a single PDF page (as bytes) to an image buffer
   */
  async renderPageToImage(pageBytes) {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = await import('canvas');

    const loadingTask = getDocument({ data: pageBytes, useSystemFonts: true });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({ canvasContext: context, viewport }).promise;
    
    doc.destroy();
    
    return canvas.toBuffer('image/png');
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      logger.info('[ocr] Tesseract worker terminated');
    }
  }
}

export const ocrService = new OCRService();

// Graceful shutdown
process.on('SIGTERM', () => ocrService.terminate());
process.on('SIGINT', () => ocrService.terminate());
