import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader, CheckCircle, XCircle, AlertCircle, Clock, Wrench, ShieldCheck, TrendingUp, Package, CalendarDays, DollarSign, Gauge } from 'lucide-react';

export default function BlueprintUpload({ onAnalysisComplete, tier, selectedModel }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [_jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

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
      const { api } = await import('../../api/client');
      const jobStatus = await api.jobs.getStatus(id);

      setProgress(jobStatus.progress || 0);

      if (jobStatus.status === 'completed') {
        // Job completed successfully
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setProcessing(false);
        setResult(jobStatus.result);
        setProgress(100);

        // Pass extracted data back to parent
        if (onAnalysisComplete && jobStatus.result) {
          onAnalysisComplete(jobStatus.result);
        }
      } else if (jobStatus.status === 'failed') {
        // Job failed
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setProcessing(false);
        setError(jobStatus.error || 'Analysis failed');
      }
      // If status is 'processing' or 'pending', continue polling
    } catch (err) {
      console.error('Error polling job status:', err);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
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

        // Start polling for full results
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Upload Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
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

          {/* ===== COMPREHENSIVE ANALYSIS OUTPUT ===== */}
          {!result.partial && (
            <div className="space-y-4">

              {/* --- Section 1: Project Details --- */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-surface-800 dark:to-surface-900 border border-slate-200 dark:border-surface-700 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-surface-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 dark:bg-slate-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-gray-100">Project Details</h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{result.fileName}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Overview */}
                  {result.aiAnalysis?.overview && typeof result.aiAnalysis === 'object' && (
                    <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">{result.aiAnalysis.overview}</p>
                  )}

                  {/* Complexity + Quick Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {result.aiAnalysis?.projectComplexity && (
                      <div className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-slate-200 dark:border-surface-600 text-center">
                        <Gauge className="w-4 h-4 mx-auto mb-1 text-slate-500 dark:text-gray-400" />
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold">Complexity</p>
                        <p className={`text-sm font-bold mt-0.5 ${
                          result.aiAnalysis.projectComplexity === 'complex' ? 'text-red-600 dark:text-red-400' :
                          result.aiAnalysis.projectComplexity === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {result.aiAnalysis.projectComplexity.charAt(0).toUpperCase() + result.aiAnalysis.projectComplexity.slice(1)}
                          {result.aiAnalysis.complexityScore != null && ` (${result.aiAnalysis.complexityScore})`}
                        </p>
                      </div>
                    )}
                    {result.extractedData?.sqft > 0 && (
                      <div className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-slate-200 dark:border-surface-600 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold">Sq Footage</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-gray-100 mt-1">{result.extractedData.sqft.toLocaleString()}</p>
                      </div>
                    )}
                    {result.extractedData?.units > 0 && (
                      <div className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-slate-200 dark:border-surface-600 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold">Units</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-gray-100 mt-1">{result.extractedData.units}</p>
                      </div>
                    )}
                    {result.extractedData?.stories > 0 && (
                      <div className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-slate-200 dark:border-surface-600 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold">Stories</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-gray-100 mt-1">{result.extractedData.stories}</p>
                      </div>
                    )}
                    {result.extractedData?.bathrooms > 0 && (
                      <div className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-slate-200 dark:border-surface-600 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold">Bathrooms</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-gray-100 mt-1">{result.extractedData.bathrooms}</p>
                      </div>
                    )}
                  </div>

                  {/* Complexity Factors */}
                  {result.aiAnalysis?.complexityFactors?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.aiAnalysis.complexityFactors.map((f, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-slate-200 dark:bg-surface-700 text-slate-700 dark:text-gray-300 rounded-full">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* --- Section 2: Plumbing Fixtures --- */}
              {result.extractedData && (result.extractedData.lavatories || result.extractedData.kitchenFaucets ||
                result.extractedData.barSinks || result.extractedData.toilets ||
                result.extractedData.tubs || result.extractedData.showerBases ||
                result.extractedData.mudPans || result.extractedData.washingMachines ||
                result.extractedData.waterSoftenerPreplumb) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-surface-800 dark:to-surface-900 border border-blue-200 dark:border-surface-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-blue-200 dark:border-surface-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-700 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-blue-900 dark:text-gray-100">Plumbing Fixtures</h4>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'toilets', label: 'Toilets' },
                        { key: 'lavatories', label: 'Lavatories' },
                        { key: 'kitchenFaucets', label: 'Kitchen Faucets' },
                        { key: 'barSinks', label: 'Bar Sinks' },
                        { key: 'tubs', label: 'Tubs' },
                        { key: 'showerBases', label: 'Shower Bases' },
                        { key: 'mudPans', label: 'Mud Pans' },
                        { key: 'washingMachines', label: 'Washing Machines' },
                        { key: 'waterSoftenerPreplumb', label: 'Water Softener Pre-plumb' },
                      ].filter(f => result.extractedData[f.key] > 0).map(f => (
                        <div key={f.key} className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-blue-100 dark:border-surface-600 flex items-center justify-between">
                          <span className="text-xs text-blue-700 dark:text-gray-400">{f.label}</span>
                          <span className="text-lg font-bold text-blue-900 dark:text-gray-100">{result.extractedData[f.key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- Section 3: Requirements (from AI) --- */}
              {result.aiAnalysis?.requirements && typeof result.aiAnalysis === 'object' && (
                Object.keys(result.aiAnalysis.requirements).length > 0 && (
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-surface-800 dark:to-surface-900 border border-violet-200 dark:border-surface-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-violet-200 dark:border-surface-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 dark:bg-violet-700 flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-violet-900 dark:text-gray-100">Requirements & Specifications</h4>
                  </div>
                  <div className="p-5 space-y-4 text-sm">
                    {/* Pipes */}
                    {result.aiAnalysis.requirements.pipes?.length > 0 && (
                      <div>
                        <p className="font-semibold text-violet-800 dark:text-gray-200 mb-2">Piping</p>
                        <div className="space-y-2">
                          {result.aiAnalysis.requirements.pipes.map((p, i) => (
                            <div key={i} className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-violet-100 dark:border-surface-600">
                              <div className="flex justify-between">
                                <span className="font-medium text-violet-900 dark:text-gray-100">{p.type}</span>
                                {p.estimatedLength && <span className="text-violet-600 dark:text-violet-400 font-semibold">{p.estimatedLength}</span>}
                              </div>
                              <p className="text-violet-600 dark:text-gray-400 text-xs mt-0.5">
                                {p.material}{p.size ? ` — ${p.size}` : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Fixtures from AI */}
                    {result.aiAnalysis.requirements.fixtures?.length > 0 && (
                      <div>
                        <p className="font-semibold text-violet-800 dark:text-gray-200 mb-2">Fixture Requirements</p>
                        <div className="grid grid-cols-2 gap-2">
                          {result.aiAnalysis.requirements.fixtures.map((f, i) => (
                            <div key={i} className="bg-white dark:bg-surface-800 rounded-lg p-2.5 border border-violet-100 dark:border-surface-600">
                              <div className="flex justify-between items-center">
                                <span className="text-violet-800 dark:text-gray-200 font-medium">{f.category}</span>
                                <span className="text-violet-600 dark:text-violet-400 font-bold">{f.count}</span>
                              </div>
                              {f.notes && <p className="text-[11px] text-violet-500 dark:text-gray-500 mt-0.5">{f.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Water Heater */}
                    {result.aiAnalysis.requirements.waterHeater && (
                      <div>
                        <p className="font-semibold text-violet-800 dark:text-gray-200 mb-2">Water Heater</p>
                        <div className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-violet-100 dark:border-surface-600">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-violet-500 dark:text-gray-400">Type:</span> <span className="font-medium text-violet-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.type}</span></div>
                            <div><span className="text-violet-500 dark:text-gray-400">Capacity:</span> <span className="font-medium text-violet-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.capacity}</span></div>
                            {result.aiAnalysis.requirements.waterHeater.location && (
                              <div><span className="text-violet-500 dark:text-gray-400">Location:</span> <span className="font-medium text-violet-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.location}</span></div>
                            )}
                            {result.aiAnalysis.requirements.waterHeater.units > 0 && (
                              <div><span className="text-violet-500 dark:text-gray-400">Units:</span> <span className="font-medium text-violet-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.units}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Drainage */}
                    {result.aiAnalysis.requirements.drainage && (
                      <div>
                        <p className="font-semibold text-violet-800 dark:text-gray-200 mb-1">Drainage</p>
                        <p className="text-violet-700 dark:text-gray-300">{result.aiAnalysis.requirements.drainage}</p>
                      </div>
                    )}
                    {/* Special Features */}
                    {result.aiAnalysis.requirements.specialFeatures?.length > 0 && (
                      <div>
                        <p className="font-semibold text-violet-800 dark:text-gray-200 mb-1">Special Features</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.aiAnalysis.requirements.specialFeatures.map((f, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* --- Section 4: Timeline & Labor --- */}
              {result.aiAnalysis && typeof result.aiAnalysis === 'object' && (result.aiAnalysis.timeline || result.aiAnalysis.laborEstimate) && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-surface-800 dark:to-surface-900 border border-emerald-200 dark:border-surface-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-emerald-200 dark:border-surface-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 dark:text-gray-100">Timeline & Labor</h4>
                      {result.aiAnalysis.timeline?.estimatedDuration && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Estimated: {result.aiAnalysis.timeline.estimatedDuration}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Labor Estimate */}
                    {result.aiAnalysis.laborEstimate && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-800 dark:text-gray-300 uppercase tracking-wider mb-2">Labor Breakdown</p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { key: 'roughIn', label: 'Rough-In' },
                            { key: 'topOut', label: 'Top-Out' },
                            { key: 'trim', label: 'Trim' },
                          ].filter(p => result.aiAnalysis.laborEstimate[p.key]).map(p => (
                            <div key={p.key} className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-emerald-100 dark:border-surface-600 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-emerald-500 dark:text-gray-400 font-semibold">{p.label}</p>
                              <p className="text-lg font-bold text-emerald-900 dark:text-gray-100 mt-0.5">{result.aiAnalysis.laborEstimate[p.key].hours}h</p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">{result.aiAnalysis.laborEstimate[p.key].duration}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Timeline Phases */}
                    {result.aiAnalysis.timeline?.phases?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-800 dark:text-gray-300 uppercase tracking-wider mb-2">Phases</p>
                        <div className="space-y-2">
                          {result.aiAnalysis.timeline.phases.map((phase, i) => (
                            <div key={i} className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-emerald-100 dark:border-surface-600">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-emerald-900 dark:text-gray-100 text-sm">{phase.name}</span>
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{phase.duration}</span>
                              </div>
                              {phase.tasks?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {phase.tasks.map((t, j) => (
                                    <span key={j} className="text-[11px] text-emerald-700 dark:text-gray-400 bg-emerald-50 dark:bg-surface-700 px-2 py-0.5 rounded">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Critical Path */}
                    {result.aiAnalysis.timeline?.criticalPath?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-800 dark:text-gray-300 uppercase tracking-wider mb-1">Critical Path</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.aiAnalysis.timeline.criticalPath.map((cp, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-medium">{cp}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- Section 5: Estimated Pricing & Materials --- */}
              {(result.estimate || (result.aiAnalysis && typeof result.aiAnalysis === 'object' && result.aiAnalysis.materialBreakdown)) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-surface-800 dark:to-surface-900 border border-amber-200 dark:border-surface-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-amber-200 dark:border-surface-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 dark:bg-amber-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-amber-900 dark:text-gray-100">Pricing & Materials</h4>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Total & Per Unit */}
                    {result.estimate && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-surface-800 rounded-lg p-4 border border-amber-200 dark:border-surface-600 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-gray-400 font-semibold">Total Estimate</p>
                          <p className="text-2xl font-bold text-amber-900 dark:text-gray-100 mt-1">${result.estimate.total?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-800 rounded-lg p-4 border border-amber-200 dark:border-surface-600 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-amber-500 dark:text-gray-400 font-semibold">Per Unit</p>
                          <p className="text-2xl font-bold text-amber-900 dark:text-gray-100 mt-1">${result.estimate.perUnit?.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {/* Labor Cost Breakdown */}
                    {result.estimate?.labor && (
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-gray-300 uppercase tracking-wider mb-2">Labor Costs</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'roughIn', label: 'Rough-In' },
                            { key: 'topOut', label: 'Top-Out' },
                            { key: 'trim', label: 'Trim' },
                          ].filter(l => result.estimate.labor[l.key]).map(l => (
                            <div key={l.key} className="bg-white dark:bg-surface-800 rounded-lg p-2.5 border border-amber-100 dark:border-surface-600 text-center">
                              <p className="text-[10px] text-amber-500 dark:text-gray-400 font-semibold">{l.label}</p>
                              <p className="text-sm font-bold text-amber-900 dark:text-gray-100">${result.estimate.labor[l.key]?.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Material Breakdown */}
                    {result.estimate?.materials && (
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-gray-300 uppercase tracking-wider mb-2">Material Costs</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(result.estimate.materials).map(([k, v]) => (
                            <div key={k} className="bg-white dark:bg-surface-800 rounded-lg p-2.5 border border-amber-100 dark:border-surface-600 text-center">
                              <p className="text-[10px] text-amber-500 dark:text-gray-400 font-semibold capitalize">{k}</p>
                              <p className="text-sm font-bold text-amber-900 dark:text-gray-100">${v?.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Pricing Recommendation */}
                    {result.aiAnalysis?.pricingRecommendation && typeof result.aiAnalysis === 'object' && (
                      <div className="bg-amber-100/50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-200 dark:border-amber-800/30">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">AI Pricing Recommendation</p>
                        <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                          Recommended Tier: {result.aiAnalysis.pricingRecommendation.tier}
                        </p>
                        {result.aiAnalysis.pricingRecommendation.factors?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {result.aiAnalysis.pricingRecommendation.factors.map((f, i) => (
                              <span key={i} className="text-[11px] px-2 py-0.5 bg-amber-200/60 dark:bg-amber-800/30 text-amber-800 dark:text-amber-300 rounded">{f}</span>
                            ))}
                          </div>
                        )}
                        {result.aiAnalysis.pricingRecommendation.adjustments && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">{result.aiAnalysis.pricingRecommendation.adjustments}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- Section 6: Recommendations & Risks --- */}
              {result.aiAnalysis && typeof result.aiAnalysis === 'object' && (result.aiAnalysis.recommendations?.length > 0 || result.aiAnalysis.risks?.length > 0) && (
                <div className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-surface-800 dark:to-surface-900 border border-cyan-200 dark:border-surface-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-cyan-200 dark:border-surface-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600 dark:bg-cyan-700 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-cyan-900 dark:text-gray-100">Recommendations & Risks</h4>
                  </div>
                  <div className="p-5 space-y-4">
                    {result.aiAnalysis.recommendations?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-cyan-800 dark:text-gray-300 uppercase tracking-wider mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {result.aiAnalysis.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-white dark:bg-surface-800 rounded-lg p-3 border border-cyan-100 dark:border-surface-600">
                              <CheckCircle className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-cyan-900 dark:text-gray-200">{typeof rec === 'string' ? rec : rec.text || JSON.stringify(rec)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.aiAnalysis.risks?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-cyan-800 dark:text-gray-300 uppercase tracking-wider mb-2">Potential Risks</p>
                        <div className="space-y-2">
                          {result.aiAnalysis.risks.map((r, i) => (
                            <div key={i} className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-red-100 dark:border-surface-600">
                              <div className="flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{r.risk || r}</p>
                                  {r.mitigation && (
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Mitigation: {r.mitigation}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- Section 7: Code Compliance --- */}
              {result.aiAnalysis?.codeCompliance?.notes?.length > 0 && typeof result.aiAnalysis === 'object' && (
                <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-surface-800 dark:to-surface-900 border border-rose-200 dark:border-surface-700 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-rose-200 dark:border-surface-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 dark:bg-rose-700 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-rose-900 dark:text-gray-100">Code Compliance</h4>
                  </div>
                  <div className="p-5">
                    <div className="space-y-2">
                      {result.aiAnalysis.codeCompliance.notes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2.5 bg-white dark:bg-surface-800 rounded-lg p-3 border border-rose-100 dark:border-surface-600">
                          <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-rose-900 dark:text-gray-200">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback: raw AI text if structured parse failed */}
              {result.aiAnalysisText && typeof result.aiAnalysis === 'object' && !result.aiAnalysis.overview && (
                <div className="bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">AI Analysis (Raw)</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.aiAnalysisText}</p>
                </div>
              )}
              {/* String-only AI response fallback */}
              {result.aiAnalysis && typeof result.aiAnalysis === 'string' && (
                <div className="bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">AI Analysis</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.aiAnalysis}</p>
                </div>
              )}

              {/* Model attribution */}
              {result.modelUsed && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right">Model: {result.modelUsed}</p>
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
