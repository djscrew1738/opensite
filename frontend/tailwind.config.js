/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

/* ═══════════════════════════════════════════════════════════════
   DARK FORGE — Job Pulse Design System ✨ ENHANCED
   Industrial control room × Bloomberg terminal × native iOS
   Enhanced with vibrant accents, glow effects, and high contrast
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
        gray: colors.slate,
        // ── Surface System ─────────────────────────────
        surface: {
          // Base dark mode colors
          primary:  '#0A0B0D',  // App background — blue-black
          card:     '#111318',  // Card backgrounds
          elevated: '#181C24',  // Modals, panels, dropdowns
          overlay:  'rgba(0, 0, 0, 0.6)', // Backdrop overlay
          // Full color scale for proper dark mode support
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#151e2e',  // Extra step between 800 and 900
          900: '#0f172a',
          950: '#020617',
        },

        // ── Border System ──────────────────────────────
        border: {
          DEFAULT:  '#1F2430',  // Subtle 1px borders
          strong:   '#2D3548',  // Active/focused elements
          muted:    '#161A22',  // Very subtle separators
          glow:     'rgba(59, 130, 246, 0.3)', // Glowing border
        },

        // ── Vibrant Accent Colors ──────────────────────
        accent: {
          DEFAULT:  '#3B82F6',  // Electric blue — primary actions
          hover:    '#2563EB',  // Blue hover state
          muted:    'rgba(59, 130, 246, 0.12)', // Blue background tint
          glow:     'rgba(59, 130, 246, 0.15)', // Blue glow shadow
          
          // Primary vibrant palette
          blue:     '#3B82F6',
          cyan:     '#06B6D4',
          teal:     '#14B8A6',
          green:    '#10B981',
          lime:     '#84CC16',
          yellow:   '#EAB308',
          amber:    '#F59E0B',
          orange:   '#F97316',
          red:      '#EF4444',
          rose:     '#F43F5E',
          pink:     '#EC4899',
          purple:   '#8B5CF6',
          violet:   '#7C3AED',
          indigo:   '#6366F1',
          
          // Neon vibrant variants
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
            violet: '#8B5CF6',
          },
        },

        // ── Phase Colors (Enhanced Vibrancy) ───────────
        phase: {
          underground: '#6366F1', // Indigo
          roughin:     '#3B82F6', // Blue
          topout:      '#06B6D4', // Cyan
          trim:        '#10B981', // Emerald
          final:       '#F59E0B', // Amber
        },

        // ── Text Colors (Enhanced Contrast) ─────────────
        text: {
          primary:   '#F8FAFC',   // Near white, maximum contrast
          secondary: '#CBD5E1',   // Light gray, high readability
          muted:     '#64748B',   // Medium gray
          disabled:  '#475569',   // Darker gray
          inverse:   '#0F172A',   // Dark text on light bg
        },

        // ── Semantic Colors (Enhanced) ─────────────────
        success: {
          DEFAULT: '#10B981',
          light:   '#34D399',
          dark:    '#059669',
          muted:   'rgba(16, 185, 129, 0.12)',
          glow:    'rgba(16, 185, 129, 0.4)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light:   '#FBBF24',
          dark:    '#D97706',
          muted:   'rgba(245, 158, 11, 0.12)',
          glow:    'rgba(245, 158, 11, 0.4)',
        },
        danger: {
          DEFAULT: '#EF4444',
          light:   '#F87171',
          dark:    '#DC2626',
          muted:   'rgba(239, 68, 68, 0.12)',
          glow:    'rgba(239, 68, 68, 0.4)',
        },
        info: {
          DEFAULT: '#3B82F6',
          light:   '#60A5FA',
          dark:    '#2563EB',
          muted:   'rgba(59, 130, 246, 0.12)',
          glow:    'rgba(59, 130, 246, 0.4)',
        },

        // ── Data Visualization Colors (Popping Palette) ─
        chart: {
          1: '#3B82F6',  // Electric Blue
          2: '#8B5CF6',  // Purple
          3: '#06B6D4',  // Cyan
          4: '#10B981',  // Emerald
          5: '#F59E0B',  // Amber
          6: '#EF4444',  // Red
          7: '#EC4899',  // Pink
          8: '#F97316',  // Orange
          9: '#6366F1',  // Indigo
          10: '#14B8A6', // Teal
          // High saturation variants for dark mode
          neon1: '#00D4FF',
          neon2: '#B829F7',
          neon3: '#00F0FF',
          neon4: '#00FF88',
          neon5: '#FFB800',
          neon6: '#FF3366',
          neon7: '#FF66CC',
          neon8: '#FF6B00',
          neon9: '#7C3AED',
          neon10: '#00E5C9',
        },

        // ── Builder Colors ─────────────────────────────
        builder: {
          drhorton:  '#3B82F6', // Blue pill
          horizon:   '#F59E0B', // Amber pill
          other:     '#8B5CF6', // Purple pill
        },

        // ── Field Mode Colors ─────────────────────────
        field: {
          bg: '#0a0a0a',
          card: '#111111',
          elevated: '#1a1a1a',
          hover: '#222222',
          border: '#333333',
          'border-strong': '#555555',
          primary: '#00d4ff',
          success: '#00ff88',
          warning: '#ffaa00',
          danger: '#ff4444',
          hot: '#ff4444',
          text: '#ffffff',
          'text-secondary': '#e0e0e0',
          'text-muted': '#a0a0a0',
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
        'display':    ['2.5rem',   { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],  // 40px
        'heading':    ['1.5rem',   { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],  // 24px
        'subheading': ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],  // 18px
        'label':      ['0.9375rem',{ lineHeight: '1.4', fontWeight: '600' }],  // 15px
        'body':       ['0.9375rem',{ lineHeight: '1.6', fontWeight: '400' }],  // 15px
        'caption':    ['0.8125rem',{ lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.02em' }],  // 13px
        'mono-sm':    ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],  // 14px — JetBrains Mono
        '2xs':        ['0.625rem', { lineHeight: '0.875rem' }],
      },

      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
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

      // ── Shadows — Enhanced with Glow & Bloom ───────
      boxShadow: {
        // Standard cards
        'card':       '0 2px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.6)',
        'card-rest':  '0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        'card-lift':  '0 2px 8px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        
        // Enhanced Glow Effects
        'glow-blue':     '0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.15)',
        'glow-blue-lg':  '0 0 30px rgba(59, 130, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)',
        'glow-blue-xl':  '0 0 40px rgba(59, 130, 246, 0.5), 0 0 100px rgba(59, 130, 246, 0.25)',
        'glow-cyan':     '0 0 20px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.15)',
        'glow-green':    '0 0 20px rgba(16, 185, 129, 0.35), 0 0 60px rgba(16, 185, 129, 0.15)',
        'glow-emerald':  '0 0 20px rgba(16, 185, 129, 0.35), 0 0 60px rgba(16, 185, 129, 0.15)',
        'glow-amber':    '0 0 20px rgba(245, 158, 11, 0.35), 0 0 60px rgba(245, 158, 11, 0.15)',
        'glow-orange':   '0 0 20px rgba(249, 115, 22, 0.35), 0 0 60px rgba(249, 115, 22, 0.15)',
        'glow-red':      '0 0 20px rgba(239, 68, 68, 0.35), 0 0 60px rgba(239, 68, 68, 0.15)',
        'glow-rose':     '0 0 20px rgba(244, 63, 94, 0.35), 0 0 60px rgba(244, 63, 94, 0.15)',
        'glow-pink':     '0 0 20px rgba(236, 72, 153, 0.35), 0 0 60px rgba(236, 72, 153, 0.15)',
        'glow-purple':   '0 0 20px rgba(139, 92, 246, 0.35), 0 0 60px rgba(139, 92, 246, 0.15)',
        'glow-violet':   '0 0 20px rgba(124, 58, 237, 0.35), 0 0 60px rgba(124, 58, 237, 0.15)',
        'glow-indigo':   '0 0 20px rgba(99, 102, 241, 0.35), 0 0 60px rgba(99, 102, 241, 0.15)',
        'glow-white':    '0 0 20px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.1)',
        
        // Neon glow effects
        'neon-blue':    '0 0 5px #00D4FF, 0 0 20px #00D4FF, 0 0 40px rgba(0, 212, 255, 0.5)',
        'neon-cyan':    '0 0 5px #00F0FF, 0 0 20px #00F0FF, 0 0 40px rgba(0, 240, 255, 0.5)',
        'neon-green':   '0 0 5px #00FF88, 0 0 20px #00FF88, 0 0 40px rgba(0, 255, 136, 0.5)',
        'neon-purple':  '0 0 5px #B829F7, 0 0 20px #B829F7, 0 0 40px rgba(184, 41, 247, 0.5)',
        'neon-pink':    '0 0 5px #FF66CC, 0 0 20px #FF66CC, 0 0 40px rgba(255, 102, 204, 0.5)',
        'neon-red':     '0 0 5px #FF3366, 0 0 20px #FF3366, 0 0 40px rgba(255, 51, 102, 0.5)',
        'neon-amber':   '0 0 5px #FFB800, 0 0 20px #FFB800, 0 0 40px rgba(255, 184, 0, 0.5)',
        
        // Component shadows
        'fab':        '0 4px 16px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.15)',
        'fab-hover':  '0 6px 24px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.25)',
        'nav-float':  '0 -4px 24px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.1)',
        'sheet':      '0 -8px 32px rgba(0, 0, 0, 0.5)',
        
        // Bloom effects (multi-layer)
        'bloom-sm': '0 0 10px rgba(255,255,255,0.1), 0 0 20px rgba(255,255,255,0.05)',
        'bloom':    '0 0 20px rgba(255,255,255,0.15), 0 0 40px rgba(255,255,255,0.1), 0 0 60px rgba(255,255,255,0.05)',
        'bloom-lg': '0 0 30px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.15), 0 0 90px rgba(255,255,255,0.1)',
        
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
        // Standard animations
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':  'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':    'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':     'fadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer':     'shimmer 1.5s linear infinite',
        'pipe-fill':   'pipeFill 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-left':  'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'rail-expand': 'railExpand 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'grain':       'grain 8s steps(10) infinite',
        'enter':       'enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'enter-scale': 'enterScale 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'count-up':    'countUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'nav-float':   'navFloat 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'sheet-up':    'sheetUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        
        // Glow pulse animations
        'pulse-glow':      'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-fast': 'pulseGlow 1s ease-in-out infinite',
        'pulse-glow-slow': 'pulseGlow 3s ease-in-out infinite',
        'pulse-dot':       'pulseDot 2s ease-in-out infinite',
        'glow-pulse':      'glowPulse 2s ease-in-out infinite',
        'glow-pulse-fast': 'glowPulse 1.5s ease-in-out infinite',
        
        // Bloom animations
        'bloom-pulse':  'bloomPulse 3s ease-in-out infinite',
        'bloom-fade':   'bloomFade 2s ease-in-out infinite',
        
        // Shimmer effects
        'shimmer-fast': 'shimmer 1s linear infinite',
        'shimmer-slow': 'shimmer 2.5s linear infinite',
        
        // Float animation
        'float':       'float 3s ease-in-out infinite',
        'float-slow':  'float 6s ease-in-out infinite',
        
        // Border glow
        'border-glow': 'borderGlow 2s linear infinite',
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
        glowPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.15)',
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 90px rgba(59, 130, 246, 0.25)',
          },
        },
        bloomPulse: {
          '0%, 100%': { 
            filter: 'brightness(1) drop-shadow(0 0 10px rgba(255,255,255,0.1))',
          },
          '50%': { 
            filter: 'brightness(1.1) drop-shadow(0 0 30px rgba(255,255,255,0.2))',
          },
        },
        bloomFade: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(59, 130, 246, 0.3)' },
          '50%': { borderColor: 'rgba(59, 130, 246, 0.8)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      
      // ── Background Image ───────────────────────────
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glow-radial': 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        'glow-radial-lg': 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}
