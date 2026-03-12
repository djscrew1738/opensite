import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { colors } from '../../styles/tokens';
import { useHaptic } from '../../hooks/useHaptic';

/* ═══════════════════════════════════════════════════════════════
   BottomSheet — Job Pulse Design System
   Mobile-first slide-up panel with drag-to-dismiss
   ═══════════════════════════════════════════════════════════════ */

// ── Snap point height mapping ────────────────────────────────
const SNAP_HEIGHTS = {
  half: 50,
  full: 90,
  auto: null,
};

// ── Dismiss threshold: drag past 25% of sheet height to close ─
const DISMISS_THRESHOLD = 0.25;
// Velocity threshold (px/ms) — fast flick dismisses regardless
const VELOCITY_THRESHOLD = 0.5;

/**
 * BottomSheet
 *
 * A mobile-first, draggable bottom sheet component.
 * Uses CSS transitions + native touch events (no animation libraries).
 *
 * @param {boolean}  isOpen     - Whether the sheet is visible
 * @param {function} onClose    - Callback fired when the sheet should close
 * @param {string}   title      - Header title text
 * @param {string}   [subtitle] - Optional subtitle below title
 * @param {'half'|'full'|'auto'} [snapPoint='full'] - Sheet height preset
 * @param {number}   [heightVh] - Custom height in vh (overrides snapPoint)
 * @param {React.ReactNode} children  - Scrollable content
 * @param {string}   [className] - Additional class names for the sheet body
 */
