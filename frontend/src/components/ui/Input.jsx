import React, { forwardRef, useId } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  DEFAULT: 'h-10 px-4 text-sm',
  lg: 'h-12 px-4 text-base',
};

// Generate unique IDs for accessibility
const useFormId = (id) => {
  const generatedId = useId();
  return id || generatedId;
};

export const Input = forwardRef(({
  className = '',
  size = 'DEFAULT',
  error,
  leftIcon,
  rightIcon,
  label,
  helperText,
  id: idProp,
  required,
  disabled,
  ...props
}, ref) => {
  const id = useFormId(idProp);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const hasError = Boolean(error);
  const describedBy = [
    hasError ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined;

  const baseClasses = `
    w-full
    bg-surface-900
    border rounded-xl
    text-text-primary placeholder:text-text-disabled
    transition-all duration-fast
    focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400/50
    disabled:bg-surface-800 disabled:text-text-disabled disabled:cursor-not-allowed
    ${leftIcon ? 'pl-10' : ''}
    ${(rightIcon || hasError) ? 'pr-10' : ''}
  `;

  const stateClasses = hasError
    ? 'border-danger-dark focus:border-danger focus:ring-danger/20'
    : 'border-border-medium hover:border-border-heavy';

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            ${baseClasses}
            ${sizeStyles[size]}
            ${stateClasses}
            ${className}
          `}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          {...props}
        />
        {(rightIcon || hasError) && (
          <div 
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-danger" />
            ) : (
              <span className="text-text-muted">{rightIcon}</span>
            )}
          </div>
        )}
      </div>
      {helperText && !hasError && (
        <p 
          id={helperId}
          className="mt-1.5 text-xs text-text-muted"
        >
          {helperText}
        </p>
      )}
      {hasError && (
        <p 
          id={errorId}
          className="mt-1.5 text-xs text-danger flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// TextArea
export const TextArea = forwardRef(({
  className = '',
  size = 'DEFAULT',
  error,
  label,
  helperText,
  id: idProp,
  required,
  disabled,
  rows = 4,
  ...props
}, ref) => {
  const id = useFormId(idProp);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const hasError = Boolean(error);
  const describedBy = [
    hasError ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined;

  const baseClasses = `
    w-full
    bg-surface-900
    border rounded-xl
    text-text-primary placeholder:text-text-disabled
    transition-all duration-fast
    focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400/50
    disabled:bg-surface-800 disabled:text-text-disabled disabled:cursor-not-allowed
    resize-y
  `;

  const stateClasses = hasError
    ? 'border-danger-dark focus:border-danger focus:ring-danger/20'
    : 'border-border-medium hover:border-border-heavy';

  const paddingClasses = {
    sm: 'px-3 py-2 text-xs',
    DEFAULT: 'px-4 py-3 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={`
          ${baseClasses}
          ${paddingClasses[size]}
          ${stateClasses}
          ${className}
        `}
        {...props}
      />
      {helperText && !hasError && (
        <p id={helperId} className="mt-1.5 text-xs text-text-muted">
          {helperText}
        </p>
      )}
      {hasError && (
        <p 
          id={errorId}
          className="mt-1.5 text-xs text-danger flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

// Select
export const Select = forwardRef(({
  children,
  className = '',
  size = 'DEFAULT',
  error,
  label,
  helperText,
  id: idProp,
  required,
  disabled,
  placeholder,
  ...props
}, ref) => {
  const id = useFormId(idProp);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const hasError = Boolean(error);
  const describedBy = [
    hasError ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined;

  const baseClasses = `
    w-full
    bg-surface-900
    border rounded-xl
    text-text-primary
    transition-all duration-fast
    focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400/50
    disabled:bg-surface-800 disabled:text-text-disabled disabled:cursor-not-allowed
    appearance-none cursor-pointer
    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')]
    bg-[length:1.5em_1.5em]
    bg-[right_0.5rem_center]
    bg-no-repeat
    pr-10
  `;

  const stateClasses = hasError
    ? 'border-danger-dark focus:border-danger focus:ring-danger/20'
    : 'border-border-medium hover:border-border-heavy';

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        required={required}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={`
          ${baseClasses}
          ${sizeStyles[size]}
          ${stateClasses}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {helperText && !hasError && (
        <p id={helperId} className="mt-1.5 text-xs text-text-muted">
          {helperText}
        </p>
      )}
      {hasError && (
        <p 
          id={errorId}
          className="mt-1.5 text-xs text-danger flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Password Input with toggle
export const PasswordInput = forwardRef(({
  className = '',
  size = 'DEFAULT',
  error,
  label,
  helperText,
  id: idProp,
  required,
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      size={size}
      error={error}
      label={label}
      helperText={helperText}
      id={idProp}
      required={required}
      disabled={disabled}
      className={className}
      rightIcon={
        <button
          type="button"
          onClick={togglePassword}
          className="p-1 hover:bg-surface-700 rounded-lg transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export default Input;
