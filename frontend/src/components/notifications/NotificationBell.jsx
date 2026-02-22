import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../styles/tokens';

/**
 * NotificationBell - Bell icon with unread count badge and pulse animation
 * 
 * Features:
 * - Unread count badge (shows "9+" for counts over 9)
 * - Pulse animation when urgent notifications exist
 * - Accessible with aria-label
 */
export default function NotificationBell({
  count = 0,
  hasUrgent = false,
  onClick,
  className = '',
  size = 'default',
}) {
  const [isPulsing, setIsPulsing] = useState(hasUrgent);

  // Update pulsing state when hasUrgent changes
  useEffect(() => {
    setIsPulsing(hasUrgent);
  }, [hasUrgent]);

  const sizeClasses = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4', badge: 'text-[9px] min-w-[14px] h-[14px]' },
    default: { button: 'w-10 h-10', icon: 'w-5 h-5', badge: 'text-[10px] min-w-[18px] h-[18px]' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6', badge: 'text-xs min-w-[20px] h-[20px]' },
  };

  const sizes = sizeClasses[size] || sizeClasses.default;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-xl transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50
        ${sizes.button}
        ${className}
      `}
      style={{
        background: 'transparent',
        color: 'rgba(148, 163, 184, 0.6)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.color = 'rgba(148, 163, 184, 0.9)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(148, 163, 184, 0.6)';
      }}
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}${hasUrgent ? ', urgent items require attention' : ''}`}
      aria-expanded={false}
      aria-haspopup="dialog"
    >
      {/* Bell Icon */}
      <Bell className={sizes.icon} aria-hidden="true" />

      {/* Pulse Animation Ring (when urgent items exist) */}
      <AnimatePresence>
        {isPulsing && (
          <>
            {/* Outer ring */}
            <motion.span
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                border: `2px solid ${colors.danger.DEFAULT}`,
              }}
            />
            {/* Inner ring */}
            <motion.span
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.3,
              }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                border: `2px solid ${colors.danger.DEFAULT}`,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Unread Count Badge */}
      <AnimatePresence mode="wait">
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`
              absolute -top-0.5 -right-0.5 flex items-center justify-center
              font-bold rounded-full shadow-lg
              ${sizes.badge}
            `}
            style={{
              background: hasUrgent ? colors.danger.DEFAULT : colors.accent.blue,
              color: colors.text.inverse,
              boxShadow: hasUrgent 
                ? `0 0 8px ${colors.danger.glow}` 
                : `0 0 8px ${colors.accent.glow}`,
            }}
            aria-hidden="true"
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * Compact Notification Bell for Mobile Nav
 */
export function NotificationBellCompact({ count = 0, hasUrgent = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
      style={{ minWidth: '56px', minHeight: '48px' }}
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}${hasUrgent ? ', urgent items require attention' : ''}`}
      aria-expanded={false}
      aria-haspopup="dialog"
    >
      <div className="relative">
        <Bell
          className="w-[22px] h-[22px]"
          strokeWidth={1.75}
          style={{ color: 'rgba(148, 163, 184, 0.5)' }}
          aria-hidden="true"
        />
        
        {/* Pulse ring for urgent */}
        {hasUrgent && (
          <>
            <motion.span
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${colors.danger.DEFAULT}` }}
            />
          </>
        )}

        {/* Badge */}
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex items-center justify-center text-white font-bold"
              style={{
                width: '16px',
                height: '16px',
                fontSize: '9px',
                borderRadius: '8px',
                background: hasUrgent ? colors.danger.DEFAULT : colors.accent.blue,
                boxShadow: hasUrgent 
                  ? `0 0 8px ${colors.danger.glow}` 
                  : `0 0 8px ${colors.accent.glow}`,
              }}
            >
              {count > 9 ? '9+' : count}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span
        className="font-semibold leading-none"
        style={{
          fontSize: '10px',
          color: 'rgba(148, 163, 184, 0.4)',
        }}
      >
        Alerts
      </span>
      <div
        className="rounded-full"
        style={{
          width: '3px',
          height: '3px',
          background: 'transparent',
        }}
      />
    </button>
  );
}
