import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import { 
  formatFileSize, 
  validateFile, 
  EXTENSION_SETS,
  MAX_FILE_SIZE 
} from '../upload/utils';
import { CompactErrorDisplay } from '../upload/ErrorDisplay';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.csv,.md,.html,.json,.xml';
const ACCEPTED_SET = EXTENSION_SETS.document;

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Upload icon with dynamic state
 */
const UploadIcon = memo(function UploadIcon({ isActive, isUploading }) {
  if (isUploading) {
    return (
      <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
    );
  }

  return (
    <div
      className={`
        w-10 h-10 rounded-xl flex items-center justify-center transition-colors
        ${isActive ? 'bg-accent-500/15' : 'bg-surface-800'}
      `}
    >
      {isActive ? (
        <FileText className="w-5 h-5 text-accent-500" />
      ) : (
        <Upload className="w-5 h-5 text-surface-400" />
      )}
    </div>
  );
});

UploadIcon.propTypes = {
  isActive: PropTypes.bool.isRequired,
  isUploading: PropTypes.bool.isRequired,
};

/**
 * Upload text content
 */
const UploadText = memo(function UploadText({ isActive, isUploading }) {
  if (isUploading) {
    return (
      <>
        <p className="text-sm font-medium text-surface-100">
          Uploading...
        </p>
        <p className="text-xs text-surface-400">
          Please wait while your document is processed
        </p>
      </>
    );
  }

  return (
    <div>
      <p className="text-sm text-surface-100">
        {isActive ? (
          <span className="text-accent-500 font-semibold">
            Drop file here
          </span>
        ) : (
          <>
            <span className="text-accent-500 font-semibold">
              Click to upload
            </span>{' '}
            or drag and drop
          </>
        )}
      </p>
      <p className="text-xs mt-1 text-surface-500">
        PDF, DOCX, TXT, CSV, MD, HTML, JSON, XML
      </p>
    </div>
  );
});

UploadText.propTypes = {
  isActive: PropTypes.bool.isRequired,
  isUploading: PropTypes.bool.isRequired,
};

/**
 * Drop zone overlay for active drag state
 */
const DropOverlay = memo(function DropOverlay() {
  return (
    <div className="absolute inset-0 rounded-xl pointer-events-none bg-accent-500/5" />
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DocUpload Component
 * Drag-and-drop upload zone for text documents.
 * Dark Forge design system. Compact layout for sidebar placement.
 * 
 * @param {Object} props
 * @param {Function} props.onUpload - Called with the selected File object
 * @param {boolean} props.disabled - Disables all interaction when true
 */
function DocUpload({ onUpload, disabled = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const processFile = useCallback(async (file) => {
    // Validate file
    const validation = validateFile(file, {
      allowedExtensions: ACCEPTED_SET,
      maxSize: MAX_FILE_SIZE
    });

    if (!validation.valid) {
      setError({ 
        type: 'UPLOAD_FAILED', 
        details: { message: validation.error },
        isWarning: false 
      });
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      await onUpload(file);
    } catch (err) {
      setError({ 
        type: 'UPLOAD_FAILED', 
        details: { message: err?.message || 'Upload failed. Please try again.' },
        isWarning: false
      });
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const handleFiles = useCallback((files) => {
    if (files.length > 0) {
      // Only process the first file for single-file upload
      processFile(files[0]);
    }
  }, [processFile]);

  const dragDrop = useDragDrop({ 
    disabled: disabled || isUploading, 
    onDrop: handleFiles 
  });

  const fileInput = useFileInput({
    disabled: disabled || isUploading,
    onSelect: handleFiles
  });

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  const isActive = dragDrop.isDragging && !disabled && !isUploading;
  const isInteractionDisabled = disabled || isUploading;

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onClick={fileInput.handlers.onClick}
        onDragEnter={dragDrop.handlers.onDragEnter}
        onDragLeave={dragDrop.handlers.onDragLeave}
        onDragOver={dragDrop.handlers.onDragOver}
        onDrop={dragDrop.handlers.onDrop}
        className={`
          relative px-4 py-5 text-center select-none rounded-xl
          border-2 border-dashed transition-all duration-200
          ${isActive 
            ? 'bg-accent-500/5 border-accent-500' 
            : 'bg-transparent border-surface-700 hover:border-surface-600'
          }
          ${isInteractionDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        role="button"
        tabIndex={isInteractionDisabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.handlers.onClick();
          }
        }}
        aria-label="Upload document"
        aria-disabled={isInteractionDisabled}
      >
        <input
          ref={fileInput.inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={fileInput.handlers.onChange}
          disabled={isInteractionDisabled}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-2">
          <UploadIcon isActive={isActive} isUploading={isUploading} />
          <UploadText isActive={isActive} isUploading={isUploading} />
        </div>

        {/* Blue overlay on drag */}
        {isActive && <DropOverlay />}
      </div>

      {/* Error state */}
      {error && (
        <CompactErrorDisplay error={error} onDismiss={handleDismissError} />
      )}
    </div>
  );
}

DocUpload.propTypes = {
  onUpload: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

DocUpload.defaultProps = {
  disabled: false,
};

export default DocUpload;
