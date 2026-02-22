import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for form validation with real-time error messages
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validators - Validation rules per field
 * @returns {Object} Form state, errors, validation helpers
 * 
 * @example
 * const { values, errors, touched, handleChange, handleBlur, isValid } = useFormValidation(
 *   { email: '', phone: '' },
 *   {
 *     email: [
 *       { required: true, message: 'Email is required' },
 *       { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
 *     ],
 *     phone: [
 *       { required: true, message: 'Phone is required' },
 *       { pattern: /^\(\d{3}\) \d{3}-\d{4}$/, message: 'Format: (214) 555-0100' }
 *     ]
 *   }
 * );
 */
export function useFormValidation(initialValues = {}, validators = {}) {
  const [values, setValuesState] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Validate a single field
  const validateField = useCallback((name, value) => {
    const fieldValidators = validators[name];
    if (!fieldValidators) return '';
    
    for (const rule of fieldValidators) {
      // Required check
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return rule.message || 'This field is required';
      }
      
      // Skip other checks if empty and not required
      if (!value && !rule.required) continue;
      
      // Pattern check
      if (rule.pattern && !rule.pattern.test(String(value))) {
        return rule.message || 'Invalid format';
      }
      
      // Min length check
      if (rule.minLength && String(value).length < rule.minLength) {
        return rule.message || `Must be at least ${rule.minLength} characters`;
      }
      
      // Max length check
      if (rule.maxLength && String(value).length > rule.maxLength) {
        return rule.message || `Must be no more than ${rule.maxLength} characters`;
      }
      
      // Min value check (for numbers)
      if (rule.min !== undefined && Number(value) < rule.min) {
        return rule.message || `Must be at least ${rule.min}`;
      }
      
      // Max value check (for numbers)
      if (rule.max !== undefined && Number(value) > rule.max) {
        return rule.message || `Must be no more than ${rule.max}`;
      }
      
      // Custom validator
      if (rule.validate && !rule.validate(value)) {
        return rule.message || 'Invalid value';
      }
    }
    
    return '';
  }, [validators]);
  
  // Validate all fields
  const validateAll = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validators).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    setTouched(Object.keys(validators).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));
    
    return Object.keys(newErrors).length === 0;
  }, [validators, values, validateField]);
  
  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValuesState(prev => ({ ...prev, [name]: newValue }));
    
    // Validate on change if already touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);
  
  // Handle blur (mark as touched and validate)
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);
  
  // Set value programmatically
  const setValue = useCallback((name, value) => {
    setValuesState(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);
  
  // Set multiple values
  const setMultipleValues = useCallback((newValues) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
    
    // Validate touched fields
    Object.keys(newValues).forEach(name => {
      if (touched[name]) {
        const error = validateField(name, newValues[name]);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    });
  }, [touched, validateField]);
  
  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValuesState(newValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);
  
  // Check if form is valid
  const isValid = useMemo(() => {
    // Check all required fields have values
    for (const [field, rules] of Object.entries(validators)) {
      const hasRequired = rules.some(r => r.required);
      if (hasRequired && (!values[field] || values[field].trim?.() === '')) {
        return false;
      }
    }
    
    // Check no errors exist
    return Object.keys(errors).length === 0 || 
           Object.values(errors).every(e => !e);
  }, [validators, values, errors]);
  
  // Get field props helper
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': !!errors[name] && touched[name],
    'aria-describedby': errors[name] && touched[name] ? `${name}-error` : undefined,
  }), [values, errors, touched, handleChange, handleBlur]);
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    setValues: setMultipleValues,
    reset,
    validateAll,
    isValid,
    getFieldProps,
  };
}

export default useFormValidation;
