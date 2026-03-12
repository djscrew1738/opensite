/**
 * PasswordInput - Password field with toggle and strength indicator
 * @module components/auth/PasswordInput
 */

import { useState, useCallback, memo, forwardRef } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { colors } from '../../styles/tokens';

/**
 * Calculate password strength (0-4)
 * @param {string} password
 * @returns {number}
 */
function calculateStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = [
  colors.danger.DEFAULT,
  colors.danger.DEFAULT,
  colors.warning.DEFAULT,
  colors.accent.green,
  colors.success.DEFAULT,
];

/**
 * @typedef {Object} PasswordInputProps
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {string} [label='Password']
 * @property {string} [placeholder='••••••••']
 * @property {boolean} [required=false]
 * @property {boolean} [autoFocus=false]
 * @property {boolean} [showStrength=false] - Show strength meter
 * @property {number} [minLength=6]
 * @property {string} [error]
 * @property {boolean} [disabled=false]
 * @property {string} [autoComplete='current-password']
 * @property {string} [id]
 * @property {string} [name='password']
 */

export const PasswordInput = memo(forwardRef(function PasswordInput({
  value,
  onChange,
  label = 'Password',
  placeholder = '••••••••',
  required = false,
  autoFocus = false,
  showStrength = false,
  minLength = 6,
  maxLength,
  error,
  disabled = false,
  autoComplete = 'current-password',
  id,
  name = 'password',
  onBlur,
}, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);
  const strength = calculateStrength(value);
  
  const toggleVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  const handleChange = useCallback((newValue) => {
    onChange(newValue);
  }, [onChange]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);
  
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold"
          style={{ color: colors.text.secondary }}
        >
          {label}
          {required && <span style={{ color: colors.danger.DEFAULT }}>*</span>}
        </label>
      </div>
      
      <div className="relative group">
        <Lock 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors pointer-events-none"
          style={{ 
            color: hasError ? colors.danger.DEFAULT : colors.text.muted 
          }}
          aria-hidden="true"
        />
        
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          autoFocus={autoFocus}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={`
            w-full pl-12 pr-12 py-3.5 border rounded-xl transition-all text-base outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError ? 'ring-1' : 'focus:ring-1'}
          `}
          style={{
            backgroundColor: disabled ? colors.surface.card : `${colors.surface.primary}80`,
            borderColor: hasError ? colors.danger.DEFAULT : colors.border.strong,
            color: colors.text.primary,
            boxShadow: hasError ? `0 0 0 1px ${colors.danger.DEFAULT}` : undefined,
          }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50"
          style={{ color: colors.text.muted }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.color = colors.text.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.text.muted;
          }}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Eye className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>
      
      {/* Strength Meter */}
      {showStrength && isFocused && value && (
        <div className="space-y-1">
          <div className="flex gap-1 h-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor: strength >= level 
                    ? strengthColors[strength] 
                    : colors.border.strong,
                }}
              />
            ))}
          </div>
          <p 
            className="text-xs font-medium"
            style={{ color: strengthColors[strength] }}
          >
            {strengthLabels[strength]}
          </p>
          
          {/* Requirements checklist */}
          <div className="space-y-1 pt-1">
            <Requirement met={value.length >= 8} text="At least 8 characters" />
            <Requirement met={/[a-z]/.test(value) && /[A-Z]/.test(value)} text="Upper & lowercase letters" />
            <Requirement met={/\d/.test(value)} text="At least one number" />
            <Requirement met={/[^a-zA-Z0-9]/.test(value)} text="At least one special character" />
          </div>
        </div>
      )}
      
      {hasError && (
        <p 
          id={errorId}
          className="text-xs font-medium flex items-center gap-1"
          style={{ color: colors.danger.DEFAULT }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}));

/**
 * Requirement checklist item
 */
const Requirement = memo(function Requirement({ met, text }) {
  return (
    <div 
      className="flex items-center gap-1.5 text-xs"
      style={{ color: met ? colors.success.DEFAULT : colors.text.muted }}
    >
      {met ? (
        <Check className="w-3 h-3" aria-hidden="true" />
      ) : (
        <X className="w-3 h-3" aria-hidden="true" />
      )}
      <span>{text}</span>
    </div>
  );
});

Requirement.displayName = 'Requirement';
PasswordInput.displayName = 'PasswordInput';
