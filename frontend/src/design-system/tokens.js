/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DARK FORGE DESIGN TOKENS v2.0 — UI/UX Overhaul
 * CTL Plumbing LLC × DFW Field Operations
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Single source of truth for all design values.
 * NO HARDCODED VALUES IN COMPONENTS — always reference these tokens.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const colors = {
  transparent: 'transparent',
  current: 'currentColor',

  // ── Surface System (Refined for depth perception) ────────────────────────────
  surface: {
    base:      '#090A0C',   // Deepest layer — pure void
    primary:   '#0A0B0D',   // App background — blue-black
    secondary: '#0D0F12',   // Slightly elevated
    card:      '#111318',   // Card backgrounds
    elevated:  '#181C24',   // Modals, panels, dropdowns
    float:     '#1E232D',   // Floating elements, highest surface
    overlay:   'rgba(0, 0, 0, 0.65)',
    scrim:     'rgba(0, 0, 0, 0.85)',
  },

  // ── Border System (Refined for subtle hierarchy) ─────────────────────────────
  border: {
    ghost:   'rgba(255, 255, 255, 0.03)',  // Almost invisible
    subtle:  'rgba(255, 255, 255, 0.06)',  // Very subtle
    muted:   '#161A22',                    // Default separators
    default: '#1F2430',                    // Standard borders
    strong:  '#2D3548',                    // Active/focused
    bright:  '#3D4558',                    // Emphasized edges
    glow:    'rgba(59, 130, 246, 0.3)',    // Glowing borders
  },

  // ── Accent Palette (Enhanced Vibrancy) ───────────────────────────────────────
  accent: {
    // Primary scale
    50:  '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
    400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
    800: '#1E40AF', 900: '#1E3A8A', 950: '#172554',
    
    DEFAULT:  '#3B82F6',
    hover:    '#2563EB',
    active:   '#1D4ED8',
    muted:    'rgba(59, 130, 246, 0.12)',
    subtle:   'rgba(59, 130, 246, 0.08)',
    glow:     'rgba(59, 130, 246, 0.2)',
    glowStrong: 'rgba(59, 130, 246, 0.4)',
    
    // Vibrant variants
    blue:   '#3B82F6',
    cyan:   '#06B6D4',
    teal:   '#14B8A6',
    green:  '#10B981',
    lime:   '#84CC16',
    yellow: '#EAB308',
    amber:  '#F59E0B',
    orange: '#F97316',
    red:    '#EF4444',
    rose:   '#F43F5E',
    pink:   '#EC4899',
    purple: '#8B5CF6',
    violet: '#7C3AED',
    indigo: '#6366F1',
  },

  // ── Neon Accents (For dark mode vibrancy) ────────────────────────────────────
  neon: {
    blue:   '#00D4FF',
    cyan:   '#00F0FF',
    green:  '#00FF88',
    lime:   '#CCFF00',
    yellow: '#FFEE00',
    amber:  '#FFB800',
    orange: '#FF6B00',
    red:    '#FF3366',
    rose:   '#FF5588',
    pink:   '#FF66CC',
    purple: '#B829F7',
    violet: '#A855F7',
  },

  // ── Phase Colors (Construction Pipeline) ─────────────────────────────────────
  phase: {
    underground: { base: '#6366F1', glow: 'rgba(99, 102, 241, 0.4)', muted: 'rgba(99, 102, 241, 0.12)' },
    roughin:     { base: '#3B82F6', glow: 'rgba(59, 130, 246, 0.4)', muted: 'rgba(59, 130, 246, 0.12)' },
    topout:      { base: '#06B6D4', glow: 'rgba(6, 182, 212, 0.4)', muted: 'rgba(6, 182, 212, 0.12)' },
    trim:        { base: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', muted: 'rgba(16, 185, 129, 0.12)' },
    final:       { base: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)', muted: 'rgba(245, 158, 11, 0.12)' },
    complete:    { base: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', muted: 'rgba(16, 185, 129, 0.12)' },
  },

  // ── Text Colors (Enhanced Contrast Scale) ────────────────────────────────────
  text: {
    primary:   '#F8FAFC',   // Almost white — maximum contrast
    secondary: '#CBD5E1',   // Light gray — high readability
    tertiary:  '#94A3B8',   // Medium gray — supporting text
    muted:     '#64748B',   // Darker gray — placeholders
    disabled:  '#475569',   // Very dark — disabled states
    hint:      '#334155',   // Almost invisible — subtle hints
    inverse:   '#0F172A',   // Dark text on light backgrounds
  },

  // ── Semantic Colors (Complete with all states) ───────────────────────────────
  success: {
    DEFAULT: '#10B981',
    light:   '#34D399',
    dark:    '#059669',
    muted:   'rgba(16, 185, 129, 0.12)',
    subtle:  'rgba(16, 185, 129, 0.08)',
    glow:    'rgba(16, 185, 129, 0.4)',
    border:  'rgba(16, 185, 129, 0.2)',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light:   '#FBBF24',
    dark:    '#D97706',
    muted:   'rgba(245, 158, 11, 0.12)',
    subtle:  'rgba(245, 158, 11, 0.08)',
    glow:    'rgba(245, 158, 11, 0.4)',
    border:  'rgba(245, 158, 11, 0.2)',
  },
  danger: {
    DEFAULT: '#EF4444',
    light:   '#F87171',
    dark:    '#DC2626',
    muted:   'rgba(239, 68, 68, 0.12)',
    subtle:  'rgba(239, 68, 68, 0.08)',
    glow:    'rgba(239, 68, 68, 0.4)',
    border:  'rgba(239, 68, 68, 0.2)',
  },
  info: {
    DEFAULT: '#3B82F6',
    light:   '#60A5FA',
    dark:    '#2563EB',
    muted:   'rgba(59, 130, 246, 0.12)',
    subtle:  'rgba(59, 130, 246, 0.08)',
    glow:    'rgba(59, 130, 246, 0.4)',
    border:  'rgba(59, 130, 246, 0.2)',
  },

  // ── Data Visualization (Chart Colors) ────────────────────────────────────────
  chart: [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#F97316', '#6366F1', '#14B8A6',
  ],
  chartNeon: [
    '#00D4FF', '#B829F7', '#00F0FF', '#00FF88', '#FFB800',
    '#FF3366', '#FF66CC', '#FF6B00', '#7C3AED', '#00E5C9',
  ],

  // ── Builder Colors ───────────────────────────────────────────────────────────
  builder: {
    drhorton:  { base: '#3B82F6', muted: 'rgba(59, 130, 246, 0.15)', glow: 'rgba(59, 130, 246, 0.3)' },
    horizon:   { base: '#F59E0B', muted: 'rgba(245, 158, 11, 0.15)', glow: 'rgba(245, 158, 11, 0.3)' },
    other:     { base: '#8B5CF6', muted: 'rgba(139, 92, 246, 0.15)', glow: 'rgba(139, 92, 246, 0.3)' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY SYSTEM (Refined for better readability)
// ═══════════════════════════════════════════════════════════════════════════════

export const typography = {
  fontFamily: {
    sans:     "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display:  "'Inter', system-ui, -apple-system, sans-serif",
    mono:     "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
  },

  // Size scale with line-height pairs
  sizes: {
    '2xs':    { size: '11px', lineHeight: 1.4, letterSpacing: '0.02em' },
    'xs':     { size: '12px', lineHeight: 1.4, letterSpacing: '0.01em' },
    'sm':     { size: '13px', lineHeight: 1.5, letterSpacing: '0' },
    'base':   { size: '14px', lineHeight: 1.6, letterSpacing: '0' },
    'md':     { size: '15px', lineHeight: 1.6, letterSpacing: '0' },
    'lg':     { size: '16px', lineHeight: 1.5, letterSpacing: '-0.01em' },
    'xl':     { size: '18px', lineHeight: 1.4, letterSpacing: '-0.01em' },
    '2xl':    { size: '20px', lineHeight: 1.3, letterSpacing: '-0.02em' },
    '3xl':    { size: '24px', lineHeight: 1.2, letterSpacing: '-0.02em' },
    '4xl':    { size: '30px', lineHeight: 1.1, letterSpacing: '-0.02em' },
    '5xl':    { size: '36px', lineHeight: 1.1, letterSpacing: '-0.03em' },
  },

  // Semantic aliases
  display:    { size: '36px', lineHeight: 1.1, weight: 800, letterSpacing: '-0.03em' },
  h1:         { size: '30px', lineHeight: 1.2, weight: 700, letterSpacing: '-0.02em' },
  h2:         { size: '24px', lineHeight: 1.2, weight: 700, letterSpacing: '-0.02em' },
  h3:         { size: '20px', lineHeight: 1.3, weight: 600, letterSpacing: '-0.01em' },
  h4:         { size: '18px', lineHeight: 1.4, weight: 600, letterSpacing: '-0.01em' },
  body:       { size: '14px', lineHeight: 1.6, weight: 400, letterSpacing: '0' },
  bodyLarge:  { size: '15px', lineHeight: 1.6, weight: 400, letterSpacing: '0' },
  caption:    { size: '12px', lineHeight: 1.4, weight: 400, letterSpacing: '0.01em' },
  label:      { size: '11px', lineHeight: 1.4, weight: 600, letterSpacing: '0.03em' },
  button:     { size: '14px', lineHeight: 1.4, weight: 600, letterSpacing: '0' },
  mono:       { size: '13px', lineHeight: 1.5, weight: 500, letterSpacing: '0' },

  // Weights
  weight: {
    thin:       100,
    light:      300,
    regular:    400,
    medium:     500,
    semibold:   600,
    bold:       700,
    extrabold:  800,
    black:      900,
  },

  // Features for better rendering
  features: "'cv11', 'ss01', 'calt', 'liga'",
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPACING SYSTEM (8px base grid)
// ═══════════════════════════════════════════════════════════════════════════════

export const spacing = {
  0:  '0px',
  0.5: '2px',
  1:  '4px',
  1.5:'6px',
  2:  '8px',
  2.5:'10px',
  3:  '12px',
  3.5:'14px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  7:  '28px',
  8:  '32px',
  9:  '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
};

// Semantic spacing aliases
export const space = {
  none:   '0px',
  '3xs':  '2px',
  '2xs':  '4px',
  xs:     '8px',
  sm:     '12px',
  md:     '16px',
  lg:     '24px',
  xl:     '32px',
  '2xl':  '48px',
  '3xl':  '64px',
  '4xl':  '96px',
};

// ═══════════════════════════════════════════════════════════════════════════════
// RADIUS SYSTEM (Consistent corner rounding)
// ═══════════════════════════════════════════════════════════════════════════════

export const radius = {
  none:  '0px',
  xs:    '2px',
  sm:    '4px',
  md:    '6px',   // Buttons
  DEFAULT:'8px',  // Inputs
  lg:    '10px',
  xl:    '12px',  // Cards
  '2xl': '16px',  // Sheets
  '3xl': '20px',
  '4xl': '24px',  // Modals
  full:  '9999px',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW SYSTEM (Elevation & depth)
// ═══════════════════════════════════════════════════════════════════════════════

export const shadows = {
  // Elevation shadows
  none:   'none',
  xs:     '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm:     '0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25)',
  DEFAULT:'0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  md:     '0 6px 8px -1px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
  lg:     '0 10px 15px -3px rgba(0, 0, 0, 0.45), 0 4px 6px -4px rgba(0, 0, 0, 0.35)',
  xl:     '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  '2xl':  '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  inner:  'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  
  // Card shadows with inner highlight
  card: {
    rest:    '0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
    hover:   '0 2px 8px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
    active:  '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
  },

  // Glow effects
  glow: {
    sm:  '0 0 12px rgba(59, 130, 246, 0.25)',
    DEFAULT:'0 0 20px rgba(59, 130, 246, 0.3)',
    lg:  '0 0 30px rgba(59, 130, 246, 0.4)',
    xl:  '0 0 40px rgba(59, 130, 246, 0.5)',
    blue:'0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.15)',
    cyan:'0 0 20px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.15)',
    green:'0 0 20px rgba(16, 185, 129, 0.35), 0 0 60px rgba(16, 185, 129, 0.15)',
    amber:'0 0 20px rgba(245, 158, 11, 0.35), 0 0 60px rgba(245, 158, 11, 0.15)',
    red: '0 0 20px rgba(239, 68, 68, 0.35), 0 0 60px rgba(239, 68, 68, 0.15)',
    purple:'0 0 20px rgba(139, 92, 246, 0.35), 0 0 60px rgba(139, 92, 246, 0.15)',
    white:'0 0 20px rgba(255, 255, 255, 0.15), 0 0 60px rgba(255, 255, 255, 0.08)',
  },

  // Neon glows
  neon: {
    blue:   '0 0 5px #00D4FF, 0 0 20px #00D4FF, 0 0 40px rgba(0, 212, 255, 0.5)',
    cyan:   '0 0 5px #00F0FF, 0 0 20px #00F0FF, 0 0 40px rgba(0, 240, 255, 0.5)',
    green:  '0 0 5px #00FF88, 0 0 20px #00FF88, 0 0 40px rgba(0, 255, 136, 0.5)',
    purple: '0 0 5px #B829F7, 0 0 20px #B829F7, 0 0 40px rgba(184, 41, 247, 0.5)',
    pink:   '0 0 5px #FF66CC, 0 0 20px #FF66CC, 0 0 40px rgba(255, 102, 204, 0.5)',
    red:    '0 0 5px #FF3366, 0 0 20px #FF3366, 0 0 40px rgba(255, 51, 102, 0.5)',
    amber:  '0 0 5px #FFB800, 0 0 20px #FFB800, 0 0 40px rgba(255, 184, 0, 0.5)',
  },

  // Component-specific shadows
  fab:      '0 4px 16px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.15)',
  fabHover: '0 6px 24px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.25)',
  sheet:    '0 -8px 32px rgba(0, 0, 0, 0.5)',
  navFloat: '0 -4px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.1)',
  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  modal:    '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  tooltip:  '0 4px 12px rgba(0, 0, 0, 0.4)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION SYSTEM (Premium motion)
// ═══════════════════════════════════════════════════════════════════════════════

export const animation = {
  // Duration scale
  duration: {
    instant: '0ms',
    fastest: '50ms',
    fast:    '150ms',
    normal:  '200ms',
    medium:  '250ms',
    slow:    '300ms',
    slower:  '400ms',
    slowest: '500ms',
    enter:   '350ms',
    exit:    '250ms',
    complex: '450ms',
  },

  // Easing curves
  ease: {
    // Standard
    linear:      'linear',
    default:     'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Entrance
    enter:       'cubic-bezier(0.16, 1, 0.3, 1)',      // Decelerate
    enterExpo:   'cubic-bezier(0.22, 1, 0.36, 1)',     // Premium decelerate
    
    // Exit
    exit:        'cubic-bezier(0.4, 0, 1, 1)',         // Accelerate
    exitExpo:    'cubic-bezier(0.4, 0, 0.2, 1)',       // Premium accelerate
    
    // Movement
    move:        'cubic-bezier(0.4, 0, 0.2, 1)',       // Standard
    moveExpo:    'cubic-bezier(0.22, 1, 0.36, 1)',     // Smooth
    
    // Spring
    spring:      'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Overshoot
    springSoft:  'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy
    
    // Special
    bounce:      'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic:     'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  },

  // Stagger delays
  stagger: {
    none:   0,
    fast:   25,
    normal: 50,
    slow:   75,
    slower: 100,
  },

  // Performance
  willChange: 'transform, opacity',
  gpu: 'translateZ(0)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Z-INDEX SCALE
// ═══════════════════════════════════════════════════════════════════════════════

export const zIndex = {
  hide:     -1,
  base:      0,
  docked:   10,
  default:  20,
  dropdown: 30,
  sticky:   40,
  sidebar:  50,
  fab:      60,
  overlay:  70,
  nav:      80,
  sheet:    90,
  modal:    100,
  popover:  110,
  toast:    120,
  tooltip:  130,
};

// ═══════════════════════════════════════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

export const breakpoints = {
  xs:  320,
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  '2xl': 1536,
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

export const component = {
  // Cards
  card: {
    radius: radius.xl,
    padding: space.md,
    bg: colors.surface.card,
    border: colors.border.default,
    shadow: shadows.card.rest,
  },

  // Buttons
  button: {
    minHeight: '44px',
    minWidth:  '88px',
    radius: radius.md,
    padding: `${space.xs} ${space.md}`,
    fontSize: typography.button.size,
    fontWeight: typography.button.weight,
  },

  // Inputs
  input: {
    minHeight: '48px',
    radius: radius.DEFAULT,
    padding: `${space.sm} ${space.md}`,
    fontSize: typography.body.size,
    bg: colors.surface.secondary,
    border: colors.border.strong,
    borderFocus: colors.accent.DEFAULT,
  },

  // Touch targets
  touch: {
    min:  '44px',  // WCAG minimum
    row:  '48px',  // Comfortable row height
    fab:  '56px',  // FAB size
    icon: '40px',  // Icon button
  },

  // Focus ring
  focus: {
    width: '2px',
    offset: '2px',
    color: colors.accent.DEFAULT,
    shadow: `0 0 0 2px rgba(59, 130, 246, 0.3)`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const PHASES = [
  { key: 'underground', label: 'Underground', color: colors.phase.underground.base, order: 0 },
  { key: 'roughin',     label: 'Rough-In',    color: colors.phase.roughin.base,     order: 1 },
  { key: 'topout',      label: 'Top-Out',     color: colors.phase.topout.base,      order: 2 },
  { key: 'trim',        label: 'Trim',        color: colors.phase.trim.base,        order: 3 },
  { key: 'complete',    label: 'Complete',    color: colors.phase.final.base,       order: 4 },
];

export const PHASE_MAP = Object.fromEntries(PHASES.map(p => [p.key, p]));

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDER SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const BUILDERS = {
  drhorton: { 
    abbr: 'DRH', 
    label: 'DR Horton', 
    color: colors.builder.drhorton.base, 
    bg: colors.builder.drhorton.muted,
    glow: colors.builder.drhorton.glow,
  },
  horizon: { 
    abbr: 'HH', 
    label: 'Horizon Homes', 
    color: colors.builder.horizon.base, 
    bg: colors.builder.horizon.muted,
    glow: colors.builder.horizon.glow,
  },
  other: { 
    abbr: '??', 
    label: 'Other', 
    color: colors.builder.other.base, 
    bg: colors.builder.other.muted,
    glow: colors.builder.other.glow,
  },
};

export function getBuilder(name) {
  if (!name) return BUILDERS.other;
  const lower = name.toLowerCase();
  if (lower.includes('horton') || lower.includes('drh')) return BUILDERS.drhorton;
  if (lower.includes('horizon') || lower.includes('hh')) return BUILDERS.horizon;
  return { ...BUILDERS.other, abbr: name.slice(0, 2).toUpperCase() };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

export const a11y = {
  // Reduced motion
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  
  // Contrast
  minContrast: 4.5,
  enhancedContrast: 7,
  
  // Focus
  focusVisible: ':focus-visible',
  
  // Screen reader only
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
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
};
