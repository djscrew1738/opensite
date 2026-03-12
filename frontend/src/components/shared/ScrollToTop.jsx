import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';

const SHOW_THRESHOLD = 320; // px from top before button appears

/**
 * ScrollToTop
 *
 * A ghost FAB that fades in once the user has scrolled past SHOW_THRESHOLD.
 * On mobile it positions itself above the tab bar.
 * On desktop it sits above the standard bottom-right corner.
 *
 * Usage: drop once inside your Layout or page root.
 * No props required.
 *
 * @example
 * <ScrollToTop />
 */
export function ScrollToTop({ scrollContainer = window }) {
  const [visible, setVisible] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    const el = scrollContainer === window ? window : scrollContainer;
    const getScrollY = () =>
      scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;

    const onScroll = () => {
      setVisible(getScrollY() > SHOW_THRESHOLD);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollContainer]);

  const scrollToTop = useCallback(() => {
    haptic.tap();
    const el = scrollContainer === window ? window : scrollContainer;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scrollContainer, haptic]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-to-top"
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          whileTap={{ scale: 0.85 }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={[
            // Fixed position — above mobile tab bar on small screens
            'fixed z-40',
            // Mobile: bottom-right above tab bar
            'bottom-[88px] right-4',
            // Desktop: normal bottom-right
            'md:bottom-6 md:right-6',
            // Size
            'w-9 h-9',
            // Visual — ghost style
            'rounded-full',
            'flex items-center justify-center',
            'backdrop-blur-md',
            'border',
          ].join(' ')}
          style={{
            background: 'rgba(13, 15, 18, 0.75)',
            borderColor: 'rgba(45, 53, 72, 0.8)',
            color: 'rgba(148, 163, 184, 0.9)', // text-secondary
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default ScrollToTop;
