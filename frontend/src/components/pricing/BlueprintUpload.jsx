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

          {/* ===== COMPREHENSIVE ANALYSIS OUTPUT ===== */}
          {!result.partial && (
            <div className="border border-gray-200 dark:border-surface-700 rounded-xl overflow-hidden bg-white dark:bg-surface-900">

              {/* ── Hero: Project Overview ── */}
              <div className="px-6 py-5 bg-gradient-to-r from-[#003594] to-[#002266]">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white">{result.fileName}</h4>
                    {result.aiAnalysis?.overview && typeof result.aiAnalysis === 'object' && (
                      <p className="text-sm text-blue-100 mt-2 leading-relaxed max-w-2xl">{result.aiAnalysis.overview}</p>
                    )}
                  </div>
                  {result.aiAnalysis?.projectComplexity && (
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex-shrink-0 ml-4 ${
                      result.aiAnalysis.projectComplexity === 'complex' ? 'bg-red-500/20 text-red-200 border border-red-400/30' :
                      result.aiAnalysis.projectComplexity === 'medium' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' :
                      'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                    }`}>
                      {result.aiAnalysis.projectComplexity}
                      {result.aiAnalysis.complexityScore != null && ` (${result.aiAnalysis.complexityScore})`}
                    </span>
                  )}
                </div>

                {/* Quick Stats Strip */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {result.estimate?.total != null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Total</p>
                      <p className="text-xl font-bold text-white">${result.estimate.total.toLocaleString()}</p>
                    </div>
                  )}
                  {result.estimate?.perUnit != null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Per Unit</p>
                      <p className="text-xl font-bold text-white">${result.estimate.perUnit.toLocaleString()}</p>
                    </div>
                  )}
                  {result.aiAnalysis?.timeline?.estimatedDuration && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Duration</p>
                      <p className="text-xl font-bold text-white">{result.aiAnalysis.timeline.estimatedDuration}</p>
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
                      <p className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Bathrooms</p>
                      <p className="text-xl font-bold text-white">{result.extractedData.bathrooms}</p>
                    </div>
                  )}
                </div>

                {/* Complexity Factors */}
                {result.aiAnalysis?.complexityFactors?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {result.aiAnalysis.complexityFactors.map((f, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-white/10 text-blue-200 rounded-full">{f}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Content Sections ── */}
              <div className="divide-y divide-gray-100 dark:divide-surface-700">

                {/* Plumbing Fixtures */}
                {result.extractedData && (result.extractedData.lavatories || result.extractedData.kitchenFaucets ||
                  result.extractedData.barSinks || result.extractedData.toilets ||
                  result.extractedData.tubs || result.extractedData.showerBases ||
                  result.extractedData.mudPans || result.extractedData.washingMachines ||
                  result.extractedData.waterSoftenerPreplumb) && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Wrench className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Plumbing Fixtures</h4>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {[
                        { key: 'toilets', label: 'Toilets' },
                        { key: 'lavatories', label: 'Lavatories' },
                        { key: 'kitchenFaucets', label: 'Kitchen Faucets' },
                        { key: 'barSinks', label: 'Bar Sinks' },
                        { key: 'tubs', label: 'Tubs' },
                        { key: 'showerBases', label: 'Shower Bases' },
                        { key: 'mudPans', label: 'Mud Pans' },
                        { key: 'washingMachines', label: 'Washing Machines' },
                        { key: 'waterSoftenerPreplumb', label: 'Water Softener' },
                      ].filter(f => result.extractedData[f.key] > 0).map(f => (
                        <div key={f.key} className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{result.extractedData[f.key]}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{f.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements & Specifications */}
                {result.aiAnalysis?.requirements && typeof result.aiAnalysis === 'object' &&
                  Object.keys(result.aiAnalysis.requirements).length > 0 && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <Package className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Requirements & Specifications</h4>
                    </div>
                    <div className="space-y-4 text-sm">
                      {/* Pipes */}
                      {result.aiAnalysis.requirements.pipes?.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Piping</p>
                          <div className="space-y-1.5">
                            {result.aiAnalysis.requirements.pipes.map((p, i) => (
                              <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-surface-800 rounded-lg px-3 py-2">
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{p.type}</span>
                                  <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">{p.material}{p.size ? ` — ${p.size}` : ''}</span>
                                </div>
                                {p.estimatedLength && <span className="text-[#003594] dark:text-blue-400 font-semibold text-xs">{p.estimatedLength}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Fixtures from AI */}
                      {result.aiAnalysis.requirements.fixtures?.length > 0 && (
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Fixture Requirements</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {result.aiAnalysis.requirements.fixtures.map((f, i) => (
                              <div key={i} className="bg-gray-50 dark:bg-surface-800 rounded-lg px-3 py-2 flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">{f.category}</span>
                                <span className="font-bold text-gray-900 dark:text-gray-100">{f.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Water Heater */}
                      {result.aiAnalysis.requirements.waterHeater && (
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Water Heater</p>
                          <div className="bg-gray-50 dark:bg-surface-800 rounded-lg px-3 py-2.5">
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                              <span><span className="text-gray-500 dark:text-gray-400">Type:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.type}</span></span>
                              <span><span className="text-gray-500 dark:text-gray-400">Capacity:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.capacity}</span></span>
                              {result.aiAnalysis.requirements.waterHeater.location && (
                                <span><span className="text-gray-500 dark:text-gray-400">Location:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.location}</span></span>
                              )}
                              {result.aiAnalysis.requirements.waterHeater.units > 0 && (
                                <span><span className="text-gray-500 dark:text-gray-400">Units:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{result.aiAnalysis.requirements.waterHeater.units}</span></span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Drainage */}
                      {result.aiAnalysis.requirements.drainage && (
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Drainage</p>
                          <p className="text-gray-600 dark:text-gray-400">{result.aiAnalysis.requirements.drainage}</p>
                        </div>
                      )}
                      {/* Special Features */}
                      {result.aiAnalysis.requirements.specialFeatures?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {result.aiAnalysis.requirements.specialFeatures.map((f, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 bg-[#003594]/8 dark:bg-blue-900/20 text-[#003594] dark:text-blue-300 rounded-full font-medium">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline & Labor */}
                {result.aiAnalysis && typeof result.aiAnalysis === 'object' && (result.aiAnalysis.timeline || result.aiAnalysis.laborEstimate) && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <CalendarDays className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Timeline & Labor</h4>
                    </div>
                    <div className="space-y-4">
                      {/* Labor Estimate */}
                      {result.aiAnalysis.laborEstimate && (
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'roughIn', label: 'Rough-In' },
                            { key: 'topOut', label: 'Top-Out' },
                            { key: 'trim', label: 'Trim' },
                          ].filter(p => result.aiAnalysis.laborEstimate[p.key]).map(p => (
                            <div key={p.key} className="bg-gray-50 dark:bg-surface-800 rounded-lg p-3 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">{p.label}</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">{result.aiAnalysis.laborEstimate[p.key].hours}h</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{result.aiAnalysis.laborEstimate[p.key].duration}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Timeline Phases */}
                      {result.aiAnalysis.timeline?.phases?.length > 0 && (
                        <div className="space-y-1.5">
                          {result.aiAnalysis.timeline.phases.map((phase, i) => (
                            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-surface-800 rounded-lg px-3 py-2.5">
                              <div className="w-6 h-6 rounded-full bg-[#003594]/10 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-[#003594] dark:text-blue-400">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{phase.name}</span>
                                {phase.tasks?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{phase.tasks.join(' · ')}</p>
                                )}
                              </div>
                              <span className="text-xs font-medium text-[#003594] dark:text-blue-400 flex-shrink-0">{phase.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Critical Path */}
                      {result.aiAnalysis.timeline?.criticalPath?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold mr-1">Critical:</span>
                          {result.aiAnalysis.timeline.criticalPath.map((cp, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full font-medium">{cp}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing & Cost Breakdown */}
                {(result.estimate || (result.aiAnalysis && typeof result.aiAnalysis === 'object' && result.aiAnalysis.materialBreakdown)) && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <DollarSign className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Cost Breakdown</h4>
                    </div>
                    <div className="space-y-4">
                      {/* Labor Cost Breakdown */}
                      {result.estimate?.labor && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Labor</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: 'roughIn', label: 'Rough-In' },
                              { key: 'topOut', label: 'Top-Out' },
                              { key: 'trim', label: 'Trim' },
                            ].filter(l => result.estimate.labor[l.key]).map(l => (
                              <div key={l.key} className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{l.label}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">${result.estimate.labor[l.key]?.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Material Breakdown */}
                      {result.estimate?.materials && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Materials</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(result.estimate.materials).map(([k, v]) => (
                              <div key={k} className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold capitalize">{k}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">${v?.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Pricing Recommendation */}
                      {result.aiAnalysis?.pricingRecommendation && typeof result.aiAnalysis === 'object' && (
                        <div className="bg-[#003594]/5 dark:bg-blue-900/10 rounded-lg p-3 border border-[#003594]/10 dark:border-blue-800/20">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-[#003594] dark:text-blue-400" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                              Recommended Tier: <span className="text-[#003594] dark:text-blue-400 font-bold">{result.aiAnalysis.pricingRecommendation.tier}</span>
                            </p>
                          </div>
                          {result.aiAnalysis.pricingRecommendation.factors?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.aiAnalysis.pricingRecommendation.factors.map((f, i) => (
                                <span key={i} className="text-[11px] px-2 py-0.5 bg-[#003594]/8 dark:bg-blue-800/20 text-[#003594] dark:text-blue-300 rounded">{f}</span>
                              ))}
                            </div>
                          )}
                          {result.aiAnalysis.pricingRecommendation.adjustments && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">{result.aiAnalysis.pricingRecommendation.adjustments}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Material Takeoff */}
                {result.aiAnalysis?.materialTakeoff?.length > 0 && typeof result.aiAnalysis === 'object' && (() => {
                  const takeoff = result.aiAnalysis.materialTakeoff;
                  const categories = ['All', ...new Set(takeoff.map(m => m.category).filter(Boolean))];
                  const filtered = takeoffFilter === 'All' ? takeoff : takeoff.filter(m => m.category === takeoffFilter);
                  const grandTotal = filtered.reduce((sum, m) => sum + (m.totalCost || 0), 0);
                  const totalItems = filtered.reduce((sum, m) => sum + (m.quantity || 0), 0);

                  return (
                    <div className="px-6 py-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <ClipboardList className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Material Takeoff</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{takeoff.length} items · ${grandTotal.toLocaleString()}</span>
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
                              a.download = `material-takeoff-${result.fileName || 'export'}.csv`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="text-xs px-2.5 py-1.5 bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-surface-600 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> CSV
                          </button>
                          <button
                            type="button"
                            onClick={() => setTakeoffExpanded(!takeoffExpanded)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          >
                            {takeoffExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Category filter pills */}
                      {takeoffExpanded && categories.length > 2 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {categories.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setTakeoffFilter(cat)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                takeoffFilter === cat
                                  ? 'bg-[#003594] text-white'
                                  : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-600'
                              }`}
                            >
                              {cat} ({cat === 'All' ? takeoff.length : takeoff.filter(m => m.category === cat).length})
                            </button>
                          ))}
                        </div>
                      )}

                      {takeoffExpanded && (
                        <>
                          {/* Summary Row */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2.5 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Items</p>
                              <p className="text-base font-bold text-gray-900 dark:text-gray-100">{filtered.length}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2.5 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Total Qty</p>
                              <p className="text-base font-bold text-gray-900 dark:text-gray-100">{totalItems.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-surface-800 rounded-lg p-2.5 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Cost</p>
                              <p className="text-base font-bold text-gray-900 dark:text-gray-100">${grandTotal.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Takeoff Table */}
                          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-surface-600">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 dark:bg-surface-700">
                                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Item</th>
                                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold hidden sm:table-cell">Category</th>
                                  <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Qty</th>
                                  <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Unit</th>
                                  <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold hidden sm:table-cell">Unit $</th>
                                  <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-surface-600">
                                {filtered.map((m, i) => (
                                  <tr key={i} className="bg-white dark:bg-surface-800 hover:bg-gray-50 dark:hover:bg-surface-750 transition-colors">
                                    <td className="px-3 py-2.5">
                                      <p className="font-medium text-gray-900 dark:text-gray-100">{m.item}</p>
                                      {m.description && <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">{m.description}</p>}
                                    </td>
                                    <td className="px-3 py-2.5 hidden sm:table-cell">
                                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-300 rounded-full">{m.category}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 dark:text-gray-100">{m.quantity?.toLocaleString()}</td>
                                    <td className="px-3 py-2.5 text-right text-gray-500 dark:text-gray-400">{m.unit}</td>
                                    <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-300 hidden sm:table-cell">${m.unitCost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-3 py-2.5 text-right font-bold text-gray-900 dark:text-gray-100">${m.totalCost?.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-50 dark:bg-surface-700 font-bold">
                                  <td className="px-3 py-3 text-gray-900 dark:text-gray-100" colSpan={2}>Grand Total</td>
                                  <td className="px-3 py-3 text-right text-gray-900 dark:text-gray-100 hidden sm:table-cell" colSpan={1}></td>
                                  <td className="px-3 py-3 text-right text-gray-900 dark:text-gray-100" colSpan={1}></td>
                                  <td className="px-3 py-3 text-right text-gray-900 dark:text-gray-100 hidden sm:table-cell" colSpan={1}></td>
                                  <td className="px-3 py-3 text-right text-lg text-[#003594] dark:text-blue-400">${grandTotal.toLocaleString()}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Category breakdown bar */}
                          {takeoffFilter === 'All' && categories.length > 2 && (
                            <div className="mt-4 space-y-2">
                              {categories.filter(c => c !== 'All').map(cat => {
                                const catTotal = takeoff.filter(m => m.category === cat).reduce((s, m) => s + (m.totalCost || 0), 0);
                                const pct = grandTotal > 0 ? (catTotal / grandTotal * 100) : 0;
                                return (
                                  <div key={cat}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">{cat}</span>
                                      <span className="text-gray-500 dark:text-gray-400">${catTotal.toLocaleString()} ({pct.toFixed(0)}%)</span>
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

                {/* Recommendations & Risks */}
                {result.aiAnalysis && typeof result.aiAnalysis === 'object' && (result.aiAnalysis.recommendations?.length > 0 || result.aiAnalysis.risks?.length > 0) && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <TrendingUp className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Insights</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.aiAnalysis.recommendations?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Recommendations</p>
                          <div className="space-y-1.5">
                            {result.aiAnalysis.recommendations.map((rec, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700 dark:text-gray-300">{typeof rec === 'string' ? rec : rec.text || JSON.stringify(rec)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.aiAnalysis.risks?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Risks</p>
                          <div className="space-y-1.5">
                            {result.aiAnalysis.risks.map((r, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-gray-700 dark:text-gray-300">{r.risk || r}</p>
                                  {r.mitigation && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Mitigation: {r.mitigation}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Code Compliance */}
                {result.aiAnalysis?.codeCompliance?.notes?.length > 0 && typeof result.aiAnalysis === 'object' && (
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <ShieldCheck className="w-4 h-4 text-[#003594] dark:text-blue-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Code Compliance</h4>
                    </div>
                    <div className="space-y-1.5">
                      {result.aiAnalysis.codeCompliance.notes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#003594] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 dark:text-gray-300">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Fallback: raw AI text if structured parse failed */}
              {result.aiAnalysisText && typeof result.aiAnalysis === 'object' && !result.aiAnalysis.overview && (
                <div className="px-6 py-5 border-t border-gray-100 dark:border-surface-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Analysis</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.aiAnalysisText}</p>
                </div>
              )}
              {/* String-only AI response fallback */}
              {result.aiAnalysis && typeof result.aiAnalysis === 'string' && (
                <div className="px-6 py-5 border-t border-gray-100 dark:border-surface-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Analysis</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.aiAnalysis}</p>
                </div>
              )}

              {/* Model attribution */}
              {result.modelUsed && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-surface-800 border-t border-gray-100 dark:border-surface-700">
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
