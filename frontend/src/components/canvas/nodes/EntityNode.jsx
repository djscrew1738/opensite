import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion as Motion } from 'framer-motion';
import { User, Building2, Scale, X, Edit2, Check, Link2 } from 'lucide-react';
import { ENTITY_TYPES } from '../canvasStore';

const EntityNode = memo(({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.label || '');
  const [editNotes, setEditNotes] = useState(data.notes || '');
  const [localData, setLocalData] = useState(data);
  
  const entityType = ENTITY_TYPES[data.entityType] || ENTITY_TYPES.person;
  
  const handleSave = () => {
    setLocalData(prev => ({ ...prev, label: editName, notes: editNotes }));
    setIsEditing(false);
    // In real implementation, would call onUpdate callback
  };
  
  const connectionCount = (data.connections || []).length;
  
  return (
    <Motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        width: '100%',
        height: '100%',
        background: selected 
          ? `linear-gradient(135deg, ${entityType.color}15 0%, #1a1d24 100%)`
          : '#1a1d24',
        border: `2px solid ${selected ? entityType.color : entityType.color + '60'}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: selected 
          ? `0 0 25px ${entityType.color}40`
          : '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header with Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderBottom: `1px solid ${entityType.color}30`,
          background: entityType.color + '10',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${entityType.color} 0%, ${entityType.color}80 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {entityType.icon}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${entityType.color}`,
                borderRadius: 6,
                padding: '4px 8px',
                color: '#f5f3f0',
                fontSize: 14,
                fontWeight: 600,
                width: '100%',
                outline: 'none',
              }}
            />
          ) : (
            <>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#f5f3f0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={localData.label}
              >
                {localData.label}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: entityType.color,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500,
                }}
              >
                {entityType.label}
              </div>
            </>
          )}
        </div>
        
        {/* Edit Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          style={{
            padding: 6,
            background: isEditing ? `${entityType.color}30` : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 6,
            color: isEditing ? entityType.color : '#9a9590',
            cursor: 'pointer',
          }}
        >
          {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
        </motion.button>
      </div>
      
      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
        {/* Role/Status */}
        {(data.role || data.status) && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}
          >
            {data.role && (
              <span
                style={{
                  padding: '3px 8px',
                  background: entityType.color + '20',
                  border: `1px solid ${entityType.color}40`,
                  borderRadius: 4,
                  fontSize: 10,
                  color: entityType.color,
                  fontWeight: 500,
                }}
              >
                {data.role}
              </span>
            )}
            {data.status && (
              <span
                style={{
                  padding: '3px 8px',
                  background: '#22c55e20',
                  border: '1px solid #22c55e40',
                  borderRadius: 4,
                  fontSize: 10,
                  color: '#22c55e',
                  fontWeight: 500,
                }}
              >
                {data.status}
              </span>
            )}
          </div>
        )}
        
        {/* Notes */}
        {isEditing ? (
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Add notes..."
            style={{
              width: '100%',
              minHeight: 60,
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${entityType.color}40`,
              borderRadius: 8,
              padding: 8,
              color: '#c4bfb8',
              fontSize: 12,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        ) : localData.notes ? (
          <div
            style={{
              fontSize: 12,
              color: '#c4bfb8',
              lineHeight: 1.5,
              maxHeight: 80,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {localData.notes}
          </div>
        ) : null}
        
        {/* Connection Count */}
        {connectionCount > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: '#9a9590',
            }}
          >
            <Link2 size={12} />
            {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: entityType.color, border: '2px solid #1a1d24' }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10, background: entityType.color, border: '2px solid #1a1d24' }} />
      <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, background: '#6b7280', border: '2px solid #1a1d24' }} />
      <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, background: '#6b7280', border: '2px solid #1a1d24' }} />
    </Motion.div>
  );
});

EntityNode.displayName = 'EntityNode';

export default EntityNode;
