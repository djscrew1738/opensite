import { useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { colors } from '../../styles/tokens';
import { FILE_TYPES, formatFileSize, formatDate } from './docHelpers';

// ═══════════════════════════════════════════════════════════════
// Component: DocumentListItem
// ═══════════════════════════════════════════════════════════════

/**
 * A list item component displaying document information with selection and delete actions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.project - Document project data
 * @param {string} props.project.id - Unique document identifier
 * @param {string} [props.project.name] - Document name
 * @param {string} [props.project.fileType] - File extension/type
 * @param {number} [props.project.size] - File size in bytes
 * @param {string} [props.project.createdAt] - Creation timestamp
 * @param {boolean} props.isSelected - Whether the document is selected
 * @param {Function} props.onSelect - Callback when selection state changes
 * @param {Function} props.onClick - Callback when item is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @returns {JSX.Element} Document list item component
 */
function DocumentListItem({ project, isSelected, onSelect, onClick, onDelete }) {
  const fileType = FILE_TYPES[project.fileType?.toLowerCase()] || FILE_TYPES.pdf;
  const Icon = fileType.icon;

  /**
   * Handles selection click, preventing event propagation
   * @param {React.MouseEvent} e - Click event
   */
  const handleSelectClick = useCallback((e) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  /**
   * Handles delete click, preventing event propagation
   * @param {React.MouseEvent} e - Click event
   */
  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  // Item style based on selection state
  const itemStyle = isSelected 
    ? { 
        backgroundColor: colors.accent.muted, 
        borderColor: colors.accent.DEFAULT 
      }
    : { 
        backgroundColor: 'transparent', 
        borderColor: 'transparent' 
      };

  // Checkbox style based on selection state
  const checkboxStyle = {
    backgroundColor: isSelected ? colors.accent.DEFAULT : 'rgba(255, 255, 255, 0.1)',
    borderColor: isSelected ? colors.accent.DEFAULT : colors.border.strong,
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={!isSelected ? { backgroundColor: colors.surface.card } : undefined}
      transition={{ duration: 0.1 }}
      className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer border"
      style={itemStyle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Document: ${project.name || 'Untitled'}`}
    >
      {/* ═══════════════════════════════════════════════════════════════
          Selection Checkbox
      ═══════════════════════════════════════════════════════════════ */}
      <button
        onClick={handleSelectClick}
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors border"
        style={checkboxStyle}
        aria-label={isSelected ? 'Deselect document' : 'Select document'}
        aria-pressed={isSelected}
        type="button"
      >
        {isSelected && <CheckCircle2 className="w-3 h-3" style={{ color: colors.text.primary }} />}
      </button>

      {/* ═══════════════════════════════════════════════════════════════
          File Icon
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: fileType.bg }}
      >
        <Icon className="w-5 h-5" style={{ color: fileType.color }} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Document Info
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0">
        <p 
          className="font-medium truncate"
          style={{ color: colors.text.primary }}
          title={project.name || 'Untitled'}
        >
          {project.name || 'Untitled'}
        </p>
        <p style={{ color: colors.text.muted }} className="text-xs">
          {fileType.label} · {formatFileSize(project.size)}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Date
      ═══════════════════════════════════════════════════════════════ */}
      <p 
        className="text-sm hidden sm:block"
        style={{ color: colors.text.muted }}
      >
        {formatDate(project.createdAt)}
      </p>

      {/* ═══════════════════════════════════════════════════════════════
          Delete Action
      ═══════════════════════════════════════════════════════════════ */}
      <button
        onClick={handleDeleteClick}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        style={{ 
          color: colors.danger.DEFAULT,
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.danger.muted;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label={`Delete ${project.name || 'document'}`}
        title="Delete document"
        type="button"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

DocumentListItem.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    fileType: PropTypes.string,
    size: PropTypes.number,
    createdAt: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

export default memo(DocumentListItem);
