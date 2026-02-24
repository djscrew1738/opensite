/**
 * BlueprintAnalysisPanel Component
 * Comprehensive blueprint upload and analysis interface
 */

import React, { useState } from 'react';
import { useBlueprintAnalysis, useMethodComparison } from '../../hooks/useBlueprintAnalysis';

const SERVICE_OPTIONS = [
  { id: 'dimensions', label: 'Dimension Extraction', description: 'Extract measurements and cabinet codes' },
  { id: 'vision', label: 'Computer Vision', description: 'Detect walls, fixtures, and rooms visually' },
  { id: 'ai', label: 'AI Analysis', description: 'Generate material takeoffs and estimates' }
];

const STATUS_LABELS = {
  pending: 'Queued',
  extracting_text: 'Reading PDF...',
  running_dimensions: 'Extracting dimensions...',
  running_cv: 'Analyzing with computer vision...',
  running_ai: 'Generating AI estimate...',
  combining: 'Combining results...',
  completed: 'Analysis complete!',
  failed: 'Analysis failed'
};

export function BlueprintAnalysisPanel({ projectId, onAnalysisComplete }) {
  const [selectedServices, setSelectedServices] = useState(['dimensions', 'vision', 'ai']);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  
  const {
    submitAnalysis,
    analyzeSync,
    quickEstimate,
    status,
    progress,
    results,
    error,
    isLoading
  } = useBlueprintAnalysis();

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    try {
      const filePath = `/uploads/${uploadedFile.name}`;
      
      const result = await analyzeSync({
        filePath,
        projectId,
        services: selectedServices
      });
      
      onAnalysisComplete?.(result);
      setActiveTab('results');
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Blueprint Analysis</h2>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'results' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setActiveTab('results')}
            disabled={!results}
          >
            Results
          </button>
        </div>
      </div>

      {activeTab === 'upload' && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="blueprint-upload"
            />
            <label htmlFor="blueprint-upload" className="cursor-pointer block">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-300 mb-2">
                {uploadedFile ? uploadedFile.name : 'Drop PDF blueprint here or click to browse'}
              </p>
            </label>
          </div>

          {uploadedFile && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SERVICE_OPTIONS.map(service => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedServices.includes(service.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        readOnly
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{service.label}</span>
                    </div>
                    <p className="text-sm text-gray-400">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{STATUS_LABELS[status] || status}</span>
                <span className="text-gray-400">{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded">
              {error}
            </div>
          )}

          {uploadedFile && (
            <button
              onClick={handleAnalyze}
              disabled={isLoading || selectedServices.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Blueprint'}
            </button>
          )}
        </div>
      )}

      {activeTab === 'results' && results && (
        <AnalysisResults results={results} />
      )}
    </div>
  );
}

function AnalysisResults({ results }) {
  const { combined } = results;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded text-center">
            <div className="text-2xl font-bold">
              {combined?.fixtures ? Object.values(combined.fixtures).reduce((a, b) => a + b, 0) : 0}
            </div>
            <div className="text-sm text-gray-400">Total Fixtures</div>
          </div>
          <div className="bg-gray-700 p-4 rounded text-center">
            <div className="text-2xl font-bold">
              {combined?.pipeRuns?.combined?.estimatedFeet || 0}
            </div>
            <div className="text-sm text-gray-400">Estimated Pipe (ft)</div>
          </div>
          <div className="bg-gray-700 p-4 rounded text-center">
            <div className="text-2xl font-bold">
              ${combined?.totals?.material?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-400">Material Cost</div>
          </div>
          <div className="bg-gray-700 p-4 rounded text-center">
            <div className="text-2xl font-bold">
              ${combined?.totals?.total?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-400">Total Estimate</div>
          </div>
        </div>
        
        {combined?.sources && (
          <div className="mt-4 flex gap-2 items-center">
            <span className="text-sm text-gray-400">Sources:</span>
            {combined.sources.map(source => (
              <span key={source} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                {source}
              </span>
            ))}
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              {combined.confidence}% confidence
            </span>
          </div>
        )}
      </div>

      {combined?.fixtures && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Fixtures Detected</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(combined.fixtures).map(([key, value]) => (
              <div key={key} className="bg-gray-700 p-4 rounded text-center">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {combined?.materials && combined.materials.length > 0 && (
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
                {combined.materials.map((item, idx) => (
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
      )}
    </div>
  );
}

export default BlueprintAnalysisPanel;
