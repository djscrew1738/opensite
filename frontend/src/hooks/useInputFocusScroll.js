import { useEffect } from 'react';

const INPUT_SELECTORS = 'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select, [contenteditable="true"]';

// How many px of breathing room to leave between the input and the keyboard top
const PADDING = 16;

// Delay before scrolling — gives the keyboard time to fully open
const DELAY_MS = 320;

/**
 * useInputFocusScroll
 *
 * Globally ensures focused inputs are always visible when the mobile keyboard
 * opens. Attaches a passive focusin listener to the document.
 *
 * Uses window.visualViewport (widely supported) to know the visible area after
 * keyboard opens, then scrolls the element into view if it would be obscured.
 *
 * Wire once in your root Layout component:
 *   useInputFocusScroll();
 */
export function useInputFocusScroll() {
  useEffect(() => {
    // Only active on touch devices; desktop keyboard never obscures content
    const hasTouchScreen =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!hasTouchScreen) return;

    let timer = null;

    const scrollFocusedIntoView = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const el = document.activeElement;
        if (!el || !el.matches(INPUT_SELECTORS)) return;

        const vv = window.visualViewport;
        if (!vv) {
          // Fallback: native scrollIntoView
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return;
        }

        const rect = el.getBoundingClientRect();
        const visibleBottom = vv.offsetTop + vv.height;

        if (rect.bottom + PADDING > visibleBottom) {
          const scrollBy = rect.bottom + PADDING - visibleBottom;
          window.scrollBy({ top: scrollBy, behavior: 'smooth' });
        }
      }, DELAY_MS);
    };

    document.addEventListener('focusin', scrollFocusedIntoView, { passive: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', scrollFocusedIntoView);
    };
  }, []);
}

export default useInputFocusScroll;
