import { useState } from 'react';
import { Download, FileText, BarChart3, DollarSign, Lightbulb, Clock } from 'lucide-react';
import ProjectOverviewCard from './ProjectOverviewCard';
import FixtureBreakdownChart from './FixtureBreakdownChart';
import CostVisualization from './CostVisualization';
import AIInsightsPanel from './AIInsightsPanel';
import TimelineVisualizer from './TimelineVisualizer';

/**
 * AnalysisDashboard - Main container with tabbed interface for blueprint analysis
 * @param {object} estimate - Pricing estimate
 * @param {object} analysis - AI analysis (can be structured or text)
 * @param {object} extractedData - Data extracted from blueprint
 * @param {string} fileName - Blueprint file name
 */
export default function AnalysisDashboard({ estimate, analysis, extractedData, fileName }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle both structured and text analysis
  const aiAnalysis = analysis && typeof analysis === 'object' && !analysis.overview ? null : analysis;
  const aiAnalysisText = analysis && typeof analysis === 'string' ? analysis : analysis?.aiAnalysisText;

  if (!estimate && !analysis && !extractedData) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Enter project details and click "Calculate Estimate" or upload a blueprint to see analysis
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      count: null,
      show: true
    },
    {
      id: 'fixtures',
      label: 'Fixtures',
      icon: BarChart3,
      count: extractedData ? Object.values(extractedData).filter(v => typeof v === 'number' && v > 0).length : 0,
      show: extractedData && Object.keys(extractedData).length > 0
    },
    {
      id: 'costs',
      label: 'Cost Analysis',
      icon: DollarSign,
      count: null,
      show: estimate && estimate.breakdown
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
      count: null,
      show: aiAnalysis && (aiAnalysis.timeline || aiAnalysis.laborEstimate)
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Lightbulb,
      count: aiAnalysis ? (
        (aiAnalysis.recommendations?.length || 0) +
        (aiAnalysis.risks?.length || 0)
      ) : 0,
      show: aiAnalysis || aiAnalysisText
    }
  ].filter(tab => tab.show);

  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        // Import dynamically to avoid loading jspdf unnecessarily
        const { default: html2canvas } = await import('html2canvas');
        const { default: jsPDF } = await import('jspdf');

        const element = document.getElementById('analysis-dashboard');
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${fileName || 'blueprint-analysis'}.pdf`);
      } else if (format === 'image') {
        const { default: html2canvas } = await import('html2canvas');

        const element = document.getElementById('analysis-dashboard');
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true
        });

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName || 'blueprint-analysis'}.png`;
          link.click();
          URL.revokeObjectURL(url);
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Blueprint Analysis</h2>
            {fileName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">File: {fileName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('image')}
              className="btn-secondary flex items-center gap-2"
              title="Export as Image"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Image</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="btn-primary flex items-center gap-2"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap
                    transition-colors
                    ${isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div id="analysis-dashboard" className="min-h-[400px]">
        {activeTab === 'overview' && (
          <ProjectOverviewCard
            extractedData={extractedData}
            aiAnalysis={aiAnalysis}
            estimate={estimate}
          />
        )}

        {activeTab === 'fixtures' && (
          <FixtureBreakdownChart extractedData={extractedData} />
        )}

        {activeTab === 'costs' && (
          <CostVisualization estimate={estimate} />
        )}

        {activeTab === 'timeline' && (
          <TimelineVisualizer
            aiAnalysis={aiAnalysis}
            estimate={estimate}
          />
        )}

        {activeTab === 'insights' && (
          <AIInsightsPanel
            aiAnalysis={aiAnalysis}
            aiAnalysisText={aiAnalysisText}
          />
        )}
      </div>
    </div>
  );
}
