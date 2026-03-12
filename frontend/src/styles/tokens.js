/**
 * Dark Forge Design Tokens — Job Pulse
 * ═════════════════════════════════════
 * Single source of truth. No hardcoded values in components.
 * CTL Plumbing LLC × DFW Field Operations
 */

// ═══════════════════════════════════════════════
// COLOR TOKENS
// ═══════════════════════════════════════════════

export const colors = {
  transparent: 'transparent',
  current: 'currentColor',

  // ── Surface System ─────────────────────────────
  surface: {
    primary:  '#0A0B0D',   // App background — blue-black
    card:     '#111318',   // Card backgrounds
    elevated: '#181C24',   // Modals, panels, dropdowns
    overlay:  'rgba(0, 0, 0, 0.6)',
  },

  // ── Border System ──────────────────────────────
  border: {
    default: '#1F2430',
    strong:  '#2D3548',
    muted:   '#161A22',
  },

  // ── Accent Colors ──────────────────────────────
  accent: {
    DEFAULT:  '#3B82F6',
    blue:     '#3B82F6',
    light:    '#60A5FA',
    hover:    '#2563EB',
    muted:    'rgba(59, 130, 246, 0.12)',
    glow:     'rgba(59, 130, 246, 0.15)',
    green:    '#10B981',
    amber:    '#F59E0B',
    red:      '#EF4444',
    purple:   '#8B5CF6',
    pink:     '#EC4899',
  },

  // ── Phase Colors ───────────────────────────────
  phase: {
    underground: '#6366F1',
    roughin:     '#3B82F6',
    topout:      '#06B6D4',
    trim:        '#10B981',
    final:       '#F59E0B',
  },

  // ── Text Colors ────────────────────────────────
  text: {
    primary:   '#F1F5F9',
    secondary: '#94A3B8',
    muted:     '#475569',
    disabled:  '#334155',
    inverse:   '#0F172A',
  },

  // ── Semantic Colors ────────────────────────────
  success: { 
    DEFAULT: '#10B981', 
    light: '#34D399', 
    dark: '#059669', 
    muted: 'rgba(16, 185, 129, 0.12)',
    glow: 'rgba(16, 185, 129, 0.4)',
    border: 'rgba(16, 185, 129, 0.2)',
  },
  warning: { 
    DEFAULT: '#F59E0B', 
    light: '#FBBF24', 
    dark: '#D97706', 
    muted: 'rgba(245, 158, 11, 0.12)',
    glow: 'rgba(245, 158, 11, 0.4)',
    border: 'rgba(245, 158, 11, 0.2)',
  },
  danger:  { 
    DEFAULT: '#EF4444', 
    light: '#F87171', 
    dark: '#DC2626', 
    muted: 'rgba(239, 68, 68, 0.12)',
    glow: 'rgba(239, 68, 68, 0.4)',
    border: 'rgba(239, 68, 68, 0.2)',
  },
  info:    { 
    DEFAULT: '#3B82F6', 
    light: '#60A5FA', 
    dark: '#2563EB', 
    muted: 'rgba(59, 130, 246, 0.12)',
    glow: 'rgba(59, 130, 246, 0.4)',
    border: 'rgba(59, 130, 246, 0.2)',
  },

  // ── Builder Colors ─────────────────────────────
  builder: {
    drhorton: '#3B82F6',
    horizon:  '#F59E0B',
    other:    '#8B5CF6',
  },
};

// ═══════════════════════════════════════════════
// PHASE SYSTEM
// ═══════════════════════════════════════════════

export const PHASES = [
  { key: 'underground', label: 'Underground', color: '#6366F1', order: 0 },
  { key: 'roughin',     label: 'Rough-In',    color: '#3B82F6', order: 1 },
  { key: 'topout',      label: 'Top-Out',     color: '#06B6D4', order: 2 },
  { key: 'trim',        label: 'Trim',        color: '#10B981', order: 3 },
  { key: 'complete',    label: 'Complete',    color: '#F59E0B', order: 4 },
];

export const PHASE_MAP = Object.fromEntries(PHASES.map(p => [p.key, p]));

// ═══════════════════════════════════════════════
// BUILDER SYSTEM
// ═══════════════════════════════════════════════

