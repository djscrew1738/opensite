/**
 * AuthButton - Primary action button with loading state
 * @module components/auth/AuthButton
 */

import { memo } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';

/**
 * @typedef {Object} AuthButtonProps
 * @property {React.ReactNode} children
 * @property {boolean} [isLoading=false]
 * @property {boolean} [disabled=false]
 * @property {() => void} [onClick]
 * @property {'button' | 'submit'} [type='button']
 * @property {string} [className]
 */

export const AuthButton = memo(function AuthButton({
  children,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) {
  const isDisabled = disabled || isLoading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full py-4 font-bold rounded-xl transition-all 
        flex items-center justify-center gap-2 
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        backgroundColor: isDisabled ? colors.surface.card : colors.accent.DEFAULT,
        color: 'white',
        boxShadow: isDisabled ? 'none' : shadows.glowBlue,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = colors.accent.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = colors.accent.DEFAULT;
        }
      }}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      ) : (
        <>
          {children}
          <ArrowRight 
            className="w-5 h-5 transition-transform group-hover:translate-x-1" 
            aria-hidden="true" 
          />
        </>
      )}
    </button>
  );
});

AuthButton.displayName = 'AuthButton';

/**
 * Secondary button variant (for guest login, etc.)
 */
export const AuthSecondaryButton = memo(function AuthSecondaryButton({
  children,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
}) {
  const isDisabled = disabled || isLoading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className="
        w-full py-3.5 border font-semibold rounded-xl transition-all 
        flex items-center justify-center gap-2 
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
      "
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.strong,
        color: colors.text.primary,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = colors.surface.card;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.surface.primary;
      }}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" style={{ color: colors.text.muted }} aria-hidden="true" />}
          {children}
        </>
      )}
    </button>
  );
});

AuthSecondaryButton.displayName = 'AuthSecondaryButton';
