/**
 * StickyNoteNode Component
 * Canvas node for draggable sticky notes with editing capabilities
 * 
 * @module components/canvas/nodes/StickyNoteNode
 */

import { memo, useState, useRef, useMemo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion } from 'framer-motion';
import { Pin, Trash2, Palette } from 'lucide-react';
import { useCanvasStore } from '../canvasStore';
import { colors, shadows } from '../../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

// User-selectable sticky note colors (functional, not design tokens)
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
        background: `radial-gradient(circle at 30% 30%, ${colors.danger.light}, ${colors.danger.dark})`,
        boxShadow: shadows.card,
      }}
    />
  );
});

PushPin.displayName = 'PushPin';

/**
 * Top shadow gradient for depth effect
 */
const TopShadow = memo(function TopShadow() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-10 pointer-events-none rounded-t"
      style={{
        background: `linear-gradient(180deg, ${colors.surface.overlay} 0%, transparent 100%)`,
      }}
    />
  );
});

TopShadow.displayName = 'TopShadow';

/**
 * Toolbar button
 * @param {{onClick: () => void, title: string, children: React.ReactNode, isActive?: boolean, color?: string | null}} props
 */
const ToolbarButton = memo(function ToolbarButton({ 
  onClick, 
  title, 
  children,
  isActive = false,
  color = null,
}) {
  const buttonColor = color || colors.accent.DEFAULT;

  return (
    <Motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      className="flex items-center justify-center p-1.5 border-none rounded cursor-pointer transition-colors"
      style={{
        backgroundColor: isActive ? `${buttonColor}20` : 'transparent',
        color: isActive ? buttonColor : colors.text.primary,
      }}
      type="button"
    >
      {children}
    </Motion.button>
  );
});

ToolbarButton.displayName = 'ToolbarButton';

/**
 * Toolbar divider
 */
const ToolbarDivider = memo(function ToolbarDivider() {
  return (
    <div 
      className="w-px my-1 mx-0.5"
      style={{ backgroundColor: colors.border.default }}
    />
  );
});

ToolbarDivider.displayName = 'ToolbarDivider';

/**
 * Node toolbar (visible when selected)
 * @param {{isPinned: boolean, onColorChange: () => void, onPinToggle: () => void, onDelete?: () => void}} props
 */
const NodeToolbar = memo(function NodeToolbar({ 
  isPinned, 
  onColorChange, 
  onPinToggle,
  onDelete,
}) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-lg z-20"
      style={{
        backgroundColor: colors.surface.elevated,
        boxShadow: shadows.cardHover,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <ToolbarButton onClick={onColorChange} title="Change color">
        <Palette size={14} />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={onPinToggle} 
        title={isPinned ? 'Unpin' : 'Pin'}
        isActive={isPinned}
        color={colors.accent.DEFAULT}
      >
        <Pin size={14} />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      <ToolbarButton 
        onClick={onDelete} 
        title="Delete note"
        color={colors.danger.DEFAULT}
      >
        <Trash2 size={14} />
      </ToolbarButton>
    </Motion.div>
  );
});

NodeToolbar.displayName = 'NodeToolbar';

/**
 * Editable textarea
 * @param {{value: string, onChange: (value: string) => void, onBlur: () => void, textColor: string, textareaRef: React.RefObject<HTMLTextAreaElement>}} props
 */
const NoteEditor = memo(function NoteEditor({ 
  value, 
  onChange, 
  onBlur, 
  textColor,
  textareaRef 
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onBlur();
    } else if (e.key === 'Escape') {
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
      placeholder="Type your note here..."
    />
  );
});

NoteEditor.displayName = 'NoteEditor';

/**
 * Display mode for note content
 * @param {{content: string, textColor: string, onClick: () => void}} props
 */