export const BUILDERS = {
  drhorton: { abbr: 'DRH', label: 'DR Horton',     color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  horizon:  { abbr: 'HH',  label: 'Horizon Homes',  color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  other:    { abbr: '??',  label: 'Other',           color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
};

export function getBuilder(name) {
  if (!name) return BUILDERS.other;
  const lower = name.toLowerCase();
  if (lower.includes('horton') || lower.includes('drh')) return BUILDERS.drhorton;
  if (lower.includes('horizon') || lower.includes('hh')) return BUILDERS.horizon;
  return { ...BUILDERS.other, abbr: name.slice(0, 2).toUpperCase() };
}

// ═══════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════

export const typography = {
  fontFamily: {
    sans:    "'Inter', system-ui, -apple-system, sans-serif",
    display: "'Inter', system-ui, -apple-system, sans-serif",
    mono:    "'JetBrains Mono', monospace",
  },
  fontSize: {
    display:    '40px',
    heading:    '22px',
    subheading: '17px',
    label:      '15px',
    body:       '15px',
    caption:    '13px',
    mono:       '14px',
  },
  fontWeight: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
    extrabold: 800,
  },
  lineHeight: {
    display: 1.2,
    heading: 1.2,
    subheading: 1.4,
    label: 1.4,
    body: 1.5,
    caption: 1.4,
    mono: 1.4,
  },
  letterSpacing: {
    tight:  '-0.02em',
    normal: '0',
    wide:   '0.02em',
  },
};

// ═══════════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════════

export const spacing = {
  0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px',
  5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px',
  16: '64px', 20: '80px', 24: '96px',
};

// ═══════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════

export const radius = {
  none:  '0px',
  sm:    '4px',
  btn:   '6px',
  input: '8px',
  md:    '10px',
  card:  '12px',
  sheet: '16px',
  xl:    '20px',
  modal: '24px',
  full:  '9999px',
};

// ═══════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════

export const shadows = {
  card:      '0 2px 8px rgba(0, 0, 0, 0.4)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.6)',
  glowBlue:  '0 0 20px rgba(59, 130, 246, 0.15)',
  glowRed:   '0 0 12px rgba(239, 68, 68, 0.4)',
  glowAmber: '0 0 12px rgba(245, 158, 11, 0.4)',
  fab:       '0 4px 16px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.15)',
  sheet:     '0 -8px 32px rgba(0, 0, 0, 0.5)',
  navFloat:  '0 -4px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.1)',
};

// ═══════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════

export const animation = {
  duration: {
    fast:   '150ms',
    normal: '200ms',
    medium: '250ms',
    slow:   '300ms',
    sheet:  '300ms',
    count:  '800ms',
  },
  ease: {
    premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
    out:     'cubic-bezier(0, 0, 0.2, 1)',
    spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  stagger: {
    card: 25,    // ms between cards
    skeleton: 50, // ms between skeleton items
  },
};

// ═══════════════════════════════════════════════
// Z-INDEX
// ═══════════════════════════════════════════════

export const zIndex = {
  base:      0,
  docked:    10,
  dropdown:  20,
  sticky:    30,
  sidebar:   40,
  fab:       40,
  overlay:   50,
  nav:       50,
  sheet:     50,
  modal:     60,
  toast:     70,
  tooltip:   80,
};

// ═══════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════

export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// ═══════════════════════════════════════════════
// COMPONENT TOKENS
// ═══════════════════════════════════════════════

export const component = {
  card: {
    radius: radius.card,
    bg: colors.surface.card,
    border: colors.border.default,
    shadow: shadows.card,
  },
  input: {
    minHeight: '52px',
    radius: radius.input,
    fontSize: '16px',
  },
  button: {
    minHeight: '48px',
    radius: radius.btn,
  },
  bottomSheet: {
    radius: radius.modal,
    bg: colors.surface.elevated,
  },
  nav: {
    mobileHeight: '64px',
    sidebarExpanded: '240px',
    sidebarCollapsed: '64px',
  },
  touch: {
    minTap: '48px',
    minRow: '56px',
    minInput: '52px',
    minSpacing: '8px',
  },
};
