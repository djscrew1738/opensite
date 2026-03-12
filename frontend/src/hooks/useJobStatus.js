/**
 * useJobStatus Hook
 * React hook for polling job status with configurable options
 * 
 * @module hooks/useJobStatus
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

/** @type {number} Default polling interval in milliseconds */
const DEFAULT_POLLING_INTERVAL = 2000;

/** @type {number} Maximum number of polling attempts before giving up */
const DEFAULT_MAX_ATTEMPTS = 300; // 10 minutes at 2s intervals

/**
 * Hook for polling job status via HTTP API
 * 
 * @param {string | null} jobId - The job ID to poll
 * @param {object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 2000)
 * @param {number} options.maxAttempts - Maximum polling attempts (default: 300)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {function} options.onComplete - Callback when job completes
 * @param {function} options.onError - Callback when job fails or errors
 * @returns {{
 *   status: string | null,
 *   progress: number,
 *   results: any | null,
 *   error: string | null,
 *   isPolling: boolean,
 *   stopPolling: () => void,
 *   startPolling: () => void
 * }}
 * 
 * @example
 * ```jsx
 * const { status, progress, results, error } = useJobStatus(jobId, {
 *   interval: 1000,
 *   onComplete: (data) => console.log('Done:', data),
 * });
 * ```
 */
export function useJobStatus(
  jobId,
  {
    interval = DEFAULT_POLLING_INTERVAL,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    enabled = true,
    onComplete,
    onError,
  } = {}
) {
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const intervalRef = useRef(null);
  const attemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
  }, []);

  const startPolling = useCallback(() => {
    if (!jobId || !enabled) return;
    
    // Don't start if already polling
    if (intervalRef.current) return;

    setIsPolling(true);
    attemptsRef.current = 0;

    intervalRef.current = setInterval(async () => {
      attemptsRef.current += 1;

      // Check max attempts
      if (attemptsRef.current >= maxAttempts) {
        stopPolling();
        const timeoutError = 'Polling timeout: maximum attempts reached';
        if (isMountedRef.current) {
          setError(timeoutError);
        }
        onError?.(new Error(timeoutError));
        return;
      }

      try {
        const data = await api.jobs.getStatus(jobId);
        
        if (!isMountedRef.current) return;

        setStatus(data.status);
        setProgress(data.progress || 0);

        if (data.results) {
          setResults(data.results);
        }

        if (data.errors?.length > 0) {
          const errorMessage = data.errors.join(', ');
          setError(errorMessage);
        }

        // Stop polling if job is complete or failed
        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling();
          
          if (data.status === 'completed') {
            onComplete?.(data);
          } else {
            onError?.(new Error(data.errors?.[0] || 'Job failed'));
          }
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        const errorMessage = err.message || 'Failed to fetch job status';
        setError(errorMessage);
        stopPolling();
        onError?.(err);
      }
    }, interval);
  }, [jobId, interval, maxAttempts, enabled, onComplete, onError, stopPolling]);

  // Auto-start polling when jobId changes and enabled is true
  useEffect(() => {
    if (jobId && enabled) {
      // Reset state for new job
      setStatus(null);
      setProgress(0);
      setResults(null);
      setError(null);
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [jobId, enabled, startPolling, stopPolling]);

  return {
    status,
    progress,
    results,
    error,
    isPolling,
    stopPolling,
    startPolling,
  };
}

/**
 * Hook for tracking multiple jobs simultaneously
 * 
 * @param {string[]} jobIds - Array of job IDs to track
 * @param {object} options - Same options as useJobStatus
 * @returns {Array<ReturnType<typeof useJobStatus>>}
 */
export function useMultipleJobStatus(jobIds, options = {}) {
  return jobIds.map(jobId => useJobStatus(jobId, options));
}

/**
 * Hook for jobs list with auto-refresh
 * 
 * @param {object} options - Configuration options
 * @param {number} options.refreshInterval - Refresh interval in milliseconds (default: 10000)
 * @param {string[]} options.statusFilter - Filter by status (optional)
 * @returns {{
 *   jobs: Array<any>,
 *   isLoading: boolean,
 *   error: string | null,
 *   refetch: () => Promise<void>
 * }}
 */
export function useJobsList(
  {
    refreshInterval = 10000,
    statusFilter = null,
  } = {}
) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.jobs.getAll();
      let jobList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      
      if (statusFilter?.length > 0) {
        jobList = jobList.filter(job => statusFilter.includes(job.status));
      }

      setJobs(jobList);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchJobs();

    const interval = setInterval(fetchJobs, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchJobs, refreshInterval]);

  return {
    jobs,
    isLoading,
    error,
    refetch: fetchJobs,
  };
}

export default useJobStatus;
