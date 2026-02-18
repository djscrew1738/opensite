import { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { visionApi } from '../../api/vision';

export default function VisionUpload({ onProjectCreated }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await visionApi.upload(file);
      setJobId(result.jobId);
      setProgress(10);

      // Poll for tile generation completion
      pollRef.current = setInterval(async () => {
        try {
          const status = await visionApi.getJobStatus(result.jobId);
          setProgress(status.progress || 0);

          if (status.status === 'completed') {
            clearInterval(pollRef.current);
            setUploading(false);
            setProgress(100);
            if (onProjectCreated) onProjectCreated(result.projectId);
          } else if (status.status === 'failed') {
            clearInterval(pollRef.current);
            setUploading(false);
            setError(status.error || 'Tile generation failed');
          }
        } catch (err) {
          // Polling error — keep trying
        }
      }, 1500);
    } catch (err) {
      setUploading(false);
      setError(err.message);
    }
  }, [onProjectCreated]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          w-full max-w-lg rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-300
          ${dragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 scale-[1.02]'
            : 'border-surface-300 dark:border-gray-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-gray-800/50'
          }
          ${uploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.tiff,.tif,.webp,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 mx-auto animate-spin" />
            <div>
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                Generating deep-zoom tiles...
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {progress}% complete
              </p>
            </div>
            <div className="w-full bg-surface-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
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

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
