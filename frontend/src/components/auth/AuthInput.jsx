/**
 * AuthInput - Input field with icon, validation, and error states
 * @module components/auth/AuthInput
 */

import { memo, forwardRef } from 'react';
import { colors } from '../../styles/tokens';

/**
 * @typedef {Object} AuthInputProps
 * @property {string} [type='text']
 * @property {React.ComponentType} icon - Lucide icon component
 * @property {string} label
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {string} [placeholder]
 * @property {boolean} [required=false]
 * @property {boolean} [autoFocus=false]
 * @property {number} [minLength]
 * @property {React.ReactNode} [rightElement]
 * @property {string} [error] - Error message
 * @property {string} [helpText] - Help text below input
 * @property {boolean} [disabled=false]
 * @property {string} [autoComplete]
 * @property {string} [id] - Input ID for label association
 */

export const AuthInput = memo(forwardRef(function AuthInput({
  type = 'text',
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  autoFocus = false,
  minLength,
  maxLength,
  rightElement,
  error,
  helpText,
  disabled = false,
  autoComplete,
  id,
  name,
  onBlur,
  onKeyDown,
}, ref) {
  const inputId = id || name || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const hasError = Boolean(error);
  
  return (
    <div className="space-y-1.5">
      <label 
        htmlFor={inputId}
        className="block text-sm font-semibold"
        style={{ color: colors.text.secondary }}
      >
        {label}
        {required && <span style={{ color: colors.danger.DEFAULT }}>*</span>}
      </label>
      
      <div className="relative group">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors pointer-events-none"
            style={{ 
              color: hasError ? colors.danger.DEFAULT : colors.text.muted 
            }}
            aria-hidden="true"
          />
        )}
        
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          required={required}
          autoFocus={autoFocus}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helpText ? helpId : undefined}
          className={`
            w-full pl-12 pr-4 py-3.5 border rounded-xl transition-all text-base outline-none
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
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      
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
      
      {helpText && !hasError && (
        <p 
          id={helpId}
          className="text-xs"
          style={{ color: colors.text.muted }}
        >
          {helpText}
        </p>
      )}
    </div>
  );
}));

AuthInput.displayName = 'AuthInput';
