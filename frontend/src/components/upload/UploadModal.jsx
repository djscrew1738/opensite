/**
 * UploadModal Component
 * Modal for uploading files with job linking
 * 
 * @module components/upload/UploadModal
 */

import { useState, useEffect, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Link2 } from 'lucide-react';
import { api } from '../../api/client';
import { useUniversalUpload } from '../../hooks/useUniversalUpload';
import UploadDropzone from './UploadDropzone';
import FileQueueItem from './FileQueueItem';
import { colors } from '../../styles/tokens';

/**
 * UploadModal - File upload modal with job linking
 * 
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   jobId?: string | null
 * }} props
 */
const UploadModal = memo(function UploadModal({ isOpen, onClose, jobId: initialJobId = null }) {
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);

  const {
    queue, addFiles, removeFile, retryFile, clearCompleted,
    isUploading, completedCount, errorCount
  } = useUniversalUpload({
    jobId: selectedJobId,
    onComplete: () => {},
  });

  // Fetch jobs for the linker dropdown
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.projects.getAll(),
    enabled: isOpen,
  });

  // Update jobId when prop changes
  useEffect(() => {
    if (initialJobId) setSelectedJobId(initialJobId);
  }, [initialJobId]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2
                   sm:w-full sm:max-w-lg z-50
                   flex flex-col max-h-[80vh]"
        style={{
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${colors.border.default}` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.accent.muted }}
            >
              <Upload className="w-5 h-5" style={{ color: colors.accent.DEFAULT }} />
            </div>
            <div>
              <h2 
                id="upload-modal-title"
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                Upload Files
              </h2>
              {queue.length > 0 && (
                <p 
                  className="text-xs"
                  style={{ color: colors.text.muted }}
                >
                  {queue.length} file{queue.length !== 1 ? 's' : ''}
                  {completedCount > 0 && ` · ${completedCount} done`}
                  {errorCount > 0 && ` · ${errorCount} failed`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: colors.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surface.elevated;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.muted;
            }}
            aria-label="Close upload modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Dropzone */}
          <UploadDropzone onFiles={addFiles} />

          {/* Job Linker */}
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 shrink-0" style={{ color: colors.text.muted }} />
            <select
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{
                backgroundColor: colors.surface.primary,
                border: `1px solid ${colors.border.strong}`,
                color: colors.text.primary,
              }}
            >
              <option value="">No job linked</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.name}</option>
              ))}
            </select>
          </div>

          {/* File Queue */}
          {queue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p 
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: colors.text.muted }}
                >
                  Queue ({queue.length})
                </p>
                {completedCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="text-xs transition-colors"
                    style={{ color: colors.text.muted }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.text.muted;
                    }}
                  >
                    Clear done
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {queue.map(item => (
                    <FileQueueItem
                      key={item.id}
                      item={item}
                      onRemove={removeFile}
                      onRetry={retryFile}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${colors.border.default}` }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ color: colors.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surface.elevated;
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            {isUploading ? 'Minimize' : 'Close'}
          </button>
          <div className="flex items-center gap-2">
            {isUploading && (
              <span 
                className="text-xs flex items-center gap-1.5"
                style={{ color: colors.accent.DEFAULT }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
});

UploadModal.displayName = 'UploadModal';

export default UploadModal;