const NoteDisplay = memo(function NoteDisplay({ 
  content, 
  textColor, 
  onClick 
}) {
  const displayContent = content?.trim() || 'Click to edit...';
  const isPlaceholder = !content?.trim();

  return (
    <div
      onClick={onClick}
      className="flex-1 text-sm leading-relaxed cursor-text break-words overflow-hidden"
      style={{
        color: isPlaceholder ? `${textColor}80` : textColor,
        whiteSpace: 'pre-wrap',
      }}
    >
      {displayContent}
    </div>
  );
});

NoteDisplay.displayName = 'NoteDisplay';

/**
 * Note footer with date and save hint
 * @param {{date: string, textColor: string, isEditing: boolean}} props
 */
const NoteFooter = memo(function NoteFooter({ 
  date, 
  textColor, 
  isEditing 
}) {
  return (
    <div
      className="flex justify-between items-center mt-auto pt-2 text-xs"
      style={{ color: textColor, opacity: 0.6 }}
    >
      <span>{date}</span>
      {isEditing && (
        <span style={{ fontSize: 9 }}>⌘+Enter to save</span>
      )}
    </div>
  );
});

NoteFooter.displayName = 'NoteFooter';

/**
 * Connection handles for the sticky note
 * @param {{colors: {bg: string, border: string}, isSelected: boolean}} props
 */
const ConnectionHandles = memo(function ConnectionHandles({ 
  colors: colorSet, 
  isSelected 
}) {
  const handleStyle = {
    width: 8,
    height: 8,
    background: colorSet.border,
    border: `2px solid ${colorSet.bg}`,
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

ConnectionHandles.displayName = 'ConnectionHandles';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * StickyNoteNode - Canvas node for draggable sticky notes
 * @param {{id: string, data: {content?: string, colorIndex?: number, isPinned?: boolean, createdAt?: string, rotation?: number}, selected: boolean}} props
 */
const StickyNoteNode = memo(function StickyNoteNode({ id, data, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || '');
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [isPinned, setIsPinned] = useState(data.isPinned || false);
  const textareaRef = useRef(null);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const removeNode = useCanvasStore((state) => state.removeNode);
  
  const colorSet = STICKY_COLORS[colorIndex] || STICKY_COLORS[0];
  
  // Memoize the formatted date
  const formattedDate = useMemo(() => {
    const date = data.createdAt ? new Date(data.createdAt) : new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [data.createdAt]);

  const handleColorChange = useCallback(() => {
    const nextIndex = (colorIndex + 1) % STICKY_COLORS.length;
    setColorIndex(nextIndex);
    updateNodeData(id, { colorIndex: nextIndex });
  }, [id, colorIndex, updateNodeData]);

  const handlePinToggle = useCallback(() => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    updateNodeData(id, { isPinned: nextPinned });
  }, [id, isPinned, updateNodeData]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      removeNode(id);
    }
  }, [id, removeNode]);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleStopEditing = useCallback(() => {
    setIsEditing(false);
    updateNodeData(id, { content });
  }, [id, content, updateNodeData]);
  
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
        backgroundColor: colorSet.bg,
        boxShadow: selected
          ? `0 8px 30px ${colors.surface.overlay}, 0 0 0 2px ${colorSet.border}`
          : shadows.cardHover,
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
          onDelete={handleDelete}
        />
      )}
      
      {/* Content */}
      <div className="flex flex-col h-full px-3.5 py-4">
        {isEditing ? (
          <NoteEditor
            value={content}
            onChange={setContent}
            onBlur={handleStopEditing}
            textColor={colorSet.text}
            textareaRef={textareaRef}
          />
        ) : (
          <NoteDisplay
            content={content}
            textColor={colorSet.text}
            onClick={handleStartEditing}
          />
        )}
        
        <NoteFooter
          date={formattedDate}
          textColor={colorSet.text}
          isEditing={isEditing}
        />
      </div>
      
      <ConnectionHandles colors={colorSet} isSelected={selected} />
    </Motion.div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';

export default StickyNoteNode;
