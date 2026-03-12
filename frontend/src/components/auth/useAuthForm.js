/**
 * useAuthForm - Form state management with validation
 * @module components/auth/useAuthForm
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Validation rules
 */
const validators = {
  required: (value) => {
    if (!value || value.trim() === '') return 'This field is required';
    return null;
  },
  
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  
  minLength: (value, min) => {
    if (!value) return null;
    if (value.length < min) return `Must be at least ${min} characters`;
    return null;
  },
  
  password: (value) => {
    if (!value) return null;
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
    if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
    if (!/\d/.test(value)) return 'Password must contain a number';
    return null;
  },
  
  match: (value, matchValue, fieldName = 'field') => {
    if (!value) return null;
    if (value !== matchValue) return `Must match ${fieldName}`;
    return null;
  },
};

/**
 * Rate limiter for form submissions
 */
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.attempts = 0;
    this.lastAttempt = 0;
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.lockedUntil = 0;
  }
  
  canAttempt() {
    const now = Date.now();
    
    // Check if currently locked
    if (now < this.lockedUntil) {
      const remaining = Math.ceil((this.lockedUntil - now) / 1000);
      return { allowed: false, remaining };
    }
    
    // Reset if window has passed
    if (now - this.lastAttempt > this.windowMs) {
      this.attempts = 0;
    }
    
    // Check attempt limit
    if (this.attempts >= this.maxAttempts) {
      this.lockedUntil = now + this.windowMs;
      const remaining = Math.ceil(this.windowMs / 1000);
      return { allowed: false, remaining };
    }
    
    return { allowed: true, remaining: 0 };
  }
  
  recordAttempt() {
    this.attempts++;
    this.lastAttempt = Date.now();
  }
  
  reset() {
    this.attempts = 0;
    this.lockedUntil = 0;
  }
}

/**
 * Hook for managing login form state
 */
export function useLoginForm(options = {}) {
  const { onSubmit, maxAttempts = 5 } = options;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  
  const rateLimiterRef = useRef(new RateLimiter(maxAttempts));
  const emailInputRef = useRef(null);
  
  // Update lock timer
  useEffect(() => {
    if (!isLocked) return;
    
    const interval = setInterval(() => {
      const { allowed, remaining } = rateLimiterRef.current.canAttempt();
      setLockRemaining(remaining);
      
      if (allowed) {
        setIsLocked(false);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLocked]);
  
  const validate = useCallback(() => {
    const newErrors = {};
    
    const emailError = validators.required(email) || validators.email(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validators.required(password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);
  
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    // Check rate limit
    const { allowed, remaining } = rateLimiterRef.current.canAttempt();
    if (!allowed) {
      setIsLocked(true);
      setLockRemaining(remaining);
      return { success: false, error: `Too many attempts. Try again in ${remaining}s.` };
    }
    
    // Validate
    if (!validate()) {
      return { success: false, error: 'Please fix the errors above' };
    }
    
    setIsSubmitting(true);
    rateLimiterRef.current.recordAttempt();
    
    try {
      const result = await onSubmit?.(email.trim(), password);
      rateLimiterRef.current.reset();
      return { success: true, data: result };
    } catch (err) {
      const message = err.message || 'Login failed';
      setErrors(prev => ({ ...prev, general: message }));
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, validate, onSubmit]);
  
  const clearError = useCallback((field) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);
  
  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    clearError('email');
    clearError('general');
  }, [clearError]);
  
  const handlePasswordChange = useCallback((value) => {
    setPassword(value);
    clearError('password');
    clearError('general');
  }, [clearError]);
  
  return {
    // State
    email,
    password,
    errors,
    isSubmitting,
    isLocked,
    lockRemaining,
    
    // Refs
    emailInputRef,
    
    // Actions
    setEmail: handleEmailChange,
    setPassword: handlePasswordChange,
    handleSubmit,
    clearError,
    
    // Validation
    isValid: !errors.email && !errors.password && email && password,
  };
}

/**
 * Hook for managing registration form state
 */
export function useRegisterForm(options = {}) {
  const { onSubmit, maxAttempts = 3 } = options;
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  
  const rateLimiterRef = useRef(new RateLimiter(maxAttempts));
  
  // Update lock timer
  useEffect(() => {
    if (!isLocked) return;
    
    const interval = setInterval(() => {
      const { allowed, remaining } = rateLimiterRef.current.canAttempt();
      setLockRemaining(remaining);
      
      if (allowed) {
        setIsLocked(false);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLocked]);
  
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'username':
        return validators.required(value) || validators.minLength(value, 2);
      case 'email':
        return validators.required(value) || validators.email(value);
      case 'password':
        return validators.required(value) || validators.password(value);
      case 'confirmPassword':
        return validators.required(value) || 
               validators.match(value, formData.password, 'password');
      default:
        return null;
    }
  }, [formData.password]);
  
  const validateAll = useCallback(() => {
    const newErrors = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);
  
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      delete next.general;
      return next;
    });
  }, []);
  
  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [formData, validateField]);
  
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    // Check rate limit
    const { allowed, remaining } = rateLimiterRef.current.canAttempt();
    if (!allowed) {
      setIsLocked(true);
      setLockRemaining(remaining);
      return { success: false, error: `Too many attempts. Try again in ${remaining}s.` };
    }
    
    // Validate
    if (!validateAll()) {
      return { success: false, error: 'Please fix the errors above' };
    }
    
    setIsSubmitting(true);
    rateLimiterRef.current.recordAttempt();
    
    try {
      const result = await onSubmit?.({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      rateLimiterRef.current.reset();
      return { success: true, data: result };
    } catch (err) {
      const message = err.message || 'Registration failed';
      setErrors(prev => ({ ...prev, general: message }));
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateAll, onSubmit]);
  
  return {
    // State
    formData,
    errors,
    touched,
    isSubmitting,
    isLocked,
    lockRemaining,
    
    // Actions
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Validation
    isValid: Object.keys(errors).length === 0 && 
             Object.values(formData).every(v => v),
  };
}

/**
 * Hook for managing guest login
 */
export function useGuestLogin(options = {}) {
  const { onSubmit } = options;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleGuestLogin = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // Guest credentials are now configurable via env
      const guestEmail = import.meta.env.VITE_GUEST_EMAIL || 'guest@ctlplumbingllc.com';
      const guestPassword = import.meta.env.VITE_GUEST_PASSWORD || 'guest';
      
      const result = await onSubmit?.(guestEmail, guestPassword);
      return { success: true, data: result };
    } catch (err) {
      const message = err.message || 'Guest login failed. Is the database seeded?';
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit]);
  
  return {
    isSubmitting,
    handleGuestLogin,
  };
}
