import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Expand, Pin } from 'lucide-react';
import { DOCUMENT_CATEGORIES } from '../canvasStore';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * File icon with extension label
 */
const FileIcon = memo(function FileIcon({ extension, color }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-12 h-14 rounded-md border border-white/10"
      style={{ 
        background: 'linear-gradient(135deg, #2a2f38 0%, #1a1d24 100%)',
      }}
    >
      <FileText size={20} color={color} />
      <span 
        className="text-[8px] font-bold mt-1"
        style={{ color }}
      >
        {extension}
      </span>
      {/* Folded corner */}
      <div
        className="absolute top-0 right-0"
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 12px 12px 0',
          borderColor: 'transparent #3B82F6 transparent transparent',
        }}
      />
    </div>
  );
});

/**
 * OCR text preview with gradient fade
 */
const OCRPreview = memo(function OCRPreview({ text }) {
  if (!text) return null;

  return (
    <div className="relative mt-2.5 p-2 rounded-md bg-black/30 max-h-[60px] overflow-hidden text-[10px] text-[#c4bfb8]">
      <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-black/80 to-transparent" />
      {text.substring(0, 150)}...
    </div>
  );
});

/**
 * Document preview modal
 */
const PreviewModal = memo(function PreviewModal({ 
  isOpen, 
  onClose, 
  data, 
  category, 
  fileExt 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-10 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <Motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col w-full max-w-[900px] h-[80vh] bg-[#121318] rounded-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base text-[#f5f3f0] m-0">{data.label}</h3>
                <span className="text-xs text-[#9a9590]">
                  {category.label} • {fileExt}
                </span>
              </div>
              <Motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white/10 border-none rounded-lg text-[#9a9590] cursor-pointer"
              >
                <X size={20} />
              </Motion.button>
            </div>
            
            {/* Preview Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Document View */}
              <div className="flex-1 flex items-center justify-center p-5 bg-[#0a0b0e]">
                <div className="flex flex-col items-center justify-center w-full h-full bg-[#1a1d24] rounded-lg text-[#6b7280]">
                  <FileText size={64} color={category.color} />
                  <p>Document Preview</p>
                  <p className="text-xs">File: {data.documentId}</p>
                </div>
              </div>
              
              {/* OCR Sidebar */}
              {data.ocrText && (
                <div className="w-80 border-l border-white/10 p-4 overflow-auto">
                  <h4 className="m-0 mb-3 text-[13px] text-[#f5f3f0] uppercase tracking-wide">
                    Extracted Text
                  </h4>
                  <div className="text-xs leading-relaxed text-[#c4bfb8] whitespace-pre-wrap font-mono">
                    {data.ocrText}
                  </div>
                </div>
              )}
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
});

/**
 * Action buttons (Preview & Pin)
 */
const ActionButtons = memo(function ActionButtons({ 
  onPreview, 
  onPinToggle, 
  isPinned 
}) {
  return (
    <div className="flex gap-1.5 mt-2">
      <Motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPreview}
        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 text-[11px] font-medium rounded-md cursor-pointer"
        style={{
          background: 'rgba(245, 176, 65, 0.1)',
          border: '1px solid rgba(245, 176, 65, 0.3)',
          color: '#3B82F6',
        }}
      >
        <Expand size={12} />
        Preview
      </Motion.button>
      
      <Motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPinToggle}
        className="py-1.5 px-2 rounded-md cursor-pointer"
        style={{
          background: isPinned ? 'rgba(245, 176, 65, 0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isPinned ? 'rgba(245, 176, 65, 0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: isPinned ? '#3B82F6' : '#9a9590',
        }}
      >
        <Pin size={12} />
      </Motion.button>
    </div>
  );
});

/**
 * Node header with category info
 */
const NodeHeader = memo(function NodeHeader({ category, isPinned }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={{
        background: `${category.color}15`,
        borderBottom: `1px solid ${category.color}30`,
      }}
    >
      <span className="text-base">{category.icon}</span>
      <span
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: category.color }}
      >
        {category.label}
      </span>
      {isPinned && (
        <Motion.span
          initial={{ rotate: -45, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          className="ml-auto text-[#3B82F6]"
        >
          <Pin size={12} />
        </Motion.span>
      )}
    </div>
  );
});

/**
 * Connection handles for the node
 */
const ConnectionHandles = memo(function ConnectionHandles({ color }) {
  const handleStyle = { 
    border: '2px solid #1a1d24',
  };

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ width: 10, height: 10, background: color, ...handleStyle }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ width: 10, height: 10, background: color, ...handleStyle }} 
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ width: 8, height: 8, background: '#6b7280', ...handleStyle }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ width: 8, height: 8, background: '#6b7280', ...handleStyle }} 
      />
    </>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

const DocumentNode = memo(function DocumentNode({ data, selected }) {
  const [showPreview, setShowPreview] = useState(false);
  const [isPinned, setIsPinned] = useState(data.isPinned || false);
  
  const category = DOCUMENT_CATEGORIES[data.category] || DOCUMENT_CATEGORIES.other;
  const fileExt = data.fileType?.toUpperCase() || 'FILE';

  const handlePinToggle = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const handlePreviewOpen = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setShowPreview(false);
  }, []);
  
  return (
    <>
      <Motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full overflow-hidden rounded-xl"
        style={{
          background: '#1a1d24',
          border: `2px solid ${selected ? '#3B82F6' : category.color + '60'}`,
          boxShadow: selected 
            ? '0 0 20px rgba(245, 176, 65, 0.3)' 
            : '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <NodeHeader category={category} isPinned={isPinned} />
        
        {/* Content */}
        <div className="relative p-3">
          {/* File Icon & Info */}
          <div className="flex items-center gap-3 mb-2.5">
            <FileIcon extension={fileExt} color={category.color} />
            
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-medium truncate text-[#f5f3f0]"
                title={data.label}
              >
                {data.label}
              </div>
              {data.aiConfidence && (
                <div className="text-[10px] text-[#9a9590] mt-0.5">
                  AI confidence: {Math.round(data.aiConfidence * 100)}%
                </div>
              )}
            </div>
          </div>
          
          <ActionButtons 
            onPreview={handlePreviewOpen}
            onPinToggle={handlePinToggle}
            isPinned={isPinned}
          />
          
          <OCRPreview text={data.ocrText} />
        </div>
        
        <ConnectionHandles color={category.color} />
      </Motion.div>
      
      <PreviewModal
        isOpen={showPreview}
        onClose={handlePreviewClose}
        data={data}
        category={category}
        fileExt={fileExt}
      />
    </>
  );
});

DocumentNode.displayName = 'DocumentNode';

export default DocumentNode;
