import { memo } from 'react';
import PropTypes from 'prop-types';
import { Brain, Sparkles, FileText, AlertCircle } from 'lucide-react';
import AIInsightsPanel from '../pricing/AIInsightsPanel';
import TimelineVisualizer from '../pricing/TimelineVisualizer';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Section header with icon and title
 */
const SectionHeader = memo(function SectionHeader({ hasAnalysis }) {
  return (
    <div className="px-5 py-4 border-b border-surface-700 flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${hasAnalysis ? 'bg-accent-500/10' : 'bg-surface-700'}`}>
        <Brain className={`w-5 h-5 ${hasAnalysis ? 'text-accent-500' : 'text-surface-400'}`} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
          AI Analysis
        </h3>
        {hasAnalysis && (
          <p className="text-xs text-surface-400">
            AI-powered insights and recommendations
          </p>
        )}
      </div>
      {hasAnalysis && (
        <Sparkles className="w-4 h-4 text-accent-500 animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
});

/**
 * Empty state when no analysis is available
 */
const EmptyAnalysisState = memo(function EmptyAnalysisState() {
  return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-700 mb-4">
        <FileText className="w-6 h-6 text-surface-400" />
      </div>
      <h4 className="text-sm font-medium text-surface-300 mb-1">
        No Analysis Yet
      </h4>
      <p className="text-xs text-surface-500 max-w-xs mx-auto">
        Run AI analysis to get insights about your project requirements, timeline, and recommendations.
      </p>
    </div>
  );
});

/**
 * Error state for failed analysis
 */
const ErrorAnalysisState = memo(function ErrorAnalysisState({ message }) {
  return (
    <div className="p-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-danger-500/10 border border-danger-500/20">
        <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-danger-400 mb-1">
            Analysis Failed
          </h4>
          <p className="text-xs text-surface-400">
            {message || 'Unable to generate AI analysis. Please try again.'}
          </p>
        </div>
      </div>
    </div>
  );
});

/**
 * Analysis content with insights and timeline
 */
const AnalysisContent = memo(function AnalysisContent({ analysis, analysisText }) {
  return (
    <div className="p-5 space-y-6">
      <AIInsightsPanel 
        aiAnalysis={analysis} 
        aiAnalysisText={analysisText} 
      />
      <TimelineVisualizer aiAnalysis={analysis} />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * AIAnalysisSection - Container for AI analysis results
 * 
 * Displays:
 * - AI Insights Panel (structured analysis)
 * - Timeline Visualizer (project phases)
 * - Error/empty states
 * 
 * @param {Object} props
 * @param {Object|string} props.analysis - AI analysis result (object or string)
 * @param {Object} props.extractedData - Optional extracted data from blueprint
 * @param {string} props.error - Error message if analysis failed
 */
function AIAnalysisSection({ analysis, extractedData, error }) {
  // Normalize analysis data
  const hasAnalysis = !!analysis;
  const aiAnalysis = typeof analysis === 'object' ? analysis : null;
  const aiAnalysisText = typeof analysis === 'string' ? analysis : null;

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
      <SectionHeader hasAnalysis={hasAnalysis && !error} />
      
      {error ? (
        <ErrorAnalysisState message={error} />
      ) : !hasAnalysis ? (
        <EmptyAnalysisState />
      ) : (
        <AnalysisContent 
          analysis={aiAnalysis} 
          analysisText={aiAnalysisText} 
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

AIAnalysisSection.propTypes = {
  analysis: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  extractedData: PropTypes.object,
  error: PropTypes.string,
};

AIAnalysisSection.defaultProps = {
  analysis: null,
  extractedData: null,
  error: null,
};

SectionHeader.propTypes = {
  hasAnalysis: PropTypes.bool.isRequired,
};

ErrorAnalysisState.propTypes = {
  message: PropTypes.string,
};

AnalysisContent.propTypes = {
  analysis: PropTypes.object,
  analysisText: PropTypes.string,
};

export default memo(AIAnalysisSection);
