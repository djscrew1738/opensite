/** @type {import('tailwindcss').Config} */
/* ═══════════════════════════════════════════════════════════════
   DARK FORGE — Job Pulse Design System
   Industrial control room × Bloomberg terminal × native iOS
   ═══════════════════════════════════════════════════════════════ */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Surface System ─────────────────────────────
        surface: {
          primary:  '#0A0B0D',  // App background — blue-black
          card:     '#111318',  // Card backgrounds
          elevated: '#181C24',  // Modals, panels, dropdowns
          overlay:  'rgba(0, 0, 0, 0.6)', // Backdrop overlay
        },

        // ── Border System ──────────────────────────────
        border: {
          DEFAULT:  '#1F2430',  // Subtle 1px borders
          strong:   '#2D3548',  // Active/focused elements
          muted:    '#161A22',  // Very subtle separators
        },

        // ── Accent Colors ──────────────────────────────
        accent: {
          DEFAULT:  '#3B82F6',  // Electric blue — primary actions
          hover:    '#2563EB',  // Blue hover state
          muted:    'rgba(59, 130, 246, 0.12)', // Blue background tint
          glow:     'rgba(59, 130, 246, 0.15)', // Blue glow shadow
          green:    '#10B981',  // On-track, complete, receivables
          amber:    '#F59E0B',  // Delayed, warning, pending
          red:      '#EF4444',  // Overdue, critical, danger
          purple:   '#8B5CF6',  // Inspections, canvas
        },

        // ── Phase Colors ───────────────────────────────
        phase: {
          underground: '#6366F1', // Indigo
          roughin:     '#3B82F6', // Blue
          topout:      '#06B6D4', // Cyan
          trim:        '#10B981', // Emerald
          final:       '#F59E0B', // Amber
        },

        // ── Text Colors ────────────────────────────────
        text: {
          primary:   '#F1F5F9', // Near white, high contrast
          secondary: '#94A3B8', // Slate, secondary info
          muted:     '#475569', // Timestamps, captions
          disabled:  '#334155', // Disabled state
          inverse:   '#0F172A', // Dark text on light bg
        },

        // ── Semantic Colors ────────────────────────────
        success: {
          DEFAULT: '#10B981',
          light:   '#34D399',
          dark:    '#059669',
          muted:   'rgba(16, 185, 129, 0.12)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light:   '#FBBF24',
          dark:    '#D97706',
          muted:   'rgba(245, 158, 11, 0.12)',
        },
        danger: {
          DEFAULT: '#EF4444',
          light:   '#F87171',
          dark:    '#DC2626',
          muted:   'rgba(239, 68, 68, 0.12)',
        },
        info: {
          DEFAULT: '#3B82F6',
          light:   '#60A5FA',
          dark:    '#2563EB',
          muted:   'rgba(59, 130, 246, 0.12)',
        },

        // ── Builder Colors ─────────────────────────────
        builder: {
          drhorton:  '#3B82F6', // Blue pill
          horizon:   '#F59E0B', // Amber pill
          other:     '#8B5CF6', // Purple pill
        },

        // ── Legacy compat aliases ──────────────────────
        copper: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3B82F6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
          glow: 'rgba(59, 130, 246, 0.15)',
        },
        brand: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3B82F6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        primary: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
          400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
          800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },

      // ── Typography ─────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        // Dark Forge type scale — outdoor mobile readability
        'display':    ['2.5rem',   { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.02em' }],  // 40px
        'heading':    ['1.375rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],  // 22px
        'subheading': ['1.0625rem',{ lineHeight: '1.4', fontWeight: '600' }],  // 17px
        'label':      ['0.9375rem',{ lineHeight: '1.4', fontWeight: '600' }],  // 15px
        'body':       ['0.9375rem',{ lineHeight: '1.5', fontWeight: '400' }],  // 15px
        'caption':    ['0.8125rem',{ lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.02em' }],  // 13px
        'mono-sm':    ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],  // 14px — JetBrains Mono
        '2xs':        ['0.625rem', { lineHeight: '0.875rem' }],
      },

      // ── Spacing ────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ── Border Radius ──────────────────────────────
      borderRadius: {
        'card':    '12px',  // Cards
        'input':   '8px',   // Inputs & badges
        'btn':     '6px',   // Buttons
        'sheet':   '16px',  // Bottom sheets
        'modal':   '24px',  // Modals on mobile
        '4xl':     '2rem',
      },

      // ── Shadows — Dark Forge ───────────────────────
      boxShadow: {
        'card':       '0 2px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.6)',
        'card-rest':  '0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        'card-lift':  '0 2px 8px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-blue':  '0 0 20px rgba(59, 130, 246, 0.15), 0 0 60px rgba(59, 130, 246, 0.05)',
        'glow-blue-lg': '0 0 30px rgba(59, 130, 246, 0.25), 0 0 80px rgba(59, 130, 246, 0.1)',
        'glow-red':   '0 0 12px rgba(239, 68, 68, 0.4)',
        'glow-amber': '0 0 12px rgba(245, 158, 11, 0.4)',
        'glow-green': '0 0 12px rgba(16, 185, 129, 0.4)',
        'fab':        '0 4px 16px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.15)',
        'nav-float':  '0 -4px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.1)',
        'sheet':      '0 -8px 32px rgba(0, 0, 0, 0.5)',
        // Legacy compat
        'dark-sm':    '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark':       '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'dark-md':    '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'dark-lg':    '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
        'dark-xl':    '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        'dark-glow':  '0 0 20px rgba(59, 130, 246, 0.15)',
        'dark-glow-lg': '0 0 30px rgba(59, 130, 246, 0.2)',
        'glow-copper': '0 0 20px rgba(59, 130, 246, 0.15), 0 0 60px rgba(59, 130, 246, 0.05)',
        'glow-copper-lg': '0 0 30px rgba(59, 130, 246, 0.25), 0 0 80px rgba(59, 130, 246, 0.1)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'obsidian': '0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)',
        'obsidian-lg': '0 2px 8px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.2)',
        'industrial': '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
        'industrial-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
        'blueprint': 'inset 0 0 0 1px rgba(59, 130, 246, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.05)',
        'card-rest-dark': '0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        'card-hover-dark': '0 2px 8px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        'elevation-1': '0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'elevation-2': '0 2px 4px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        'elevation-3': '0 4px 8px rgba(0,0,0,0.1), 0 16px 40px rgba(0,0,0,0.08)',
        'inset-border': 'inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
      },

      // ── Transitions ────────────────────────────────
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out':     'cubic-bezier(0, 0, 0.2, 1)',
        'spring':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'fast':   '150ms',
        'normal': '200ms',
        'medium': '250ms',
        'slow':   '300ms',
      },

      // ── Animations ─────────────────────────────────
      animation: {
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':  'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':    'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':     'fadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer':     'shimmer 1.5s linear infinite',
        'pipe-fill':   'pipeFill 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-left':  'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'rail-expand': 'railExpand 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'grain':       'grain 8s steps(10) infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'pulse-dot':   'pulseDot 2s ease-in-out infinite',
        'enter':       'enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'enter-scale': 'enterScale 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'count-up':    'countUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'nav-float':   'navFloat 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'sheet-up':    'sheetUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pipeFill: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--pipe-width, 0%)' },
        },
        slideLeft: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        railExpand: {
          '0%':   { width: '72px' },
          '100%': { width: '260px' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-15%, 5%)' },
          '30%': { transform: 'translate(7%, -25%)' },
          '40%': { transform: 'translate(-5%, 25%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
          '60%': { transform: 'translate(15%, 0%)' },
          '70%': { transform: 'translate(0%, 15%)' },
          '80%': { transform: 'translate(3%, 35%)' },
          '90%': { transform: 'translate(-10%, 10%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.4)', opacity: '0.7' },
        },
        enter: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        enterScale: {
          '0%':   { transform: 'scale(0.96) translateY(4px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        navFloat: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        sheetUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
