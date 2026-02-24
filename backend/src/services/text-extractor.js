import fs from 'fs';
import path from 'path';
import logger from './logger.js';

// Dynamic import for mammoth (may not be installed)
let mammoth = null;
try {
  mammoth = await import('mammoth');
} catch { /* DOCX extraction unavailable */ }

export async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return extractFromPDF(filePath);
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
    return extractFromDocx(filePath);
  }
  // TXT, CSV, MD, HTML, JSON, XML — all plain text
  return extractFromText(filePath);
}

async function extractFromPDF(filePath) {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    pageCount: data.numpages,
    metadata: data.info || {}
  };
}

async function extractFromDocx(filePath) {
  if (!mammoth) {
    throw new Error('DOCX extraction requires the mammoth package. Install with: npm install mammoth');
  }
  const result = await mammoth.extractRawText({ path: filePath });
  return {
    text: result.value,
    pageCount: null,
    metadata: {}
  };
}

async function extractFromText(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  return {
    text,
    pageCount: null,
    metadata: {}
  };
}
