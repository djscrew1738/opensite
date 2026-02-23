import { useEffect, useRef } from 'react';

/**
 * useFocusTrap - Traps focus within a modal/dialog element
 * Ensures keyboard navigation stays within the modal when open
 * 
 * @param {boolean} isActive - Whether the focus trap is active
 * @param {Function} onEscape - Callback when Escape key is pressed
 * @returns {React.RefObject} Ref to attach to the container element
 * 
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const ref = useFocusTrap(isOpen, onClose);
 *   return (
 *     <div ref={ref} role="dialog" aria-modal="true">
 *       // modal content
 *     </div>
 *   );
 * }
 */
export function useFocusTrap(isActive, onEscape) {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the element that had focus before the modal opened
    previousActiveElement.current = document.activeElement;

    // Find all focusable elements within the container
    const getFocusableElements = () => {
      const container = containerRef.current;
      if (!container) return [];

      const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]'
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors))
        .filter(el => {
          // Filter out hidden elements
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Focus the first element, or the autofocus element if present
      const autofocusElement = containerRef.current?.querySelector('[autofocus]');
      (autofocusElement || focusableElements[0]).focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab on first element -> move to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> move to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that had it before the modal opened
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return containerRef;
}

export default useFocusTrap;
