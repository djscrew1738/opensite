import { useRef, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { FileText, Trash2, Loader2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { colors } from '../../styles/tokens';
import { useRelativeTime, formatWordCount, truncateFilename } from '../../hooks/useDocuments';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/**
 * Status configuration mapping for document states
 * @type {Object.<string, {label: string, color: string, bg: string, border: string, icon: import('lucide-react').LucideIcon, animate: boolean}>}
 */
const STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    color: colors.warning.DEFAULT,
    bg: colors.warning.muted,
    border: colors.warning.border,
    icon: Loader2,
    animate: true,
  },
  ready: {
    label: 'Ready',
    color: colors.success.DEFAULT,
    bg: colors.success.muted,
    border: colors.success.border,
    icon: CheckCircle2,
    animate: false,
  },
  error: {
    label: 'Error',
    color: colors.danger.DEFAULT,
    bg: colors.danger.muted,
    border: colors.danger.border,
    icon: AlertCircle,
    animate: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Status badge showing document processing state
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Document status ('processing', 'ready', 'error')
 * @returns {JSX.Element} Status badge component
 */
const StatusBadge = memo(function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.processing;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium leading-none border"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderColor: config.border,
      }}
      aria-label={`Status: ${config.label}`}
    >
      <Icon 
        className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} 
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
});

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['processing', 'ready', 'error']).isRequired,
};

StatusBadge.displayName = 'StatusBadge';

/**
 * Skeleton loading row for loading state
 * 
 * @param {Object} props - Component props
 * @param {number} [props.delay] - Animation delay in milliseconds
 * @returns {JSX.Element} Skeleton row component
 */
const SkeletonRow = memo(function SkeletonRow({ delay = 0 }) {
  return (
    <div 
      className="flex items-center gap-3 px-3 py-3 border-b"
      style={{ 
        borderColor: colors.border.default,
        animationDelay: `${delay}ms` 
      }}
      aria-hidden="true"
    >
      {/* Icon placeholder */}
      <div 
        className="w-8 h-8 rounded-lg flex-shrink-0 animate-pulse" 
        style={{ backgroundColor: colors.surface.elevated }} 
      />
      {/* Text placeholders */}
      <div className="flex-1 space-y-2">
        <div 
          className="h-3.5 rounded animate-pulse w-3/4" 
          style={{ backgroundColor: colors.surface.elevated }} 
        />
        <div 
          className="h-2.5 rounded animate-pulse w-1/2" 
          style={{ backgroundColor: colors.surface.elevated }} 
        />
      </div>
      {/* Badge placeholder */}
      <div 
        className="w-14 h-5 rounded animate-pulse flex-shrink-0" 
        style={{ backgroundColor: colors.surface.elevated }} 
      />
    </div>
  );
});

SkeletonRow.propTypes = {
  delay: PropTypes.number,
};

SkeletonRow.defaultProps = {
  delay: 0,
};

SkeletonRow.displayName = 'SkeletonRow';

/**
 * Individual document row in sidebar
 * 
 * @param {Object} props - Component props
 * @param {Object} props.doc - Document data
 * @param {string} props.doc.id - Unique document identifier
 * @param {string} props.doc.original_name - Original file name
 * @param {string} props.doc.status - Document status
 * @param {number} [props.doc.word_count] - Word count
 * @param {string} [props.doc.created_at] - Creation timestamp
 * @param {boolean} props.isSelected - Whether this document is selected
 * @param {Function} props.onSelect - Callback when document is selected
 * @param {Function} props.onDelete - Callback when delete is requested
 * @returns {JSX.Element} Document row component
 */
const DocRow = memo(function DocRow({ doc, isSelected, onSelect, onDelete }) {
  const timeAgo = useRelativeTime(doc.created_at);
  const wordCount = formatWordCount(doc.word_count);

  /**
   * Handles row click/selection
   */
  const handleSelect = useCallback(() => {
    onSelect(doc.id);
  }, [onSelect, doc.id]);

  /**
   * Handles delete button click
   * @param {React.MouseEvent} e - Click event
   */
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(doc.id);
  }, [onDelete, doc.id]);

  /**
   * Handles keyboard interaction
   * @param {React.KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(doc.id);
    }
  }, [onSelect, doc.id]);

  // Row styles based on selection state
  const rowStyle = isSelected
    ? {
        backgroundColor: colors.accent.muted,
        borderLeftColor: colors.accent.DEFAULT,
      }
    : {
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
      };

  // Icon container styles
  const iconContainerStyle = isSelected
    ? { backgroundColor: colors.accent.muted }
    : { backgroundColor: colors.surface.elevated };

  // Icon color
  const iconColor = isSelected ? colors.accent.DEFAULT : colors.text.muted;

  return (
    <div
      data-doc-id={doc.id}
      onClick={handleSelect}
      className="group flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-l-[3px]"
      style={{
        borderColor: colors.border.default,
        ...rowStyle,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-selected={isSelected}
      aria-label={`${doc.original_name}, ${doc.status}`}
    >
      {/* File icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={iconContainerStyle}
      >
        <FileText className="w-4 h-4" style={{ color: iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <span
          className="text-sm font-medium truncate block"
          style={{ color: colors.text.primary }}
          title={doc.original_name}
        >
          {truncateFilename(doc.original_name)}
        </span>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={doc.status} />
          {wordCount && (
            <span 
              className="text-[11px] font-mono"
              style={{ color: colors.text.muted }}
            >
              {wordCount}
            </span>
          )}
        </div>

        {/* Time */}
        {timeAgo && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" style={{ color: colors.text.disabled }} />
            <span 
              className="text-[11px]"
              style={{ color: colors.text.disabled }}
            >
              {timeAgo}
            </span>
          </div>
        )}
      </div>

      {/* Delete button — visible on hover */}
      <button
        onClick={handleDelete}
        className="flex-shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 focus:outline-none"
        style={{ 
          color: colors.text.muted,
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.danger.DEFAULT;
          e.currentTarget.style.backgroundColor = colors.danger.muted;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.text.muted;
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onFocus={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.danger.muted}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
        title="Delete document"
        aria-label={`Delete ${doc.original_name}`}
        type="button"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
});

