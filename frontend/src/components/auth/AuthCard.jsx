/**
 * AuthCard - Card container for auth forms
 * @module components/auth/AuthCard
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../styles/tokens';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

/**
 * @typedef {Object} AuthCardProps
 * @property {React.ReactNode} children
 * @property {string} [title] - Optional title inside card
 * @property {string} [subtitle] - Optional subtitle
 */

export const AuthCard = memo(function AuthCard({ children, title, subtitle }) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-md w-full relative z-10"
    >
      <motion.div 
        variants={itemVariants}
        className="backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundColor: `${colors.surface.elevated}80`,
          border: `1px solid ${colors.border.strong}`,
        }}
      >
        {/* Subtle top border glow */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ 
            background: `linear-gradient(to right, transparent, ${colors.accent.light}50, transparent)`,
          }}
        />
        
        {/* Optional header */}
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h2 
                className="text-2xl font-bold tracking-tight"
                style={{ color: colors.text.primary }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p 
                className="text-sm mt-1"
                style={{ color: colors.text.muted }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {children}
      </motion.div>
    </motion.div>
  );
});

AuthCard.displayName = 'AuthCard';

export { containerVariants, itemVariants };
