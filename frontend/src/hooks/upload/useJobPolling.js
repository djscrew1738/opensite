import { useState, useRef, useCallback, useEffect } from 'react';

const DEFAULT_OPTIONS = {
  pollInterval: 2000,
  maxPollTime: 300000, // 5 minutes
  onProgress: null,
  onComplete: null,
  onError: null,
};

/**
 * useJobPolling Hook
 * Polls job status from API with automatic timeout and cleanup
 * 
 * @param {Function} statusFetcher - Async function that fetches job status
 * @param {Object} options
 * @param {number} options.pollInterval - Milliseconds between polls
 * @param {number} options.maxPollTime - Maximum time to poll before timeout
 * @param {Function} options.onProgress - Called with progress updates
 * @param {Function} options.onComplete - Called when job completes
 * @param {Function} options.onError - Called on error
 * @returns {Object} Polling state and controls
 */
export function useJobPolling(statusFetcher, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [status, setStatus] = useState('idle'); // idle, polling, completed, failed, timeout
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const pollIntervalRef = useRef(null);
  const pollStartRef = useRef(null);
  const abortControllerRef = useRef(null);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (jobId) => {
    try {
      // Check timeout
      if (pollStartRef.current && Date.now() - pollStartRef.current > opts.maxPollTime) {
        clearPolling();
        setStatus('timeout');
        setError('Analysis timed out after 5 minutes. The AI provider may be unavailable.');
        opts.onError?.('timeout', 'Analysis timed out');
        return;
      }

      const jobStatus = await statusFetcher(jobId, abortControllerRef.current?.signal);
      
      setProgress(jobStatus.progress || 0);
      opts.onProgress?.(jobStatus.progress || 0, jobStatus);

      if (jobStatus.status === 'completed') {
        clearPolling();
        setStatus('completed');
        setProgress(100);
        setResult(jobStatus.result);
        opts.onComplete?.(jobStatus.result, jobStatus);
      } else if (jobStatus.status === 'failed') {
        clearPolling();
        setStatus('failed');
        const errorMsg = jobStatus.error || 'Analysis failed';
        setError(errorMsg);
        opts.onError?.('failed', errorMsg, jobStatus);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      clearPolling();
      setStatus('failed');
      const errorMsg = err.message || 'Lost connection while checking status';
      setError(errorMsg);
      opts.onError?.('connection', errorMsg);
    }
  }, [statusFetcher, opts, clearPolling]);

  const startPolling = useCallback((jobId) => {
    // Clear any existing polling
    clearPolling();
    
    // Reset state
    setStatus('polling');
    setProgress(0);
    setError(null);
    setResult(null);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    // Start polling
    pollStartRef.current = Date.now();
    pollIntervalRef.current = setInterval(() => {
      pollStatus(jobId);
    }, opts.pollInterval);
    
    // Initial poll
    pollStatus(jobId);
  }, [opts.pollInterval, pollStatus, clearPolling]);

  const stopPolling = useCallback(() => {
    clearPolling();
    abortControllerRef.current?.abort();
    setStatus('idle');
  }, [clearPolling]);

  const cancel = useCallback(() => {
    stopPolling();
    setError('Analysis cancelled');
    opts.onError?.('cancelled', 'Analysis cancelled');
  }, [stopPolling, opts]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
    pollStartRef.current = null;
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling();
      abortControllerRef.current?.abort();
    };
  }, [clearPolling]);

  return {
    status,
    progress,
    error,
    result,
    isPolling: status === 'polling',
    isComplete: status === 'completed',
    isFailed: status === 'failed' || status === 'timeout',
    actions: {
      start: startPolling,
      stop: stopPolling,
      cancel,
      reset,
    }
  };
}

/**
 * useVisionUpload Hook
 * Specialized hook for vision/tile upload with polling
 * @param {Object} options
 * @param {Function} options.uploadApi - Upload API function
 * @param {Function} options.statusApi - Status API function  
 * @param {Function} options.onComplete
 * @param {Function} options.onError
 */
export function useVisionUpload(options = {}) {
  const { uploadApi, statusApi, onComplete, onError } = options;
  
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);

  const handleStatusFetch = useCallback(async (id, signal) => {
    return statusApi(id, { signal });
  }, [statusApi]);

  const polling = useJobPolling(handleStatusFetch, {
    pollInterval: 1500,
    onComplete: (result, status) => {
      setUploading(false);
      onComplete?.(result, status);
    },
    onError: (type, error) => {
      setUploading(false);
      onError?.(type, error);
    }
  });

  const upload = useCallback(async (file) => {
    if (!file) return;
    
    setUploading(true);
    setJobId(null);
    polling.actions.reset();

    try {
      const result = await uploadApi(file);
      
      if (!result?.jobId) {
        throw new Error('Upload response missing job ID');
      }
      
      setJobId(result.jobId);
      polling.actions.start(result.jobId);
      
      return result;
    } catch (err) {
      setUploading(false);
      onError?.('upload', err.message);
      throw err;
    }
  }, [uploadApi, polling.actions, onError]);

  return {
    uploading,
    progress: polling.progress,
    jobId,
    error: polling.error,
    actions: {
      upload,
      cancel: () => {
        polling.actions.cancel();
        setUploading(false);
      },
      reset: () => {
        polling.actions.reset();
        setUploading(false);
        setJobId(null);
      }
    }
  };
}
