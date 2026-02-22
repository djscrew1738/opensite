import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { colors } from '../../styles/tokens';

/**
 * Offline Banner — persistent amber banner at top when no connection
 * Shows "No connection — working offline"
 * Shows "Reconnected — syncing" toast on reconnect
 * 
 * Accessibility features:
 * - role="status" and aria-live for announcements
 * - aria-label for status message
 * - Dismissible banner
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnect, setShowReconnect] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnect(true);
      setTimeout(() => setShowReconnect(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if ((!isOffline && !showReconnect) || isDismissed) return null;

  const statusConfig = isOffline
    ? {
        bg: colors.warning.muted || 'rgba(245, 158, 11, 0.95)',
        color: colors.text.inverse,
        icon: WifiOff,
        message: 'No connection — working offline',
        role: 'alert',
        ariaLive: 'assertive',
      }
    : {
        bg: colors.success.muted || 'rgba(16, 185, 129, 0.95)',
        color: colors.text.inverse,
        icon: RefreshCw,
        message: 'Reconnected — syncing',
        role: 'status',
        ariaLive: 'polite',
      };

  const Icon = statusConfig.icon;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold safe-area-inset-top ${isOffline ? '' : 'animate-pulse'}`}
      style={{
        background: statusConfig.bg,
        color: statusConfig.color,
        backdropFilter: 'blur(8px)',
      }}
      role={statusConfig.role}
      aria-live={statusConfig.ariaLive}
      aria-label={statusConfig.message}
    >
      <Icon className={`w-4 h-4 ${isOffline ? '' : 'animate-spin'}`} aria-hidden="true" />
      <span>{statusConfig.message}</span>
      
      {/* Dismiss button for offline banner */}
      {isOffline && (
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Dismiss offline notification"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
