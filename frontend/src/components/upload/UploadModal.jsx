import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Link2 } from 'lucide-react';
import { api } from '../../api/client';
import { useUniversalUpload } from '../../hooks/useUniversalUpload';
import UploadDropzone from './UploadDropzone';
import FileQueueItem from './FileQueueItem';

export default function UploadModal({ isOpen, onClose, jobId: initialJobId = null }) {
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
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2
                   sm:w-full sm:max-w-lg z-50
                   bg-[#111318] border border-[#1F2430] rounded-2xl shadow-2xl
                   flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2430]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Upload Files</h2>
              {queue.length > 0 && (
                <p className="text-xs text-[#64748B]">
                  {queue.length} file{queue.length !== 1 ? 's' : ''}
                  {completedCount > 0 && ` · ${completedCount} done`}
                  {errorCount > 0 && ` · ${errorCount} failed`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#181C24] transition-colors"
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
            <Link2 className="w-4 h-4 text-[#64748B] shrink-0" />
            <select
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-[#0F1117] border border-[#2D3548] text-[#F1F5F9] outline-none cursor-pointer"
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
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Queue ({queue.length})
                </p>
                {completedCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="text-xs text-[#64748B] hover:text-[#F1F5F9] transition-colors"
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
        <div className="px-5 py-4 border-t border-[#1F2430] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#181C24] transition-colors"
          >
            {isUploading ? 'Minimize' : 'Close'}
          </button>
          <div className="flex items-center gap-2">
            {isUploading && (
              <span className="text-xs text-[#3B82F6] flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
