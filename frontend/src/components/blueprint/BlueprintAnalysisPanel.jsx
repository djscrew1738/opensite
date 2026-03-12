/**
 * BlueprintAnalysisPanel Component
 * Comprehensive blueprint upload and analysis interface
 * 
 * @module components/blueprint/BlueprintAnalysisPanel
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { useBlueprintAnalysis } from '../../hooks/useBlueprintAnalysis';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Array<{id: string, label: string, description: string}>} */
const SERVICE_OPTIONS = [
  { 
    id: 'dimensions', 
    label: 'Dimension Extraction', 
    description: 'Extract measurements and cabinet codes' 
  },
  { 
    id: 'vision', 
    label: 'Computer Vision', 
    description: 'Detect walls, fixtures, and rooms visually' 
  },
  { 
    id: 'ai', 
    label: 'AI Analysis', 
    description: 'Generate material takeoffs and estimates' 
  },
];

/** @type {Record<string, string>} */
const STATUS_LABELS = {
  pending: 'Queued',
  extracting_text: 'Reading PDF...',
  running_dimensions: 'Extracting dimensions...',
  running_cv: 'Analyzing with computer vision...',
  running_ai: 'Generating AI estimate...',
  combining: 'Combining results...',
  completed: 'Analysis complete!',
  failed: 'Analysis failed',
};

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage service selection state
 * @param {string[]} initialServices - Initial selected services
 * @returns {{selectedServices: string[], toggleService: (id: string) => void}}
 */
function useServiceSelection(initialServices = ['dimensions', 'vision', 'ai']) {
  const [selectedServices, setSelectedServices] = useState(initialServices);

  const toggleService = useCallback((serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  }, []);

  return { selectedServices, toggleService };
}

/**
 * Hook to manage file upload state
 * @returns {{uploadedFile: File | null, handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => File | null, clearFile: () => void}}
 */
function useFileUpload() {
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      return file;
    }
    return null;
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  return { uploadedFile, handleFileUpload, clearFile };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Tab button for switching between upload and results
 * @param {{active: boolean, onClick: () => void, disabled?: boolean, children: React.ReactNode}} props
 */
const TabButton = memo(function TabButton({ 
  active, 
  onClick, 
  disabled, 
  children 
}) {
  const baseClasses = 'px-4 py-2 rounded transition-colors font-medium';
  const activeClasses = 'bg-accent text-white';
  const inactiveClasses = 'bg-surface-elevated text-text-secondary hover:bg-surface-card';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${disabled ? disabledClasses : ''}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
});

TabButton.displayName = 'TabButton';

/**
 * File upload area with drag-and-drop styling
 * @param {{fileName: string | undefined, onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void}} props
 */
const FileUploadArea = memo(function FileUploadArea({ 
  fileName, 
  onFileSelect 
}) {
  return (
    <div 
      className="border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-border-strong cursor-pointer"
      style={{ borderColor: colors.border.default }}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={onFileSelect}
        className="hidden"
        id="blueprint-upload"
        aria-label="Upload PDF blueprint"
      />
      <label htmlFor="blueprint-upload" className="cursor-pointer block">
        <div className="text-4xl mb-4" role="img" aria-hidden="true">📄</div>
        <p className="text-text-secondary mb-2">
          {fileName || 'Drop PDF blueprint here or click to browse'}
        </p>
        {!fileName && (
          <p className="text-xs text-text-muted">Supports PDF files up to 100MB</p>
        )}
      </label>
    </div>
  );
});

FileUploadArea.displayName = 'FileUploadArea';

/**
 * Service selection card
 * @param {{service: typeof SERVICE_OPTIONS[0], isSelected: boolean, onToggle: (id: string) => void}} props
 */
