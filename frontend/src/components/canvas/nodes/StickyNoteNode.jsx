import { memo, useState, useRef, useMemo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion } from 'framer-motion';
import { Pin, Trash2, Palette } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STICKY_COLORS = [
  { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' }, // Amber
  { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }, // Blue
  { bg: '#d1fae5', text: '#065f46', border: '#10b981' }, // Green
  { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' }, // Pink
  { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' }, // Purple
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Push pin indicator
 */
const PushPin = memo(function PushPin() {
  return (
    <Motion.div
      initial={{ scale: 0, y: -10 }}
      animate={{ scale: 1, y: 0 }}
      className="absolute -top-2 left-1/2 -translate-x-1/2 z-10"
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #ef4444, #b91c1c)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      }}
    />
  );
});

/**
 * Top shadow gradient for depth effect
 */
const TopShadow = memo(function TopShadow() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-10 pointer-events-none rounded-t"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
      }}
    />
  );
});

/**
 * Toolbar button
 */
const ToolbarButton = memo(function ToolbarButton({ 
  onClick, 
  title, 
  children,
  isActive = false,
  color = null,
}) {
  return (
    <Motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      className="flex items-center justify-center p-1.5 border-none rounded cursor-pointer"
      style={{
        background: isActive ? (color || 'rgba(245, 176, 65, 0.2)') : 'transparent',
        color: isActive ? (color || '#3B82F6') : '#f5f3f0',
      }}
    >
      {children}
    </Motion.button>
  );
});

/**
 * Toolbar divider
 */
const ToolbarDivider = memo(function ToolbarDivider() {
  return (
    <div 
      className="w-px my-1 mx-0.5"
      style={{ background: 'rgba(255,255,255,0.1)' }}
    />
  );
});

/**
 * Node toolbar (visible when selected)
 */
const NodeToolbar = memo(function NodeToolbar({ 
  isPinned, 
  onColorChange, 
  onPinToggle 
}) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-lg z-20"
      style={{
        background: '#1a1d24',
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <ToolbarButton onClick={onColorChange} title="Change color">
        <Palette size={14} />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={onPinToggle} 
        title={isPinned ? 'Unpin' : 'Pin'}
        isActive={isPinned}
        color="#3B82F6"
      >
        <Pin size={14} />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      <ToolbarButton title="Delete note" color="#ef4444">
        <Trash2 size={14} />
      </ToolbarButton>
    </Motion.div>
  );
});

/**
 * Editable textarea
 */
const NoteEditor = memo(function NoteEditor({ 
  value, 
  onChange, 
  onBlur, 
  textColor,
  textareaRef 
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.metaKey) {
      onBlur();
    }
  }, [onBlur]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      className="flex-1 w-full bg-transparent border-none resize-none outline-none p-0"
      style={{
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.5,
        color: textColor,
      }}
    />
  );
});

/**
 * Display mode for note content
 */
const NoteDisplay = memo(function NoteDisplay({ 
  content, 
  textColor, 
  onClick 
}) {
  return (
    <div
      onClick={onClick}
      className="flex-1 text-sm leading-relaxed cursor-text break-words overflow-hidden"
      style={{
        color: textColor,
        whiteSpace: 'pre-wrap',
      }}
    >
      {content}
    </div>
  );
});

/**
 * Note footer with date and save hint
 */
const NoteFooter = memo(function NoteFooter({ 
  date, 
  textColor, 
  isEditing 
}) {
  return (
    <div
      className="flex justify-between items-center mt-auto pt-2 text-[10px]"
      style={{ color: textColor, opacity: 0.6 }}
    >
      <span>{date}</span>
      {isEditing && (
        <span style={{ fontSize: 9 }}>⌘+Enter to save</span>
      )}
    </div>
  );
});

/**
 * Connection handles for the sticky note
 */
const ConnectionHandles = memo(function ConnectionHandles({ 
  colors, 
  isSelected 
}) {
  const handleStyle = {
    width: 8,
    height: 8,
    background: colors.border,
    border: `2px solid ${colors.bg}`,
    opacity: isSelected ? 1 : 0,
  };

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Left} 
        style={handleStyle} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={handleStyle} 
      />
    </>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

const StickyNoteNode = memo(function StickyNoteNode({ data, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || 'Click to edit...');
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [isPinned, setIsPinned] = useState(data.isPinned || false);
  const textareaRef = useRef(null);
  
  const colors = STICKY_COLORS[colorIndex] || STICKY_COLORS[0];
  
  // Memoize the formatted date
  const formattedDate = useMemo(() => {
    const date = data.createdAt ? new Date(data.createdAt) : new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [data.createdAt]);

  const handleColorChange = useCallback(() => {
    setColorIndex((prev) => (prev + 1) % STICKY_COLORS.length);
  }, []);

  const handlePinToggle = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleStopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);
  
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
      className="w-full h-full rounded relative"
      style={{
        background: colors.bg,
        boxShadow: selected
          ? `0 8px 30px rgba(0,0,0,0.3), 0 0 0 2px ${colors.border}`
          : '0 4px 15px rgba(0,0,0,0.2)',
        transform: 'translateZ(0)', // GPU acceleration
      }}
    >
      {isPinned && <PushPin />}
      <TopShadow />
      
      {selected && (
        <NodeToolbar
          isPinned={isPinned}
          onColorChange={handleColorChange}
          onPinToggle={handlePinToggle}
        />
      )}
      
      {/* Content */}
      <div className="flex flex-col h-full px-3.5 py-4">
        {isEditing ? (
          <NoteEditor
            value={content}
            onChange={setContent}
            onBlur={handleStopEditing}
            textColor={colors.text}
            textareaRef={textareaRef}
          />
        ) : (
          <NoteDisplay
            content={content}
            textColor={colors.text}
            onClick={handleStartEditing}
          />
        )}
        
        <NoteFooter
          date={formattedDate}
          textColor={colors.text}
          isEditing={isEditing}
        />
      </div>
      
      <ConnectionHandles colors={colors} isSelected={selected} />
    </Motion.div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';

export default StickyNoteNode;
