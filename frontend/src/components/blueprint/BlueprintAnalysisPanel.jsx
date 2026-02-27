import { useState, useCallback, useMemo, memo } from 'react';
import { useBlueprintAnalysis } from '../../hooks/useBlueprintAnalysis';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

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
 */
const TabButton = memo(function TabButton({ 
  active, 
  onClick, 
  disabled, 
  children 
}) {
  return (
    <button
      className={`px-4 py-2 rounded transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
});

/**
 * File upload area with drag-and-drop styling
 */
const FileUploadArea = memo(function FileUploadArea({ 
  fileName, 
  onFileSelect 
}) {
  return (
    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
      <input
        type="file"
        accept=".pdf"
        onChange={onFileSelect}
        className="hidden"
        id="blueprint-upload"
      />
      <label htmlFor="blueprint-upload" className="cursor-pointer block">
        <div className="text-4xl mb-4">📄</div>
        <p className="text-gray-300 mb-2">
          {fileName || 'Drop PDF blueprint here or click to browse'}
        </p>
      </label>
    </div>
  );
});

/**
 * Service selection card
 */
const ServiceCard = memo(function ServiceCard({ 
  service, 
  isSelected, 
  onToggle 
}) {
  return (
    <div
      onClick={() => onToggle(service.id)}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-600 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="w-4 h-4"
        />
        <span className="font-medium">{service.label}</span>
      </div>
      <p className="text-sm text-gray-400">{service.description}</p>
    </div>
  );
});

/**
 * Service selection grid
 */
const ServiceSelection = memo(function ServiceSelection({ 
  services, 
  selectedServices, 
  onToggle 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Analysis Services</h3>
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

/**
 * Analysis progress bar
 */
const AnalysisProgress = memo(function AnalysisProgress({ status, progress }) {
  const statusText = STATUS_LABELS[status] || status;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{statusText}</span>
        <span className="text-gray-400">{progress}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

/**
 * Error message display
 */
const ErrorMessage = memo(function ErrorMessage({ message }) {
  return (
    <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded">
      {message}
    </div>
  );
});

/**
 * Analysis action button
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
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
    >
      {isLoading ? 'Analyzing...' : 'Analyze Blueprint'}
    </button>
  );
});

/**
 * Stat card for results display
 */
const StatCard = memo(function StatCard({ value, label }) {
  return (
    <div className="bg-gray-700 p-4 rounded text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
});

/**
 * Analysis summary section
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

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Analysis Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.fixtures} label="Total Fixtures" />
        <StatCard value={stats.pipeFeet} label="Estimated Pipe (ft)" />
        <StatCard value={`$${stats.materialCost.toLocaleString()}`} label="Material Cost" />
        <StatCard value={`$${stats.totalEstimate.toLocaleString()}`} label="Total Estimate" />
      </div>
      
      {combined?.sources && (
        <div className="mt-4 flex gap-2 items-center flex-wrap">
          <span className="text-sm text-gray-400">Sources:</span>
          {combined.sources.map(source => (
            <span 
              key={source} 
              className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
            >
              {source}
            </span>
          ))}
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
            {combined.confidence}% confidence
          </span>
        </div>
      )}
    </div>
  );
});

/**
 * Fixtures detected section
 */
const FixturesSection = memo(function FixturesSection({ fixtures }) {
  if (!fixtures || Object.keys(fixtures).length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Fixtures Detected</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(fixtures).map(([key, value]) => (
          <div key={key} className="bg-gray-700 p-4 rounded text-center">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-gray-400 capitalize">
              {key.replace(/_/g, ' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Material takeoff table
 */
const MaterialTakeoffTable = memo(function MaterialTakeoffTable({ materials }) {
  if (!materials?.length) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Material Takeoff</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-2 text-gray-400">Item</th>
              <th className="pb-2 text-gray-400">Category</th>
              <th className="pb-2 text-gray-400">Qty</th>
              <th className="pb-2 text-gray-400">Unit</th>
              <th className="pb-2 text-gray-400 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-700">
                <td className="py-2">{item.item}</td>
                <td className="py-2 text-gray-400">{item.category}</td>
                <td className="py-2">{item.qty || item.quantity}</td>
                <td className="py-2 text-gray-400">{item.unit}</td>
                <td className="py-2 text-right">
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

/**
 * Analysis results component
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

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * BlueprintAnalysisPanel Component
 * Comprehensive blueprint upload and analysis interface
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
        <h2 className="text-2xl font-bold">Blueprint Analysis</h2>
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
        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
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

export default BlueprintAnalysisPanel;