DocRow.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.string.isRequired,
    original_name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['processing', 'ready', 'error']).isRequired,
    word_count: PropTypes.number,
    created_at: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

DocRow.displayName = 'DocRow';

/**
 * Empty state when no documents exist
 * @returns {JSX.Element} Empty state component
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: colors.surface.elevated }}
      >
        <FileText className="w-6 h-6" style={{ color: colors.text.disabled }} />
      </div>
      <p 
        className="text-sm font-medium"
        style={{ color: colors.text.secondary }}
      >
        No documents uploaded yet
      </p>
      <p 
        className="text-xs mt-1"
        style={{ color: colors.text.muted }}
      >
        Upload a document to get started
      </p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Sidebar header with document count
 * 
 * @param {Object} props - Component props
 * @param {number} props.count - Number of documents
 * @returns {JSX.Element} Sidebar header component
 */
const SidebarHeader = memo(function SidebarHeader({ count }) {
  return (
    <div 
      className="px-3 py-2.5 flex items-center justify-between border-b"
      style={{ borderColor: colors.border.default }}
    >
      <span 
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: colors.text.muted }}
      >
        Documents
      </span>
      {count > 0 && (
        <span 
          className="text-[11px] font-medium px-1.5 py-0.5 rounded font-mono"
          style={{ 
            backgroundColor: colors.surface.elevated,
            color: colors.text.secondary 
          }}
          aria-label={`${count} documents`}
        >
          {count}
        </span>
      )}
    </div>
  );
});

SidebarHeader.propTypes = {
  count: PropTypes.number.isRequired,
};

SidebarHeader.displayName = 'SidebarHeader';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DocSidebar — Sidebar listing uploaded text documents.
 * Dark Forge design system with design tokens.
 * 
 * @param {Object} props - Component props
 * @param {Array} [props.documents] - Array of document objects
 * @param {string} [props.selectedId] - ID of currently selected document
 * @param {Function} props.onSelect - Callback when a document is selected
 * @param {Function} props.onDelete - Callback when a document is deleted
 * @param {boolean} [props.isLoading] - Whether documents are loading
 * @returns {JSX.Element} Document sidebar component
 */
function DocSidebar({
  documents = [],
  selectedId,
  onSelect,
  onDelete,
  isLoading = false,
}) {
  const scrollContainerRef = useRef(null);

  // Auto-scroll selected document into view when selection changes
  useEffect(() => {
    if (!selectedId || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector(`[data-doc-id="${selectedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  /**
   * Handles document selection
   * @param {string} id - Document ID to select
   */
  const handleSelect = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);

  /**
   * Handles document deletion
   * @param {string} id - Document ID to delete
   */
  const handleDelete = useCallback((id) => {
    onDelete(id);
  }, [onDelete]);

  // Container styles
  const containerStyle = {
    backgroundColor: colors.surface.card,
    borderColor: colors.border.default,
  };

  // Loading state — 3 skeleton rows
  if (isLoading) {
    return (
      <div 
        className="rounded-xl overflow-hidden border"
        style={containerStyle}
        role="region"
        aria-label="Documents sidebar"
        aria-busy="true"
      >
        <SidebarHeader count={0} />
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} delay={i * 50} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!documents || documents.length === 0) {
    return (
      <div 
        className="rounded-xl overflow-hidden border"
        style={containerStyle}
        role="region"
        aria-label="Documents sidebar"
      >
        <SidebarHeader count={0} />
        <EmptyState />
      </div>
    );
  }

  // Document list
  return (
    <div 
      className="rounded-xl overflow-hidden border"
      style={containerStyle}
      role="region"
      aria-label="Documents sidebar"
    >
      <SidebarHeader count={documents.length} />

      {/* Scrollable list */}
      <div 
        ref={scrollContainerRef} 
        className="max-h-[calc(100vh-300px)] overflow-y-auto"
        role="listbox"
        aria-label="Documents"
      >
        {documents.map((doc) => (
          <DocRow
            key={doc.id}
            doc={doc}
            isSelected={doc.id === selectedId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

DocSidebar.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.object),
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

DocSidebar.defaultProps = {
  documents: [],
  selectedId: null,
  isLoading: false,
};

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

export default memo(DocSidebar);
