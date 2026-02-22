import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook to persist state in URL search params
 * Enables sharing deep links and preserves state across navigation
 * 
 * @param {Object} defaultValues - Default values for each param
 * @returns {Object} Current values and setter functions
 * 
 * @example
 * const { values, setValue, setValues, reset } = useUrlState({
 *   tab: 'cities',
 *   search: '',
 *   status: ''
 * });
 */
export function useUrlState(defaultValues = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse current URL params
  const parseValues = useCallback(() => {
    const values = { ...defaultValues };
    
    Object.keys(defaultValues).forEach(key => {
      const paramValue = searchParams.get(key);
      if (paramValue !== null) {
        values[key] = paramValue;
      }
    });
    
    return values;
  }, [searchParams, defaultValues]);
  
  const [values, setValuesState] = useState(parseValues);
  
  // Update local state when URL changes
  useEffect(() => {
    setValuesState(parseValues());
  }, [parseValues]);
  
  // Set a single value
  const setValue = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      
      if (value === '' || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      
      return next;
    });
  }, [setSearchParams]);
  
  // Set multiple values at once
  const setValues = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      
      return next;
    });
  }, [setSearchParams]);
  
  // Reset all to defaults
  const reset = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);
  
  return {
    values,
    setValue,
    setValues,
    reset
  };
}

export default useUrlState;
