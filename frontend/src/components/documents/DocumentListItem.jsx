import { motion } from 'framer-motion';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { FILE_TYPES, formatFileSize, formatDate } from './docHelpers';

export default function DocumentListItem({ project, isSelected, onSelect, onClick, onDelete }) {
  const fileType = FILE_TYPES[project.fileType?.toLowerCase()] || FILE_TYPES.pdf;
  const Icon = fileType.icon;

  return (
    <motion.div
      onClick={onClick}
      whileHover={!isSelected ? { backgroundColor: '#111318' } : undefined}
      transition={{ duration: 0.1 }}
      className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer"
      style={{
        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: `1px solid ${isSelected ? '#3B82F6' : 'transparent'}`,
      }}
    >
      {/* Selection */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors"
        style={{
          background: isSelected ? '#3B82F6' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${isSelected ? '#3B82F6' : '#2D3548'}`,
        }}
      >
        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: fileType.bg }}
      >
        <Icon className="w-5 h-5" style={{ color: fileType.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" style={{ color: '#F1F5F9' }}>
          {project.name || 'Untitled'}
        </p>
        <p className="text-xs" style={{ color: '#64748B' }}>
          {fileType.label} · {formatFileSize(project.size)}
        </p>
      </div>

      {/* Date */}
      <p className="text-sm hidden sm:block" style={{ color: '#64748B' }}>
        {formatDate(project.createdAt)}
      </p>

      {/* Actions */}
      <button
        onClick={onDelete}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#EF4444' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
