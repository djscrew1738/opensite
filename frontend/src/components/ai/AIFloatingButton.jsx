import { useState, useEffect, useCallback, memo } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { usePageContext } from '../../hooks/usePageContext';

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage pulsing animation state
 */
function usePulse(dependencies = [], duration = 2000) {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), duration);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return isPulsing;
}

/**
 * Hook for first-time user tooltip
 */
function useFirstVisitTooltip(storageKey = 'ai-button-tooltip', delay = 2000, duration = 5000) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const hasSeenTooltip = sessionStorage.getItem(storageKey);
    if (hasSeenTooltip) return;

    const showTimer = setTimeout(() => {
      setShowTooltip(true);
      sessionStorage.setItem(storageKey, 'true');
    }, delay);
    
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, delay + duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [storageKey, delay, duration]);

  return { showTooltip, setShowTooltip };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Tooltip component for first-time users
 */
const Tooltip = memo(function Tooltip({ text, onDismiss }) {
  useEffect(() => {
    const handleClick = () => onDismiss();
    window.addEventListener('click', handleClick, { once: true });
    return () => window.removeEventListener('click', handleClick);
  }, [onDismiss]);

  return (
    <div className="mb-2 px-4 py-2 bg-surface-elevated border border-border rounded-xl shadow-lg max-w-[200px] animate-slide-in-bottom relative">
      <p className="text-sm text-text-primary">{text}</p>
      <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-surface-elevated" />
    </div>
  );
});

/**
 * Context indicator showing current page context
 */
const ContextIndicator = memo(function ContextIndicator({ title }) {
  if (!title) return null;
  
  return (
    <div className="mb-1 px-3 py-1 bg-accent-muted/80 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-wider text-accent-blue font-bold animate-fade-in border border-accent-blue/20">
      Ask about {title}
    </div>
  );
});

/**
 * Main floating action button
 */
const FloatingButton = memo(function FloatingButton({ onClick, isPulsing }) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex items-center justify-center
        w-14 h-14 rounded-full
        bg-gradient-to-br from-accent-blue to-accent-cyan
        text-white
        shadow-lg shadow-accent-blue/30
        hover:shadow-xl hover:shadow-accent-blue/40
        transition-all duration-300
        hover:scale-105 active:scale-95
        ${isPulsing ? 'animate-pulse-glow' : ''}
      `}
      aria-label="Open AI Assistant"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-accent-blue opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
      
      {/* Icon */}
      <div className="relative">
        <Bot className="w-6 h-6" />
        <Sparkles 
          className={`
            absolute -top-1 -right-1 w-3 h-3 
            ${isPulsing ? 'animate-spin' : ''}
          `} 
        />
      </div>

      {/* Ripple effect on pulse */}
      {isPulsing && (
        <>
          <span className="absolute inset-0 rounded-full bg-accent-blue animate-ping opacity-20" />
          <span 
            className="absolute -inset-2 rounded-full bg-accent-blue/10 animate-ping opacity-10" 
            style={{ animationDelay: '0.2s' }} 
          />
        </>
      )}
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * AIFloatingButton - Floating action button to open AI sidebar
 * Shows on all pages, positioned bottom-right
 * Animates when there's a context change
 */
function AIFloatingButton({ onClick, isOpen }) {
  const pageContext = usePageContext();
  const isPulsing = usePulse([pageContext.page], 2000);
  const { showTooltip, setShowTooltip } = useFirstVisitTooltip();

  const handleDismissTooltip = useCallback(() => {
    setShowTooltip(false);
  }, [setShowTooltip]);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col items-end gap-2">
      {showTooltip && (
        <Tooltip 
          text="Tap to chat with your AI assistant" 
          onDismiss={handleDismissTooltip} 
        />
      )}

      <ContextIndicator title={pageContext.title} />

      <FloatingButton onClick={onClick} isPulsing={isPulsing} />
    </div>
  );
}

/**
 * Alternative compact version for mobile nav or tight spaces
 */
export function AICompactButton({ onClick, isOpen }) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2 px-4 py-2 rounded-full
        bg-accent-blue text-white
        text-sm font-medium
        shadow-lg shadow-accent-blue/30
        hover:bg-accent-hover
        transition-all active:scale-95
      "
      aria-label="Open AI Assistant"
    >
      <Bot className="w-4 h-4" />
      <span>AI Assistant</span>
    </button>
  );
}

export default AIFloatingButton;
