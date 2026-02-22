import React, { memo, useState, useRef, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion } from 'framer-motion';
import { Pin, Trash2, Palette, Type } from 'lucide-react';

const STICKY_COLORS = [
  { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' }, // Amber
  { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }, // Blue
  { bg: '#d1fae5', text: '#065f46', border: '#10b981' }, // Green
  { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' }, // Pink
  { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' }, // Purple
];

const StickyNoteNode = memo(({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || 'Click to edit...');
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [isPinned, setIsPinned] = useState(data.isPinned || false);
  const textareaRef = useRef(null);
  
  const colors = STICKY_COLORS[colorIndex] || STICKY_COLORS[0];
  
  // Memoize the formatted date to avoid calling Date() during render
  const formattedDate = useMemo(() => {
    const date = data.createdAt ? new Date(data.createdAt) : new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [data.createdAt]);
  
  const handleColorChange = () => {
    setColorIndex((prev) => (prev + 1) % STICKY_COLORS.length);
  };
  
  return (
    <Motion.div
      initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
      animate={{ 
        scale: 1, 
        rotate: isPinned ? 0 : data.rotation || -2,
        opacity: 1 
      }}
      whileHover={{ rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        width: '100%',
        height: '100%',
        background: colors.bg,
        borderRadius: 4,
        boxShadow: selected
          ? `0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px ${colors.border}`
          : '0 4px 15px rgba(0,0,0,0.2)',
        position: 'relative',
        transform: 'translateZ(0)', // GPU acceleration
      }}
    >
      {/* Push Pin */}
      {isPinned && (
        <Motion.div
          initial={{ scale: 0, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #ef4444, #b91c1c)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        />
      )}
      
      {/* Top Shadow Gradient for Depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
          borderRadius: '4px 4px 0 0',
          pointerEvents: 'none',
        }}
      />
      
      {/* Toolbar */}
      {selected && (
        <Motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4,
            background: '#1a1d24',
            padding: '4px 8px',
            borderRadius: 8,
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 20,
          }}
        >
          <Motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleColorChange}
            title="Change color"
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              color: '#f5f3f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palette size={14} />
          </Motion.button>
          
          <Motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin' : 'Pin'}
            style={{
              padding: 6,
              background: isPinned ? 'rgba(245, 176, 65, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: 4,
              color: isPinned ? '#3B82F6' : '#f5f3f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pin size={14} />
          </Motion.button>
          
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 2px' }} />
          
          <Motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Delete note"
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={14} />
          </Motion.button>
        </Motion.div>
      )}
      
      {/* Content */}
      <div
        style={{
          padding: '16px 14px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                setIsEditing(false);
              }
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: 14,
              lineHeight: 1.5,
              color: colors.text,
              padding: 0,
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 1.5,
              color: colors.text,
              cursor: 'text',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflow: 'hidden',
            }}
          >
            {content}
          </div>
        )}
        
        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10,
            color: colors.text,
            opacity: 0.6,
          }}
        >
          <span>{formattedDate}</span>
          {isEditing && (
            <span style={{ fontSize: 9 }}>
              ⌘+Enter to save
            </span>
          )}
        </div>
      </div>
      
      {/* Connection Handles (subtle for sticky notes) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          width: 8, 
          height: 8, 
          background: colors.border, 
          border: '2px solid ' + colors.bg,
          opacity: selected ? 1 : 0,
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          width: 8, 
          height: 8, 
          background: colors.border, 
          border: '2px solid ' + colors.bg,
          opacity: selected ? 1 : 0,
        }} 
      />
    </Motion.div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';

export default StickyNoteNode;
