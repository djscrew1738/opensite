/**
 * useBlueprintAnalysis Hook
 * React hook for blueprint analysis with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';

/**
 * Hook for submitting and tracking blueprint analysis
 */
export function useBlueprintAnalysis() {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const wsRef = useRef(null);

  // Submit analysis
  const submitAnalysis = useCallback(async (options) => {
    const { filePath, projectId, services = ['dimensions', 'vision', 'ai'] } = options;
    
    setIsLoading(true);
    setError(null);
    setResults(null);
    setProgress(0);
    
    try {
      const response = await apiClient.post('/blueprint/analyze', {
        filePath,
        projectId,
        services
      });
      
      setJobId(response.data.jobId);
      setStatus('pending');
      
      // Connect WebSocket for real-time updates
      connectWebSocket(response.data.jobId);
      
      return response.data.jobId;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Submit synchronous analysis (waits for completion)
  const analyzeSync = useCallback(async (options) => {
    const { filePath, projectId, services = ['dimensions', 'vision', 'ai'], timeout = 120000 } = options;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/blueprint/analyze-sync', {
        filePath,
        projectId,
        services,
        timeout
      });
      
      setResults(response.data);
      setStatus('completed');
      setProgress(100);
      
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Quick estimate (fastest method)
  const quickEstimate = useCallback(async (filePath, projectId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/blueprint/quick-estimate', {
        filePath,
        projectId
      });
      
      setJobId(response.data.jobId);
      setStatus('pending');
      
      connectWebSocket(response.data.jobId);
      
      return response.data.jobId;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Connect WebSocket
  const connectWebSocket = useCallback((jobId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}/ws/blueprint`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        jobId
      }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'status':
        case 'update':
          setStatus(data.data.status);
          setProgress(data.data.progress);
          
          if (data.data.status === 'completed') {
            setResults(data.data.results);
            setIsLoading(false);
            ws.close();
          }
          
          if (data.data.errors?.length > 0) {
            setError(data.data.errors.join(', '));
          }
          break;
          
        case 'error':
          setError(data.message);
          setIsLoading(false);
          break;
      }
    };
    
    ws.onerror = (err) => {
      setError('WebSocket connection error');
      setIsLoading(false);
    };
    
    wsRef.current = ws;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    jobId,
    status,
    progress,
    results,
    error,
    isLoading,
    submitAnalysis,
    analyzeSync,
    quickEstimate
  };
}

// Re-export useJobStatus from dedicated hook file for convenience
export { useJobStatus, useMultipleJobStatus, useJobsList } from './useJobStatus';

/**
 * Hook for comparing analysis methods
 */
export function useMethodComparison() {
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);

  const compare = useCallback(async (filePath) => {
    setIsComparing(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/blueprint/compare-methods', {
        filePath
      });
      
      setComparison(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsComparing(false);
    }
  }, []);

  return { compare, isComparing, comparison, error };
}

/**
 * Hook for project analysis history
 */
export function useProjectAnalysis(projectId) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/blueprint/projects/${projectId}/analysis`);
      setAnalysis(response.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, isLoading, error, refetch: fetchAnalysis };
}

export default useBlueprintAnalysis;
