import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { 
  Upload, FileText, Loader, CheckCircle, XCircle, AlertCircle, Clock, 
  Wrench, ClipboardList, ChevronDown, ChevronUp, Download 
} from 'lucide-react';

// Constants defined outside component
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_DURATION = 300000; // 5 minutes

// Memoized child components
const MemoizedWrench = memo(Wrench);
const MemoizedClipboardList = memo(ClipboardList);

function BlueprintUpload({ onAnalysisComplete, tier, selectedModel }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [takeoffFilter, setTakeoffFilter] = useState('All');
  const [takeoffExpanded, setTakeoffExpanded] = useState(true);
  
  // Refs for cleanup
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const pollStartRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized file validation
  const validateFile = useCallback((fileToValidate) => {
    if (fileToValidate.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 100MB. Your file is ${(fileToValidate.size / 1024 / 1024).toFixed(2)}MB.`;
    }
    return null;
  }, []);

  // Memoized file select handler
  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress(0);
  }, [validateFile]);

  // Memoized drag and drop handlers
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const validationError = validateFile(droppedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(droppedFile);
    setResult(null);
    setError(null);
    setProgress(0);
  }, [validateFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Stop polling helper
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Poll job status - memoized
  const pollJobStatus = useCallback(async (id) => {
    // Safety timeout: stop polling after 5 minutes
    if (pollStartRef.current && Date.now() - pollStartRef.current > MAX_POLL_DURATION) {
      stopPolling();
      setProcessing(false);
      setError('Analysis timed out after 5 minutes. The AI provider may be unavailable. Please try again.');
      return;
    }

    try {
      const { api } = await import('../../api/client');
      const jobStatus = await api.jobs.getStatus(id);

      setProgress(jobStatus.progress || 0);

      if (jobStatus.status === 'completed') {
        stopPolling();
        setProcessing(false);
        setResult(jobStatus.result);
        setProgress(100);

        if (onAnalysisComplete && jobStatus.result) {
          onAnalysisComplete(jobStatus.result);
        }
      } else if (jobStatus.status === 'failed') {
        stopPolling();
        setProcessing(false);
        setError(jobStatus.error || 'Analysis failed. Check AI provider settings and try again.');
      }
    } catch (err) {
      console.error('Error polling job status:', err);
      stopPolling();
      setProcessing(false);
      setError('Lost connection while checking analysis status. Please try again.');
    }
  }, [onAnalysisComplete, stopPolling]);

  // Upload handler - memoized
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const { api } = await import('../../api/client');
      const response = await api.upload.blueprint(file, tier, selectedModel, true);

      setUploading(false);

      if (response.jobId) {
        // Async mode - start polling for job status
        setProcessing(true);
        setProgress(10);

        // Show extracted data immediately if available
        if (response.extractedData && Object.keys(response.extractedData).length > 0) {
          setResult({
            fileName: response.fileName,
            extractedData: response.extractedData,
            textExtracted: response.textExtracted,
            partial: true
          });

          if (onAnalysisComplete) {
            onAnalysisComplete({
              extractedData: response.extractedData,
              fileName: response.fileName
            });
          }
        }

        // Start polling
        pollStartRef.current = Date.now();
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(response.jobId);
        }, POLL_INTERVAL);
      } else {
        // Sync mode response
        setResult(response);
        if (onAnalysisComplete && response.extractedData) {
          onAnalysisComplete(response);
        }
      }
    } catch (err) {
      if (err.response?.status === 413 || err.message?.includes('413') || err.message?.includes('too large')) {
        setError('File too large. Maximum upload size is 100MB. Please compress your file or upload a smaller blueprint.');
      } else {
        setError(err.message || 'Upload failed');
      }
      setUploading(false);
      setProcessing(false);
    }
  }, [file, tier, selectedModel, onAnalysisComplete, pollJobStatus]);

  // Clear file handler - memoized
  const clearFile = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProcessing(false);
    stopPolling();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stopPolling]);

  // Retry handler - memoized
  const handleRetry = useCallback(() => {
    setError(null);
    handleUpload();
  }, [handleUpload]);

  // Toggle handlers - memoized
  const toggleTakeoffExpanded = useCallback(() => {
    setTakeoffExpanded(prev => !prev);
  }, []);

  // Derived state
  const isAnalyzing = uploading || processing;
  const showPartialResults = result && result.partial;

  // Export handler with cleanup
  const handleExportCSV = useCallback(() => {
    if (!result?.aiAnalysis?.materialTakeoff) return;
    
    const takeoff = result.aiAnalysis.materialTakeoff;
    const rows = [['Item', 'Category', 'Description', 'Qty', 'Unit', 'Unit Cost', 'Total Cost']];
    takeoff.forEach(m => rows.push([m.item, m.category, m.description, m.quantity, m.unit, m.unitCost, m.totalCost]));
    rows.push([]);
    rows.push(['', '', '', '', '', 'GRAND TOTAL', takeoff.reduce((s, m) => s + (m.totalCost || 0), 0)]);
    
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `takeoff-${result.fileName || 'export'}.csv`;
    
    requestAnimationFrame(() => {
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
  }, [result]);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Blueprint Upload & Analysis
      </h3>

      {/* Upload Area */}
      {!file && !result && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            PDF, JPG, or PNG (Max 100MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Selected File */}
      {file && !result && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              disabled={isAnalyzing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isAnalyzing}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Analyze with AI
                </>
              )}
            </button>
            <button
              type="button"
              onClick={clearFile}
              disabled={isAnalyzing}
              className="btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {selectedModel && (
            <p className="text-xs text-gray-500 mt-2">
              Using model: {selectedModel}
            </p>
          )}
        </div>
      )}

      {/* Processing Status */}
      {processing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">AI Analysis in Progress</p>
              <p className="text-sm text-blue-700">
                This may take 2-5 minutes. You can continue working while we analyze...
              </p>
            </div>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 text-right mt-1">{progress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-300">Analysis Failed</p>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {file && (
              <button
                type="button"
                onClick={handleRetry}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Retry Analysis
              </button>
            )}
            <button
              type="button"
              onClick={clearFile}
              className="btn-secondary text-sm"
            >
              Upload Different File
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <BlueprintResults 
          result={result}
          takeoffFilter={takeoffFilter}
          setTakeoffFilter={setTakeoffFilter}
          takeoffExpanded={takeoffExpanded}
          toggleTakeoffExpanded={toggleTakeoffExpanded}
          onExportCSV={handleExportCSV}
          onClearFile={clearFile}
        />
      )}
    </div>
  );
}

// Separated results component for better performance
const BlueprintResults = memo(({
  result,
  takeoffFilter,
  setTakeoffFilter,
  takeoffExpanded,
  toggleTakeoffExpanded,
  onExportCSV,
  onClearFile
}) => {
  const showPartialResults = result.partial;
  
  // Get fixtures data
  const fixtures = useMemo(() => {
    const ex = result.extractedData || {};
    const ai = result.aiAnalysis?.fixtures || {};
    const fixtureList = [
      { key: 'toilets', label: 'Toilets' },
      { key: 'lavatories', label: 'Lavs' },
      { key: 'kitchenFaucets', label: 'Kitchen' },
      { key: 'barSinks', label: 'Bar Sinks' },
      { key: 'tubs', label: 'Tubs' },
      { key: 'showerBases', label: 'Showers' },
      { key: 'mudPans', label: 'Mud Pans' },
      { key: 'washingMachines', label: 'W/M' },
      { key: 'waterSoftenerPreplumb', label: 'WS Pre' },
      { key: 'waterSoftener', label: 'WS Pre' },
    ];
    
    const hasFixtures = fixtureList.some(f => (ai[f.key] || ex[f.key]) > 0);
    const total = ai.total || fixtureList.reduce((s, f) => s + (ai[f.key] || ex[f.key] || 0), 0);
    
    return { fixtureList, hasFixtures, total };
  }, [result]);

  // Get material takeoff data
  const takeoffData = useMemo(() => {
    if (!result.aiAnalysis?.materialTakeoff?.length) return null;
    
    const takeoff = result.aiAnalysis.materialTakeoff;
    const categories = ['All', ...new Set(takeoff.map(m => m.category).filter(Boolean))];
    const filtered = takeoffFilter === 'All' ? takeoff : takeoff.filter(m => m.category === takeoffFilter);
    const grandTotal = filtered.reduce((sum, m) => sum + (m.totalCost || 0), 0);
    
    return { takeoff, categories, filtered, grandTotal };
  }, [result.aiAnalysis, takeoffFilter]);

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={`${showPartialResults ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 flex items-center gap-3`}>
        {showPartialResults ? (
          <>
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-900">Extracted Data Ready</p>
              <p className="text-sm text-blue-700">AI analysis in progress...</p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Analysis Complete</p>
              <p className="text-sm text-green-700">{result.fileName}</p>
            </div>
          </>
        )}
      </div>

      {/* Full Analysis Output */}
      {!result.partial && (
        <div className="border border-gray-200 dark:border-surface-700 rounded-xl overflow-hidden bg-white dark:bg-surface-900">
          {/* Hero Section */}
          <BlueprintHero result={result} />

          {/* Content */}
          <div className="divide-y divide-gray-100 dark:divide-surface-700">
            {/* Fixtures */}
            {fixtures.hasFixtures && <FixturesSection fixtures={fixtures} />}

            {/* Material Takeoff */}
            {takeoffData && (
              <MaterialTakeoffSection
                takeoffData={takeoffData}
                takeoffFilter={takeoffFilter}
                setTakeoffFilter={setTakeoffFilter}
                takeoffExpanded={takeoffExpanded}
                toggleTakeoffExpanded={toggleTakeoffExpanded}
                onExportCSV={onExportCSV}
                fileName={result.fileName}
              />
            )}
          </div>

          {/* Model attribution */}
          {result.modelUsed && (
            <div className="px-6 py-2.5 bg-gray-50 dark:bg-surface-800 border-t border-gray-100 dark:border-surface-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right">Analyzed with {result.modelUsed}</p>
            </div>
          )}
        </div>
      )}

      {/* Partial Results */}
      {result.partial && result.extractedData && Object.keys(result.extractedData).length > 0 && (
        <PartialResults extractedData={result.extractedData} />
      )}

      {/* Warnings */}
      {result.warnings?.length > 0 && !result.partial && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      <button type="button" onClick={onClearFile} className="btn-secondary w-full">
        Upload Another Blueprint
      </button>
    </div>
  );
});

const BlueprintHero = memo(({ result }) => {
  const ex = result.extractedData || {};
  
  const stats = useMemo(() => [
    { label: 'Estimate', value: result.estimate?.total || result.aiAnalysis?.totals?.estimate, color: 'text-white' },
    { label: 'Material', value: result.estimate?.materialTotal || result.aiAnalysis?.totals?.material, color: 'text-emerald-300' },
    { label: 'Per Unit', value: result.estimate?.perUnit },
    { label: 'Sq Ft', value: ex.sqft },
    { label: 'Units', value: ex.units },
    { label: 'Stories', value: ex.stories },
    { label: 'Baths', value: ex.bathrooms },
  ].filter(s => s.value > 0), [result, ex]);

  return (
    <div className="px-6 py-5 bg-gradient-to-r from-[#3B82F6] to-[#1d4ed8]">
      <h4 className="text-lg font-bold text-white">{result.fileName}</h4>

      <div className="flex flex-wrap gap-4 mt-3">
        {stats.map(stat => (
          <div key={stat.label}>
            <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color || 'text-white'}`}>
              {stat.label === 'Sq Ft' || stat.label === 'Units' || stat.label === 'Stories' || stat.label === 'Baths' 
                ? stat.value.toLocaleString() 
                : `$${stat.value.toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      {result.aiAnalysis?.notes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.aiAnalysis.notes.map((n, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 bg-white/10 text-blue-200 rounded-full">{n}</span>
          ))}
        </div>
      )}
    </div>
  );
});

const FixturesSection = memo(({ fixtures }) => (
  <div className="px-6 py-4">
    <div className="flex items-center gap-2.5 mb-3">
      <MemoizedWrench className="w-4 h-4 text-[#3B82F6] dark:text-blue-400" />
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Fixtures</h4>
      <span className="text-xs font-bold text-[#3B82F6] dark:text-blue-400 ml-auto">{fixtures.total} total</span>
    </div>
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
      {fixtures.fixtureList
        .filter(f => f.count > 0)
        .map(f => (
          <div key={f.key} className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{f.count}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{f.label}</p>
          </div>
        ))}
    </div>
  </div>
));

const MaterialTakeoffSection = memo(({
  takeoffData,
  takeoffFilter,
  setTakeoffFilter,
  takeoffExpanded,
  toggleTakeoffExpanded,
  onExportCSV,
  fileName
}) => {
  const { takeoff, categories, filtered, grandTotal } = takeoffData;

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <MemoizedClipboardList className="w-4 h-4 text-[#3B82F6] dark:text-blue-400" />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Material Takeoff</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">{takeoff.length} items</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="text-xs px-2.5 py-1.5 bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-surface-600 transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
          <button type="button" onClick={toggleTakeoffExpanded} className="text-gray-400 hover:text-gray-600 p-1">
            {takeoffExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      {takeoffExpanded && categories.length > 2 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map(cat => (
            <button 
              key={cat} 
              type="button" 
              onClick={() => setTakeoffFilter(cat)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                takeoffFilter === cat ? 'bg-[#3B82F6] text-white' : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {cat} ({cat === 'All' ? takeoff.length : takeoff.filter(m => m.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {takeoffExpanded && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-surface-600">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-surface-700">
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Item</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Cat</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Qty</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Unit</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold hidden sm:table-cell">Each</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-surface-600">
                {filtered.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-surface-750 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{m.item}</p>
                      {m.description && <p className="text-[11px] text-gray-500 mt-0.5">{m.description}</p>}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 rounded">{m.category}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-gray-100">{m.quantity?.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{m.unit}</td>
                    <td className="px-3 py-2 text-right text-gray-600 hidden sm:table-cell">${m.unitCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100">${m.totalCost?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-surface-700 font-bold">
                  <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100" colSpan={2}>Material Total</td>
                  <td colSpan={3} className="hidden sm:table-cell"></td>
                  <td className="px-3 py-2.5 text-right text-lg text-[#3B82F6] dark:text-blue-400">${grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Category cost bars */}
          {takeoffFilter === 'All' && categories.length > 2 && (
            <div className="mt-3 space-y-1.5">
              {categories.filter(c => c !== 'All').map(cat => {
                const catTotal = takeoff.filter(m => m.category === cat).reduce((s, m) => s + (m.totalCost || 0), 0);
                const pct = grandTotal > 0 ? (catTotal / grandTotal * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{cat}</span>
                      <span className="text-gray-500">${catTotal.toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-surface-700 rounded-full h-1.5">
                      <div className="bg-[#3B82F6] dark:bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
});

const PartialResults = memo(({ extractedData }) => (
  <div className="bg-blue-50 dark:bg-surface-800 border border-blue-200 dark:border-surface-700 rounded-xl p-5">
    <h4 className="font-semibold text-blue-900 dark:text-gray-100 mb-3">Extracted Information</h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.entries(extractedData)
        .filter(([, v]) => v > 0)
        .map(([key, val]) => (
          <div key={key} className="bg-white dark:bg-surface-700 rounded-lg p-2.5 border border-blue-100 dark:border-surface-600 flex items-center justify-between">
            <span className="text-xs text-blue-700 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-sm font-bold text-blue-900 dark:text-gray-100">
              {typeof val === 'number' ? val.toLocaleString() : val}
            </span>
          </div>
        ))}
    </div>
  </div>
));

export default memo(BlueprintUpload);
