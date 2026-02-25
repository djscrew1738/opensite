import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2, FileWarning, Eye } from 'lucide-react';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB — matches backend multer limit
const ALLOWED_TYPES = ['.pdf'];
const ALLOWED_MIME_TYPES = ['application/pdf'];

// Error message helper with suggestions
const getErrorDetails = (errorType, details = {}) => {
  const errors = {
    FILE_TOO_LARGE: {
      title: 'File Too Large',
      message: `File size exceeds 100MB limit (${details.size}MB).`,
      suggestions: [
        'Compress the PDF using a tool like Smallpdf or Adobe Acrobat',
        'Remove unnecessary pages from the blueprint',
        'Reduce image quality if the PDF contains images',
        'Split the blueprint into multiple smaller PDFs'
      ]
    },
    INVALID_TYPE: {
      title: 'Invalid File Type',
      message: `Only PDF files are supported.`,
      suggestions: [
        'Convert your file to PDF format',
        'For images (JPG/PNG), convert to PDF first',
        'For CAD files (.dwg, .dxf), export as PDF from your CAD software'
      ]
    },
    CORRUPT_FILE: {
      title: 'Corrupted File',
      message: 'The PDF file appears to be corrupted or invalid.',
      suggestions: [
        'Try opening the file in a PDF reader to verify it works',
        'Re-export the PDF from the original source',
        'Use a PDF repair tool to fix the file'
      ]
    },
    ENCRYPTED_FILE: {
      title: 'Password Protected',
      message: 'The PDF is password protected and cannot be processed.',
      suggestions: [
        'Remove the password protection from the PDF',
        'Save a copy without password protection',
        'Use "Print to PDF" to create an unprotected copy'
      ]
    },
    SCANNED_PDF: {
      title: 'Scanned PDF Detected',
      message: 'This appears to be a scanned image PDF.',
      suggestions: [
        'Text extraction may be limited - please verify all data',
        'Consider using OCR software to make the PDF searchable first',
        'Manual data entry may be required for best results'
      ]
    },
    EMPTY_FILE: {
      title: 'Empty File',
      message: 'The PDF contains no extractable content.',
      suggestions: [
        'Verify the PDF is not blank',
        'Check if the PDF contains only images/scans',
        'Try a different PDF file'
      ]
    }
  };
  
  return errors[errorType] || {
    title: 'Upload Error',
    message: details.message || 'An unexpected error occurred.',
    suggestions: ['Please try again or contact support if the problem persists.']
  };
};

export default function FileDropzone({ 
  onFileSelect, 
  onFileRemove,
  selectedFile,
  disabled = false,
  showPreview = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const validateFile = async (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        type: 'FILE_TOO_LARGE',
        details: { size: (file.size / 1024 / 1024).toFixed(1) }
      };
    }

    // Check file extension
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      return { type: 'INVALID_TYPE' };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      // Allow if extension matches even if MIME type doesn't
      if (!ALLOWED_TYPES.includes(ext)) {
        return { type: 'INVALID_TYPE' };
      }
    }

    // Check if file is empty
    if (file.size === 0) {
      return { type: 'EMPTY_FILE' };
    }

    // Try to detect if it's a scanned PDF
    // This is a heuristic - we'll check file size patterns
    // Scanned PDFs are typically larger and have different size ratios
    const isLikelyScanned = file.size > 1024 * 1024 && file.type === 'application/pdf';
    
    return { 
      type: null, 
      isLikelyScanned,
      warning: isLikelyScanned ? 'SCANNED_PDF' : null
    };
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (disabled) return;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    setError(null);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const validation = await validateFile(files[0]);
    if (validation.type) {
      setError(validation);
      return;
    }
    
    if (validation.warning && !error) {
      // Show warning but still allow
      setError({ ...validation, isWarning: true });
    }
    
    onFileSelect(files[0]);
  }, [disabled, onFileSelect, error]);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    const validation = await validateFile(files[0]);
    
    if (validation.type) {
      setError(validation);
      return;
    }
    
    onFileSelect(files[0]);
  }, [onFileSelect]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const clearError = () => {
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get error/warning display
  const getAlertDisplay = () => {
    if (!error) return null;
    
    const isWarning = error.isWarning;
    const errorInfo = getErrorDetails(error.type || error.warning, error.details || {});
    
    return (
      <div className={`
        flex items-start gap-3 p-4 rounded-lg mb-3 animate-in slide-in-from-top-2
        ${isWarning 
          ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' 
          : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
        }
      `}>
        {isWarning ? (
          <FileWarning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${isWarning ? 'text-amber-900 dark:text-amber-300' : 'text-red-900 dark:text-red-300'}`}>
            {errorInfo.title}
          </h4>
          <p className={`text-sm mt-0.5 ${isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
            {errorInfo.message}
          </p>
          {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
            <div className="mt-2">
              <p className={`text-xs font-medium ${isWarning ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-300'}`}>
                Suggestions:
              </p>
              <ul className={`text-xs mt-1 space-y-0.5 ${isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                {errorInfo.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {!isWarning && (
          <button 
            onClick={clearError}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (selectedFile) {
    return (
      <div className="space-y-3">
        {getAlertDisplay()}
        
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFileRemove?.(); clearError(); }}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {getAlertDisplay()}
      
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-out
          ${disabled 
            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed' 
            : isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.02]' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        <div className={`
          w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
          transition-all duration-200
          ${isDragging ? 'bg-blue-100 dark:bg-blue-900/50 scale-110' : 'bg-gray-100 dark:bg-gray-800'}
        `}>
          <Upload className={`w-8 h-8 transition-colors duration-200 ${
            isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
          }`} />
        </div>
        <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
          {isDragging ? (
            'Drop file here'
          ) : (
            <>
              <span className="text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
            </>
          )}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          PDF files up to 50MB
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Supports: Text-based PDFs • Scanned PDFs (limited)
        </p>
        {isDragging && <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl pointer-events-none" />}
      </div>
    </div>
  );
}
