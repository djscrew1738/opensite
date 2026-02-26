import { motion } from 'framer-motion';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { FILE_TYPES, formatFileSize, formatDate } from './docHelpers';

export default function DocumentCard({ project, isSelected, onSelect, onClick, onDelete }) {
  const fileType = FILE_TYPES[project.fileType?.toLowerCase()] || FILE_TYPES.pdf;
  const Icon = fileType.icon;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group relative p-4 rounded-xl cursor-pointer"
      style={{
        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#111318',
        border: `1px solid ${isSelected ? '#3B82F6' : '#1F2430'}`,
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#2D3548';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#1F2430';
      }}
    >
      {/* Selection checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center transition-colors"
        style={{
          background: isSelected ? '#3B82F6' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${isSelected ? '#3B82F6' : '#2D3548'}`,
        }}
      >
        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      {/* File icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto"
        style={{ background: fileType.bg }}
      >
        <Icon className="w-6 h-6" style={{ color: fileType.color }} />
      </div>

      {/* File name */}
      <p
        className="font-medium text-sm truncate text-center"
        style={{ color: '#F1F5F9' }}
      >
        {project.name || 'Untitled'}
      </p>

      {/* Meta info */}
      <p className="text-xs text-center mt-1" style={{ color: '#64748B' }}>
        {formatFileSize(project.size)} · {formatDate(project.createdAt)}
      </p>

      {/* Actions */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#EF4444' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
