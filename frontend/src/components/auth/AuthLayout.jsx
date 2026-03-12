/**
 * AuthLayout - Background layout for auth pages
 * @module components/auth/AuthLayout
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { colors } from '../../styles/tokens';
import { itemVariants } from './AuthCard';

/**
 * @typedef {Object} AuthLayoutProps
 * @property {React.ReactNode} children
 * @property {string} [pageTitle] - SEO/page title
 */

export const AuthLayout = memo(function AuthLayout({ children, pageTitle }) {
  // Update document title
  if (pageTitle && typeof document !== 'undefined') {
    document.title = `${pageTitle} | Job Pulse`;
  }
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12"
      style={{ backgroundColor: colors.surface.primary }}
    >
      {/* Background Effects */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ 
          backgroundImage: 'url("/blueprint-pattern.svg")',
          backgroundSize: 'cover',
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: `${colors.accent.DEFAULT}10` }}
      />
      
      {children}
    </div>
  );
});

AuthLayout.displayName = 'AuthLayout';

/**
 * Logo header for auth pages
 * @param {{
 *   title: string, 
 *   subtitle: string, 
 *   iconSize?: 'large' | 'small'
 * }} props
 */
export const AuthLogoHeader = memo(function AuthLogoHeader({ 
  title, 
  subtitle, 
  iconSize = 'large' 
}) {
  const sizeClasses = iconSize === 'large' 
    ? 'w-20 h-20 rounded-3xl' 
    : 'w-16 h-16 rounded-2xl';
  const iconSizePx = iconSize === 'large' ? 40 : 32;

  return (
    <motion.div variants={itemVariants} className="text-center mb-8">
      <div 
        className={`inline-flex items-center justify-center ${sizeClasses} mb-6 relative group overflow-hidden`}
        style={{
          background: `linear-gradient(to bottom right, ${colors.accent.DEFAULT}, #1e40af)`,
          boxShadow: `0 0 40px ${colors.accent.glow}`,
        }}
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        />
        <Building2 
          className="text-white relative z-10" 
          size={iconSizePx}
          aria-hidden="true"
        />
      </div>
      <h1 
        className="text-4xl font-black tracking-tight mb-2"
        style={{ color: colors.text.primary }}
      >
        {title}
      </h1>
      <p 
        className="font-bold tracking-widest uppercase text-xs"
        style={{ color: colors.text.muted }}
      >
        {subtitle}
      </p>
    </motion.div>
  );
});

AuthLogoHeader.displayName = 'AuthLogoHeader';

/**
 * Footer link for auth pages
 */
export const AuthFooter = memo(function AuthFooter({ text, linkText, to }) {
  return (
    <div className="mt-8 text-center">
      <p style={{ color: colors.text.muted }}>
        {text}{' '}
        <a 
          href={to}
          className="font-semibold transition-colors"
          style={{ color: colors.accent.DEFAULT }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.light}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
        >
          {linkText}
        </a>
      </p>
    </div>
  );
});

AuthFooter.displayName = 'AuthFooter';

/**
 * Divider with text
 */
export const AuthDivider = memo(function AuthDivider({ text }) {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div 
          className="w-full border-t"
          style={{ borderColor: colors.border.strong }}
        />
      </div>
      <div className="relative flex justify-center text-sm">
        <span 
          className="px-4 font-semibold uppercase tracking-wider text-xs"
          style={{ 
            backgroundColor: colors.surface.elevated,
            color: colors.text.muted,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
});

AuthDivider.displayName = 'AuthDivider';

/**
 * Security badge at bottom of auth pages
 */
export const AuthSecurityBadge = memo(function AuthSecurityBadge() {
  return (
    <motion.div 
      variants={itemVariants} 
      className="mt-8 text-center"
    >
      <p 
        className="text-[11px] font-medium tracking-widest uppercase"
        style={{ color: `${colors.text.muted}80` }}
      >
        Protected by enterprise-grade security
      </p>
    </motion.div>
  );
});

AuthSecurityBadge.displayName = 'AuthSecurityBadge';
