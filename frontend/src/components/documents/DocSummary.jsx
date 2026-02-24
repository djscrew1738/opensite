import { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check, Loader2 } from 'lucide-react';

/**
 * DocSummary -- Displays the AI-generated summary for a document.
 *
 * States:
 *   - No summary, not loading: "Generate Summary" button
 *   - Loading: Skeleton pulse with status text
 *   - Summary exists: Readable card with Regenerate and Copy actions
 */
export default function DocSummary({ document, onSummarize, isLoading }) {
  const [copied, setCopied] = useState(false);

  const summary = document?.summary;

  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select-and-copy not available in all contexts
    }
  };

  // -- Loading state --
  if (isLoading) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}>
        <div className="flex items-center gap-3 mb-4">
          <Loader2
            size={18}
            className="animate-spin"
            style={{ color: '#3B82F6' }}
          />
          <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>
            Generating summary...
          </span>
        </div>

        {/* Skeleton lines */}
        <div className="space-y-3">
          <div className="h-4 rounded-md animate-pulse" style={{ backgroundColor: '#1F2430', width: '100%' }} />
          <div className="h-4 rounded-md animate-pulse" style={{ backgroundColor: '#1F2430', width: '92%' }} />
          <div className="h-4 rounded-md animate-pulse" style={{ backgroundColor: '#1F2430', width: '78%' }} />
          <div className="h-4 rounded-md animate-pulse" style={{ backgroundColor: '#1F2430', width: '85%' }} />
          <div className="h-4 rounded-md animate-pulse" style={{ backgroundColor: '#1F2430', width: '60%' }} />
        </div>
      </div>
    );
  }

  // -- No summary yet --
  if (!summary) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
          >
            <Sparkles size={22} style={{ color: '#3B82F6' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#F1F5F9' }}>
              No summary available
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Generate an AI summary of this document
            </p>
          </div>
          <button
            onClick={onSummarize}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#3B82F6',
              color: '#F1F5F9',
            }}
          >
            <Sparkles size={16} />
            Generate Summary
          </button>
        </div>
      </div>
    );
  }

  // -- Summary exists --
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: '#3B82F6' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            AI Summary
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: copied ? 'rgba(16, 185, 129, 0.1)' : 'rgba(241, 245, 249, 0.05)',
              color: copied ? '#10B981' : '#94A3B8',
              border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : '#1F2430'}`,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {/* Regenerate button */}
          <button
            onClick={onSummarize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(241, 245, 249, 0.05)',
              color: '#94A3B8',
              border: '1px solid #1F2430',
            }}
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Summary text */}
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: '#181C24',
          border: '1px solid #1F2430',
        }}
      >
        <p
          className="text-sm leading-relaxed"
          style={{
            color: '#F1F5F9',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.7',
          }}
        >
          {summary}
        </p>
      </div>
    </div>
  );
}
