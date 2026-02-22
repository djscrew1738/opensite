import { Sun, Monitor } from 'lucide-react';
import { useFieldMode } from '../../hooks/useFieldMode';

/**
 * FieldModeToggle Component
 * A toggle button for switching between normal and Field Mode
 * Optimized for visibility in direct sunlight on mobile devices
 */
export function FieldModeToggle({ 
  variant = 'button', // 'button' | 'switch' | 'icon'
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = true,
  className = '',
}) {
  const { isFieldMode, toggleFieldMode } = useFieldMode();

  const sizeClasses = {
    sm: {
      button: 'p-2',
      icon: 'w-4 h-4',
      switch: 'w-12 h-7',
      thumb: 'w-5 h-5',
      thumbTranslate: 'translate-x-5',
    },
    md: {
      button: 'p-3',
      icon: 'w-5 h-5',
      switch: 'w-16 h-9',
      thumb: 'w-7 h-7',
      thumbTranslate: 'translate-x-7',
    },
    lg: {
      button: 'p-4',
      icon: 'w-6 h-6',
      switch: 'w-20 h-11',
      thumb: 'w-9 h-9',
      thumbTranslate: 'translate-x-9',
    },
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // Button variant - shows icon and optional label
  if (variant === 'button') {
    return (
      <button
        onClick={toggleFieldMode}
        className={`
          relative inline-flex items-center gap-2 rounded-lg font-semibold
          transition-all duration-200 active:scale-95
          ${isFieldMode 
            ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)]' 
            : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border hover:border-border-strong'
          }
          ${sizes.button}
          ${className}
        `}
        style={{ minHeight: 48, minWidth: 48 }}
        aria-pressed={isFieldMode}
        aria-label={isFieldMode ? 'Disable Field Mode' : 'Enable Field Mode'}
        title={isFieldMode ? 'Field Mode On - Optimized for outdoor use' : 'Enable Field Mode for outdoor visibility'}
      >
        <Sun 
          className={`${sizes.icon} ${isFieldMode ? 'animate-pulse' : ''}`}
          strokeWidth={isFieldMode ? 2.5 : 2}
        />
        {showLabel && (
          <span className="hidden sm:inline">
            {isFieldMode ? 'Field On' : 'Field Mode'}
          </span>
        )}
        
        {/* Active indicator dot */}
        {isFieldMode && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff4444] rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  // Switch variant - toggle switch style
  if (variant === 'switch') {
    return (
      <button
        onClick={toggleFieldMode}
        className={`
          relative rounded-full transition-all duration-200
          ${isFieldMode 
            ? 'bg-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.4)]' 
            : 'bg-surface-elevated border-2 border-border'
          }
          ${sizes.switch}
          ${className}
        `}
        style={{ minHeight: 48 }}
        aria-pressed={isFieldMode}
        aria-label={isFieldMode ? 'Disable Field Mode' : 'Enable Field Mode'}
      >
        <span
          className={`
            absolute top-1 left-1 rounded-full transition-transform duration-200
            ${isFieldMode 
              ? `${sizes.thumbTranslate} bg-black` 
              : 'translate-x-0 bg-text-secondary'
            }
            ${sizes.thumb}
          `}
        />
        
        {/* Icons inside switch */}
        <span className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <Sun 
            className={`w-3.5 h-3.5 ${isFieldMode ? 'text-black opacity-100' : 'text-transparent opacity-0'} transition-opacity`}
          />
          <Monitor 
            className={`w-3.5 h-3.5 ${!isFieldMode ? 'text-text-muted opacity-100' : 'text-transparent opacity-0'} transition-opacity`}
          />
        </span>
      </button>
    );
  }

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleFieldMode}
        className={`
          relative inline-flex items-center justify-center rounded-lg
          transition-all duration-200 active:scale-95
          ${isFieldMode 
            ? 'text-[#00ff88] bg-[#00ff88]/10 border-2 border-[#00ff88]' 
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
          }
          ${sizes.button}
          ${className}
        `}
        style={{ minHeight: 48, minWidth: 48 }}
        aria-pressed={isFieldMode}
        aria-label={isFieldMode ? 'Disable Field Mode' : 'Enable Field Mode'}
        title={isFieldMode ? 'Field Mode On' : 'Enable Field Mode'}
      >
        <Sun 
          className={sizes.icon}
          strokeWidth={isFieldMode ? 2.5 : 2}
        />
        
        {/* Status indicator */}
        <span 
          className={`
            absolute bottom-1 right-1 w-2 h-2 rounded-full
            ${isFieldMode ? 'bg-[#00ff88]' : 'bg-text-muted'}
          `}
        />
      </button>
    );
  }

  return null;
}

export default FieldModeToggle;
