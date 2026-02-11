import { useState, useRef } from 'react';
import { Upload, FileText, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function BlueprintUpload({ onAnalysisComplete, tier, selectedModel }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const { api } = await import('../../api/client');
      const response = await api.upload.blueprint(file, tier, selectedModel);

      setResult(response);

      // Pass extracted data back to parent
      if (onAnalysisComplete && response.extractedData) {
        onAnalysisComplete(response);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Blueprint Upload & Analysis
      </h3>

      {/* Upload Area */}
      {!file && !result && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-700 mb-2">
            <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-gray-500">
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
              onClick={clearFile}
              disabled={uploading}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Analyzing Blueprint...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Analyze with AI
                </>
              )}
            </button>
            <button
              onClick={clearFile}
              disabled={uploading}
              className="btn-secondary"
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Upload Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Analysis Complete</p>
              <p className="text-sm text-green-700">{result.fileName}</p>
            </div>
          </div>

          {/* Extracted Data */}
          {result.extractedData && Object.keys(result.extractedData).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Extracted Information</h4>
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
          )}

          {/* AI Analysis */}
          {result.aiAnalysis && (
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

          {/* Estimate */}
          {result.estimate && (
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

          <button onClick={clearFile} className="btn-secondary w-full">
            Upload Another Blueprint
          </button>
        </div>
      )}
    </div>
  );
}
