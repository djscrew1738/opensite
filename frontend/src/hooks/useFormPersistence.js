import { useEffect, useRef } from 'react';

/**
 * Auto-save hook for form persistence across browser refreshes
 * Similar to @zippers/savior but built for React
 *
 * @param {string} formKey - Unique identifier for the form (e.g., 'pricing-form', 'lead-modal')
 * @param {Object} formData - Current form state object
 * @param {Function} setFormData - State setter function
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Enable/disable persistence (default: true)
 * @param {number} options.debounceMs - Debounce delay for saving (default: 500ms)
 * @param {Function} options.shouldSave - Custom function to determine if data should be saved
 * @param {Function} options.onRestore - Callback when data is restored
 *
 * @example
 * const [formData, setFormData] = useState({ name: '', email: '' });
 * const { clearSaved } = useFormPersistence('contact-form', formData, setFormData);
 *
 * const handleSubmit = () => {
 *   // Submit form...
 *   clearSaved(); // Clear saved data after successful submit
 * };
 */
export function useFormPersistence(formKey, formData, setFormData, options = {}) {
  const {
    enabled = true,
    debounceMs = 500,
    shouldSave = () => true,
    onRestore = null
  } = options;

  const storageKey = `1stein_form_${formKey}`;
  const debounceTimer = useRef(null);
  const initialLoadDone = useRef(false);

  // Restore saved data on mount
  useEffect(() => {
    if (!enabled || initialLoadDone.current) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Validate that parsed data is an object
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Check if saved data has any non-empty values
          const hasData = Object.values(parsed).some(val => {
            if (typeof val === 'string') return val.trim() !== '';
            if (typeof val === 'number') return val !== 0;
            return val != null;
          });

          if (hasData) {
            // Merge saved data with current form data (preserve structure)
            const mergedData = { ...formData, ...parsed };
            setFormData(mergedData);

            if (onRestore) {
              onRestore(parsed);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to restore form data for "${formKey}":`, error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
    }

    initialLoadDone.current = true;
  }, [enabled, storageKey, formKey, setFormData, onRestore, formData]); // Only run once on mount

  // Clear old form data if storage is full
  const clearOldFormData = () => {
    try {
      const keys = Object.keys(localStorage);
      const formKeys = keys.filter(key => key.startsWith('1stein_form_'));

      // Remove the oldest saved forms (keep only last 5)
      if (formKeys.length > 5) {
        formKeys.slice(0, formKeys.length - 5).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.warn('Failed to clear old form data:', error);
    }
  };

  // Auto-save on form data changes (debounced)
  useEffect(() => {
    if (!enabled || !initialLoadDone.current || !shouldSave(formData)) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounced save
    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.warn(`Failed to save form data for "${formKey}":`, error);

        // If quota exceeded, try to clear old form data
        if (error.name === 'QuotaExceededError') {
          clearOldFormData();
        }
      }
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [formData, enabled, storageKey, formKey, debounceMs, shouldSave]);

  // Clear saved data from localStorage
  const clearSaved = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to clear saved form data for "${formKey}":`, error);
    }
  };

  return {
    clearSaved,
    isEnabled: enabled
  };
}

export default useFormPersistence;
