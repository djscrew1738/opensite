/**
 * DocumentNode Component
 * Canvas node for displaying blueprint and document files
 * 
 * @module components/canvas/nodes/DocumentNode
 */

import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Expand, Pin } from 'lucide-react';
import { DOCUMENT_CATEGORIES, useCanvasStore } from '../canvasStore';
import { colors, shadows } from '../../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {React.CSSProperties} */
const FILE_ICON_GRADIENT = {
  background: `linear-gradient(135deg, ${colors.surface.elevated} 0%, ${colors.surface.card} 100%)`,
};

/** @type {React.CSSProperties} */
const FOLDED_CORNER_STYLE = {
  width: 0,
  height: 0,
  borderStyle: 'solid',
  borderWidth: '0 12px 12px 0',
  borderColor: `transparent ${colors.accent.DEFAULT} transparent transparent`,
};

// OCR text color - slightly muted from primary
const OCR_TEXT_COLOR = '#c4bfb8';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * File icon with extension label
 * @param {{extension: string, color: string}} props
 */
const FileIcon = memo(function FileIcon({ extension, color }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-12 h-14 rounded-md border"
      style={{
        ...FILE_ICON_GRADIENT,
        borderColor: `${colors.text.primary}10`,
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
        style={FOLDED_CORNER_STYLE}
      />
    </div>
  );
});

FileIcon.displayName = 'FileIcon';

/**
 * OCR text preview with gradient fade
 * @param {{text: string | undefined}} props
 */
const OCRPreview = memo(function OCRPreview({ text }) {
  if (!text) return null;

  return (
    <div 
      className="relative mt-2.5 p-2 rounded-md max-h-[60px] overflow-hidden text-xs"
      style={{ 
        backgroundColor: `${colors.surface.primary}4D`, // 30% opacity
        color: OCR_TEXT_COLOR,
      }}
    >
      <div 
        className="absolute bottom-0 left-0 right-0 h-5"
        style={{ 
          background: `linear-gradient(to top, ${colors.surface.card}CC, transparent)`,
        }}
      />
      {text.substring(0, 150)}...
    </div>
  );
});

OCRPreview.displayName = 'OCRPreview';

/**
 * Document preview modal
 * @param {{
 *   isOpen: boolean, 
 *   onClose: () => void, 
 *   data: {label: string, documentId: string, ocrText?: string}, 
 *   category: {label: string, color: string}, 
 *   fileExt: string
 * }} props
 */
const PreviewModal = memo(function PreviewModal({ 
  isOpen, 
  onClose, 
  data, 
  category, 
  fileExt 
}) {
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-10 backdrop-blur-sm"
          style={{ backgroundColor: colors.surface.overlay }}
          onClick={handleBackdropClick}
        >
          <Motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col w-full max-w-[900px] h-[80vh] rounded-2xl border overflow-hidden"
            style={{ 
              backgroundColor: colors.surface.card,
              borderColor: colors.border.default,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div 
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${colors.border.default}` }}
            >
              <div>
                <h3 
                  className="text-base m-0"
                  style={{ color: colors.text.primary }}
                >
                  {data.label}
                </h3>
                <span style={{ color: colors.text.muted, fontSize: '12px' }}>
                  {category.label} • {fileExt}
                </span>
              </div>
              <Motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 border-none rounded-lg cursor-pointer transition-colors"
                style={{ 
                  backgroundColor: colors.surface.elevated,
                  color: colors.text.muted,
                }}
                aria-label="Close preview"
              >
                <X size={20} />
              </Motion.button>
            </div>
            
            {/* Preview Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Document View */}
              <div 
                className="flex-1 flex items-center justify-center p-5"
                style={{ backgroundColor: colors.surface.primary }}
              >
                <div 
                  className="flex flex-col items-center justify-center w-full h-full rounded-lg"
                  style={{ 
                    backgroundColor: colors.surface.elevated,
                    color: colors.text.muted,
                  }}
                >
                  <FileText size={64} color={category.color} />
                  <p>Document Preview</p>
                  <p className="text-xs">File: {data.documentId}</p>
                </div>
              </div>
              
              {/* OCR Sidebar */}
              {data.ocrText && (
                <div 
                  className="w-80 border-l p-4 overflow-auto"
                  style={{ borderColor: colors.border.default }}
                >
                  <h4 
                    className="m-0 mb-3 text-[13px] uppercase tracking-wide"
                    style={{ color: colors.text.primary }}
                  >
                    Extracted Text
                  </h4>
                  <div 
                    className="text-xs leading-relaxed whitespace-pre-wrap font-mono"
                    style={{ color: OCR_TEXT_COLOR }}
                  >
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

PreviewModal.displayName = 'PreviewModal';

/**
 * Action buttons (Preview & Pin)
 * @param {{onPreview: () => void, onPinToggle: () => void, isPinned: boolean}} props
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
        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 text-[11px] font-medium rounded-md cursor-pointer transition-colors"
        style={{
          backgroundColor: isPinned ? colors.accent.muted : `${colors.warning.DEFAULT}1A`, // 10% opacity
          border: `1px solid ${isPinned ? colors.accent.DEFAULT : `${colors.warning.DEFAULT}4D`}`, // 30% opacity
          color: colors.accent.DEFAULT,
        }}
      >
        <Expand size={12} />
        Preview
      </Motion.button>
      
      <Motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPinToggle}
        className="py-1.5 px-2 rounded-md cursor-pointer transition-colors"
        style={{
          backgroundColor: isPinned ? colors.accent.muted : `${colors.text.primary}0D`, // 5% opacity
          border: `1px solid ${isPinned ? colors.accent.DEFAULT : colors.border.default}`,
          color: isPinned ? colors.accent.DEFAULT : colors.text.muted,
        }}
        aria-label={isPinned ? 'Unpin document' : 'Pin document'}
      >
        <Pin size={12} />
      </Motion.button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

/**
 * Node header with category info
 * @param {{category: {icon: string, label: string, color: string}, isPinned: boolean}} props
 */
const NodeHeader = memo(function NodeHeader({ category, isPinned }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={{
        backgroundColor: `${category.color}15`,
        borderBottom: `1px solid ${category.color}30`,
      }}
    >
      <span className="text-base">{category.icon}</span>
      <span
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: category.color }}
      >
        {category.label}
      </span>
      {isPinned && (
        <Motion.span
          initial={{ rotate: -45, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          className="ml-auto"
          style={{ color: colors.accent.DEFAULT }}
        >
          <Pin size={12} />
        </Motion.span>
      )}
    </div>
  );
});

NodeHeader.displayName = 'NodeHeader';

/**
 * Connection handles for the node
 * @param {{color: string}} props
 */
const ConnectionHandles = memo(function ConnectionHandles({ color }) {
  const handleStyle = { 
    border: `2px solid ${colors.surface.card}`,
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
        style={{ width: 8, height: 8, background: colors.text.muted, ...handleStyle }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ width: 8, height: 8, background: colors.text.muted, ...handleStyle }} 
      />
    </>
  );
});

ConnectionHandles.displayName = 'ConnectionHandles';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DocumentNode - Canvas node for displaying blueprint documents
 * @param {{id: string, data: {category: string, fileType?: string, label: string, aiConfidence?: number, ocrText?: string, isPinned?: boolean}, selected: boolean}} props
 */
const DocumentNode = memo(function DocumentNode({ id, data, selected }) {
  const [showPreview, setShowPreview] = useState(false);
  const [isPinned, setIsPinned] = useState(data.isPinned || false);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  
  const category = DOCUMENT_CATEGORIES[data.category] || DOCUMENT_CATEGORIES.other;
  const fileExt = data.fileType?.toUpperCase() || 'FILE';

  const handlePinToggle = useCallback(() => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    updateNodeData(id, { isPinned: nextPinned });
  }, [id, isPinned, updateNodeData]);

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
          backgroundColor: colors.surface.elevated,
          border: `2px solid ${selected ? colors.accent.DEFAULT : category.color + '60'}`,
          boxShadow: selected 
            ? shadows.glowBlue
            : shadows.card,
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
                className="text-[13px] font-medium truncate"
                style={{ color: colors.text.primary }}
                title={data.label}
              >
                {data.label}
              </div>
              {data.aiConfidence && (
                <div 
                  className="text-xs mt-0.5"
                  style={{ color: colors.text.muted }}
                >
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
        
        <ConnectionHandles color={category.category} />
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
