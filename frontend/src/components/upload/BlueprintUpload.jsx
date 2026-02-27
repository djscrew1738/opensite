import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../hooks/useToast';
import FileDropzone from './FileDropzone';
import UploadProgress from './UploadProgress';
import AnalysisResults from './AnalysisResults';
import ExtractedDataEditor from './ExtractedDataEditor';
import { UploadSuccess } from '../shared/SuccessAnimation';
import { FileText, Upload, X, Sparkles, AlertCircle, RefreshCw, FileSearch } from 'lucide-react';
import { ModelSelector } from '../ai/ModelSelector';
import { useJobPolling } from '../../hooks/upload/useJobPolling';
import { parseErrorType, createError } from './utils';

const POLL_INTERVAL = 2000;
const MAX_POLL_TIME = 300000;

/**
 * Status view components
 */
function IdleView({ file, onFileSelect, onFileRemove, onExtract, onQuickAnalyze, selectedModel }) {
  return (
    <div className="space-y-4">
      <FileDropzone
        onFileSelect={onFileSelect}
        onFileRemove={onFileRemove}
        selectedFile={file}
      />

      {file && (
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={onExtract}
            className="btn-primary flex items-center gap-2"
          >
            <FileSearch className="w-4 h-4" />
            Extract & Review Data
          </button>
          <button
            onClick={() => onQuickAnalyze()}
            className="btn-secondary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Quick Analyze
          </button>
          <button
            onClick={onFileRemove}
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
}

function ExtractingView({ progress }) {
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

function ReviewView({ 
  pdfType, 
  selectedModel, 
  onModelChange,
  extractedData,
  confidenceScores,
  validationResults,
  onSubmit,
  onCancel,
  isAnalyzing,
  onSkip
}) {
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
        onSubmit={onSubmit}
        onCancel={onCancel}
        isAnalyzing={isAnalyzing}
      />

      {/* Skip review option */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSkip}
          disabled={isAnalyzing}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline disabled:opacity-50"
        >
          Skip review and analyze immediately
        </button>
      </div>
    </div>
  );
}

function ErrorView({ error, file, onRetry, onUploadAnother }) {
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
            onClick={onRetry}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
        <button
          onClick={onUploadAnother}
          className="btn-secondary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Different File
        </button>
      </div>
    </div>
  );
}

function SuccessView({ fileName, onUploadAnother, onViewResults }) {
  return (
    <div className="space-y-6">
      <UploadSuccess
        fileName={fileName}
        onUploadAnother={onUploadAnother}
        onViewResults={onViewResults}
      />
    </div>
  );
}

/**
 * Main BlueprintUpload Component
 */
export default function BlueprintUpload({
  onAnalysisComplete,
  selectedModel,
  onModelChange,
  className = ''
}) {
  const { success: showSuccess, error: showError } = useToast();
  
  // State
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [extractedData, setExtractedData] = useState(null);
  const [confidenceScores, setConfidenceScores] = useState({});
  const [validationResults, setValidationResults] = useState({ warnings: [], suggestions: [] });
  const [pdfType, setPdfType] = useState(null);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  // Polling hook for job status
  const polling = useJobPolling(
    async (jobId, signal) => {
      const { api } = await import('../../api/client');
      return api.jobs.getStatus(jobId, { signal });
    },
    {
      pollInterval: POLL_INTERVAL,
      maxPollTime: MAX_POLL_TIME,
      onProgress: (progress) => {
        // Progress is handled by UploadProgress component
      },
      onComplete: (result) => {
        setStatus('completed');
        showSuccess('Blueprint analysis complete!');
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
      },
      onError: (type, err) => {
        setStatus('error');
        setError(err);
        showError(err);
      }
    }
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetState = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setError(null);
    setExtractedData(null);
    setConfidenceScores({});
    setValidationResults({ warnings: [], suggestions: [] });
    setPdfType(null);
    polling.actions.reset();
  }, [polling.actions]);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setStatus('idle');
    setError(null);
    setExtractedData(null);
  }, []);

  const handleFileRemove = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleExtract = useCallback(async () => {
    if (!file) return;

    setStatus('extracting');
    setError(null);

    try {
      const { api } = await import('../../api/client');
      abortControllerRef.current = new AbortController();
      
      const extractResponse = await api.upload.extract(file);

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
      } else {
        setExtractedData({});
      }
      
      setStatus('review');
    } catch (err) {
      const errorType = parseErrorType(err, err.response?.status);
      const errorDetails = createError(errorType);
      setStatus('error');
      setError(errorDetails.message);
      showError(errorDetails.message);
    }
  }, [file, showError]);

  const handleAnalyze = useCallback(async (editedData) => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      const { api } = await import('../../api/client');
      abortControllerRef.current = new AbortController();
      
      const response = await api.upload.blueprintWithData(
        file, 
        editedData,
        selectedModel
      );

      if (response.jobId) {
        setStatus('processing');
        polling.actions.start(response.jobId);
      } else {
        // Sync response
        setStatus('completed');
        showSuccess('Blueprint analysis complete!');
        if (onAnalysisComplete) {
          onAnalysisComplete(response);
        }
      }
    } catch (err) {
      const errorType = parseErrorType(err, err.response?.status);
      const errorDetails = createError(errorType, { message: err.message });
      setStatus('error');
      setError(errorDetails.message);
      showError(errorDetails.message);
    }
  }, [file, selectedModel, polling.actions, onAnalysisComplete, showSuccess, showError]);

  const handleRetry = useCallback(() => {
    setError(null);
    if (extractedData) {
      setStatus('review');
    } else {
      handleExtract();
    }
  }, [extractedData, handleExtract]);

  const handleCancel = useCallback(() => {
    polling.actions.cancel();
    abortControllerRef.current?.abort();
    setStatus('idle');
    showError('Analysis cancelled');
  }, [polling.actions, showError]);

  // Render content based on status
  const renderContent = () => {
    switch (status) {
      case 'completed':
        return (
          <SuccessView
            fileName={file?.name}
            onUploadAnother={resetState}
            onViewResults={() => setStatus('results')}
          />
        );

      case 'results':
        return (
          <AnalysisResults
            result={polling.result}
            isPartial={false}
            onUploadAnother={resetState}
          />
        );

      case 'uploading':
      case 'processing':
        return (
          <UploadProgress
            progress={polling.progress}
            status={status}
            fileName={file?.name}
            onCancel={handleCancel}
          />
        );

      case 'extracting':
        return <ExtractingView progress={30} />;

      case 'review':
        return (
          <ReviewView
            pdfType={pdfType}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            extractedData={extractedData}
            confidenceScores={confidenceScores}
            validationResults={validationResults}
            onSubmit={handleAnalyze}
            onCancel={handleFileRemove}
            isAnalyzing={status === 'uploading'}
            onSkip={() => handleAnalyze(extractedData || {})}
          />
        );

      case 'error':
        return (
          <ErrorView
            error={error}
            file={file}
            onRetry={handleRetry}
            onUploadAnother={resetState}
          />
        );

      case 'idle':
      default:
        return (
          <IdleView
            file={file}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            onExtract={handleExtract}
            onQuickAnalyze={() => handleAnalyze({})}
            selectedModel={selectedModel}
          />
        );
    }
  };

  const getSubtitle = () => {
    switch (status) {
      case 'review':
        return 'Review and correct extracted data before AI analysis';
      case 'extracting':
        return 'Reading PDF and identifying project specifications';
      case 'processing':
      case 'uploading':
        return 'AI is analyzing your blueprint...';
      case 'completed':
        return 'Analysis complete! Review the results below.';
      case 'error':
        return 'Something went wrong. Please try again.';
      default:
        return 'Upload a blueprint PDF to extract fixtures and generate a material takeoff';
    }
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
            {getSubtitle()}
          </p>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
