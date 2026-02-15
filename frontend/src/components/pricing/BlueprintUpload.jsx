import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

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

          {/* Extracted Data */}
          {result.extractedData && Object.keys(result.extractedData).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Extracted Information</h4>

              {/* Basic Info */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
                  Basic Information
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {result.extractedData.sqft && (
                    <div>
                      <span className="text-blue-700">Square Footage:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {result.extractedData.sqft.toLocaleString()} sqft
                      </span>
                    </div>
                  )}
                  {result.extractedData.units && (
                    <div>
                      <span className="text-blue-700">Units:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {result.extractedData.units}
                      </span>
                    </div>
                  )}
                  {result.extractedData.bathrooms && (
                    <div>
                      <span className="text-blue-700">Bathrooms:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {result.extractedData.bathrooms}
                      </span>
                    </div>
                  )}
                  {result.extractedData.stories && (
                    <div>
                      <span className="text-blue-700">Stories:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {result.extractedData.stories}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixtures */}
              {(result.extractedData.lavatories || result.extractedData.kitchenFaucets ||
                result.extractedData.barSinks || result.extractedData.toilets ||
                result.extractedData.tubs || result.extractedData.showerBases ||
                result.extractedData.mudPans || result.extractedData.washingMachines ||
                result.extractedData.waterSoftenerPreplumb) && (
                <div className="border-t border-blue-200 pt-3">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
                    Plumbing Fixtures
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {result.extractedData.lavatories > 0 && (
                      <div>
                        <span className="text-blue-700">Lavatories:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.lavatories}
                        </span>
                      </div>
                    )}
                    {result.extractedData.kitchenFaucets > 0 && (
                      <div>
                        <span className="text-blue-700">Kitchen Faucets:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.kitchenFaucets}
                        </span>
                      </div>
                    )}
                    {result.extractedData.barSinks > 0 && (
                      <div>
                        <span className="text-blue-700">Bar Sinks:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.barSinks}
                        </span>
                      </div>
                    )}
                    {result.extractedData.toilets > 0 && (
                      <div>
                        <span className="text-blue-700">Toilets:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.toilets}
                        </span>
                      </div>
                    )}
                    {result.extractedData.tubs > 0 && (
                      <div>
                        <span className="text-blue-700">Tubs:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.tubs}
                        </span>
                      </div>
                    )}
                    {result.extractedData.showerBases > 0 && (
                      <div>
                        <span className="text-blue-700">Shower Bases:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.showerBases}
                        </span>
                      </div>
                    )}
                    {result.extractedData.mudPans > 0 && (
                      <div>
                        <span className="text-blue-700">Mud Pans:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.mudPans}
                        </span>
                      </div>
                    )}
                    {result.extractedData.washingMachines > 0 && (
                      <div>
                        <span className="text-blue-700">Washing Machines:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.washingMachines}
                        </span>
                      </div>
                    )}
                    {result.extractedData.waterSoftenerPreplumb > 0 && (
                      <div className="col-span-2">
                        <span className="text-blue-700">Water Softener Pre-plumb:</span>
                        <span className="ml-2 font-semibold text-blue-900">
                          {result.extractedData.waterSoftenerPreplumb}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Analysis - only show when complete */}
          {result.aiAnalysis && !result.partial && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">AI Analysis</h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{result.aiAnalysis}</p>
              </div>
              {result.modelUsed && (
                <p className="text-xs text-gray-500 mt-3">
                  Model used: {result.modelUsed}
                </p>
              )}
            </div>
          )}

          {/* Estimate - only show when complete */}
          {result.estimate && !result.partial && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-semibold text-primary-900 mb-3">Estimated Pricing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-primary-700">Total Price</p>
                  <p className="text-2xl font-bold text-primary-900">
                    ${result.estimate.total?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-primary-700">Per Unit</p>
                  <p className="text-2xl font-bold text-primary-900">
                    ${result.estimate.perUnit?.toLocaleString()}
                  </p>
                </div>
              </div>
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
