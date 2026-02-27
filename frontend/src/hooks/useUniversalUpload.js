import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '../api/upload';
import { 
  categorizeFile, 
  getFileIconType, 
  getPipelineLabel,
  validateFile,
  generateFileId,
  MAX_FILE_SIZE
} from '../components/upload/utils';

const MAX_CONCURRENT = 3;

/**
 * Queue states: 'queued' | 'uploading' | 'processing' | 'complete' | 'error'
 */
export function useUniversalUpload({ jobId = null, onComplete } = {}) {
  const [queue, setQueue] = useState([]);
  const activeCount = useRef(0);
  const queryClient = useQueryClient();

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
      const validation = validateFile(file, { maxSize: MAX_FILE_SIZE });
      return {
        id: generateFileId('upload'),
        file,
        name: file.name,
        size: file.size,
        category: categorizeFile(file.name),
        icon: getFileIconType(file.name),
        pipeline: getPipelineLabel(file.name),
        status: validation.valid ? 'queued' : 'error',
        error: validation.valid ? null : validation.error,
        progress: 0,
        serverId: null,
      };
    });

    setQueue(prev => [...prev, ...newItems]);
    // Trigger processing after state update
    setTimeout(() => processQueue(), 50);
    return newItems;
  }, [processQueue]);

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
