import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion } from 'framer-motion';
import { Edit2, Check, Link2 } from 'lucide-react';
import { ENTITY_TYPES } from '../canvasStore';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Entity icon in header
 */
const EntityIcon = memo(function EntityIcon({ type }) {
  return (
    <div
      className="flex items-center justify-center text-lg shrink-0"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${type.color} 0%, ${type.color}80 100%)`,
      }}
    >
      {type.icon}
    </div>
  );
});

/**
 * Editable name input
 */
const EditableName = memo(function EditableName({ 
  value, 
  onChange, 
  onSave, 
  typeColor 
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSave()}
      autoFocus
      className="w-full px-2 py-1 text-sm font-semibold bg-black/30 rounded-md outline-none"
      style={{
        border: `1px solid ${typeColor}`,
        color: '#f5f3f0',
      }}
    />
  );
});

/**
 * Display name and type
 */
const NameDisplay = memo(function NameDisplay({ 
  label, 
  typeLabel, 
  typeColor 
}) {
  return (
    <>
      <div
        className="text-sm font-semibold truncate text-[#f5f3f0]"
        title={label}
      >
        {label}
      </div>
      <div
        className="text-[10px] uppercase tracking-wide font-medium"
        style={{ color: typeColor }}
      >
        {typeLabel}
      </div>
    </>
  );
});

/**
 * Edit toggle button
 */
const EditButton = memo(function EditButton({ 
  isEditing, 
  onClick, 
  typeColor 
}) {
  return (
    <Motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="p-1.5 border-none rounded-md cursor-pointer"
      style={{
        background: isEditing ? `${typeColor}30` : 'rgba(255,255,255,0.1)',
        color: isEditing ? typeColor : '#9a9590',
      }}
    >
      {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
    </Motion.button>
  );
});

/**
 * Role/Status badges
 */
const RoleBadges = memo(function RoleBadges({ role, status, typeColor }) {
  if (!role && !status) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {role && (
        <span
          className="px-2 py-0.5 text-[10px] font-medium rounded"
          style={{
            background: `${typeColor}20`,
            border: `1px solid ${typeColor}40`,
            color: typeColor,
          }}
        >
          {role}
        </span>
      )}
      {status && (
        <span
          className="px-2 py-0.5 text-[10px] font-medium rounded"
          style={{
            background: '#22c55e20',
            border: '1px solid #22c55e40',
            color: '#22c55e',
          }}
        >
          {status}
        </span>
      )}
    </div>
  );
});

/**
 * Editable notes textarea
 */
const EditableNotes = memo(function EditableNotes({ 
  value, 
  onChange, 
  typeColor 
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add notes..."
      className="w-full min-h-[60px] p-2 text-xs bg-black/30 rounded-lg resize-none outline-none"
      style={{
        border: `1px solid ${typeColor}40`,
        color: '#c4bfb8',
        fontFamily: 'inherit',
      }}
    />
  );
});

/**
 * Display notes
 */
const NotesDisplay = memo(function NotesDisplay({ notes }) {
  if (!notes) return null;

  return (
    <div className="text-xs leading-relaxed text-[#c4bfb8] max-h-20 overflow-hidden">
      {notes}
    </div>
  );
});

/**
 * Connection count indicator
 */
const ConnectionCount = memo(function ConnectionCount({ count }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5 pt-3 mt-3 text-[11px] text-[#9a9590] border-t border-white/10">
      <Link2 size={12} />
      {count} connection{count !== 1 ? 's' : ''}
    </div>
  );
});

/**
 * Connection handles
 */
const ConnectionHandles = memo(function ConnectionHandles({ color }) {
  const handleStyle = { border: '2px solid #1a1d24' };

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

const EntityNode = memo(function EntityNode({ data, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.label || '');
  const [editNotes, setEditNotes] = useState(data.notes || '');
  const [localData, setLocalData] = useState(data);
  
  const entityType = ENTITY_TYPES[data.entityType] || ENTITY_TYPES.person;
  const connectionCount = (data.connections || []).length;

  const handleSave = useCallback(() => {
    setLocalData(prev => ({ ...prev, label: editName, notes: editNotes }));
    setIsEditing(false);
    // In real implementation, would call onUpdate callback
  }, [editName, editNotes]);

  const toggleEdit = useCallback(() => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  }, [isEditing, handleSave]);
  
  return (
    <Motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full overflow-hidden rounded-2xl"
      style={{
        background: selected 
          ? `linear-gradient(135deg, ${entityType.color}15 0%, #1a1d24 100%)`
          : '#1a1d24',
        border: `2px solid ${selected ? entityType.color : entityType.color + '60'}`,
        boxShadow: selected 
          ? `0 0 25px ${entityType.color}40`
          : '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header with Icon */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{
          borderBottom: `1px solid ${entityType.color}30`,
          background: entityType.color + '10',
        }}
      >
        <EntityIcon type={entityType} />
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <EditableName
              value={editName}
              onChange={setEditName}
              onSave={handleSave}
              typeColor={entityType.color}
            />
          ) : (
            <NameDisplay
              label={localData.label}
              typeLabel={entityType.label}
              typeColor={entityType.color}
            />
          )}
        </div>
        
        <EditButton
          isEditing={isEditing}
          onClick={toggleEdit}
          typeColor={entityType.color}
        />
      </div>
      
      {/* Content */}
      <div className="px-4 py-3">
        <RoleBadges 
          role={data.role} 
          status={data.status} 
          typeColor={entityType.color} 
        />
        
        {isEditing ? (
          <EditableNotes
            value={editNotes}
            onChange={setEditNotes}
            typeColor={entityType.color}
          />
        ) : (
          <NotesDisplay notes={localData.notes} />
        )}
        
        <ConnectionCount count={connectionCount} />
      </div>
      
      <ConnectionHandles color={entityType.color} />
    </Motion.div>
  );
});

EntityNode.displayName = 'EntityNode';

export default EntityNode;
