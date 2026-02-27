import { useState, useCallback } from 'react';

/**
 * useSettingsAppearance Hook
 * Manages appearance settings state (stored in localStorage)
 */
export function useSettingsAppearance() {
  const [themePreference, setThemePreference] = useState(() =>
    localStorage.getItem('theme_preference') || 'system'
  );
  const [compactSidebar, setCompactSidebar] = useState(() =>
    localStorage.getItem('compact_sidebar') === 'true'
  );
  const [denseMode, setDenseMode] = useState(() =>
    localStorage.getItem('dense_mode') === 'true'
  );
  const [animationsEnabled, setAnimationsEnabled] = useState(() =>
    localStorage.getItem('animations_enabled') !== 'false'
  );
  const [dateFormat, setDateFormat] = useState(() =>
    localStorage.getItem('date_format') || 'MM/DD/YYYY'
  );
  const [numberFormat, setNumberFormat] = useState(() =>
    localStorage.getItem('number_format') || 'US'
  );

  const handleApplyTheme = useCallback((pref) => {
    setThemePreference(pref);
    localStorage.setItem('theme_preference', pref);
    if (pref === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      localStorage.setItem('theme', pref);
      document.documentElement.classList.toggle('dark', pref === 'dark');
    }
  }, []);

  const handleSaveAppearance = useCallback((showToast) => {
    localStorage.setItem('compact_sidebar', String(compactSidebar));
    localStorage.setItem('dense_mode', String(denseMode));
    localStorage.setItem('animations_enabled', String(animationsEnabled));
    localStorage.setItem('date_format', dateFormat);
    localStorage.setItem('number_format', numberFormat);
    showToast?.('Appearance settings saved');
  }, [compactSidebar, denseMode, animationsEnabled, dateFormat, numberFormat]);

  return {
    themePreference,
    setThemePreference,
    compactSidebar,
    setCompactSidebar,
    denseMode,
    setDenseMode,
    animationsEnabled,
    setAnimationsEnabled,
    dateFormat,
    setDateFormat,
    numberFormat,
    setNumberFormat,
    handleApplyTheme,
    handleSaveAppearance,
  };
}
