/**
 * EntityNode Component
 * Canvas node for displaying entities like contacts, companies, and properties
 * 
 * @module components/canvas/nodes/EntityNode
 */

import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion } from 'framer-motion';
import { Edit2, Check, Link2 } from 'lucide-react';
import { ENTITY_TYPES, useCanvasStore } from '../canvasStore';
import { colors, shadows } from '../../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Entity icon in header
 * @param {{type: {color: string, icon: string}}} props
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

EntityIcon.displayName = 'EntityIcon';

/**
 * Editable name input
 * @param {{value: string, onChange: (value: string) => void, onSave: () => void, typeColor: string}} props
 */
const EditableName = memo(function EditableName({ 
  value, 
  onChange, 
  onSave, 
  typeColor 
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      // Cancel edit - parent should handle this
      onSave();
    }
  }, [onSave]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onSave}
      autoFocus
      className="w-full px-2 py-1 text-sm font-semibold rounded-md outline-none"
      style={{
        backgroundColor: `${colors.surface.primary}4D`, // 30% opacity
        border: `1px solid ${typeColor}`,
        color: colors.text.primary,
      }}
    />
  );
});

EditableName.displayName = 'EditableName';

/**
 * Display name and type
 * @param {{label: string, typeLabel: string, typeColor: string}} props
 */
const NameDisplay = memo(function NameDisplay({ 
  label, 
  typeLabel, 
  typeColor 
}) {
  return (
    <>
      <div
        className="text-sm font-semibold truncate"
        style={{ color: colors.text.primary }}
        title={label}
      >
        {label}
      </div>
      <div
        className="text-xs uppercase tracking-wide font-medium"
        style={{ color: typeColor }}
      >
        {typeLabel}
      </div>
    </>
  );
});

NameDisplay.displayName = 'NameDisplay';

/**
 * Edit toggle button
 * @param {{isEditing: boolean, onClick: () => void, typeColor: string}} props
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
      className="p-1.5 border-none rounded-md cursor-pointer transition-colors"
      style={{
        backgroundColor: isEditing ? `${typeColor}30` : colors.surface.elevated,
        color: isEditing ? typeColor : colors.text.muted,
      }}
      aria-label={isEditing ? 'Save changes' : 'Edit entity'}
    >
      {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
    </Motion.button>
  );
});

EditButton.displayName = 'EditButton';

/**
 * Role/Status badges
 * @param {{role?: string, status?: string, typeColor: string}} props
 */
const RoleBadges = memo(function RoleBadges({ role, status, typeColor }) {
  if (!role && !status) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {role && (
        <span
          className="px-2 py-0.5 text-xs font-medium rounded"
          style={{
            backgroundColor: `${typeColor}20`,
            border: `1px solid ${typeColor}40`,
            color: typeColor,
          }}
        >
          {role}
        </span>
      )}
      {status && (
        <span
          className="px-2 py-0.5 text-xs font-medium rounded"
          style={{
            backgroundColor: colors.success.muted,
            border: `1px solid ${colors.success.border}`,
            color: colors.success.DEFAULT,
          }}
        >
          {status}
        </span>
      )}
    </div>
  );
});

RoleBadges.displayName = 'RoleBadges';

/**
 * Editable notes textarea
 * @param {{value: string, onChange: (value: string) => void, typeColor: string}} props
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
      className="w-full min-h-[60px] p-2 text-xs rounded-lg resize-none outline-none"
      style={{
        backgroundColor: `${colors.surface.primary}4D`, // 30% opacity
        border: `1px solid ${typeColor}40`,
        color: colors.text.secondary,
        fontFamily: 'inherit',
      }}
    />
  );
});

EditableNotes.displayName = 'EditableNotes';

/**
 * Display notes
 * @param {{notes?: string}} props
 */
const NotesDisplay = memo(function NotesDisplay({ notes }) {
  if (!notes) return null;

  return (
    <div 
      className="text-xs leading-relaxed max-h-20 overflow-hidden"
      style={{ color: colors.text.secondary }}
    >
      {notes}
    </div>
  );
});

NotesDisplay.displayName = 'NotesDisplay';

/**
 * Connection count indicator
 * @param {{count: number}} props
 */
const ConnectionCount = memo(function ConnectionCount({ count }) {
  if (count === 0) return null;

  return (
    <div 
      className="flex items-center gap-1.5 pt-3 mt-3 text-[11px] border-t"
      style={{ 
        color: colors.text.muted,
        borderColor: colors.border.default,
      }}
    >
      <Link2 size={12} />
      {count} connection{count !== 1 ? 's' : ''}
    </div>
  );
});

ConnectionCount.displayName = 'ConnectionCount';

/**
 * Connection handles
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
 * EntityNode - Canvas node for entities (contacts, companies, properties)
 * @param {{id: string, data: {entityType?: string, label?: string, notes?: string, role?: string, status?: string, connections?: Array<any>}, selected: boolean}} props
 */
const EntityNode = memo(function EntityNode({ id, data, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.label || '');
  const [editNotes, setEditNotes] = useState(data.notes || '');
  const [localData, setLocalData] = useState(data);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  
  const entityType = ENTITY_TYPES[data.entityType] || ENTITY_TYPES.person;
  const connectionCount = (data.connections || []).length;

  const handleSave = useCallback(() => {
    const updatedData = { ...localData, label: editName, notes: editNotes };
    setLocalData(updatedData);
    setIsEditing(false);
    updateNodeData(id, { label: editName, notes: editNotes });
  }, [id, editName, editNotes, localData, updateNodeData]);

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
        backgroundColor: selected 
          ? `${entityType.color}15`
          : colors.surface.elevated,
        backgroundImage: selected 
          ? `linear-gradient(135deg, ${entityType.color}15 0%, ${colors.surface.elevated} 100%)`
          : 'none',
        border: `2px solid ${selected ? entityType.color : entityType.color + '60'}`,
        boxShadow: selected 
          ? `0 0 25px ${entityType.color}40`
          : shadows.card,
      }}
    >
      {/* Header with Icon */}
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={{
          borderBottom: `1px solid ${entityType.color}30`,
          backgroundColor: `${entityType.color}10`,
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
