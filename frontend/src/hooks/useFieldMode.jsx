import { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Field Mode Context
 * Provides ultra-high-contrast interface optimized for direct sunlight on mobile
 * Features:
 * - WCAG AAA contrast ratios
 * - Dark background (#0a0a0a) with bright accent colors
 * - Minimum 48x48px touch targets
 * - 18px base font size
 * - Extra padding for gloved-hand use
 * - Collapsible secondary information
 */

const FieldModeContext = createContext();

const FIELD_MODE_STORAGE_KEY = 'opensite-field-mode';

export function FieldModeProvider({ children }) {
  const [isFieldMode, setIsFieldMode] = useState(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FIELD_MODE_STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return false;
  });

  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply field mode class to document
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    if (isFieldMode) {
      root.classList.add('field-mode');
      body.classList.add('field-mode-active');
      
      // Force dark mode when field mode is active
      root.classList.add('dark');
    } else {
      root.classList.remove('field-mode');
      body.classList.remove('field-mode-active');
    }

    localStorage.setItem(FIELD_MODE_STORAGE_KEY, isFieldMode.toString());
  }, [isFieldMode]);

  const toggleFieldMode = useCallback(() => {
    setIsFieldMode(prev => !prev);
  }, []);

  const enableFieldMode = useCallback(() => {
    setIsFieldMode(true);
  }, []);

  const disableFieldMode = useCallback(() => {
    setIsFieldMode(false);
  }, []);

  const value = {
    isFieldMode,
    isMobile,
    toggleFieldMode,
    enableFieldMode,
    disableFieldMode,
  };

  return (
    <FieldModeContext.Provider value={value}>
      {children}
    </FieldModeContext.Provider>
  );
}

export function useFieldMode() {
  const context = useContext(FieldModeContext);
  if (!context) {
    throw new Error('useFieldMode must be used within FieldModeProvider');
  }
  return context;
}

export default useFieldMode;
