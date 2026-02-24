import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, X, AlertCircle } from 'lucide-react';

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.csv,.md,.html,.json,.xml';
const ACCEPTED_SET = new Set(['pdf', 'docx', 'txt', 'csv', 'md', 'html', 'json', 'xml']);

/**
 * DocUpload — Drag-and-drop upload zone for text documents.
 * Dark Forge design system. Compact layout for sidebar placement.
 *
 * @param {Function} onUpload - Called with the selected File object
 * @param {boolean}  disabled - Disables all interaction when true
 */
export default function DocUpload({ onUpload, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // ── Helpers ──────────────────────────────────────────────

  const getExtension = (filename) => {
    const dot = filename.lastIndexOf('.');
    return dot !== -1 ? filename.slice(dot + 1).toLowerCase() : '';
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // ── File handling ────────────────────────────────────────

  const processFile = useCallback(async (file) => {
    if (!file) return;

    // Validate extension
    const ext = getExtension(file.name);
    if (!ACCEPTED_SET.has(ext)) {
      setError(`Unsupported file type ".${ext}". Accepted: ${[...ACCEPTED_SET].join(', ')}`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      await onUpload(file);
    } catch (err) {
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  // ── Drag handlers (counter pattern for nested elements) ─

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, uploading, processFile]);

  // ── Click to browse ─────────────────────────────────────

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFile(files[0]);
    }
    // Reset so the same file can be re-selected
    e.target.value = '';
  }, [processFile]);

  // ── Styles ──────────────────────────────────────────────

  const zoneStyle = {
    background: isDragging
      ? 'rgba(59, 130, 246, 0.06)'
      : 'transparent',
    borderColor: isDragging
      ? '#3B82F6'
      : '#1F2430',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderRadius: '12px',
    transition: 'all 200ms ease',
    cursor: disabled || uploading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={zoneStyle}
        className="relative px-4 py-5 text-center select-none"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {uploading ? (
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
                background: isDragging
                  ? 'rgba(59, 130, 246, 0.15)'
                  : '#181C24',
                transition: 'background 200ms ease',
              }}
            >
              {isDragging ? (
                <FileText className="w-5 h-5" style={{ color: '#3B82F6' }} />
              ) : (
                <Upload className="w-5 h-5" style={{ color: '#94A3B8' }} />
              )}
            </div>

            <div>
              <p className="text-sm" style={{ color: '#F1F5F9' }}>
                {isDragging ? (
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
        {isDragging && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'rgba(59, 130, 246, 0.04)' }}
          />
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            style={{ color: '#EF4444' }}
          />
          <p
            className="text-xs flex-1 leading-relaxed"
            style={{ color: '#F87171' }}
          >
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 p-0.5 rounded hover:opacity-80 transition-opacity"
            style={{ color: '#EF4444' }}
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
