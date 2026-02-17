import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const STORAGE_KEY = 'opensite_default_model';

/**
 * Custom hook for managing user's default AI model preference
 *
 * Persists the user's preferred model to localStorage and provides
 * validation against available models with fallback to backend default.
 *
 * @returns {Object} Model preference state and setters
 * @returns {string} defaultModel - Current default model name
 * @returns {Function} setDefaultModel - Set the default model preference
 * @returns {Function} clearDefaultModel - Clear the saved preference
 * @returns {boolean} isLoading - Loading state for models query
 *
 * @example
 * const { defaultModel, setDefaultModel, clearDefaultModel } = useModelPreference();
 *
 * // Set user's preferred model
 * setDefaultModel('llama3.1');
 *
 * // Clear preference (will fallback to backend default)
 * clearDefaultModel();
 */
export function useModelPreference() {
  const [defaultModelState, setDefaultModelState] = useState('');

  // Fetch available models from backend
  const { data: modelsData, isLoading } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false
  });

  const availableModels = useMemo(() => modelsData?.models || [], [modelsData]);
  const backendDefaultModel = modelsData?.defaultModel || '';

  // Helper function to check if a model is available
  const isModelAvailable = useCallback((modelName) => {
    if (!modelName || availableModels.length === 0) return false;
    return availableModels.some(model => model.name === modelName);
  }, [availableModels]);

  // Initialize default model from localStorage or backend (runs once on mount)
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!modelsData || isInitializedRef.current) return;

    // Use requestAnimationFrame to defer setState and avoid cascading renders
    requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved && isModelAvailable(saved)) {
          // Use saved preference if it's still a valid model
          setDefaultModelState(saved);
        } else {
          // Clean up invalid saved preference
          if (saved) {
            localStorage.removeItem(STORAGE_KEY);
          }
          // Fallback to backend default
          if (backendDefaultModel) {
            setDefaultModelState(backendDefaultModel);
          }
        }
      } catch (error) {
        console.warn('Failed to read model preference from localStorage:', error);
        // Fallback to backend default on error
        if (backendDefaultModel) {
          setDefaultModelState(backendDefaultModel);
        }
      }
    });

    isInitializedRef.current = true;
  }, [modelsData, backendDefaultModel, isModelAvailable]);

  // Set the default model preference
  const setDefaultModel = (modelName) => {
    if (!modelName) {
      console.warn('Cannot set empty model name');
      return;
    }

    // Validate that the model exists
    if (!isModelAvailable(modelName)) {
      console.warn(`Model "${modelName}" is not available`);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, modelName);
      setDefaultModelState(modelName);
    } catch (error) {
      console.warn('Failed to save model preference to localStorage:', error);

      // Still update state even if localStorage fails
      setDefaultModelState(modelName);

      // Try to handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        try {
          // Clear some old form data to make space
          const keys = Object.keys(localStorage);
          const formKeys = keys.filter(key => key.startsWith('opensite_form_'));
          if (formKeys.length > 0) {
            localStorage.removeItem(formKeys[0]);
            // Retry save
            localStorage.setItem(STORAGE_KEY, modelName);
          }
        } catch (retryError) {
          console.warn('Failed to retry saving model preference:', retryError);
        }
      }
    }
  };

  // Clear the saved preference
  const clearDefaultModel = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Revert to backend default
      if (backendDefaultModel) {
        setDefaultModelState(backendDefaultModel);
      }
    } catch (error) {
      console.warn('Failed to clear model preference from localStorage:', error);
    }
  };

  return {
    defaultModel: defaultModelState,
    setDefaultModel,
    clearDefaultModel,
    isLoading
  };
}

export default useModelPreference;
