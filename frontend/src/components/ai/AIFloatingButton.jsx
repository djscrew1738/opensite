import { useState, useEffect } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { usePageContext } from '../../hooks/usePageContext';

/**
 * AIFloatingButton - Floating action button to open AI sidebar
 * Shows on all pages, positioned bottom-right
 * Animates when there's a context change
 */
export default function AIFloatingButton({ onClick, isOpen }) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const pageContext = usePageContext();

  // Pulse animation on page change
  useEffect(() => {
    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), 2000);
    return () => clearTimeout(timer);
  }, [pageContext.page]);

  // Show tooltip on first visit (could be persisted)
  useEffect(() => {
    const hasSeenTooltip = sessionStorage.getItem('ai-button-tooltip');
    if (!hasSeenTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem('ai-button-tooltip', 'true');
      }, 2000);
      
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 7000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip */}
      {showTooltip && (
        <div className="mb-2 px-4 py-2 bg-surface-elevated border border-border rounded-xl shadow-lg max-w-[200px] animate-slideInBottom">
          <p className="text-sm text-text-primary">
            💡 Tap to chat with your AI assistant
          </p>
          <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-surface-elevated" />
        </div>
      )}

      {/* Context indicator */}
      <div className="mb-1 px-3 py-1 bg-accent-muted/80 backdrop-blur-sm rounded-full text-xs text-accent-blue font-medium animate-fadeIn">
        Ask about {pageContext.title}
      </div>

      {/* FAB */}
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
          
          {/* Sparkle indicator */}
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
            <span className="absolute -inset-2 rounded-full bg-accent-blue/10 animate-ping opacity-10" style={{ animationDelay: '0.2s' }} />
          </>
        )}
      </button>

      <style>{`
        @keyframes slideInBottom {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
          }
          50% { 
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }
        .animate-slideInBottom {
          animation: slideInBottom 0.3s ease-out;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out;
        }
      `}</style>
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
    >
      <Bot className="w-4 h-4" />
      <span>AI Assistant</span>
    </button>
  );
}
