/**
 * HeroUpload Component
 * The centerpiece upload zone for blueprint analysis
 * Fully automated - no manual input required
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, X, CheckCircle, Sparkles,
  FileUp, Layers, Box, Zap
} from 'lucide-react';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import { formatFileSize, validateFile, EXTENSION_SETS, MAX_FILE_SIZE } from './utils';
import { CompactErrorDisplay } from './ErrorDisplay';

const HERO_ACCEPTED_EXTENSIONS = new Set(['pdf', 'dwg', 'dxf']);
const ACCEPT_INPUT = '.pdf,.dwg,.dxf';

/**
 * ProcessingView - Shows AI analysis progress
 */
function ProcessingView({ progress }) {
  const getStageMessage = () => {
    if (progress.percent < 30) return 'Uploading your blueprint to secure servers...';
    if (progress.percent < 50) return 'Reading PDF structure and extracting text layers...';
    if (progress.percent < 75) return 'Running computer vision to detect fixtures and dimensions...';
    return 'Calculating material costs and labor estimates...';
  };

  const stages = ['Upload', 'Extract', 'Analyze', 'Estimate'];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#111318] border border-[#1F2430]">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent" />
        
        {/* Scanning line animation */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 p-12 text-center">
        {/* Animated icon */}
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <motion.div 
            className="absolute inset-0 rounded-2xl bg-blue-500/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute inset-0 rounded-2xl bg-purple-500/20"
            animate={{ scale: [1.3, 1, 1.3], opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>

        <motion.h3 
          className="text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          AI Analyzing Your Blueprint...
        </motion.h3>
        
        <motion.p 
          className="text-[#94A3B8] mb-8 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Extracting fixtures, dimensions, materials, and generating your estimate automatically
        </motion.p>

        {/* Progress bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <motion.span 
              key={progress.stage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-blue-400 font-medium"
            >
              {progress.stage}
            </motion.span>
            <span className="text-white font-bold">{progress.percent}%</span>
          </div>
          
          <div className="h-3 bg-[#1F2430] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
          
          {/* Stage indicators */}
          <div className="flex justify-between mt-4">
            {stages.map((stage, idx) => {
              const stagePercent = (idx + 1) * 25;
              const isComplete = progress.percent >= stagePercent;
              const isCurrent = progress.percent >= (idx * 25) && progress.percent < stagePercent;
              
              return (
                <div key={stage} className="flex flex-col items-center">
                  <motion.div 
                    className={`w-3 h-3 rounded-full mb-1 ${
                      isComplete ? 'bg-green-500' : 
                      isCurrent ? 'bg-blue-500' : 'bg-[#2D3548]'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className={`text-[10px] uppercase tracking-wider ${
                    isComplete || isCurrent ? 'text-white' : 'text-[#64748B]'
                  }`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fun facts / tips while waiting */}
        <motion.div 
          className="mt-8 text-sm text-[#64748B]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="italic">"{getStageMessage()}"</p>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Dropzone - Main file drop area
 */
function Dropzone({ isDragging, onClick, children }) {
  return (
    <motion.div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-3xl border-2 border-dashed cursor-pointer
        transition-all duration-300 min-h-[420px] flex items-center justify-center
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
          : 'border-[#2D3548] bg-[#111318] hover:border-[#3B82F6]/50 hover:bg-[#181C24]'
        }
      `}
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-10 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Blueprint grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center p-12">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * FileTypeBadges - Display accepted file types
 */
function FileTypeBadges() {
  const types = [
    { icon: FileText, label: 'PDF', color: 'text-red-400' },
    { icon: Layers, label: 'DWG', color: 'text-amber-400' },
    { icon: Box, label: 'DXF', color: 'text-cyan-400' },
  ];

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {types.map((type) => (
        <div 
          key={type.label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0B0D] border border-[#1F2430]"
        >
          <type.icon className={`w-4 h-4 ${type.color}`} />
          <span className="text-[#94A3B8] text-sm">{type.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * UploadIcon - Animated upload icon with floating elements
 */
function UploadIcon() {
  return (
    <motion.div 
      className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#1F2430] to-[#2D3548] 
               flex items-center justify-center border border-[#2D3548] relative"
      whileHover={{ scale: 1.05, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Upload className="w-14 h-14 text-blue-400" />
      
      {/* Floating elements */}
      <motion.div
        className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-[#111318] border border-[#2D3548] 
                 flex items-center justify-center"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <FileText className="w-5 h-5 text-purple-400" />
      </motion.div>
      <motion.div
        className="absolute -bottom-2 -left-2 w-10 h-10 rounded-xl bg-[#111318] border border-[#2D3548] 
                 flex items-center justify-center"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        <Layers className="w-5 h-5 text-green-400" />
      </motion.div>
    </motion.div>
  );
}

/**
 * FeatureHighlights - Grid of feature cards
 */
function FeatureHighlights() {
  const features = [
    { icon: Zap, label: 'Instant Detection', value: '15+ fixture types', color: 'yellow' },
    { icon: FileUp, label: 'Auto Extraction', value: 'PDF/DWG/DXF', color: 'blue' },
    { icon: Layers, label: 'Material Takeoff', value: 'Full BOM', color: 'purple' },
    { icon: Box, label: '3-Tier Estimates', value: 'Production to Premium', color: 'green' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {features.map((feature, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-[#111318]/50 rounded-xl p-4 border border-[#1F2430]/50 text-center
                   hover:border-[#2D3548] transition-colors"
        >
          <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center`}>
            <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
          </div>
          <p className="text-white font-medium text-sm">{feature.label}</p>
          <p className="text-[#64748B] text-xs">{feature.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * SelectedFilesList - Shows selected files with actions
 */
function SelectedFilesList({ files, onRemove, onClear, onUpload }) {
  return (
    <AnimatePresence>
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-[#111318] rounded-2xl border border-[#1F2430] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2430]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-white">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-[#64748B] hover:text-red-400 transition-colors text-sm"
            >
              Clear all
            </button>
          </div>

          {/* File list */}
          <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
            {files.map((file, idx) => (
              <motion.div 
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 bg-[#0A0B0D] rounded-xl border border-[#1F2430]/50
                         hover:border-[#2D3548] transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-xs text-[#64748B]">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(idx);
                  }}
                  className="p-2 rounded-lg text-[#64748B] hover:text-red-400 hover:bg-red-400/10 
                           transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Action button */}
          <div className="p-4 border-t border-[#1F2430]">
            <button
              onClick={onUpload}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 
                       hover:from-blue-600 hover:to-purple-700 rounded-xl font-bold text-white 
                       flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 
                       transition-all hover:shadow-blue-500/40 hover:scale-[1.01]"
            >
              <Sparkles className="w-5 h-5" />
              Start AI Analysis
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Main HeroUpload Component
 */
export function HeroUpload({ onUpload, isProcessing, uploadProgress }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);

  const processFiles = useCallback((files) => {
    setError(null);
    const validFiles = [];
    
    for (const file of files) {
      const validation = validateFile(file, {
        allowedExtensions: HERO_ACCEPTED_EXTENSIONS,
        maxSize: MAX_FILE_SIZE
      });
      
      if (!validation.valid) {
        setError({ type: 'UPLOAD_FAILED', details: { message: validation.error } });
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  }, []);

  const dragDrop = useDragDrop({ onDrop: processFiles });
  const fileInput = useFileInput({ onSelect: processFiles });

  const handleRemoveFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
  }, [selectedFiles, onUpload]);

  // Processing state
  if (isProcessing) {
    return <ProcessingView progress={uploadProgress} />;
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CompactErrorDisplay 
              error={error} 
              onDismiss={() => setError(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main dropzone */}
      <Dropzone 
        isDragging={dragDrop.isDragging}
        onClick={fileInput.handlers.onClick}
      >
        <input
          ref={fileInput.inputRef}
          type="file"
          accept={ACCEPT_INPUT}
          multiple
          className="hidden"
          onChange={fileInput.handlers.onChange}
        />

        <UploadIcon />

        <h2 className="text-3xl font-bold text-white mb-3">
          Drop Your Blueprint Here
        </h2>
        <p className="text-[#94A3B8] text-lg mb-2 max-w-md mx-auto">
          Upload PDF floorplans, architectural drawings, or construction blueprints
        </p>
        <p className="text-[#64748B] text-sm">
          Our AI will automatically extract fixtures, dimensions, and generate estimates
        </p>

        <FileTypeBadges />
      </Dropzone>

      {/* Selected files */}
      <SelectedFilesList
        files={selectedFiles}
        onRemove={handleRemoveFile}
        onClear={handleClearAll}
        onUpload={handleUpload}
      />

      {/* Feature highlights */}
      <FeatureHighlights />
    </div>
  );
}

export default HeroUpload;
