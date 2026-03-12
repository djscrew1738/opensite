/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DARK FORGE ANIMATION LIBRARY v2.0 — UI/UX Overhaul
 * Framer Motion variants & animation presets
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// EASING CURVES (Framer Motion format)
// ═══════════════════════════════════════════════════════════════════════════════

export const easings = {
  // Standard
  linear: [0, 0, 1, 1],
  default: [0.4, 0, 0.2, 1],
  
  // Entrance - decelerate
  enter: [0.16, 1, 0.3, 1],
  enterExpo: [0.22, 1, 0.36, 1],
  enterQuart: [0.25, 1, 0.5, 1],
  
  // Exit - accelerate
  exit: [0.4, 0, 1, 1],
  exitExpo: [0.4, 0, 0.2, 1],
  
  // Movement
  move: [0.4, 0, 0.2, 1],
  moveExpo: [0.22, 1, 0.36, 1],
  
  // Spring
  spring: [0.34, 1.56, 0.64, 1],
  springSoft: [0.68, -0.55, 0.265, 1.55],
  
  // Bounce
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.68, -0.6, 0.32, 1.6],
};

// ═══════════════════════════════════════════════════════════════════════════════
// DURATION PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const durations = {
  instant: 0,
  fastest: 0.05,
  fast: 0.15,
  normal: 0.2,
  medium: 0.25,
  slow: 0.3,
  slower: 0.4,
  slowest: 0.5,
  enter: 0.35,
  exit: 0.25,
  complex: 0.45,
  spring: 0.5,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const pageTransitions = {
  // Standard page enter
  enter: {
    initial: { opacity: 0, y: 8 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.enter,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      y: -4,
      transition: {
        duration: durations.exit,
        ease: easings.exit,
      }
    },
  },

  // Slide from right (detail pages)
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: durations.enter,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      x: -10,
      transition: {
        duration: durations.exit,
        ease: easings.exit,
      }
    },
  },

  // Slide from left (back navigation)
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: durations.enter,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      x: 10,
      transition: {
        duration: durations.exit,
        ease: easings.exit,
      }
    },
  },

  // Fade only (subtle)
  fade: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: durations.medium,
        ease: easings.default,
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: durations.fast,
        ease: easings.exit,
      }
    },
  },

  // Scale + fade (modals, dialogs)
  scale: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: durations.enter,
        ease: easings.spring,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      transition: {
        duration: durations.fast,
        ease: easings.exit,
      }
    },
  },

  // Bottom sheet style
  sheet: {
    initial: { opacity: 0, y: '100%' },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.slower,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      y: '100%',
      transition: {
        duration: durations.medium,
        ease: easings.exitExpo,
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAGGER CONTAINERS
// ═══════════════════════════════════════════════════════════════════════════════

export const staggerContainer = {
  // Fast stagger for lists
  fast: {
    animate: {
      transition: {
        staggerChildren: 0.025,
        delayChildren: 0.05,
      },
    },
  },

  // Normal stagger for cards
  default: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },

  // Slow stagger for emphasis
  slow: {
    animate: {
      transition: {
        staggerChildren: 0.075,
        delayChildren: 0.15,
      },
    },
  },

  // Cascade from top
  cascade: {
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0,
        staggerDirection: 1,
      },
    },
  },

  // Ripple from center
  ripple: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0,
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHILD ITEM ANIMATIONS (for stagger containers)
// ═══════════════════════════════════════════════════════════════════════════════

