import { Brain } from 'lucide-react';
import AIInsightsPanel from '../pricing/AIInsightsPanel';
import TimelineVisualizer from '../pricing/TimelineVisualizer';

export default function AIAnalysisSection({ analysis, extractedData }) {
  if (!analysis) return null;

  const aiAnalysis = typeof analysis === 'object' ? analysis : null;
  const aiAnalysisText = typeof analysis === 'string' ? analysis : null;

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3">
        <Brain className="w-4.5 h-4.5 text-[#003594] dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider">
          AI Analysis
        </h3>
      </div>
      <div className="p-5 space-y-6">
        <AIInsightsPanel aiAnalysis={aiAnalysis} aiAnalysisText={aiAnalysisText} />
        <TimelineVisualizer aiAnalysis={aiAnalysis} />
      </div>
    </div>
  );
}
