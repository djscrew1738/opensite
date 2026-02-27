import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import { 
  formatFileSize, 
  validateFile, 
  EXTENSION_SETS,
  MAX_FILE_SIZE 
} from '../upload/utils';
import { CompactErrorDisplay } from '../upload/ErrorDisplay';

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.csv,.md,.html,.json,.xml';
const ACCEPTED_SET = EXTENSION_SETS.document;

/**
 * DocUpload Component
 * Drag-and-drop upload zone for text documents.
 * Dark Forge design system. Compact layout for sidebar placement.
 * 
 * @param {Function} onUpload - Called with the selected File object
 * @param {boolean} disabled - Disables all interaction when true
 */
export default function DocUpload({ onUpload, disabled = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const processFile = useCallback(async (file) => {
    // Validate file
    const validation = validateFile(file, {
      allowedExtensions: ACCEPTED_SET,
      maxSize: MAX_FILE_SIZE
    });

    if (!validation.valid) {
      setError({ type: 'UPLOAD_FAILED', details: { message: validation.error } });
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      await onUpload(file);
    } catch (err) {
      setError({ 
        type: 'UPLOAD_FAILED', 
        details: { message: err?.message || 'Upload failed. Please try again.' }
      });
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const handleFiles = useCallback((files) => {
    if (files.length > 0) {
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

  const handleDismissError = () => setError(null);

  const isActive = dragDrop.isDragging && !disabled && !isUploading;

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onClick={fileInput.handlers.onClick}
        onDragEnter={dragDrop.handlers.onDragEnter}
        onDragLeave={dragDrop.handlers.onDragLeave}
        onDragOver={dragDrop.handlers.onDragOver}
        onDrop={dragDrop.handlers.onDrop}
        style={{
          background: isActive ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
          borderColor: isActive ? '#3B82F6' : '#1F2430',
          borderWidth: '2px',
          borderStyle: 'dashed',
          borderRadius: '12px',
          transition: 'all 200ms ease',
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        className="relative px-4 py-5 text-center select-none"
      >
        <input
          ref={fileInput.inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={fileInput.handlers.onChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          /* Uploading state */
          <div className="flex flex-col items-center gap-2">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: '#3B82F6' }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: '#F1F5F9' }}
            >
              Uploading...
            </p>
            <p
              className="text-xs"
              style={{ color: '#94A3B8' }}
            >
              Please wait while your document is processed
            </p>
          </div>
        ) : (
          /* Default / drag state */
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : '#181C24',
                transition: 'background 200ms ease',
              }}
            >
              {isActive ? (
                <FileText className="w-5 h-5" style={{ color: '#3B82F6' }} />
              ) : (
                <Upload className="w-5 h-5" style={{ color: '#94A3B8' }} />
              )}
            </div>

            <div>
              <p className="text-sm" style={{ color: '#F1F5F9' }}>
                {isActive ? (
                  <span style={{ color: '#3B82F6', fontWeight: 600 }}>
                    Drop file here
                  </span>
                ) : (
                  <>
                    <span style={{ color: '#3B82F6', fontWeight: 600 }}>
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </>
                )}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: '#64748B' }}
              >
                PDF, DOCX, TXT, CSV, MD, HTML, JSON, XML
              </p>
            </div>
          </div>
        )}

        {/* Blue overlay shimmer on drag */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'rgba(59, 130, 246, 0.04)' }}
          />
        )}
      </div>

      {/* Error state */}
      {error && (
        <CompactErrorDisplay error={error} onDismiss={handleDismissError} />
      )}
    </div>
  );
}
