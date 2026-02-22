import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  X,
  Bell,
  Phone,
  ArrowRight,
  Eye,
  AlertCircle,
  FileText,
  CheckCircle,
  Archive,
  Send,
  Trash2,
  Check,
} from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';
import { NotificationPriority, NotificationType } from '../../hooks/useNotifications';

/**
 * NotificationCenter - Slide-out panel for notifications
 * 
 * Features:
 * - Groups notifications by priority (Urgent, Action Needed, Info)
 * - One-tap contextual actions
 * - Swipe to dismiss on mobile
 * - Keyboard navigation support
 * - Focus trap
 */
export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  groupedNotifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onAction,
}) {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    
    // Focus first element
    const timer = setTimeout(() => {
      const firstFocusable = containerRef.current?.querySelector('button, [href], input');
      firstFocusable?.focus();
    }, 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Tab trap
      if (e.key === 'Tab') {
        const focusable = containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  // Get action config for notification type
  const getActionConfig = (type) => {
    switch (type) {
      case NotificationType.COLD_LEAD:
        return { label: 'Call Now', icon: Phone, color: colors.danger.DEFAULT };
      case NotificationType.HOT_LEAD:
        return { label: 'View Lead', icon: Eye, color: colors.accent.blue };
      case NotificationType.STUCK_JOB:
        return { label: 'Advance Phase', icon: ArrowRight, color: colors.success.DEFAULT };
      case NotificationType.NEW_PERMIT:
        return { label: 'View Lead', icon: FileText, color: colors.accent.blue };
      case NotificationType.PENDING_ESTIMATE:
        return { label: 'Send Quote', icon: Send, color: colors.warning.DEFAULT };
      case NotificationType.PHASE_DUE:
        return { label: 'View Job', icon: Eye, color: colors.accent.blue };
      case NotificationType.PHASE_COMPLETED:
        return { label: 'View Details', icon: CheckCircle, color: colors.success.DEFAULT };
      case NotificationType.LEAD_ARCHIVED:
        return { label: 'View Archive', icon: Archive, color: colors.text.muted };
      default:
        return { label: 'View', icon: Eye, color: colors.accent.blue };
    }
  };

  // Get priority config
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return {
          label: 'Urgent',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.2)',
          accent: colors.danger.DEFAULT,
          icon: AlertCircle,
        };
      case NotificationPriority.ACTION:
        return {
          label: 'Action Needed',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.2)',
          accent: colors.warning.DEFAULT,
          icon: Bell,
        };
      case NotificationPriority.INFO:
        return {
          label: 'Info',
          bg: 'rgba(100, 116, 139, 0.1)',
          border: 'rgba(100, 116, 139, 0.2)',
          accent: colors.text.muted,
          icon: CheckCircle,
        };
      default:
        return {
          label: 'Info',
          bg: colors.surface.card,
          border: colors.border.default,
          accent: colors.text.muted,
          icon: Bell,
        };
    }
  };

  const hasNotifications = notifications.length > 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]" ref={containerRef}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md"
            style={{
              background: colors.surface.elevated,
              borderLeft: `1px solid ${colors.border.default}`,
              boxShadow: shadows.sheet,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${colors.border.default}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: colors.accent.muted }}
                >
                  <Bell className="w-5 h-5" style={{ color: colors.accent.blue }} />
                </div>
                <div>
                  <h2
                    className="text-lg font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    Notifications
                  </h2>
                  <p className="text-xs" style={{ color: colors.text.muted }}>
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {hasNotifications && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                    style={{ color: colors.text.secondary }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Mark all as read"
                    aria-label="Mark all notifications as read"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                  style={{ color: colors.text.secondary }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
              {!hasNotifications ? (
                <EmptyState />
              ) : (
                <div className="p-4 space-y-6">
                  {/* Urgent Section */}
                  {groupedNotifications.urgent.length > 0 && (
                    <PrioritySection
                      title="Urgent"
                      notifications={groupedNotifications.urgent}
                      priority={NotificationPriority.URGENT}
                      getActionConfig={getActionConfig}
                      getPriorityConfig={getPriorityConfig}
                      onMarkAsRead={onMarkAsRead}
                      onDismiss={onDismiss}
                      onAction={onAction}
                      isMobile={isMobile}
                    />
                  )}

                  {/* Action Needed Section */}
                  {groupedNotifications.action.length > 0 && (
                    <PrioritySection
                      title="Action Needed"
                      notifications={groupedNotifications.action}
                      priority={NotificationPriority.ACTION}
                      getActionConfig={getActionConfig}
                      getPriorityConfig={getPriorityConfig}
                      onMarkAsRead={onMarkAsRead}
                      onDismiss={onDismiss}
                      onAction={onAction}
                      isMobile={isMobile}
                    />
                  )}

                  {/* Info Section */}
                  {groupedNotifications.info.length > 0 && (
                    <PrioritySection
                      title="Info"
                      notifications={groupedNotifications.info}
                      priority={NotificationPriority.INFO}
                      getActionConfig={getActionConfig}
                      getPriorityConfig={getPriorityConfig}
                      onMarkAsRead={onMarkAsRead}
                      onDismiss={onDismiss}
                      onAction={onAction}
                      isMobile={isMobile}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {hasNotifications && (
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between"
                style={{
                  background: colors.surface.elevated,
                  borderTop: `1px solid ${colors.border.default}`,
                  paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                }}
              >
                <span className="text-xs" style={{ color: colors.text.muted }}>
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                  style={{ color: colors.danger.DEFAULT }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Priority Section Component
 */
function PrioritySection({
  title,
  notifications,
  priority,
  getActionConfig,
  getPriorityConfig,
  onMarkAsRead,
  onDismiss,
  onAction,
  isMobile,
}) {
  const priorityConfig = getPriorityConfig(priority);
  const Icon = priorityConfig.icon;

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: priorityConfig.accent }} />
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: priorityConfig.accent }}>
          {title}
        </h3>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: priorityConfig.bg,
            color: priorityConfig.accent,
          }}
        >
          {notifications.length}
        </span>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            priorityConfig={priorityConfig}
            actionConfig={getActionConfig(notification.type)}
            onMarkAsRead={onMarkAsRead}
            onDismiss={onDismiss}
            onAction={onAction}
            isMobile={isMobile}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Individual Notification Item
 * Supports swipe-to-dismiss on mobile
 */
function NotificationItem({
  notification,
  priorityConfig,
  actionConfig,
  onMarkAsRead,
  onDismiss,
  onAction,
  isMobile,
}) {
  const [isRead, setIsRead] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const bgOpacity = useTransform(x, [-100, 0, 100], [1, 0, 1]);

  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) > 80) {
      // Swipe to dismiss
      const direction = info.offset.x > 0 ? 100 : -100;
      animate(x, direction, { type: 'spring', stiffness: 300, damping: 30 });
      setTimeout(() => onDismiss(notification.id), 200);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  };

  const handleAction = () => {
    setIsRead(true);
    onMarkAsRead(notification.id);
    onAction?.(notification);
  };

  const ActionIcon = actionConfig.icon;

  return (
    <motion.div
      drag={isMobile ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      style={{ x, opacity }}
      className="relative"
    >
      {/* Swipe background (visible during drag) */}
      {isMobile && (
        <motion.div
          className="absolute inset-0 rounded-xl flex items-center justify-end px-4"
          style={{
            opacity: bgOpacity,
            background: colors.danger.DEFAULT,
          }}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </motion.div>
      )}

      {/* Notification Card */}
      <div
        className="relative rounded-xl p-4 transition-all"
        style={{
          background: priorityConfig.bg,
          border: `1px solid ${priorityConfig.border}`,
          opacity: isRead ? 0.7 : 1,
        }}
      >
        {/* Unread indicator */}
        {!isRead && (
          <div
            className="absolute top-3 right-3 w-2 h-2 rounded-full"
            style={{ background: priorityConfig.accent }}
          />
        )}

        {/* Content */}
        <div className="pr-4">
          <h4 className="font-semibold text-sm mb-1" style={{ color: colors.text.primary }}>
            {notification.title}
          </h4>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: colors.text.secondary }}>
            {notification.message}
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAction}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{
            background: actionConfig.color,
            color: colors.text.inverse,
            boxShadow: `0 4px 12px ${actionConfig.color}40`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = `0 6px 16px ${actionConfig.color}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${actionConfig.color}40`;
          }}
        >
          <ActionIcon className="w-4 h-4" />
          {actionConfig.label}
        </button>

        {/* Dismiss button (desktop) */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => onDismiss(notification.id)}
            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            style={{ color: colors.text.muted }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <Bell className="w-8 h-8" style={{ color: colors.text.muted }} />
      </div>
      <h3 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
        All caught up!
      </h3>
      <p className="text-sm max-w-xs" style={{ color: colors.text.secondary }}>
        No notifications at the moment. We&apos;ll alert you when something needs your attention.
      </p>
    </div>
  );
}
