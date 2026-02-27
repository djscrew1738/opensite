import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { useFileSelection } from '../../hooks/upload/useDragDrop';
import { 
  formatFileSize, 
  isLikelyScannedPDF, 
  createError,
  EXTENSION_SETS,
  MAX_FILE_SIZE
} from './utils';
import ErrorDisplay from './ErrorDisplay';

const ALLOWED_TYPES = ['.pdf'];
const ALLOWED_MIME_TYPES = ['application/pdf'];

/**
 * Validates a file and returns validation result
 */
async function validateFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: createError('FILE_TOO_LARGE', { 
        size: (file.size / 1024 / 1024).toFixed(1) 
      })
    };
  }

  // Check file extension
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_TYPES.includes(ext)) {
    return { 
      valid: false, 
      error: createError('INVALID_TYPE')
    };
  }

  // Check MIME type (allow if extension matches even if MIME type doesn't)
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !ALLOWED_TYPES.includes(ext)) {
    return { 
      valid: false, 
      error: createError('INVALID_TYPE')
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { 
      valid: false, 
      error: createError('EMPTY_FILE')
    };
  }

  // Detect scanned PDF warning
  const isLikelyScanned = isLikelyScannedPDF(file);

  return { 
    valid: true, 
    isLikelyScanned,
    warning: isLikelyScanned ? createError('SCANNED_PDF', {}, true) : null
  };
}

/**
 * FileDropzone Component
 * Drag-and-drop file upload with validation
 */
export default function FileDropzone({ 
  onFileSelect, 
  onFileRemove,
  selectedFile,
  disabled = false,
  showPreview = false
}) {
  const [error, setError] = useState(null);

  const handleFiles = useCallback(async (files) => {
    if (files.length === 0) return;

    setError(null);
    const validation = await validateFile(files[0]);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (validation.warning) {
      setError(validation.warning);
    }

    onFileSelect(files[0]);
  }, [onFileSelect]);

  const { isDragging, inputRef, handlers } = useFileSelection({
    disabled,
    onFilesSelected: handleFiles
  });

  const handleDismissError = () => setError(null);

  const handleRemoveFile = (e) => {
    e?.stopPropagation();
    onFileRemove?.();
    setError(null);
  };

  // Selected file display
  if (selectedFile) {
    return (
      <div className="space-y-3">
        <ErrorDisplay error={error} onDismiss={handleDismissError} />
        
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
                onClick={handleRemoveFile}
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

  // Dropzone display
  return (
    <div className="space-y-3">
      <ErrorDisplay error={error} onDismiss={handleDismissError} />
      
      <div
        onClick={handlers.onClick}
        onDragEnter={handlers.onDragEnter}
        onDragLeave={handlers.onDragLeave}
        onDragOver={handlers.onDragOver}
        onDrop={handlers.onDrop}
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
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handlers.onInputChange}
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
          PDF files up to 100MB
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Supports: Text-based PDFs • Scanned PDFs (limited)
        </p>
        
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl pointer-events-none" />
        )}
      </div>
    </div>
  );
}
