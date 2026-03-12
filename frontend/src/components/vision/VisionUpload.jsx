import { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, Loader2, AlertCircle } from 'lucide-react';
import { useVisionUpload } from '../../hooks/upload/useJobPolling';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import { MAX_FILE_SIZE, EXTENSION_SETS } from '../upload/utils';
import { visionApi } from '../../api/vision';

const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.tiff,.tif,.webp,.pdf';
const VISION_EXTENSIONS = new Set([...EXTENSION_SETS.image, 'pdf']);

/**
 * Validates file for vision upload
 */
function validateVisionFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  if (!VISION_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Invalid file type. Supported: PNG, JPG, TIFF, WebP, PDF' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 100MB.' };
  }
  
  return { valid: true };
}

/**
 * VisionUpload Component
 * Upload component for vision/deep-zoom tile generation
 */
export default function VisionUpload({ onProjectCreated }) {
  const [localError, setLocalError] = useState(null);
  const fileInputRef = useRef(null);

  const handleComplete = useCallback((result, status) => {
    if (status?.projectId && onProjectCreated) {
      onProjectCreated(status.projectId);
    }
  }, [onProjectCreated]);

  const handleError = useCallback((type, error) => {
    setLocalError(error);
  }, []);

  const upload = useVisionUpload({
    uploadApi: visionApi.upload,
    statusApi: visionApi.getJobStatus,
    onComplete: handleComplete,
    onError: handleError
  });

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validation = validateVisionFile(file);
    if (!validation.valid) {
      setLocalError(validation.error);
      return;
    }

    setLocalError(null);
    
    try {
      await upload.actions.upload(file);
    } catch (err) {
      // Error is handled by onError callback
    }
  }, [upload.actions]);

  const dragDrop = useDragDrop({ onDrop: handleFiles });
  const fileInput = useFileInput({ onSelect: handleFiles });

  const isProcessing = upload.uploading || upload.progress > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div
        onDrop={dragDrop.handlers.onDrop}
        onDragOver={dragDrop.handlers.onDragOver}
        onDragLeave={dragDrop.handlers.onDragLeave}
        onClick={fileInput.handlers.onClick}
        className={`
          w-full max-w-lg rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-300
          ${dragDrop.isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 scale-[1.02]'
            : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-800/50'
          }
          ${isProcessing ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInput.inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={fileInput.handlers.onChange}
        />

        {isProcessing ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 mx-auto animate-spin" />
            <div>
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                Generating deep-zoom tiles...
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {upload.progress}% complete
              </p>
            </div>
            <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto">
              <FileImage className="w-8 h-8 text-surface-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                Drop a blueprint here
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                PNG, JPG, TIFF, WebP, or PDF — up to 100MB
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Browse Files
            </button>
          </div>
        )}
      </div>

      {(localError || upload.error) && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {localError || upload.error}
        </div>
      )}
    </div>
  );
}
