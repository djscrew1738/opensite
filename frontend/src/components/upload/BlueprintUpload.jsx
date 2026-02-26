import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../hooks/useToast';
import FileDropzone from './FileDropzone';
import UploadProgress from './UploadProgress';
import AnalysisResults from './AnalysisResults';
import ExtractedDataEditor from './ExtractedDataEditor';
import { UploadSuccess } from '../shared/SuccessAnimation';
import {
  FileText,
  Upload,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileSearch
} from 'lucide-react';
import { ModelSelector } from '../ai/ModelSelector';

const POLL_INTERVAL = 2000;
const MAX_POLL_TIME = 300000;

export default function BlueprintUpload({
  onAnalysisComplete,
  selectedModel,
  onModelChange,
  className = ''
}) {
  const { success: showSuccess, error: showError } = useToast();
  
  // State
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, extracting, review, uploading, processing, completed, error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [isPartial, setIsPartial] = useState(false);
  
  // Extraction data for review
  const [extractedData, setExtractedData] = useState(null);
  const [confidenceScores, setConfidenceScores] = useState({});
  const [validationResults, setValidationResults] = useState({ warnings: [], suggestions: [] });
  const [pdfType, setPdfType] = useState(null);

  // Refs
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

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setStatus('idle');
    setError(null);
    setResult(null);
    setProgress(0);
    setIsPartial(false);
    setExtractedData(null);
    setConfidenceScores({});
    setValidationResults({ warnings: [], suggestions: [] });
    setPdfType(null);
  }, []);

  // Handle file removal
  const handleFileRemove = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setError(null);
    setResult(null);
    setProgress(0);
    setJobId(null);
    setIsPartial(false);
    setExtractedData(null);
    setConfidenceScores({});
    setValidationResults({ warnings: [], suggestions: [] });
    setPdfType(null);
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, []);

  // Extract data from PDF for review
  const handleExtract = useCallback(async () => {
    if (!file) return;

    setStatus('extracting');
    setError(null);
    setProgress(10);

    try {
      const { api } = await import('../../api/client');
      
      abortControllerRef.current = new AbortController();
      
      // First, extract text and data
      const extractResponse = await api.upload.extract(file);
      
      setProgress(50);

      if (extractResponse.extractedData) {
        setExtractedData(extractResponse.extractedData);
        setConfidenceScores(extractResponse.confidenceScores || {});
        setValidationResults({
          warnings: extractResponse.warnings || [],
          suggestions: extractResponse.suggestions || []
        });
        setPdfType({
          isScanned: extractResponse.isScanned,
          confidence: extractResponse.textExtracted ? 'high' : 'low',
          pageCount: extractResponse.pages
        });
        setStatus('review');
        setProgress(100);
      } else {
        // No data extracted, but we can still proceed
        setExtractedData({});
        setStatus('review');
        setProgress(100);
      }
    } catch (err) {
      console.error('Extraction error:', err);
      
      let errorMessage = err.message || 'Failed to extract data from PDF';
      
      // Specific error handling
      if (err.response?.status === 413 || errorMessage.includes('413')) {
        errorMessage = 'File too large. Maximum size is 50MB.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid PDF file. Please ensure the file is not corrupted.';
      } else if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
        errorMessage = 'Password-protected PDFs cannot be processed. Please remove the password and try again.';
      }
      
      setStatus('error');
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [file, showError]);

  // Poll job status
  const pollJobStatus = useCallback(async (id) => {
    try {
      if (pollStartRef.current && Date.now() - pollStartRef.current > MAX_POLL_TIME) {
        clearInterval(pollIntervalRef.current);
        setStatus('error');
        setError('Analysis timed out after 5 minutes. The AI provider may be unavailable.');
        return;
      }

      const { api } = await import('../../api/client');
      const jobStatus = await api.jobs.getStatus(id);

      setProgress(jobStatus.progress || 0);

      if (jobStatus.status === 'completed') {
        clearInterval(pollIntervalRef.current);
        setStatus('completed');
        setProgress(100);
        setResult(jobStatus.result);
        setIsPartial(false);
        
        showSuccess('Blueprint analysis complete!');
        
        if (onAnalysisComplete && jobStatus.result) {
          onAnalysisComplete(jobStatus.result);
        }
      } else if (jobStatus.status === 'failed') {
        clearInterval(pollIntervalRef.current);
        setStatus('error');
        setError(jobStatus.error || 'Analysis failed. Check AI provider settings and try again.');
        showError(jobStatus.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error polling job status:', err);
      clearInterval(pollIntervalRef.current);
      setStatus('error');
      setError('Lost connection while checking analysis status. Please try again.');
      showError('Connection lost during analysis');
    }
  }, [onAnalysisComplete, showSuccess, showError]);

  // Handle AI analysis with edited data
  const handleAnalyze = useCallback(async (editedData) => {
    if (!file) return;

    setStatus('uploading');
    setError(null);
    setProgress(20);

    try {
      const { api } = await import('../../api/client');
      
      abortControllerRef.current = new AbortController();
      
      // Use the enhanced upload with extracted data
      const response = await api.upload.blueprintWithData(
        file, 
        editedData,
        selectedModel
      );

      setProgress(40);

      if (response.jobId) {
        setJobId(response.jobId);
        setStatus('processing');
        setProgress(50);

        // Start polling
        pollStartRef.current = Date.now();
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(response.jobId);
        }, POLL_INTERVAL);
      } else {
        // Sync response
        setStatus('completed');
        setProgress(100);
        setResult(response);
        setIsPartial(false);
        
        showSuccess('Blueprint analysis complete!');
        
        if (onAnalysisComplete) {
          onAnalysisComplete(response);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = err.message || 'Upload failed';
      
      if (err.response?.status === 413 || errorMessage.includes('413')) {
        errorMessage = 'File too large. Maximum upload size is 50MB.';
      } else if (err.response?.status === 500) {
        errorMessage = `Server error: ${err.response?.data?.error?.message || 'Internal server error'}`;
      } else if (err.response?.status === 400) {
        errorMessage = `Bad request: ${err.response?.data?.error?.message || 'Invalid file format'}`;
      } else if (errorMessage.includes('network') || !navigator.onLine) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setStatus('error');
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [file, selectedModel, onAnalysisComplete, pollJobStatus, showSuccess, showError]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    if (status === 'error' && file) {
      if (extractedData) {
        setStatus('review');
      } else {
        handleExtract();
      }
    } else {
      setStatus('idle');
    }
    setProgress(0);
  }, [status, file, extractedData, handleExtract]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('idle');
    setProgress(0);
    showError('Analysis cancelled');
  }, [showError]);

  // Handle upload another
  const handleUploadAnother = useCallback(() => {
    handleFileRemove();
  }, [handleFileRemove]);

  // Skip to direct analysis (legacy mode)
  const handleSkipReview = useCallback(() => {
    handleAnalyze(extractedData || {});
  }, [extractedData, handleAnalyze]);

  // Render based on status
  const renderContent = () => {
    // Show success animation immediately when completed, then results
    if (status === 'completed' && result) {
      return (
        <div className="space-y-6">
          <UploadSuccess
            fileName={file?.name}
            onUploadAnother={handleUploadAnother}
            onViewResults={() => setStatus('results')}
          />
        </div>
      );
    }

    // Show results view after success animation
    if (status === 'results' && result) {
      return (
        <AnalysisResults
          result={result}
          isPartial={false}
          onUploadAnother={handleUploadAnother}
        />
      );
    }

    // Show partial results during processing
    if (status === 'processing' && isPartial && result) {
      return (
        <AnalysisResults
          result={result}
          isPartial={true}
          onUploadAnother={handleUploadAnother}
        />
      );
    }

    // Show progress during upload/processing
    if (status === 'uploading' || status === 'processing') {
      return (
        <UploadProgress
          progress={progress}
          status={status}
          fileName={file?.name}
          onCancel={handleCancel}
        />
      );
    }

    // Show extraction progress
    if (status === 'extracting') {
      return (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center">
            <FileSearch className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Extracting Blueprint Data...
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Reading PDF and identifying project specifications
          </p>
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      );
    }

    // Show extracted data review
    if (status === 'review') {
      return (
        <div className="space-y-4">
          {/* PDF Type Warning */}
          {pdfType?.isScanned && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    Scanned PDF Detected
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    This appears to be a scanned document. Text extraction may be limited. 
                    Please verify all extracted data before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Model */}
          <div
            className="rounded-xl p-4"
            style={{ background: '#181C24', border: '1px solid #1F2430' }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: '#94A3B8' }}>
              ANALYSIS MODEL
            </p>
            <ModelSelector
              value={selectedModel}
              onChange={onModelChange}
              size="sm"
              showProvider={true}
              showPerformance={true}
            />
          </div>

          <ExtractedDataEditor
            initialData={extractedData || {}}
            confidenceScores={confidenceScores}
            warnings={validationResults.warnings}
            suggestions={validationResults.suggestions}
            onSubmit={handleAnalyze}
            onCancel={handleFileRemove}
            isAnalyzing={status === 'uploading'}
          />

          {/* Skip review option */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSkipReview}
              disabled={status === 'uploading'}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline disabled:opacity-50"
            >
              Skip review and analyze immediately
            </button>
          </div>
        </div>
      );
    }

    // Show error
    if (status === 'error') {
      return (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">Analysis Failed</h4>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {file && (
              <button
                onClick={handleRetry}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
            <button
              onClick={handleUploadAnother}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Different File
            </button>
          </div>
        </div>
      );
    }

    // Show upload UI
    return (
      <div className="space-y-4">
        <FileDropzone
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          selectedFile={file}
        />

        {file && (
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleExtract}
              className="btn-primary flex items-center gap-2"
            >
              <FileSearch className="w-4 h-4" />
              Extract & Review Data
            </button>
            <button
              onClick={() => handleAnalyze({})}
              className="btn-secondary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Quick Analyze
            </button>
            <button
              onClick={handleFileRemove}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}

        {selectedModel && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Using model: <span className="font-medium">{selectedModel}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Blueprint Upload & Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {status === 'review' 
              ? 'Review and correct extracted data before AI analysis'
              : 'Upload a blueprint PDF to extract fixtures and generate a material takeoff'
            }
          </p>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
