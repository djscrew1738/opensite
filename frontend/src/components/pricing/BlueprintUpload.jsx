import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader, CheckCircle, XCircle, AlertCircle, Clock, Wrench, ShieldCheck, TrendingUp, Package, CalendarDays, DollarSign, Gauge, ClipboardList, ClipboardCheck, ChevronDown, ChevronUp, Download } from 'lucide-react';

export default function BlueprintUpload({ onAnalysisComplete, tier, selectedModel }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [_jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [takeoffFilter, setTakeoffFilter] = useState('All');
  const [takeoffExpanded, setTakeoffExpanded] = useState(true);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const pollStartRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setJobId(null);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
      setJobId(null);
      setProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const pollJobStatus = async (id) => {
    try {
      // Safety timeout: stop polling after 5 minutes
      if (pollStartRef.current && Date.now() - pollStartRef.current > 300000) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setProcessing(false);
        setError('Analysis timed out after 5 minutes. The AI provider may be unavailable. Please try again.');
        return;
      }

      const { api } = await import('../../api/client');
      const jobStatus = await api.jobs.getStatus(id);

      setProgress(jobStatus.progress || 0);

      if (jobStatus.status === 'completed') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setProcessing(false);
        setResult(jobStatus.result);
        setProgress(100);

        if (onAnalysisComplete && jobStatus.result) {
          onAnalysisComplete(jobStatus.result);
        }
      } else if (jobStatus.status === 'failed') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setProcessing(false);
        setError(jobStatus.error || 'Analysis failed. Check AI provider settings and try again.');
      }
    } catch (err) {
      console.error('Error polling job status:', err);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setProcessing(false);
      setError('Lost connection while checking analysis status. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const { api } = await import('../../api/client');
      const response = await api.upload.blueprint(file, tier, selectedModel, true); // async=true

      // Upload complete, now we have a job ID
      setUploading(false);

      if (response.jobId) {
        // Async mode - start polling for job status
        setJobId(response.jobId);
        setProcessing(true);
        setProgress(10);

        // Show extracted data immediately if available
        if (response.extractedData && Object.keys(response.extractedData).length > 0) {
          // Create a partial result to show extracted data while AI processes
          setResult({
            fileName: response.fileName,
            extractedData: response.extractedData,
            textExtracted: response.textExtracted,
            partial: true // Flag to indicate this is partial
          });

          // Also pass extracted data to parent immediately
          if (onAnalysisComplete) {
            onAnalysisComplete({
              extractedData: response.extractedData,
              fileName: response.fileName
            });
          }
        }

        // Start polling for full results (with 5 min timeout)
        pollStartRef.current = Date.now();
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(response.jobId);
        }, 2000); // Poll every 2 seconds
      } else {
        // Sync mode response (has all data immediately)
        setResult(response);
        if (onAnalysisComplete && response.extractedData) {
          onAnalysisComplete(response);
        }
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      setProcessing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setJobId(null);
    setProgress(0);
    setProcessing(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isAnalyzing = uploading || processing;
  const showPartialResults = result && result.partial;

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
            PDF, JPG, or PNG (Max 50MB)
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
          {/* Progress Bar */}
          <div className="w-full bg-blue-100 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
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
                onClick={() => { setError(null); handleUpload(); }}
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

          {/* ===== CONCISE ANALYSIS OUTPUT ===== */}
          {!result.partial && (
            <div className="border border-gray-200 dark:border-surface-700 rounded-xl overflow-hidden bg-white dark:bg-surface-900">

              {/* ── Hero: File + Stats + Bid Number ── */}
              <div className="px-6 py-5 bg-gradient-to-r from-[#003594] to-[#002266]">
                <h4 className="text-lg font-bold text-white">{result.fileName}</h4>

                {/* Stats strip */}
                <div className="flex flex-wrap gap-4 mt-3">
                  {(result.estimate?.total || result.aiAnalysis?.totals?.estimate) != null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Estimate</p>
                      <p className="text-2xl font-bold text-white">${(result.estimate?.total || result.aiAnalysis?.totals?.estimate || 0).toLocaleString()}</p>
                    </div>
                  )}
                  {(result.estimate?.materialTotal || result.aiAnalysis?.totals?.material) > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Material</p>
                      <p className="text-2xl font-bold text-emerald-300">${(result.estimate?.materialTotal || result.aiAnalysis?.totals?.material || 0).toLocaleString()}</p>
                    </div>
                  )}
                  {result.estimate?.perUnit > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Per Unit</p>
                      <p className="text-xl font-bold text-white">${result.estimate.perUnit.toLocaleString()}</p>
                    </div>
                  )}
                  {result.extractedData?.sqft > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Sq Ft</p>
                      <p className="text-xl font-bold text-white">{result.extractedData.sqft.toLocaleString()}</p>
                    </div>
                  )}
                  {result.extractedData?.units > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Units</p>
                      <p className="text-xl font-bold text-white">{result.extractedData.units}</p>
                    </div>
                  )}
                  {result.extractedData?.stories > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Stories</p>
                      <p className="text-xl font-bold text-white">{result.extractedData.stories}</p>
                    </div>
                  )}
                  {result.extractedData?.bathrooms > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Baths</p>
                      <p className="text-xl font-bold text-white">{result.extractedData.bathrooms}</p>
                    </div>
                  )}
                </div>

                {/* Notes from AI */}
                {result.aiAnalysis?.notes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {result.aiAnalysis.notes.map((n, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-white/10 text-blue-200 rounded-full">{n}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Content ── */}
              <div className="divide-y divide-gray-100 dark:divide-surface-700">

                {/* Fixtures */}
                {(() => {
                  // Merge extracted + AI-confirmed fixtures
                  const ex = result.extractedData || {};
                  const ai = result.aiAnalysis?.fixtures || {};
                  const fixtures = [
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
                  const hasFixtures = fixtures.some(f => (ai[f.key] || ex[f.key]) > 0);
                  const totalFixtures = ai.total || fixtures.reduce((s, f) => s + (ai[f.key] || ex[f.key] || 0), 0);

                  if (!hasFixtures) return null;
                  return (
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-2.5 mb-3">
                        <Wrench className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Fixtures</h4>
                        <span className="text-xs font-bold text-[#003594] dark:text-blue-400 ml-auto">{totalFixtures} total</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {fixtures.filter(f => (ai[f.key] || ex[f.key]) > 0).map(f => (
                          <div key={f.key} className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{ai[f.key] || ex[f.key]}</p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{f.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Material Takeoff — THE MAIN EVENT */}
                {result.aiAnalysis?.materialTakeoff?.length > 0 && typeof result.aiAnalysis === 'object' && (() => {
                  const takeoff = result.aiAnalysis.materialTakeoff;
                  const categories = ['All', ...new Set(takeoff.map(m => m.category).filter(Boolean))];
                  const filtered = takeoffFilter === 'All' ? takeoff : takeoff.filter(m => m.category === takeoffFilter);
                  const grandTotal = filtered.reduce((sum, m) => sum + (m.totalCost || 0), 0);

                  return (
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <ClipboardList className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Material Takeoff</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{takeoff.length} items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
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
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="text-xs px-2.5 py-1.5 bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-surface-600 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> CSV
                          </button>
                          <button type="button" onClick={() => setTakeoffExpanded(!takeoffExpanded)} className="text-gray-400 hover:text-gray-600 p-1">
                            {takeoffExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Category filter pills */}
                      {takeoffExpanded && categories.length > 2 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {categories.map(cat => (
                            <button key={cat} type="button" onClick={() => setTakeoffFilter(cat)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                takeoffFilter === cat ? 'bg-[#003594] text-white' : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                              }`}>
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
                                  <td className="px-3 py-2.5 text-right text-lg text-[#003594] dark:text-blue-400">${grandTotal.toLocaleString()}</td>
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
                                      <div className="bg-[#003594] dark:bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
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
                })()}

              </div>

              {/* Fallback: raw AI text if structured parse failed */}
              {result.aiAnalysisText && typeof result.aiAnalysis === 'object' &&
                (!result.aiAnalysis.materialTakeoff || result.aiAnalysis.materialTakeoff.length === 0) &&
                !result.aiAnalysis.overview && (
                <div className="px-6 py-5 border-t border-gray-100 dark:border-surface-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Response</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.aiAnalysisText}</p>
                </div>
              )}
              {result.aiAnalysis && typeof result.aiAnalysis === 'string' && (
                <div className="px-6 py-5 border-t border-gray-100 dark:border-surface-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Response</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.aiAnalysis}</p>
                </div>
              )}

              {/* Model attribution */}
              {result.modelUsed && (
                <div className="px-6 py-2.5 bg-gray-50 dark:bg-surface-800 border-t border-gray-100 dark:border-surface-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-right">Analyzed with {result.modelUsed}</p>
                </div>
              )}
            </div>
          )}

          {/* Partial results — show extracted data while AI processes */}
          {result.partial && result.extractedData && Object.keys(result.extractedData).length > 0 && (
            <div className="bg-blue-50 dark:bg-surface-800 border border-blue-200 dark:border-surface-700 rounded-xl p-5">
              <h4 className="font-semibold text-blue-900 dark:text-gray-100 mb-3">Extracted Information</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.extractedData).filter(([, v]) => v > 0).map(([key, val]) => (
                  <div key={key} className="bg-white dark:bg-surface-700 rounded-lg p-2.5 border border-blue-100 dark:border-surface-600 flex items-center justify-between">
                    <span className="text-xs text-blue-700 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-bold text-blue-900 dark:text-gray-100">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                  </div>
                ))}
              </div>
            </div>
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

          <button type="button" onClick={clearFile} className="btn-secondary w-full">
            Upload Another Blueprint
          </button>
        </div>
      )}
    </div>
  );
}
