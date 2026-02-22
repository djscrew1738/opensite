import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion } from 'framer-motion';
import { FileText, X, Expand, Pin } from 'lucide-react';
import { DOCUMENT_CATEGORIES } from '../canvasStore';

const DocumentNode = memo(({ data, selected }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isPinned, setIsPinned] = useState(data.isPinned || false);
  
  const category = DOCUMENT_CATEGORIES[data.category] || DOCUMENT_CATEGORIES.other;
  const fileExt = data.fileType?.toUpperCase() || 'FILE';
  
  return (
    <>
      <Motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%',
          height: '100%',
          background: '#1a1d24',
          border: `2px solid ${selected ? '#3B82F6' : category.color + '60'}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: selected 
            ? '0 0 20px rgba(245, 176, 65, 0.3)' 
            : '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: category.color + '15',
            borderBottom: `1px solid ${category.color}30`,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>{category.icon}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: category.color,
            }}
          >
            {category.label}
          </span>
          {isPinned && (
            <Motion.span
              initial={{ rotate: -45, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              style={{ marginLeft: 'auto', color: '#3B82F6' }}
            >
              <Pin size={12} />
            </Motion.span>
          )}
        </div>
        
        {/* Content */}
        <div style={{ padding: 12, position: 'relative' }}>
          {/* File Icon & Type */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 56,
                background: 'linear-gradient(135deg, #2a2f38 0%, #1a1d24 100%)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <FileText size={20} color={category.color} />
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: category.color,
                  marginTop: 4,
                }}
              >
                {fileExt}
              </span>
              {/* Folded corner */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: '0 12px 12px 0',
                  borderColor: `transparent #3B82F6 transparent transparent`,
                }}
              />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#f5f3f0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={data.label}
              >
                {data.label}
              </div>
              {data.aiConfidence && (
                <div
                  style={{
                    fontSize: 10,
                    color: '#9a9590',
                    marginTop: 2,
                  }}
                >
                  AI confidence: {Math.round(data.aiConfidence * 100)}%
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 8,
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreview(true)}
              style={{
                flex: 1,
                padding: '6px 10px',
                background: 'rgba(245, 176, 65, 0.1)',
                border: '1px solid rgba(245, 176, 65, 0.3)',
                borderRadius: 6,
                color: '#3B82F6',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Expand size={12} />
              Preview
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPinned(!isPinned)}
              style={{
                padding: '6px 8px',
                background: isPinned ? 'rgba(245, 176, 65, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isPinned ? 'rgba(245, 176, 65, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6,
                color: isPinned ? '#3B82F6' : '#9a9590',
                cursor: 'pointer',
              }}
            >
              <Pin size={12} />
            </motion.button>
          </div>
          
          {/* OCR Preview (if available) */}
          {data.ocrText && (
            <div
              style={{
                marginTop: 10,
                padding: 8,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 6,
                fontSize: 10,
                color: '#c4bfb8',
                maxHeight: 60,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 20,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                }}
              />
              {data.ocrText.substring(0, 150)}...
            </div>
          )}
        </div>
        
        {/* Connection Handles */}
        <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: category.color, border: '2px solid #1a1d24' }} />
        <Handle type="source" position={Position.Right} style={{ width: 10, height: 10, background: category.color, border: '2px solid #1a1d24' }} />
        <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, background: '#6b7280', border: '2px solid #1a1d24' }} />
        <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, background: '#6b7280', border: '2px solid #1a1d24' }} />
      </Motion.div>
      
      {/* Full Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
            }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 900,
                height: '80vh',
                background: '#121318',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Preview Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: '#f5f3f0', fontSize: 16 }}>
                    {data.label}
                  </h3>
                  <span style={{ color: '#9a9590', fontSize: 12 }}>
                    {category.label} • {fileExt}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: 8,
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#9a9590',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>
              
              {/* Preview Content */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Document View */}
                <div
                  style={{
                    flex: 1,
                    padding: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0b0e',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#1a1d24',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <FileText size={64} color={category.color} />
                      <p>Document Preview</p>
                      <p style={{ fontSize: 12 }}>File: {data.documentId}</p>
                    </div>
                  </div>
                </div>
                
                {/* OCR Sidebar */}
                {data.ocrText && (
                  <div
                    style={{
                      width: 320,
                      borderLeft: '1px solid rgba(255,255,255,0.1)',
                      padding: 16,
                      overflow: 'auto',
                    }}
                  >
                    <h4 style={{ margin: '0 0 12px 0', color: '#f5f3f0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Extracted Text
                    </h4>
                    <div style={{ fontSize: 12, lineHeight: 1.6, color: '#c4bfb8', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {data.ocrText}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

DocumentNode.displayName = 'DocumentNode';

export default DocumentNode;
