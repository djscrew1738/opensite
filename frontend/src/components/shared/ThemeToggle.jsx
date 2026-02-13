import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`tap-target relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border-2 border-concrete-200 dark:border-gray-700 hover:border-accent-500 dark:hover:border-accent-500 transition-all duration-300 group ${className}`}
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon (visible in dark mode) */}
        <Sun
          className={`absolute inset-0 w-6 h-6 text-accent-500 transition-all duration-300 ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
          }`}
          strokeWidth={2.5}
        />

        {/* Moon Icon (visible in light mode) */}
        <Moon
          className={`absolute inset-0 w-6 h-6 text-primary-700 dark:text-accent-500 transition-all duration-300 ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
          strokeWidth={2.5}
        />
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-accent-500/0 group-hover:bg-accent-500/10 transition-colors duration-300" />
    </button>
  );
}