export const staggerItem = {
  // Fade up (standard)
  fadeUp: {
    initial: { opacity: 0, y: 12 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.medium,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: durations.fastest,
      }
    },
  },

  // Fade in place
  fade: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: durations.normal,
        ease: easings.default,
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: durations.fastest,
      }
    },
  },

  // Scale in (for icons, badges)
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: durations.medium,
        ease: easings.spring,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: {
        duration: durations.fast,
      }
    },
  },

  // Slide in from right
  slideRight: {
    initial: { opacity: 0, x: 16 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: durations.medium,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      x: -8,
      transition: {
        duration: durations.fast,
      }
    },
  },

  // Slide in from left
  slideLeft: {
    initial: { opacity: 0, x: -16 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: durations.medium,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      x: 8,
      transition: {
        duration: durations.fast,
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const cardAnimations = {
  // Standard card with hover
  interactive: {
    initial: { opacity: 0, y: 8 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.medium,
        ease: easings.enterExpo,
      }
    },
    hover: { 
      y: -2, 
      scale: 1.01,
      transition: {
        duration: durations.fast,
        ease: easings.default,
      }
    },
    tap: { 
      scale: 0.99,
      transition: {
        duration: durations.fastest,
      }
    },
  },

  // Static card (no hover effects)
  static: {
    initial: { opacity: 0, y: 8 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.medium,
        ease: easings.enterExpo,
      }
    },
  },

  // Elevated card with shadow animation
  elevated: {
    initial: { opacity: 0, y: 12, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' },
    animate: { 
      opacity: 1, 
      y: 0,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      transition: {
        duration: durations.medium,
        ease: easings.enterExpo,
      }
    },
    hover: { 
      y: -3, 
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
      transition: {
        duration: durations.normal,
        ease: easings.default,
      }
    },
    tap: { 
      y: -1,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      transition: {
        duration: durations.fastest,
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const buttonAnimations = {
  // Standard button
  default: {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: {
        duration: durations.fast,
        ease: easings.default,
      }
    },
    tap: { 
      scale: 0.97,
      transition: {
        duration: durations.fastest,
      }
    },
    disabled: {
      scale: 1,
      opacity: 0.5,
    },
  },

  // Icon button
  icon: {
    initial: { scale: 1 },
    hover: { 
      scale: 1.1,
      rotate: 2,
      transition: {
        duration: durations.fast,
        ease: easings.spring,
      }
    },
    tap: { 
      scale: 0.9,
      rotate: 0,
      transition: {
        duration: durations.fastest,
      }
    },
  },

  // FAB (Floating Action Button)
  fab: {
    initial: { opacity: 0, scale: 0, y: 20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: durations.slower,
        ease: easings.spring,
      }
    },
    hover: { 
      scale: 1.05,
      boxShadow: '0 6px 24px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.25)',
      transition: {
        duration: durations.fast,
      }
    },
    tap: { 
      scale: 0.95,
      transition: {
        duration: durations.fastest,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 10,
      transition: {
        duration: durations.fast,
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL/DIALOG ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const modalAnimations = {
  // Backdrop
  backdrop: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: durations.fast,
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: durations.fast,
        delay: 0.05,
      }
    },
  },

  // Modal content
  content: {
    initial: { opacity: 0, scale: 0.96, y: 16 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: durations.enter,
        ease: easings.spring,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.98,
      y: 8,
      transition: {
        duration: durations.fast,
        ease: easings.exit,
      }
    },
  },

  // Slide-up modal (mobile style)
  slideUp: {
    initial: { opacity: 0, y: '100%' },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.slower,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      y: '30%',
      transition: {
        duration: durations.medium,
        ease: easings.exitExpo,
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const loadingAnimations = {
  // Pulse (for dots, indicators)
  pulse: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    },
  },

  // Shimmer (for skeletons)
  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }
    },
  },

  // Spin (for loaders)
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }
    },
  },

  // Bounce (for waiting indicators)
  bounce: {
    animate: {
      y: [0, -6, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    },
  },

  // Dots loading
  dots: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.15,
        }
      }
    },
    dot: {
      animate: {
        y: [0, -8, 0],
        opacity: [0.5, 1, 0.5],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const feedbackAnimations = {
  // Success checkmark
  success: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: easings.enterExpo,
      }
    },
  },

  // Error shake
  shake: {
    animate: {
      x: [0, -8, 8, -8, 8, 0],
      transition: {
        duration: 0.4,
      }
    },
  },

  // Bounce in (for notifications)
  bounceIn: {
    initial: { opacity: 0, scale: 0.5, y: -20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: durations.slower,
        ease: easings.spring,
      }
    },
    exit: { 
      opacity: 0, 
      x: 100,
      transition: {
        duration: durations.normal,
      }
    },
  },

  // Glow pulse
  glowPulse: {
    animate: {
      boxShadow: [
        '0 0 20px rgba(59, 130, 246, 0.2)',
        '0 0 30px rgba(59, 130, 246, 0.4)',
        '0 0 20px rgba(59, 130, 246, 0.2)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIST ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const listAnimations = {
  // Item enter
  itemEnter: {
    initial: { opacity: 0, x: -10 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: durations.normal,
        ease: easings.enterExpo,
      }
    },
    exit: { 
      opacity: 0, 
      x: 10,
      height: 0,
      marginBottom: 0,
      transition: {
        duration: durations.fast,
      }
    },
  },

  // Item reorder
  reorder: {
    layout: true,
    transition: {
      duration: durations.medium,
      ease: easings.spring,
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════════════════════════════════

export const scrollReveal = {
  // Fade up on scroll
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    whileInView: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: durations.slower,
        ease: easings.enterExpo,
      }
    },
    viewport: { once: true, margin: '-50px' },
  },

  // Scale up on scroll
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    whileInView: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: durations.slower,
        ease: easings.spring,
      }
    },
    viewport: { once: true, margin: '-50px' },
  },

  // Stagger children on scroll
  stagger: {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.08,
      }
    },
    viewport: { once: true, margin: '-50px' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOVER EFFECTS
// ═══════════════════════════════════════════════════════════════════════════════

export const hoverEffects = {
  // Lift
  lift: {
    rest: { y: 0 },
    hover: { 
      y: -2,
      transition: {
        duration: durations.fast,
        ease: easings.default,
      }
    },
  },

  // Glow
  glow: {
    rest: { 
      boxShadow: '0 0 0 rgba(59, 130, 246, 0)',
    },
    hover: { 
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
      transition: {
        duration: durations.normal,
      }
    },
  },

  // Border glow
  borderGlow: {
    rest: { 
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    hover: { 
      borderColor: 'rgba(59, 130, 246, 0.5)',
      transition: {
        duration: durations.fast,
      }
    },
  },

  // Scale
  scale: {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: {
        duration: durations.fast,
        ease: easings.spring,
      }
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// NUMBER ANIMATION (count up)
// ═══════════════════════════════════════════════════════════════════════════════

export const useCountUp = (end, duration = 1, start = 0) => {
  return {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.3,
      }
    },
    custom: { end, duration, start },
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// REDUCED MOTION
// ═══════════════════════════════════════════════════════════════════════════════

export const reducedMotion = {
  // Fallback for users who prefer reduced motion
  disabled: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// Check if user prefers reduced motion
export const useReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get animation props with reduced motion support
export const getAccessibleAnimation = (animation, shouldReduceMotion) => {
  if (shouldReduceMotion) {
    return reducedMotion.disabled;
  }
  return animation;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  easings,
  durations,
  pageTransitions,
  staggerContainer,
  staggerItem,
  cardAnimations,
  buttonAnimations,
  modalAnimations,
  loadingAnimations,
  feedbackAnimations,
  listAnimations,
  scrollReveal,
  hoverEffects,
  useCountUp,
  reducedMotion,
  useReducedMotion,
  getAccessibleAnimation,
};
