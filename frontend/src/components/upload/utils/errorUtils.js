/**
 * Upload Error Utilities
 * Error messages, types, and display helpers for file uploads
 */

export const ERROR_TYPES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_TYPE: 'INVALID_TYPE',
  CORRUPT_FILE: 'CORRUPT_FILE',
  ENCRYPTED_FILE: 'ENCRYPTED_FILE',
  SCANNED_PDF: 'SCANNED_PDF',
  EMPTY_FILE: 'EMPTY_FILE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
};

/**
 * Error details with user-friendly messages and suggestions
 */
export const ERROR_DETAILS = {
  [ERROR_TYPES.FILE_TOO_LARGE]: {
    title: 'File Too Large',
    getMessage: (details) => `File size exceeds 100MB limit (${details?.size || 'unknown'}).`,
    suggestions: [
      'Compress the PDF using a tool like Smallpdf or Adobe Acrobat',
      'Remove unnecessary pages from the blueprint',
      'Reduce image quality if the PDF contains images',
      'Split the blueprint into multiple smaller PDFs'
    ]
  },
  [ERROR_TYPES.INVALID_TYPE]: {
    title: 'Invalid File Type',
    message: 'Only PDF files are supported.',
    suggestions: [
      'Convert your file to PDF format',
      'For images (JPG/PNG), convert to PDF first',
      'For CAD files (.dwg, .dxf), export as PDF from your CAD software'
    ]
  },
  [ERROR_TYPES.CORRUPT_FILE]: {
    title: 'Corrupted File',
    message: 'The PDF file appears to be corrupted or invalid.',
    suggestions: [
      'Try opening the file in a PDF reader to verify it works',
      'Re-export the PDF from the original source',
      'Use a PDF repair tool to fix the file'
    ]
  },
  [ERROR_TYPES.ENCRYPTED_FILE]: {
    title: 'Password Protected',
    message: 'The PDF is password protected and cannot be processed.',
    suggestions: [
      'Remove the password protection from the PDF',
      'Save a copy without password protection',
      'Use "Print to PDF" to create an unprotected copy'
    ]
  },
  [ERROR_TYPES.SCANNED_PDF]: {
    title: 'Scanned PDF Detected',
    message: 'This appears to be a scanned image PDF.',
    suggestions: [
      'Text extraction may be limited - please verify all data',
      'Consider using OCR software to make the PDF searchable first',
      'Manual data entry may be required for best results'
    ]
  },
  [ERROR_TYPES.EMPTY_FILE]: {
    title: 'Empty File',
    message: 'The PDF contains no extractable content.',
    suggestions: [
      'Verify the PDF is not blank',
      'Check if the PDF contains only images/scans',
      'Try a different PDF file'
    ]
  },
  [ERROR_TYPES.UPLOAD_FAILED]: {
    title: 'Upload Failed',
    message: 'Failed to upload file. Please try again.',
    suggestions: [
      'Check your internet connection',
      'Try uploading a smaller file',
      'Refresh the page and try again'
    ]
  },
  [ERROR_TYPES.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Connection lost during upload.',
    suggestions: [
      'Check your internet connection',
      'Try again when connection is stable',
      'Refresh the page if problem persists'
    ]
  },
  [ERROR_TYPES.SERVER_ERROR]: {
    title: 'Server Error',
    message: 'Server encountered an error processing your file.',
    suggestions: [
      'Try again in a few minutes',
      'Contact support if the problem persists',
      'Try with a different file'
    ]
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The operation took too long to complete.',
    suggestions: [
      'Try again with a smaller file',
      'Check your connection speed',
      'Try during off-peak hours'
    ]
  }
};

/**
 * Get error details for display
 * @param {string} errorType - One of ERROR_TYPES
 * @param {Object} details - Additional error details
 * @returns {Object} Error display info with title, message, suggestions
 */
export function getErrorDetails(errorType, details = {}) {
  const error = ERROR_DETAILS[errorType];
  
  if (!error) {
    return {
      title: 'Upload Error',
      message: details?.message || 'An unexpected error occurred.',
      suggestions: ['Please try again or contact support if the problem persists.']
    };
  }

  return {
    title: error.title,
    message: error.getMessage ? error.getMessage(details) : error.message,
    suggestions: error.suggestions
  };
}

/**
 * Parse HTTP error response to error type
 * @param {Error} error
 * @param {number} status - HTTP status code
 * @returns {string} ERROR_TYPES value
 */
export function parseErrorType(error, status) {
  const message = error?.message?.toLowerCase() || '';
  
  if (status === 413 || message.includes('413')) {
    return ERROR_TYPES.FILE_TOO_LARGE;
  }
  if (status === 400) {
    if (message.includes('password') || message.includes('encrypted')) {
      return ERROR_TYPES.ENCRYPTED_FILE;
    }
    if (message.includes('corrupt') || message.includes('invalid')) {
      return ERROR_TYPES.CORRUPT_FILE;
    }
    return ERROR_TYPES.INVALID_TYPE;
  }
  if (status === 500) {
    return ERROR_TYPES.SERVER_ERROR;
  }
  if (status === 504 || message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  }
  if (message.includes('network') || !navigator.onLine) {
    return ERROR_TYPES.NETWORK_ERROR;
  }
  
  return ERROR_TYPES.UPLOAD_FAILED;
}

/**
 * Create error object for component state
 * @param {string} type - ERROR_TYPES value
 * @param {Object} details - Additional details
 * @param {boolean} isWarning - Whether this is a warning (non-blocking)
 * @returns {Object}
 */
export function createError(type, details = {}, isWarning = false) {
  return {
    type,
    details,
    isWarning,
    timestamp: Date.now()
  };
}
