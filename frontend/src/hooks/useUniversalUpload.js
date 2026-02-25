import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '../api/upload';

const MAX_CONCURRENT = 3;

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp', 'dwg',
  'docx', 'doc', 'txt', 'md', 'csv', 'html', 'htm', 'json', 'xml',
  'xlsx', 'xls'
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Category detection (mirrors backend)
function categorizeFile(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']);
  const docExts = new Set(['docx', 'doc', 'txt', 'md', 'csv', 'html', 'htm', 'json', 'xml', 'xlsx', 'xls']);
  if (ext === 'pdf') return 'blueprint';
  if (imageExts.has(ext)) return 'image';
  if (ext === 'dwg') return 'blueprint';
  if (docExts.has(ext)) return 'document';
  return 'other';
}

function getFileIcon(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']);
  if (ext === 'pdf') return 'pdf';
  if (imageExts.has(ext)) return 'image';
  if (['docx', 'doc'].includes(ext)) return 'word';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet';
  if (ext === 'md') return 'markdown';
  return 'text';
}

function getPipelineLabel(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp']);
  const docExts = new Set(['docx', 'doc', 'txt', 'md', 'csv', 'html', 'htm', 'json', 'xml', 'xlsx', 'xls']);
  if (ext === 'pdf') return 'Vision + Text extraction';
  if (imageExts.has(ext)) return 'Vision tiles';
  if (ext === 'dwg') return 'Blueprint storage';
  if (docExts.has(ext)) return 'Text extraction';
  return 'Storage';
}

/**
 * Queue states: 'queued' | 'uploading' | 'processing' | 'complete' | 'error'
 */
export function useUniversalUpload({ jobId = null, onComplete } = {}) {
  const [queue, setQueue] = useState([]);
  const activeCount = useRef(0);
  const queryClient = useQueryClient();

  const validateFile = useCallback((file) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) return `Unsupported type: .${ext}`;
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 100MB limit';
    return null;
  }, []);

  const processQueue = useCallback(() => {
    setQueue(prev => {
      const queued = prev.filter(f => f.status === 'queued');
      const slotsAvailable = MAX_CONCURRENT - activeCount.current;
      if (slotsAvailable <= 0 || queued.length === 0) return prev;

      const toStart = queued.slice(0, slotsAvailable);
      const updated = prev.map(f => {
        if (toStart.find(s => s.id === f.id)) {
          return { ...f, status: 'uploading', progress: 0 };
        }
        return f;
      });

      // Fire uploads for each file
      toStart.forEach(item => {
        activeCount.current++;
        uploadApi.upload([item.file], {
          jobId,
          onProgress: (percent) => {
            setQueue(q => q.map(f => f.id === item.id ? { ...f, progress: percent } : f));
          },
        })
        .then((result) => {
          const uploadResult = result?.uploads?.[0];
          setQueue(q => q.map(f => f.id === item.id ? {
            ...f,
            status: 'complete',
            progress: 100,
            serverId: uploadResult?.id,
          } : f));
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['universal-files'] });
          queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
          queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
          if (jobId) queryClient.invalidateQueries({ queryKey: ['job-files', jobId] });
          onComplete?.();
        })
        .catch((err) => {
          setQueue(q => q.map(f => f.id === item.id ? {
            ...f,
            status: 'error',
            error: err?.response?.data?.error || err.message || 'Upload failed',
          } : f));
        })
        .finally(() => {
          activeCount.current--;
          // Trigger next batch
          setTimeout(() => processQueue(), 50);
        });
      });

      return updated;
    });
  }, [jobId, queryClient, onComplete]);

  const addFiles = useCallback((files) => {
    const newItems = Array.from(files).map(file => {
      const error = validateFile(file);
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        size: file.size,
        category: categorizeFile(file.name),
        icon: getFileIcon(file.name),
        pipeline: getPipelineLabel(file.name),
        status: error ? 'error' : 'queued',
        error: error || null,
        progress: 0,
        serverId: null,
      };
    });

    setQueue(prev => [...prev, ...newItems]);
    // Trigger processing after state update
    setTimeout(() => processQueue(), 50);
    return newItems;
  }, [validateFile, processQueue]);

  const removeFile = useCallback((id) => {
    setQueue(prev => prev.filter(f => f.id !== id));
  }, []);

  const retryFile = useCallback((id) => {
    setQueue(prev => prev.map(f =>
      f.id === id ? { ...f, status: 'queued', error: null, progress: 0 } : f
    ));
    setTimeout(() => processQueue(), 50);
  }, [processQueue]);

  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(f => f.status !== 'complete'));
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
    activeCount.current = 0;
  }, []);

  const isUploading = queue.some(f => f.status === 'uploading');
  const hasQueued = queue.some(f => f.status === 'queued');
  const completedCount = queue.filter(f => f.status === 'complete').length;
  const errorCount = queue.filter(f => f.status === 'error').length;

  return {
    queue,
    addFiles,
    removeFile,
    retryFile,
    clearCompleted,
    clearAll,
    isUploading,
    hasQueued,
    completedCount,
    errorCount,
  };
}
