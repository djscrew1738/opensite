import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, RefreshCw, Copy, Check, Loader2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Skeleton loading state for summary generation
 */
const SummarySkeleton = memo(function SummarySkeleton() {
  return (
    <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 size={18} className="animate-spin text-accent-500" />
        <span className="text-sm font-medium text-surface-400">
          Generating summary...
        </span>
      </div>

      {/* Skeleton lines */}
      <div className="space-y-3">
        <div className="h-4 rounded-md animate-pulse bg-surface-800 w-full" />
        <div className="h-4 rounded-md animate-pulse bg-surface-800 w-[92%]" />
        <div className="h-4 rounded-md animate-pulse bg-surface-800 w-[78%]" />
        <div className="h-4 rounded-md animate-pulse bg-surface-800 w-[85%]" />
        <div className="h-4 rounded-md animate-pulse bg-surface-800 w-[60%]" />
      </div>
    </div>
  );
});

/**
 * Empty state when no summary exists
 */
const EmptySummaryState = memo(function EmptySummaryState({ 
  onSummarize, 
  isDocumentReady 
}) {
  return (
    <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-500/10">
          <Sparkles size={22} className="text-accent-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1 text-surface-100">
            No summary available
          </p>
          <p className="text-xs text-surface-500">
            Generate an AI summary of this document
          </p>
        </div>
        <button
          onClick={onSummarize}
          disabled={!isDocumentReady}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
            transition-colors bg-accent-500 text-surface-100 hover:bg-accent-600
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Sparkles size={16} />
          {isDocumentReady ? 'Generate Summary' : 'Processing…'}
        </button>
      </div>
    </div>
  );
});

EmptySummaryState.propTypes = {
  onSummarize: PropTypes.func.isRequired,
  isDocumentReady: PropTypes.bool.isRequired,
};

/**
 * Copy button with success feedback
 */
const CopyButton = memo(function CopyButton({ onCopy, copied }) {
  return (
    <button
      onClick={onCopy}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
        transition-colors border
        ${copied 
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
          : 'bg-surface-800/50 text-surface-400 border-surface-700 hover:bg-surface-800 hover:text-surface-300'
        }
      `}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
});

CopyButton.propTypes = {
  onCopy: PropTypes.func.isRequired,
  copied: PropTypes.bool.isRequired,
};

/**
 * Regenerate summary button
 */
const RegenerateButton = memo(function RegenerateButton({ onRegenerate }) {
  return (
    <button
      onClick={onRegenerate}
      className="
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
        transition-colors bg-surface-800/50 text-surface-400 border border-surface-700
        hover:bg-surface-800 hover:text-surface-300
      "
    >
      <RefreshCw size={14} />
      Regenerate
    </button>
  );
});

RegenerateButton.propTypes = {
  onRegenerate: PropTypes.func.isRequired,
};

/**
 * Summary header with actions
 */
const SummaryHeader = memo(function SummaryHeader({ onCopy, copied, onRegenerate }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent-500" />
        <h3 className="text-sm font-semibold text-surface-100">
          AI Summary
        </h3>
      </div>

      <div className="flex items-center gap-2">
        <CopyButton onCopy={onCopy} copied={copied} />
        <RegenerateButton onRegenerate={onRegenerate} />
      </div>
    </div>
  );
});

SummaryHeader.propTypes = {
  onCopy: PropTypes.func.isRequired,
  copied: PropTypes.bool.isRequired,
  onRegenerate: PropTypes.func.isRequired,
};

/**
 * Summary content display
 */
const SummaryContent = memo(function SummaryContent({ summary }) {
  return (
    <div className="rounded-lg p-4 bg-surface-800 border border-surface-700">
      <p className="text-sm leading-relaxed text-surface-100 whitespace-pre-wrap">
        {summary}
      </p>
    </div>
  );
});

SummaryContent.propTypes = {
  summary: PropTypes.string.isRequired,
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DocSummary -- Displays the AI-generated summary for a document.
 *
 * States:
 *   - No summary, not loading: "Generate Summary" button
 *   - Loading: Skeleton pulse with status text
 *   - Summary exists: Readable card with Regenerate and Copy actions
 */
function DocSummary({ document, onSummarize, isLoading, isDocumentReady = true }) {
  const [copied, setCopied] = useState(false);

  const summary = document?.summary;

  const handleCopy = useCallback(async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select-and-copy not available in all contexts
    }
  }, [summary]);

  // Loading state
  if (isLoading) {
    return <SummarySkeleton />;
  }

  // No summary yet
  if (!summary) {
    return (
      <EmptySummaryState 
        onSummarize={onSummarize} 
        isDocumentReady={isDocumentReady} 
      />
    );
  }

  // Summary exists
  return (
    <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
      <SummaryHeader 
        onCopy={handleCopy} 
        copied={copied} 
        onRegenerate={onSummarize} 
      />
      <SummaryContent summary={summary} />
    </div>
  );
}

DocSummary.propTypes = {
  document: PropTypes.shape({
    summary: PropTypes.string,
  }),
  onSummarize: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  isDocumentReady: PropTypes.bool,
};

DocSummary.defaultProps = {
  document: null,
  isLoading: false,
  isDocumentReady: true,
};

export default DocSummary;