export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  subtitle,
  snapPoint = 'full',
  heightVh,
  children,
  className = '',
}) => {
  // ── State ────────────────────────────────────────────────
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoHeight, setAutoHeight] = useState(null);
  const [showHandleHint, setShowHandleHint] = useState(false);

  // ── Refs ─────────────────────────────────────────────────
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const triggerRef = useRef(null);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);
  const currentDragY = useRef(0);
  const passedThresholdRef = useRef(false);
  const haptic = useHaptic();

  // ── Compute resolved height ─────────────────────────────
  const resolvedHeightVh = heightVh || SNAP_HEIGHTS[snapPoint];

  // ── Open / Close orchestration ──────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Capture the element that triggered the sheet for focus return
      triggerRef.current = document.activeElement;

      // Mount immediately, then animate in on next frame
      setIsVisible(true);
      setDragOffset(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          // Show drag handle hint 600ms after sheet settles
          setTimeout(() => setShowHandleHint(true), 600);
          setTimeout(() => setShowHandleHint(false), 1400);
        });
      });

      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Animate out
      setIsAnimating(false);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setAutoHeight(null);

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to the trigger element
        if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
          triggerRef.current.focus();
        }
      }, 300); // matches CSS transition duration

      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Measure auto height ─────────────────────────────────
  useEffect(() => {
    if (isVisible && snapPoint === 'auto' && !heightVh && contentRef.current) {
      // Measure content + header + handle + safe area padding
      requestAnimationFrame(() => {
        if (contentRef.current && sheetRef.current) {
          const sheetRect = sheetRef.current.getBoundingClientRect();
          const contentHeight = contentRef.current.scrollHeight;
          // header height ~72px (handle 28px + header area ~44px) + content + padding
          const headerHeight = sheetRef.current.querySelector('[data-sheet-header]')?.offsetHeight || 0;
          const handleHeight = 28; // handle container height
          const totalHeight = handleHeight + headerHeight + contentHeight + 24; // 24px bottom padding
          const maxHeight = window.innerHeight * 0.9;
          setAutoHeight(Math.min(totalHeight, maxHeight));
        }
      });
    }
  }, [isVisible, snapPoint, heightVh, children]);

  // ── Keyboard: Escape to close ───────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ── Touch: Drag to dismiss ──────────────────────────────
  const handleTouchStart = useCallback((e) => {
    // Only track drag on the handle or header area, not scrollable content
    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    dragStartTime.current = Date.now();
    currentDragY.current = 0;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY.current;
    currentDragY.current = deltaY;

    // Only allow dragging downward (positive deltaY)
    if (deltaY > 0) {
      // Rubber-band resistance: drag feels heavy past threshold
      const visual = deltaY / (1 + deltaY * 0.006);
      setDragOffset(visual);

      // Haptic tick when crossing dismiss threshold
      const sheetHeight = sheetRef.current?.offsetHeight || window.innerHeight * 0.5;
      const threshold = sheetHeight * DISMISS_THRESHOLD;
      if (visual >= threshold && !passedThresholdRef.current) {
        passedThresholdRef.current = true;
        haptic.tick();
      } else if (visual < threshold && passedThresholdRef.current) {
        passedThresholdRef.current = false;
      }

      e.preventDefault();
    }
  }, [isDragging, haptic]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const delta = currentDragY.current;
    const elapsed = Date.now() - dragStartTime.current;
    const velocity = Math.abs(delta) / Math.max(elapsed, 1);

    // Get sheet height for threshold calculation
    const sheetHeight = sheetRef.current?.offsetHeight || window.innerHeight * 0.5;
    const thresholdDistance = sheetHeight * DISMISS_THRESHOLD;

    if (delta > thresholdDistance || velocity > VELOCITY_THRESHOLD) {
      haptic.confirm();
      setDragOffset(sheetHeight);
      setTimeout(() => {
        setDragOffset(0);
        onClose();
      }, 300);
    } else {
      // Snap back with no offset
      setDragOffset(0);
    }
    passedThresholdRef.current = false;
  }, [isDragging, onClose, haptic]);

  // ── Backdrop click ──────────────────────────────────────
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // ── Compute sheet style ─────────────────────────────────
  const getSheetStyle = () => {
    const style = {};

    // Height
    if (snapPoint === 'auto' && !heightVh) {
      if (autoHeight) {
        style.height = `${autoHeight}px`;
        style.maxHeight = '90vh';
      } else {
        style.maxHeight = '90vh';
      }
    } else {
      style.height = `${resolvedHeightVh}vh`;
    }

    // Transform: slide-up + drag offset
    if (!isAnimating && isVisible && dragOffset === 0) {
      // Initial state: fully off-screen
      style.transform = 'translateY(100%)';
    } else if (dragOffset > 0) {
      style.transform = `translateY(${dragOffset}px)`;
      style.transition = isDragging ? 'none' : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
    } else {
      style.transform = isAnimating ? 'translateY(0)' : 'translateY(100%)';
    }

    return style;
  };

  // ── Render ──────────────────────────────────────────────
  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Bottom sheet'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          opacity: isAnimating && dragOffset === 0 ? 1 : isAnimating ? Math.max(0, 1 - dragOffset / 400) : 0,
          transition: isDragging ? 'none' : 'opacity 300ms ease-out',
        }}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${className}`}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: 'var(--surface-elevated, #181C24)',
          borderTopLeftRadius: 'var(--radius-modal, 24px)',
          borderTopRightRadius: 'var(--radius-modal, 24px)',
          borderTop: '1px solid var(--border-default, #1F2430)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transition: isDragging
            ? 'none'
            : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...getSheetStyle(),
        }}
      >
        {/* Drag handle zone */}
        <div
          className="flex-shrink-0 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: 'grab' }}
        >
          {/* Handle pill */}
          <div
            className="flex items-center justify-center"
            style={{ paddingTop: 12, paddingBottom: 8 }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: showHandleHint
                  ? 'var(--color-blue-400, #60A5FA)'
                  : 'var(--border-strong, #2D3548)',
                transform: showHandleHint ? 'scaleX(1.25)' : 'scaleX(1)',
                transition: 'background 300ms ease, transform 300ms ease',
              }}
            />
          </div>

          {/* Header */}
          {(title || subtitle) && (
            <div
              data-sheet-header
              className="flex items-start justify-between gap-3 flex-shrink-0"
              style={{
                padding: '4px 20px 16px',
                borderBottom: '1px solid var(--border-default, #1F2430)',
              }}
            >
              <div className="flex-1 min-w-0">
                {title && (
                  <h2
                    className="font-bold tracking-tight truncate"
                    style={{
                      fontSize: 18,
                      lineHeight: '24px',
                      color: 'var(--text-primary, #F1F5F9)',
                    }}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    className="mt-0.5 truncate"
                    style={{
                      fontSize: 14,
                      lineHeight: '20px',
                      color: 'var(--text-secondary, #94A3B8)',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="flex items-center justify-center flex-shrink-0 rounded-lg transition-colors"
                style={{
                  width: 36,
                  height: 36,
                  minWidth: 36,
                  color: 'var(--text-muted, #475569)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.surface.elevated;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.text.muted;
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable content area */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide"
          style={{
            padding: '16px 20px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════════════════
   Named Variants — preset configurations for common use cases
   ═══════════════════════════════════════════════════════════════ */

/**
 * JobDetailSheet — Full-height sheet for viewing job details.
 * 90vh height, optimal for long-form content like job info,
 * timeline, phase history, and documents.
 */
export const JobDetailSheet = ({ children, ...props }) => (
  <BottomSheet
    {...props}
    snapPoint="full"
  >
    {children}
  </BottomSheet>
);
JobDetailSheet.displayName = 'JobDetailSheet';

/**
 * PhaseUpdateSheet — Half-height sheet for phase updates.
 * 50vh height, sized for quick phase transitions,
 * status changes, and confirmations.
 */
export const PhaseUpdateSheet = ({ children, ...props }) => (
  <BottomSheet
    {...props}
    snapPoint="half"
  >
    {children}
  </BottomSheet>
);
PhaseUpdateSheet.displayName = 'PhaseUpdateSheet';

/**
 * FilterSheet — 60vh sheet for filter panels.
 * Slightly taller than half for multi-section filter UIs
 * with phase selectors, date ranges, and builder filters.
 */
export const FilterSheet = ({ children, ...props }) => (
  <BottomSheet
    {...props}
    heightVh={60}
  >
    {children}
  </BottomSheet>
);
FilterSheet.displayName = 'FilterSheet';

/**
 * AlertDetailSheet — Half-height sheet for alert details.
 * 50vh height, used for inspection alerts, overdue notices,
 * and notification details.
 */
export const AlertDetailSheet = ({ children, ...props }) => (
  <BottomSheet
    {...props}
    snapPoint="half"
  >
    {children}
  </BottomSheet>
);
AlertDetailSheet.displayName = 'AlertDetailSheet';

/**
 * QuickAddSheet — Half-height sheet for quick-add forms.
 * 50vh height, optimized for single-field or short-form
 * inputs like adding a note, logging a call, or quick entry.
 */
export const QuickAddSheet = ({ children, ...props }) => (
  <BottomSheet
    {...props}
    snapPoint="half"
  >
    {children}
  </BottomSheet>
);
QuickAddSheet.displayName = 'QuickAddSheet';

export default BottomSheet;
