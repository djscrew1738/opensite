import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

/**
 * useTabAnimation - Shared hook for tab animations
 * 
 * Features:
 * - Directional slide animations based on tab order
 * - Automatic animation reset after duration
 * - Optional localStorage persistence
 * - Optional URL sync
 * 
 * @param {Array} tabs - Array of tab objects with id property
 * @param {Object} options - Configuration options
 * @param {string} options.defaultTab - Default active tab ID
 * @param {number} options.duration - Animation duration in ms (default: 350)
 * @param {string} options.persistKey - localStorage key for persistence
 * @param {boolean} options.syncUrl - Whether to sync with URL hash
 * @param {Function} options.onChange - Callback when tab changes
 * @returns {Object} { activeTab, direction, handleTabChange, setActiveTab }
 */
export function useTabAnimation(tabs, options = {}) {
  const {
    defaultTab,
    duration = 350,
    persistKey,
    syncUrl = false,
    onChange,
  } = options;

  // Get initial tab from URL, localStorage, or default
  const getInitialTab = useCallback(() => {
    // Check URL hash first if sync enabled
    if (syncUrl && typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash && tabs.some(t => t.id === hash)) return hash;
    }
    
    // Check localStorage if persist enabled
    if (persistKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(persistKey);
      if (stored && tabs.some(t => t.id === stored)) return stored;
    }
    
    // Fall back to default or first tab
    return defaultTab || tabs[0]?.id;
  }, [defaultTab, persistKey, syncUrl, tabs]);

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [direction, setDirection] = useState(null);
  const prevTab = useRef(activeTab);

  // Build tab order map for directional animations
  const tabOrder = useMemo(() => 
    tabs.reduce((acc, tab, idx) => ({ ...acc, [tab.id]: idx }), {}),
    [tabs]
  );

  // Reset animation direction after duration
  useEffect(() => {
    if (!direction) return;
    const timer = setTimeout(() => setDirection(null), duration);
    return () => clearTimeout(timer);
  }, [direction, duration, activeTab]);

  // Handle tab change with direction calculation
  const handleTabChange = useCallback((newTab) => {
    if (newTab === activeTab) return;
    
    // Calculate direction based on tab order
    const newDirection = tabOrder[newTab] > tabOrder[prevTab.current] ? 'left' : 'right';
    setDirection(newDirection);
    
    // Update refs and state
    const previousTab = prevTab.current;
    prevTab.current = newTab;
    setActiveTabState(newTab);
    
    // Persist if enabled
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(persistKey, newTab);
    }
    
    // Update URL if sync enabled
    if (syncUrl && typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${newTab}`);
    }
    
    // Call change handler
    onChange?.(newTab, previousTab);
  }, [activeTab, onChange, persistKey, syncUrl, tabOrder]);

  // Programmatic tab setter
  const setActiveTab = useCallback((tabId) => {
    if (tabs.some(t => t.id === tabId)) {
      handleTabChange(tabId);
    }
  }, [handleTabChange, tabs]);

  return {
    activeTab,
    direction,
    handleTabChange,
    setActiveTab,
  };
}

/**
 * useTabKeyboardNav - Keyboard navigation for tabs
 * 
 * @param {Object} options
 * @param {Array} options.tabs - Tab objects
 * @param {string} options.activeTab - Current active tab ID
 * @param {Function} options.onChange - Tab change handler
 * @param {boolean} options.enabled - Whether keyboard nav is enabled
 */
export function useTabKeyboardNav({ tabs, activeTab, onChange, enabled = true }) {
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;
    
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex === -1) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevTab = tabs[currentIndex - 1];
          if (!prevTab.disabled) onChange(prevTab.id);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          const nextTab = tabs[currentIndex + 1];
          if (!nextTab.disabled) onChange(nextTab.id);
        }
        break;
      case 'Home':
        e.preventDefault();
        const firstEnabled = tabs.find(t => !t.disabled);
        if (firstEnabled) onChange(firstEnabled.id);
        break;
      case 'End':
        e.preventDefault();
        const lastEnabled = [...tabs].reverse().find(t => !t.disabled);
        if (lastEnabled) onChange(lastEnabled.id);
        break;
      default:
        break;
    }
  }, [activeTab, enabled, onChange, tabs]);

  return { handleKeyDown };
}
