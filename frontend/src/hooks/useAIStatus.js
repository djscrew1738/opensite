import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Enhanced AI Status Hook with real-time monitoring,
 * automatic fallback detection, and performance metrics
 * 
 * @param {Object} options
 * @param {boolean} options.polling - Enable polling (default: true)
 * @param {number} options.interval - Polling interval in ms (default: 30000)
 * @returns {Object} AI status, metrics, and control functions
 */
export function useAIStatus(options = {}) {
  const { polling = true, interval = 30000 } = options;
  const queryClient = useQueryClient();
  const [preferredProvider, setPreferredProvider] = useState(localStorage.getItem('ai_preferred_provider') || 'ollama');
  const [isFallback, setIsFallback] = useState(false);
  const [lastError, setLastError] = useState(null);
  const reconnectTimeoutRef = useRef(null);

  // Main AI health query with polling
  const { 
    data: healthData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['ai-health', preferredProvider],
    queryFn: async () => {
      try {
        const health = await api.ai.getProviders();
        setLastError(null);
        return health;
      } catch (err) {
        setLastError(err.message);
        throw err;
      }
    },
    refetchInterval: polling ? interval : false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
    staleTime: 10000,
  });

  // Get metrics
  const { data: metricsData } = useQuery({
    queryKey: ['ai-metrics'],
    queryFn: () => api.settings.getMetrics(),
    refetchInterval: polling ? 60000 : false, // Every minute
    enabled: !isLoading,
  });

  // Available providers from response
  const providers = healthData?.providers || [];
  const activeProvider = healthData?.active || preferredProvider;

  // Check if we're in fallback mode
  useEffect(() => {
    if (activeProvider && preferredProvider) {
      setIsFallback(activeProvider !== preferredProvider);
    }
  }, [activeProvider, preferredProvider]);

  // Auto-switch to available provider if preferred is down
  useEffect(() => {
    if (!healthData || isLoading) return;

    const preferred = providers.find(p => p.name === preferredProvider);
    const availableProvider = providers.find(p => p.active || p.hasApiKey || p.name === 'ollama');

    if (!preferred?.hasApiKey && availableProvider && preferredProvider !== availableProvider.name) {
      console.log(`[useAIStatus] Preferred provider ${preferredProvider} unavailable, suggesting ${availableProvider.name}`);
    }
  }, [healthData, providers, preferredProvider, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Switch to a specific provider
   */
  const switchProvider = useCallback(async (providerName) => {
    try {
      await api.ai.switchProvider(providerName);
      setPreferredProvider(providerName);
      localStorage.setItem('ai_preferred_provider', providerName);
      
      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ['ai-health'] });
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [queryClient]);

  /**
   * Find best available provider
   */
  const findBestProvider = useCallback(() => {
    if (!providers.length) return null;
    
    // Priority: openclaw > ollama > groq > anthropic
    const priority = ['openclaw', 'ollama', 'groq', 'anthropic'];
    
    for (const name of priority) {
      const provider = providers.find(p => p.name === name && (p.active || p.hasApiKey));
      if (provider) return provider;
    }
    
    return providers[0];
  }, [providers]);

  /**
   * Check if a specific provider is ready
   */
  const isProviderReady = useCallback((providerName) => {
    const provider = providers.find(p => p.name === providerName);
    return provider?.active || provider?.hasApiKey || false;
  }, [providers]);

  /**
   * Get provider display info
   */
  const getProviderInfo = useCallback((providerName = activeProvider) => {
    const info = {
      ollama: { 
        label: 'Ollama Local', 
        color: 'text-blue-600', 
        bg: 'bg-blue-50',
        icon: '🖥️',
        description: 'Local AI — private & fast'
      },
      openclaw: { 
        label: 'OpenClaw Gateway', 
        color: 'text-red-600', 
        bg: 'bg-red-50',
        icon: '⚡',
        description: 'Local gateway — 200k context'
      },
      groq: { 
        label: 'Groq Cloud', 
        color: 'text-orange-600', 
        bg: 'bg-orange-50',
        icon: '☁️',
        description: 'Fast cloud inference'
      },
      anthropic: { 
        label: 'Anthropic Claude', 
        color: 'text-amber-600', 
        bg: 'bg-amber-50',
        icon: '🧠',
        description: 'Premium AI — 200k context'
      },
    };
    
    return info[providerName] || { label: providerName, color: 'text-gray-600', bg: 'bg-gray-50', icon: '🔌' };
  }, [activeProvider]);

  // Derived state
  const isReady = providers.some(p => p.active || p.hasApiKey);
  const isLocal = activeProvider === 'ollama' || activeProvider === 'openclaw';
  const hasError = !!error || !!lastError;

  // Calculate success rate from metrics
  const metrics = metricsData?.metrics || {};
  const successRate = metrics.totalRequests > 0
    ? ((metrics.successCount / metrics.totalRequests) * 100).toFixed(1)
    : 100;

  return {
    // Status
    isLoading,
    isReady,
    hasError,
    error: error?.message || lastError,
    isFallback,
    isLocal,
    
    // Providers
    providers,
    activeProvider,
    preferredProvider,
    setPreferredProvider,
    
    // Metrics
    metrics,
    successRate,
    avgResponseMs: metrics.avgResponseMs || 0,
    totalRequests: metrics.totalRequests || 0,
    
    // Functions
    switchProvider,
    findBestProvider,
    isProviderReady,
    getProviderInfo,
    refresh: refetch,
    
    // Utilities
    circuitBreaker: metrics.circuitBreaker || 'closed',
  };
}

/**
 * Hook for model management with prefetching
 */
export function useModelManager() {
  const queryClient = useQueryClient();
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(null);

  // Fetch available models
  const { data: modelsData, isLoading } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    staleTime: 60000,
  });

  const models = modelsData?.models || [];
  const defaultModel = modelsData?.defaultModel || '';

  /**
   * Pull a new model with progress tracking
   */
  const pullModel = useCallback(async (modelName) => {
    setIsPulling(true);
    setPullProgress({ status: 'Starting...', completed: 0, total: 0 });

    try {
      const response = await fetch('/api/ai/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              setIsPulling(false);
              setPullProgress(null);
              queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
              return { success: true };
            }
            setPullProgress(data);
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setIsPulling(false);
      setPullProgress(null);
      return { success: false, error: err.message };
    }
  }, [queryClient]);

  /**
   * Delete a model
   */
  const deleteModel = useCallback(async (modelName) => {
    try {
      await api.ai.deleteModel(modelName);
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [queryClient]);

  /**
   * Preload/warm up a model
   */
  const preloadModel = useCallback(async (modelName) => {
    try {
      // Send a simple request to load model into memory
      await api.ai.chat('Hello', null, modelName);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    models,
    defaultModel,
    isLoading,
    isPulling,
    pullProgress,
    pullModel,
    deleteModel,
    preloadModel,
  };
}

/**
 * Hook for AI streaming with error handling
 */
export function useAIStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Start a streaming chat session
   */
  const streamChat = useCallback(async (message, options = {}) => {
    const { onChunk, onComplete, onError, conversationId, model } = options;
    
    setIsStreaming(true);
    setStreamError(null);

    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId, model }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              throw new Error(data.error);
            }

            if (data.done) {
              setIsStreaming(false);
              onComplete?.(fullResponse, data);
              return;
            }

            if (data.chunk) {
              fullResponse += data.chunk;
              onChunk?.(data.chunk, fullResponse);
            }
          } catch (err) {
            console.warn('Stream parse error:', err);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStreamError(err.message);
        onError?.(err.message);
      }
      setIsStreaming(false);
    }
  }, []);

  /**
   * Abort current stream
   */
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      abortStream();
    };
  }, [abortStream]);

  return {
    isStreaming,
    streamError,
    streamChat,
    abortStream,
  };
}

export default useAIStatus;
