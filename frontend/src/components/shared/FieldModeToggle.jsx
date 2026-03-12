/**
 * FieldModeToggle Component
 * A toggle button for switching between normal and Field Mode
 * Optimized for visibility in direct sunlight on mobile devices
 * 
 * @module components/shared/FieldModeToggle
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Monitor } from 'lucide-react';
import { useFieldMode } from '../../hooks/useFieldMode';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** Field mode accent color - high visibility green */
const FIELD_MODE_GREEN = '#00ff88';

/** Field mode indicator dot color */
const FIELD_MODE_INDICATOR = '#ff4444';

// ═══════════════════════════════════════════════════════════════
// Size Configurations
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, Record<string, string>>} */
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

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Button variant - shows icon and optional label
 */
const ButtonVariant = memo(function ButtonVariant({
  isFieldMode,
  onToggle,
  sizes,
  showLabel,
  className,
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      className={`
        relative inline-flex items-center gap-2 rounded-lg font-semibold
        transition-colors duration-200
        ${isFieldMode
          ? 'text-black'
          : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border hover:border-border-strong'
        }
        ${sizes.button}
        ${className}
      `}
      style={{
        minHeight: 48,
        minWidth: 48,
        backgroundColor: isFieldMode ? FIELD_MODE_GREEN : undefined,
        boxShadow: isFieldMode ? `0 0 20px ${FIELD_MODE_GREEN}66` : undefined,
      }}
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
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: FIELD_MODE_INDICATOR }}
        />
      )}
    </motion.button>
  );
});

ButtonVariant.displayName = 'ButtonVariant';

/**
 * Switch variant - toggle switch style
 */
const SwitchVariant = memo(function SwitchVariant({
  isFieldMode,
  onToggle,
  sizes,
  className,
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative rounded-full transition-all duration-200
        ${isFieldMode 
          ? '' 
          : 'bg-surface-elevated border-2 border-border'
        }
        ${sizes.switch}
        ${className}
      `}
      style={{ 
        minHeight: 48,
        backgroundColor: isFieldMode ? FIELD_MODE_GREEN : undefined,
        boxShadow: isFieldMode ? `0 0 20px ${FIELD_MODE_GREEN}66` : undefined,
      }}
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
});

SwitchVariant.displayName = 'SwitchVariant';

/**
 * Icon-only variant
 */
const IconVariant = memo(function IconVariant({
  isFieldMode,
  onToggle,
  sizes,
  className,
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      className={`
        relative inline-flex items-center justify-center rounded-lg
        transition-colors duration-200
        ${!isFieldMode
          ? 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
          : ''
        }
        ${sizes.button}
        ${className}
      `}
      style={{
        minHeight: 48,
        minWidth: 48,
        backgroundColor: isFieldMode ? `${FIELD_MODE_GREEN}1A` : undefined,
        border: isFieldMode ? `2px solid ${FIELD_MODE_GREEN}` : undefined,
        color: isFieldMode ? FIELD_MODE_GREEN : undefined,
      }}
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
        className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
        style={{ backgroundColor: isFieldMode ? FIELD_MODE_GREEN : colors.text.muted }}
      />
    </motion.button>
  );
});

IconVariant.displayName = 'IconVariant';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * FieldModeToggle - Toggle for field mode (outdoor visibility)
 * 
 * @param {{
 *   variant?: 'button' | 'switch' | 'icon',
 *   size?: 'sm' | 'md' | 'lg',
 *   showLabel?: boolean,
 *   className?: string
 * }} props
 */
const FieldModeToggle = memo(function FieldModeToggle({ 
  variant = 'button',
  size = 'md',
  showLabel = true,
  className = '',
}) {
  const { isFieldMode, toggleFieldMode } = useFieldMode();
  const sizes = sizeClasses[size] || sizeClasses.md;

  const commonProps = {
    isFieldMode,
    onToggle: toggleFieldMode,
    sizes,
    className,
  };

  if (variant === 'button') {
    return <ButtonVariant {...commonProps} showLabel={showLabel} />;
  }

  if (variant === 'switch') {
    return <SwitchVariant {...commonProps} />;
  }

  if (variant === 'icon') {
    return <IconVariant {...commonProps} />;
  }

  return null;
});

FieldModeToggle.displayName = 'FieldModeToggle';

export default FieldModeToggle;
