/**
 * ThemeToggle Component
 * Toggle button for dark/light mode with animated icons
 * 
 * @module components/shared/ThemeToggle
 */

import { memo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../styles/tokens';

/**
 * ThemeToggle - Toggle button for dark/light mode
 * 
 * @param {{
 *   compact?: boolean,
 *   className?: string
 * }} props
 */
const ThemeToggle = memo(function ThemeToggle({ compact = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const size = compact ? '40px' : '44px';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-lg transition-all duration-300 group ${className}`}
      style={{
        width: size,
        height: size,
        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        border: `1px solid ${isDark ? 'rgba(61, 57, 53, 0.2)' : 'rgba(200, 197, 191, 0.3)'}`,
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon (visible in dark mode) */}
        <Sun
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
          }`}
          strokeWidth={2}
          style={{ color: colors.accent.DEFAULT }}
        />

        {/* Moon Icon (visible in light mode) */}
        <Moon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            !isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
          strokeWidth={2}
          style={{ color: colors.text.muted }}
        />
      </div>

      {/* Hover glow ring — reduced spread */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 8px ${colors.accent.glow}`,
          border: `1px solid ${colors.accent.muted}`,
        }}
      />
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