const ServiceCard = memo(function ServiceCard({ 
  service, 
  isSelected, 
  onToggle 
}) {
  const handleClick = useCallback(() => {
    onToggle(service.id);
  }, [onToggle, service.id]);

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      className="p-4 rounded-lg border cursor-pointer transition-all"
      style={{
        borderColor: isSelected ? colors.accent.DEFAULT : colors.border.default,
        backgroundColor: isSelected ? colors.accent.muted : colors.surface.card,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="w-4 h-4 accent-accent"
          tabIndex={-1}
        />
        <span className="font-medium text-text-primary">{service.label}</span>
      </div>
      <p className="text-sm text-text-secondary">{service.description}</p>
    </div>
  );
});

ServiceCard.displayName = 'ServiceCard';

/**
 * Service selection grid
 * @param {{services: typeof SERVICE_OPTIONS, selectedServices: string[], onToggle: (id: string) => void}} props
 */
const ServiceSelection = memo(function ServiceSelection({ 
  services, 
  selectedServices, 
  onToggle 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Analysis Services</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServices.includes(service.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
});

ServiceSelection.displayName = 'ServiceSelection';

/**
 * Analysis progress bar
 * @param {{status: string, progress: number}} props
 */
const AnalysisProgress = memo(function AnalysisProgress({ status, progress }) {
  const statusText = STATUS_LABELS[status] || status;
  const progressWidth = `${Math.min(Math.max(progress || 0, 0), 100)}%`;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{statusText}</span>
        <span className="text-text-muted font-mono">{progress}%</span>
      </div>
      <div 
        className="w-full rounded-full h-2 overflow-hidden"
        style={{ backgroundColor: colors.border.default }}
      >
        <div 
          className="bg-accent h-2 rounded-full transition-all duration-300"
          style={{ width: progressWidth }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
});

AnalysisProgress.displayName = 'AnalysisProgress';

/**
 * Error message display
 * @param {{message: string}} props
 */
const ErrorMessage = memo(function ErrorMessage({ message }) {
  return (
    <div 
      className="border rounded p-4"
      style={{ 
        backgroundColor: colors.danger.muted,
        borderColor: colors.danger.border,
        color: colors.danger.light,
      }}
      role="alert"
    >
      {message}
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

/**
 * Analysis action button
 * @param {{onClick: () => void, disabled: boolean, isLoading: boolean}} props
 */
const AnalyzeButton = memo(function AnalyzeButton({ 
  onClick, 
  disabled, 
  isLoading 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      style={{
        backgroundColor: disabled ? colors.border.strong : colors.accent.DEFAULT,
        color: 'white',
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = colors.accent.hover)}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = colors.accent.DEFAULT)}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Analyzing...
        </span>
      ) : 'Analyze Blueprint'}
    </button>
  );
});

AnalyzeButton.displayName = 'AnalyzeButton';

/**
 * Stat card for results display
 * @param {{value: string | number, label: string}} props
 */
const StatCard = memo(function StatCard({ value, label }) {
  return (
    <div 
      className="p-4 rounded text-center"
      style={{ backgroundColor: colors.border.default }}
    >
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-sm text-text-secondary">{label}</div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Analysis summary section
 * @param {{combined: any}} props
 */
const AnalysisSummary = memo(function AnalysisSummary({ combined }) {
  const stats = useMemo(() => {
    const totalFixtures = combined?.fixtures 
      ? Object.values(combined.fixtures).reduce((a, b) => a + b, 0) 
      : 0;
    
    return {
      fixtures: totalFixtures,
      pipeFeet: combined?.pipeRuns?.combined?.estimatedFeet || 0,
      materialCost: combined?.totals?.material || 0,
      totalEstimate: combined?.totals?.total || 0,
    };
  }, [combined]);

  const formatCurrency = (value) => `$${value.toLocaleString()}`;

  return (
    <div 
      className="rounded-lg p-6"
      style={{ backgroundColor: colors.surface.card }}
    >
      <h3 className="text-xl font-semibold text-text-primary mb-4">Analysis Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.fixtures} label="Total Fixtures" />
        <StatCard value={stats.pipeFeet} label="Estimated Pipe (ft)" />
        <StatCard value={formatCurrency(stats.materialCost)} label="Material Cost" />
        <StatCard value={formatCurrency(stats.totalEstimate)} label="Total Estimate" />
      </div>
      
      {combined?.sources && (
        <div className="mt-4 flex gap-2 items-center flex-wrap">
          <span className="text-sm text-text-secondary">Sources:</span>
          {combined.sources.map(source => (
            <span 
              key={source} 
              className="text-xs px-2 py-1 rounded"
              style={{ 
                backgroundColor: colors.accent.muted,
                color: colors.accent.light,
              }}
            >
              {source}
            </span>
          ))}
          <span 
            className="text-xs px-2 py-1 rounded"
            style={{ 
              backgroundColor: colors.success.muted,
              color: colors.success.light,
            }}
          >
            {combined.confidence}% confidence
          </span>
        </div>
      )}
    </div>
  );
});

AnalysisSummary.displayName = 'AnalysisSummary';

/**
 * Fixtures detected section
 * @param {{fixtures: Record<string, number>}} props
 */
const FixturesSection = memo(function FixturesSection({ fixtures }) {
  if (!fixtures || Object.keys(fixtures).length === 0) return null;

  return (
    <div 
      className="rounded-lg p-6"
      style={{ backgroundColor: colors.surface.card }}
    >
      <h3 className="text-xl font-semibold text-text-primary mb-4">Fixtures Detected</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(fixtures).map(([key, value]) => (
          <div 
            key={key} 
            className="p-4 rounded text-center"
            style={{ backgroundColor: colors.border.default }}
          >
            <div className="text-2xl font-bold text-text-primary">{value}</div>
            <div className="text-sm text-text-secondary capitalize">
              {key.replace(/_/g, ' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

FixturesSection.displayName = 'FixturesSection';

/**
 * Material takeoff table
 * @param {{materials: Array<{item: string, category: string, qty?: number, quantity?: number, unit: string, cost?: number, unitCost?: number}>}} props
 */
const MaterialTakeoffTable = memo(function MaterialTakeoffTable({ materials }) {
  if (!materials?.length) return null;

  return (
    <div 
      className="rounded-lg p-6"
      style={{ backgroundColor: colors.surface.card }}
    >
      <h3 className="text-xl font-semibold text-text-primary mb-4">Material Takeoff</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr 
              className="text-left"
              style={{ borderBottom: `1px solid ${colors.border.default}` }}
            >
              <th className="pb-2 text-text-secondary font-medium">Item</th>
              <th className="pb-2 text-text-secondary font-medium">Category</th>
              <th className="pb-2 text-text-secondary font-medium">Qty</th>
              <th className="pb-2 text-text-secondary font-medium">Unit</th>
              <th className="pb-2 text-text-secondary font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {materials.map((item, idx) => (
              <tr key={idx} style={{ borderColor: colors.border.default }}>
                <td className="py-2 text-text-primary">{item.item}</td>
                <td className="py-2 text-text-secondary">{item.category}</td>
                <td className="py-2 text-text-primary">{item.qty || item.quantity}</td>
                <td className="py-2 text-text-secondary">{item.unit}</td>
                <td className="py-2 text-text-primary text-right font-mono">
                  ${(item.cost || item.unitCost || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

MaterialTakeoffTable.displayName = 'MaterialTakeoffTable';

/**
 * Analysis results component
 * @param {{results: {combined: any}}} props
 */
const AnalysisResults = memo(function AnalysisResults({ results }) {
  const { combined } = results;

  return (
    <div className="space-y-6">
      <AnalysisSummary combined={combined} />
      <FixturesSection fixtures={combined?.fixtures} />
      <MaterialTakeoffTable materials={combined?.materials} />
    </div>
  );
});

AnalysisResults.displayName = 'AnalysisResults';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * BlueprintAnalysisPanel Component
 * Comprehensive blueprint upload and analysis interface
 * 
 * @param {{projectId?: string, onAnalysisComplete?: (result: any) => void}} props
 */
export function BlueprintAnalysisPanel({ projectId, onAnalysisComplete }) {
  const [activeTab, setActiveTab] = useState('upload');
  
  const { selectedServices, toggleService } = useServiceSelection();
  const { uploadedFile, handleFileUpload } = useFileUpload();
  
  const {
    analyzeSync,
    status,
    progress,
    results,
    error,
    isLoading,
  } = useBlueprintAnalysis();

  const handleAnalyze = useCallback(async () => {
    if (!uploadedFile) return;

    try {
      const filePath = `/uploads/${uploadedFile.name}`;
      
      const result = await analyzeSync({
        filePath,
        projectId,
        services: selectedServices,
      });
      
      onAnalysisComplete?.(result);
      setActiveTab('results');
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  }, [uploadedFile, projectId, selectedServices, analyzeSync, onAnalysisComplete]);

  const canAnalyze = uploadedFile && selectedServices.length > 0 && !isLoading;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Blueprint Analysis</h2>
        <div className="flex gap-2">
          <TabButton
            active={activeTab === 'upload'}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </TabButton>
          <TabButton
            active={activeTab === 'results'}
            onClick={() => setActiveTab('results')}
            disabled={!results}
          >
            Results
          </TabButton>
        </div>
      </div>

      {activeTab === 'upload' && (
        <div 
          className="rounded-lg p-6 space-y-6"
          style={{ 
            backgroundColor: colors.surface.card,
            boxShadow: shadows.card,
          }}
        >
          <FileUploadArea 
            fileName={uploadedFile?.name} 
            onFileSelect={handleFileUpload}
          />

          {uploadedFile && (
            <ServiceSelection
              services={SERVICE_OPTIONS}
              selectedServices={selectedServices}
              onToggle={toggleService}
            />
          )}

          {isLoading && <AnalysisProgress status={status} progress={progress} />}
          {error && <ErrorMessage message={error} />}

          {uploadedFile && (
            <AnalyzeButton
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              isLoading={isLoading}
            />
          )}
        </div>
      )}

      {activeTab === 'results' && results && (
        <AnalysisResults results={results} />
      )}
    </div>
  );
}

BlueprintAnalysisPanel.displayName = 'BlueprintAnalysisPanel';

export default BlueprintAnalysisPanel;
