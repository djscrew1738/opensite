import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle({ compact = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-lg transition-all duration-300 group ${className}`}
      style={{
        width: compact ? '40px' : '44px',
        height: compact ? '40px' : '44px',
        background: theme === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.05)',
        border: `1px solid ${theme === 'dark' ? 'rgba(61, 57, 53, 0.2)' : 'rgba(200, 197, 191, 0.3)'}`,
      }}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon (visible in dark mode) */}
        <Sun
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
          }`}
          strokeWidth={2}
          style={{ color: '#3B82F6' }}
        />

        {/* Moon Icon (visible in light mode) */}
        <Moon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
          strokeWidth={2}
          style={{ color: '#5c574f' }}
        />
      </div>

      {/* Hover glow ring — reduced spread */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 8px rgba(59, 130, 246, 0.1)`,
          border: '1px solid rgba(59, 130, 246, 0.15)',
        }}
      />
    </button>
  );
}
