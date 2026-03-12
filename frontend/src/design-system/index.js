/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DARK FORGE DESIGN SYSTEM v2.0 — UI/UX Overhaul
 * Main export file
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Tokens
export { 
  default as tokens,
  colors,
  typography,
  spacing,
  space,
  radius,
  shadows,
  animation,
  zIndex,
  breakpoints,
  component,
  PHASES,
  PHASE_MAP,
  BUILDERS,
  getBuilder,
  a11y,
} from './tokens';

// Animations
export {
  default as animations,
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
  useReducedMotion as checkReducedMotion,
  getAccessibleAnimation,
} from './animations';

// Hooks
export {
  default as hooks,
  useReducedMotion,
  useHover,
  usePress,
  useInteraction,
  useCountUp as useAnimatedCount,
  useInView,
  useDebouncedValue,
  useThrottledCallback,
  useLongPress,
  useRipple,
  useFocusTrap,
  useScrollPosition,
  useWindowSize,
  useKeyPress,
  useKeyCombo,
  useOnlineStatus,
  useMediaQuery,
  useIsTouchDevice,
  useSmoothScroll,
  useLoadingState,
  useAnimationSequence,
  useTooltipPosition,
} from './hooks';

// Styles (import for side effects)
import './styles.css';

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACCESS HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get color with fallback
 */
export const getColor = (path, fallback = 'transparent') => {
  const keys = path.split('.');
  let result = colors;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined) return fallback;
  }
  return result;
};

/**
 * Get shadow with color override
 */
export const getShadow = (name, color = 'blue') => {
  const shadowMap = {
    glow: shadows.glow,
    neon: shadows.neon,
  };
  return shadowMap[name]?.[color] || shadows[name] || shadows.DEFAULT;
};

/**
 * Get animation duration in ms
 */
export const getDuration = (name) => {
  const durationMap = {
    instant: 0,
    fastest: 50,
    fast: 150,
    normal: 200,
    medium: 250,
    slow: 300,
    slower: 400,
    slowest: 500,
  };
  return durationMap[name] || 200;
};

/**
 * Get easing function
 */
export const getEasing = (name) => {
  return easings[name] || easings.default;
};

/**
 * Combine class names
 */
export const cx = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Create variant styles
 */
export const createVariants = (base, variants) => {
  return (variant = 'default') => {
    const variantStyles = variants[variant] || variants.default || {};
    return cx(base, variantStyles);
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT STYLE VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const buttonVariants = createVariants('ds-btn', {
  primary: 'ds-btn-primary',
  secondary: 'ds-btn-secondary',
  ghost: 'ds-btn-ghost',
  danger: 'ds-btn-danger',
  icon: 'ds-btn-icon',
});

export const cardVariants = createVariants('ds-card', {
  default: '',
  interactive: 'ds-card-interactive',
  elevated: 'ds-card-elevated',
  glass: 'ds-card-glass',
});

export const badgeVariants = createVariants('ds-badge', {
  default: '',
  hot: 'ds-badge-hot',
  warm: 'ds-badge-warm',
  cool: 'ds-badge-cool',
  success: 'ds-badge-success',
  info: 'ds-badge-info',
});

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM INFO
// ═══════════════════════════════════════════════════════════════════════════════

export const DESIGN_SYSTEM = {
  name: 'Dark Forge',
  version: '2.0.0',
  description: 'Industrial Control Room Aesthetic with Premium Micro-interactions',
  theme: 'dark',
  lastUpdated: '2026-03-12',
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  tokens,
  animations,
  hooks,
  getColor,
  getShadow,
  getDuration,
  getEasing,
  cx,
  createVariants,
  buttonVariants,
  cardVariants,
  badgeVariants,
  DESIGN_SYSTEM,
};
