import fs from 'fs/promises';
import path from 'path';
import logger from './logger.js';

// Dynamic import for mammoth (may not be installed)
let mammoth = null;
try {
  mammoth = await import('mammoth');
} catch { /* DOCX extraction unavailable */ }

const EXTRACTION_TIMEOUT = 30000; // 30 seconds timeout

/**
 * Extract text from a file based on its MIME type
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @param {string} docId - Document ID for status updates
 * @returns {Promise<{text: string, pageCount: number|null, metadata: object}>}
 */
export async function extractText(filePath, mimeType, docId = null) {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return extractFromPDF(filePath, docId);
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
    return extractFromDocx(filePath, docId);
  }
  // TXT, CSV, MD, HTML, JSON, XML — all plain text
  return extractFromText(filePath, docId);
}

/**
 * Extract text from PDF with timeout
 */
async function extractFromPDF(filePath, docId = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT);

  try {
    const pdfParse = (await import('pdf-parse')).default;
    
    // Read file asynchronously (non-blocking)
    const buffer = await fs.readFile(filePath);
    
    // Parse with timeout
    const data = await Promise.race([
      pdfParse(buffer),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF extraction timeout')), EXTRACTION_TIMEOUT)
      )
    ]);

    clearTimeout(timeoutId);

    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: data.info || {}
    };
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Update document status if docId provided
    if (docId) {
      try {
        const { db } = await import('./database.js');
        db.prepare(`
          UPDATE text_documents
          SET status = 'error', errorMessage = ?, updatedAt = ?
          WHERE id = ?
        `).run(err.message, new Date().toISOString(), docId);
      } catch (dbErr) {
        logger.error('Failed to update document status after extraction error:', dbErr.message);
      }
    }

    if (err.name === 'AbortError' || err.message.includes('timeout')) {
      throw new Error(`PDF extraction timed out after ${EXTRACTION_TIMEOUT}ms`);
    }
    throw err;
  }
}

/**
 * Extract text from DOCX with timeout
 */
async function extractFromDocx(filePath, docId = null) {
  if (!mammoth) {
    throw new Error('DOCX extraction requires the mammoth package. Install with: npm install mammoth');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT);

  try {
    const result = await Promise.race([
      mammoth.extractRawText({ path: filePath }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DOCX extraction timeout')), EXTRACTION_TIMEOUT)
      )
    ]);

    clearTimeout(timeoutId);

    return {
      text: result.value,
      pageCount: null,
      metadata: {}
    };
  } catch (err) {
    clearTimeout(timeoutId);

    // Update document status if docId provided
    if (docId) {
      try {
        const { db } = await import('./database.js');
        db.prepare(`
          UPDATE text_documents
          SET status = 'error', errorMessage = ?, updatedAt = ?
          WHERE id = ?
        `).run(err.message, new Date().toISOString(), docId);
      } catch (dbErr) {
        logger.error('Failed to update document status after extraction error:', dbErr.message);
      }
    }

    if (err.name === 'AbortError' || err.message.includes('timeout')) {
      throw new Error(`DOCX extraction timed out after ${EXTRACTION_TIMEOUT}ms`);
    }
    throw err;
  }
}

/**
 * Extract text from plain text files (async, non-blocking)
 */
async function extractFromText(filePath, docId = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT);

  try {
    // Read file asynchronously (non-blocking) instead of readFileSync
    const text = await Promise.race([
      fs.readFile(filePath, 'utf-8'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Text extraction timeout')), EXTRACTION_TIMEOUT)
      )
    ]);

    clearTimeout(timeoutId);

    return {
      text,
      pageCount: null,
      metadata: {}
    };
  } catch (err) {
    clearTimeout(timeoutId);

    // Update document status if docId provided
    if (docId) {
      try {
        const { db } = await import('./database.js');
        db.prepare(`
          UPDATE text_documents
          SET status = 'error', errorMessage = ?, updatedAt = ?
          WHERE id = ?
        `).run(err.message, new Date().toISOString(), docId);
      } catch (dbErr) {
        logger.error('Failed to update document status after extraction error:', dbErr.message);
      }
    }

    if (err.name === 'AbortError' || err.message.includes('timeout')) {
      throw new Error(`Text extraction timed out after ${EXTRACTION_TIMEOUT}ms`);
    }
    throw err;
  }
}
