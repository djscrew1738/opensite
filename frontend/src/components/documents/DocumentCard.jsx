import { useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { colors } from '../../styles/tokens';
import { FILE_TYPES, formatFileSize, formatDate } from './docHelpers';

// ═══════════════════════════════════════════════════════════════
// Component: DocumentCard
// ═══════════════════════════════════════════════════════════════

/**
 * A card component displaying document information with selection and delete actions
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
 * @param {Function} props.onClick - Callback when card is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @returns {JSX.Element} Document card component
 */
function DocumentCard({ project, isSelected, onSelect, onClick, onDelete }) {
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

  // Card style based on selection state
  const cardStyle = {
    backgroundColor: isSelected ? colors.accent.muted : colors.surface.card,
    borderColor: isSelected ? colors.accent.DEFAULT : colors.border.default,
  };

  // Checkbox style based on selection state
  const checkboxStyle = {
    backgroundColor: isSelected ? colors.accent.DEFAULT : 'rgba(255, 255, 255, 0.1)',
    borderColor: isSelected ? colors.accent.DEFAULT : colors.border.strong,
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group relative p-4 rounded-xl cursor-pointer transition-colors border"
      style={cardStyle}
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
        className="absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center transition-colors border"
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
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto"
        style={{ backgroundColor: fileType.bg }}
      >
        <Icon className="w-6 h-6" style={{ color: fileType.color }} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          File Name
      ═══════════════════════════════════════════════════════════════ */}
      <p 
        className="font-medium text-sm truncate text-center"
        style={{ color: colors.text.primary }}
        title={project.name || 'Untitled'}
      >
        {project.name || 'Untitled'}
      </p>

      {/* ═══════════════════════════════════════════════════════════════
          Meta Info
      ═══════════════════════════════════════════════════════════════ */}
      <p 
        className="text-xs text-center mt-1"
        style={{ color: colors.text.muted }}
      >
        {formatFileSize(project.size)} · {formatDate(project.createdAt)}
      </p>

      {/* ═══════════════════════════════════════════════════════════════
          Delete Action
      ═══════════════════════════════════════════════════════════════ */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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

DocumentCard.propTypes = {
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

export default memo(DocumentCard);
