/**
 * HeroUpload Component
 * The centerpiece upload zone for blueprint analysis
 * Fully automated - no manual input required
 * 
 * @module components/upload/HeroUpload
 */

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, X, CheckCircle, Sparkles,
  FileUp, Layers, Box, Zap
} from 'lucide-react';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import { formatFileSize, validateFile, EXTENSION_SETS, MAX_FILE_SIZE } from './utils';
import { CompactErrorDisplay } from './ErrorDisplay';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const HERO_ACCEPTED_EXTENSIONS = new Set(['pdf', 'dwg', 'dxf']);
const ACCEPT_INPUT = '.pdf,.dwg,.dxf';

const STAGES = ['Upload', 'Extract', 'Analyze', 'Estimate'];

const FEATURES = [
  { icon: Zap, label: 'Instant Detection', value: '15+ fixture types', color: colors.warning.DEFAULT },
  { icon: FileUp, label: 'Auto Extraction', value: 'PDF/DWG/DXF', color: colors.accent.DEFAULT },
  { icon: Layers, label: 'Material Takeoff', value: 'Full BOM', color: colors.accent.purple },
  { icon: Box, label: '3-Tier Estimates', value: 'Production to Premium', color: colors.success.DEFAULT },
];

const FILE_TYPES = [
  { icon: FileText, label: 'PDF', color: colors.danger.DEFAULT },
  { icon: Layers, label: 'DWG', color: colors.warning.DEFAULT },
  { icon: Box, label: 'DXF', color: colors.info.DEFAULT },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Processing view with AI analysis progress
 */
const ProcessingView = memo(function ProcessingView({ progress }) {
  const getStageMessage = () => {
    if (progress.percent < 30) return 'Uploading your blueprint to secure servers...';
    if (progress.percent < 50) return 'Reading PDF structure and extracting text layers...';
    if (progress.percent < 75) return 'Running computer vision to detect fixtures and dimensions...';
    return 'Calculating material costs and labor estimates...';
  };

  return (
    <div 
      className="relative overflow-hidden rounded-3xl"
      style={{ backgroundColor: colors.surface.card, border: `1px solid ${colors.border.default}` }}
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom right, ${colors.accent.muted}, transparent)` }}
        />
        
        {/* Scanning line animation */}
        <motion.div
          className="absolute left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(to right, transparent, ${colors.accent.DEFAULT}, transparent)` }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.02,
            backgroundImage: `linear-gradient(${colors.accent.DEFAULT}80 1px, transparent 1px),
                             linear-gradient(90deg, ${colors.accent.DEFAULT}80 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 p-12 text-center">
        {/* Animated icon */}
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <motion.div 
            className="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: colors.accent.muted }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: `${colors.accent.purple}33` }}
            animate={{ scale: [1.3, 1, 1.3], opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div 
            className="relative w-full h-full rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(to bottom right, ${colors.accent.DEFAULT}, ${colors.accent.purple})` }}
          >
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
          className="mb-8 max-w-md mx-auto"
          style={{ color: colors.text.secondary }}
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
              className="font-medium"
              style={{ color: colors.accent.light }}
            >
              {progress.stage}
            </motion.span>
            <span className="text-white font-bold">{progress.percent}%</span>
          </div>
          
          <div 
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.border.default }}
          >
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                background: `linear-gradient(to right, ${colors.accent.DEFAULT}, ${colors.accent.purple}, ${colors.accent.DEFAULT})`,
                backgroundSize: '200% 100%',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          
          {/* Stage indicators */}
          <div className="flex justify-between mt-4">
            {STAGES.map((stage, idx) => {
              const stagePercent = (idx + 1) * 25;
              const isComplete = progress.percent >= stagePercent;
              const isCurrent = progress.percent >= (idx * 25) && progress.percent < stagePercent;
              
              return (
                <div key={stage} className="flex flex-col items-center">
                  <motion.div 
                    className="w-3 h-3 rounded-full mb-1"
                    style={{
                      backgroundColor: isComplete 
                        ? colors.success.DEFAULT 
                        : isCurrent 
                          ? colors.accent.DEFAULT 
                          : colors.border.strong,
                    }}
                    animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span 
                    className="text-xs uppercase tracking-wider"
                    style={{ color: isComplete || isCurrent ? colors.text.primary : colors.text.muted }}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fun facts / tips while waiting */}
        <motion.div 
          className="mt-8 text-sm"
          style={{ color: colors.text.muted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="italic">"{getStageMessage()}"</p>
        </motion.div>
      </div>
    </div>
  );
});

ProcessingView.displayName = 'ProcessingView';

/**
 * Dropzone - Main file drop area
 */
const Dropzone = memo(function Dropzone({ isDragging, onClick, children }) {
  return (
    <motion.div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-3xl border-2 border-dashed cursor-pointer
        transition-all duration-300 min-h-[420px] flex items-center justify-center
      `}
      style={{
        backgroundColor: isDragging ? colors.accent.muted : colors.surface.card,
        borderColor: isDragging ? colors.accent.DEFAULT : colors.border.strong,
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
      }}
      whileHover={{ 
        borderColor: colors.accent.DEFAULT,
        backgroundColor: colors.surface.elevated,
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-10 left-10 w-40 h-40 rounded-full blur-3xl"
          style={{ backgroundColor: colors.accent.muted }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-48 h-48 rounded-full blur-3xl"
          style={{ backgroundColor: `${colors.accent.purple}1A` }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Blueprint grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.02,
          backgroundImage: `linear-gradient(${colors.accent.DEFAULT}CC 1px, transparent 1px),
                           linear-gradient(90deg, ${colors.accent.DEFAULT}CC 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 text-center p-12">
        {children}
      </div>
    </motion.div>
  );
});

Dropzone.displayName = 'Dropzone';

/**
 * File type badges display
 */
const FileTypeBadges = memo(function FileTypeBadges() {
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {FILE_TYPES.map((type) => (
        <div 
          key={type.label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ 
            backgroundColor: colors.surface.primary, 
            border: `1px solid ${colors.border.default}` 
          }}
        >
          <type.icon className="w-4 h-4" style={{ color: type.color }} />
          <span 
            className="text-sm"
            style={{ color: colors.text.secondary }}
          >
            {type.label}
          </span>
        </div>
      ))}
    </div>
  );
});

FileTypeBadges.displayName = 'FileTypeBadges';

/**
 * Animated upload icon with floating elements
 */
const UploadIcon = memo(function UploadIcon() {
  return (
    <motion.div 
      className="w-32 h-32 mx-auto mb-6 rounded-3xl flex items-center justify-center relative"
      style={{ 
        background: `linear-gradient(to bottom right, ${colors.border.default}, ${colors.border.strong})`,
        border: `1px solid ${colors.border.strong}`,
      }}
      whileHover={{ scale: 1.05, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Upload className="w-14 h-14" style={{ color: colors.accent.light }} />
      
      {/* Floating elements */}
      <motion.div
        className="absolute -top-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ 
          backgroundColor: colors.surface.card, 
          border: `1px solid ${colors.border.strong}` 
        }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <FileText className="w-5 h-5" style={{ color: colors.accent.purple }} />
      </motion.div>
      <motion.div
        className="absolute -bottom-2 -left-2 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ 
          backgroundColor: colors.surface.card, 
          border: `1px solid ${colors.border.strong}` 
        }}
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        <Layers className="w-5 h-5" style={{ color: colors.success.DEFAULT }} />
      </motion.div>
    </motion.div>
  );
});

