import { Loader2 } from 'lucide-react';

/**
 * TabFallback Component
 * Loading spinner for lazy-loaded tab panels using Dark Forge design system
 */
export default function TabFallback() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border-muted flex items-center justify-center shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
        </div>
        <div className="absolute -inset-1 rounded-xl bg-accent-blue/10 animate-pulse blur-sm -z-10" />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-text-muted">
        Syncing Configuration...
      </p>
    </div>
  );
}
