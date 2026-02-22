import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Offline Banner — persistent amber banner at top when no connection
 * Shows "No connection — working offline"
 * Shows "Reconnected — syncing" toast on reconnect
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
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

  if (!isOffline && !showReconnect) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold safe-area-inset-top"
      style={{
        background: isOffline ? 'rgba(245, 158, 11, 0.95)' : 'rgba(16, 185, 129, 0.95)',
        color: '#0F172A',
        backdropFilter: 'blur(8px)',
      }}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>No connection — working offline</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Reconnected — syncing</span>
        </>
      )}
    </div>
  );
}