UploadIcon.displayName = 'UploadIcon';

/**
 * Feature highlights grid
 */
const FeatureHighlights = memo(function FeatureHighlights() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {FEATURES.map((feature, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="rounded-xl p-4 text-center transition-colors"
          style={{ 
            backgroundColor: `${colors.surface.card}80`,
            border: `1px solid ${colors.border.muted}`,
          }}
          whileHover={{ borderColor: colors.border.default }}
        >
          <div 
            className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${feature.color}1A` }}
          >
            <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
          </div>
          <p 
            className="font-medium text-sm"
            style={{ color: colors.text.primary }}
          >
            {feature.label}
          </p>
          <p 
            className="text-xs"
            style={{ color: colors.text.muted }}
          >
            {feature.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
});

FeatureHighlights.displayName = 'FeatureHighlights';

/**
 * Selected files list with actions
 */
const SelectedFilesList = memo(function SelectedFilesList({ files, onRemove, onClear, onUpload }) {
  return (
    <AnimatePresence>
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl overflow-hidden"
          style={{ 
            backgroundColor: colors.surface.card, 
            border: `1px solid ${colors.border.default}` 
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${colors.border.default}` }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" style={{ color: colors.success.DEFAULT }} />
              <span 
                className="font-semibold"
                style={{ color: colors.text.primary }}
              >
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-sm transition-colors"
              style={{ color: colors.text.muted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.danger.DEFAULT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.text.muted;
              }}
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
                className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                style={{ 
                  backgroundColor: colors.surface.primary,
                  border: `1px solid ${colors.border.muted}`,
                }}
                whileHover={{ borderColor: colors.border.default }}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.accent.muted }}
                >
                  <FileText className="w-5 h-5" style={{ color: colors.accent.light }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-medium truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {file.name}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: colors.text.muted }}
                  >
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(idx);
                  }}
                  className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: colors.text.muted }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.danger.muted;
                    e.currentTarget.style.color = colors.danger.DEFAULT;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text.muted;
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Action button */}
          <div 
            className="p-4"
            style={{ borderTop: `1px solid ${colors.border.default}` }}
          >
            <motion.button
              onClick={onUpload}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{ 
                background: `linear-gradient(to right, ${colors.accent.DEFAULT}, ${colors.accent.purple})`,
                boxShadow: `0 10px 25px -5px ${colors.accent.glow}`,
              }}
              whileHover={{ 
                scale: 1.01,
                boxShadow: `0 20px 30px -10px ${colors.accent.glow}`,
              }}
              whileTap={{ scale: 0.99 }}
            >
              <Sparkles className="w-5 h-5" />
              Start AI Analysis
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SelectedFilesList.displayName = 'SelectedFilesList';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * HeroUpload - Main blueprint upload component
 * 
 * @param {{
 *   onUpload: (files: File[]) => void,
 *   isProcessing: boolean,
 *   uploadProgress: { stage: string, percent: number }
 * }} props
 */
const HeroUpload = memo(function HeroUpload({ onUpload, isProcessing, uploadProgress }) {
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

        <h2 
          className="text-3xl font-bold mb-3"
          style={{ color: colors.text.primary }}
        >
          Drop Your Blueprint Here
        </h2>
        <p 
          className="text-lg mb-2 max-w-md mx-auto"
          style={{ color: colors.text.secondary }}
        >
          Upload PDF floorplans, architectural drawings, or construction blueprints
        </p>
        <p 
          className="text-sm"
          style={{ color: colors.text.muted }}
        >
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
});

HeroUpload.displayName = 'HeroUpload';

export default HeroUpload;
