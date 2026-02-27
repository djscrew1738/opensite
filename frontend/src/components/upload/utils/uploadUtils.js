/**
 * Upload Utilities
 * Shared helpers for file validation, formatting, and type detection
 */

// File size limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB - matches backend

// Common accepted file types
export const ACCEPTED_EXTENSIONS = {
  blueprint: ['.pdf', '.dwg'],
  image: ['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp'],
  document: ['.docx', '.doc', '.txt', '.md', '.csv', '.html', '.htm', '.json', '.xml'],
  spreadsheet: ['.xlsx', '.xls'],
  vision: ['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp', '.pdf'],
};

// Flat list for input accept attribute
export const ALL_ACCEPTED_EXTENSIONS = Object.values(ACCEPTED_EXTENSIONS)
  .flat()
  .join(',');

// MIME type mapping
export const MIME_TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

// Extension sets for quick lookup
export const EXTENSION_SETS = {
  blueprint: new Set(['pdf', 'dwg']),
  image: new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']),
  document: new Set(['docx', 'doc', 'txt', 'md', 'csv', 'html', 'htm', 'json', 'xml']),
  spreadsheet: new Set(['xlsx', 'xls', 'csv']),
};

/**
 * Get file extension from filename
 * @param {string} filename
 * @returns {string} Extension without dot, lowercase
 */
export function getExtension(filename) {
  const dot = filename.lastIndexOf('.');
  return dot !== -1 ? filename.slice(dot + 1).toLowerCase() : '';
}

/**
 * Format bytes to human readable string
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export function formatFileSize(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format seconds to human readable duration
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Categorize file by type
 * @param {string} filename
 * @returns {string} Category: 'blueprint' | 'image' | 'document' | 'spreadsheet' | 'other'
 */
export function categorizeFile(filename) {
  const ext = getExtension(filename);
  if (EXTENSION_SETS.blueprint.has(ext)) return 'blueprint';
  if (EXTENSION_SETS.image.has(ext)) return 'image';
  if (EXTENSION_SETS.document.has(ext)) return 'document';
  if (EXTENSION_SETS.spreadsheet.has(ext)) return 'spreadsheet';
  return 'other';
}

/**
 * Get icon type for file
 * @param {string} filename
 * @returns {string} Icon type: 'pdf' | 'image' | 'word' | 'spreadsheet' | 'markdown' | 'text'
 */
export function getFileIconType(filename) {
  const ext = getExtension(filename);
  if (ext === 'pdf') return 'pdf';
  if (EXTENSION_SETS.image.has(ext)) return 'image';
  if (['docx', 'doc'].includes(ext)) return 'word';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet';
  if (ext === 'md') return 'markdown';
  return 'text';
}

/**
 * Get pipeline label for file type
 * @param {string} filename
 * @returns {string} Human readable processing pipeline description
 */
export function getPipelineLabel(filename) {
  const ext = getExtension(filename);
  if (ext === 'pdf') return 'Vision + Text extraction';
  if (EXTENSION_SETS.image.has(ext)) return 'Vision tiles';
  if (ext === 'dwg') return 'Blueprint storage';
  if (EXTENSION_SETS.document.has(ext) || EXTENSION_SETS.spreadsheet.has(ext)) return 'Text extraction';
  return 'Storage';
}

/**
 * Validate file for upload
 * @param {File} file
 * @param {Object} options
 * @param {Set<string>} options.allowedExtensions - Set of allowed extensions
 * @param {number} options.maxSize - Max size in bytes
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFile(file, options = {}) {
  const { 
    allowedExtensions = EXTENSION_SETS.blueprint,
    maxSize = MAX_FILE_SIZE 
  } = options;

  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `File too large (${sizeMB}MB). Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB.` 
    };
  }

  // Check file is not empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check extension
  const ext = getExtension(file.name);
  if (!allowedExtensions.has(ext)) {
    const acceptedList = [...allowedExtensions].join(', ');
    return { 
      valid: false, 
      error: `Unsupported file type ".${ext}". Accepted: ${acceptedList}` 
    };
  }

  return { valid: true };
}

/**
 * Detect if PDF is likely scanned based on heuristics
 * @param {File} file
 * @returns {boolean}
 */
export function isLikelyScannedPDF(file) {
  return file.size > 1024 * 1024 && file.type === 'application/pdf';
}

/**
 * Generate unique ID for file queue items
 * @param {string} prefix
 * @returns {string}
 */
export function generateFileId(prefix = 'file') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
