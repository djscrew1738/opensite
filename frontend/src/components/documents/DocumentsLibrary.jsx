import { useState, useRef, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, Upload, Search, Grid3X3, List, Trash2, X } from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';
import { NoDocumentsEmpty } from '../empty-states';
import { VIEW_MODES } from './docHelpers';
import DocumentCard from './DocumentCard';
import DocumentListItem from './DocumentListItem';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Centered loading spinner
 * @returns {JSX.Element} Loading spinner component
 */
const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-label="Loading documents">
      <Loader2 
        className="w-8 h-8 animate-spin" 
        style={{ color: colors.accent.DEFAULT }} 
        aria-hidden="true"
      />
      <span className="sr-only">Loading documents...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Search input with icon
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Callback when search value changes
 * @returns {JSX.Element} Search input component
 */
const SearchInput = memo(function SearchInput({ value, onChange }) {
  /**
   * Handles input change
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   */
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
        style={{ color: colors.text.muted }}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder="Search documents..."
        value={value}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
        style={{
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
          color: colors.text.primary,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.accent.DEFAULT;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border.default;
        }}
        aria-label="Search documents"
      />
    </div>
  );
});

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

SearchInput.displayName = 'SearchInput';

/**
 * Sort dropdown for document ordering
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current sort value
 * @param {Function} props.onChange - Callback when sort changes
 * @returns {JSX.Element} Sort dropdown component
 */
const SortDropdown = memo(function SortDropdown({ value, onChange }) {
  /**
   * Handles sort change
   * @param {React.ChangeEvent<HTMLSelectElement>} e - Change event
   */
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <select
      value={value}
      onChange={handleChange}
      className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
      style={{
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.border.default}`,
        color: colors.text.secondary,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = colors.accent.DEFAULT;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
      }}
      aria-label="Sort documents by"
    >
      <option value="date">Sort by Date</option>
      <option value="name">Sort by Name</option>
      <option value="size">Sort by Size</option>
    </select>
  );
});

SortDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

SortDropdown.displayName = 'SortDropdown';

/**
 * View mode toggle (grid/list)
 * 
 * @param {Object} props - Component props
 * @param {string} props.viewMode - Current view mode
 * @param {Function} props.onChange - Callback when view mode changes
 * @returns {JSX.Element} View mode toggle component
 */
const ViewModeToggle = memo(function ViewModeToggle({ viewMode, onChange }) {
  /**
   * Handles view mode change
   * @param {string} mode - View mode to set
   */
  const handleChange = useCallback((mode) => {
    onChange(mode);
  }, [onChange]);

  const isGrid = viewMode === VIEW_MODES.GRID;
  const isList = viewMode === VIEW_MODES.LIST;

  // Button styles
  const getButtonStyle = (active) => ({
    backgroundColor: active ? colors.surface.elevated : colors.surface.card,
    color: active ? colors.text.primary : colors.text.muted,
  });

  return (
    <div 
      className="flex items-center rounded-lg overflow-hidden border"
      style={{ borderColor: colors.border.default }}
      role="group"
      aria-label="View mode"
    >
      <button
        onClick={() => handleChange(VIEW_MODES.GRID)}
        className="p-2 transition-colors"
        style={getButtonStyle(isGrid)}
        onMouseEnter={(e) => {
          if (!isGrid) {
            e.currentTarget.style.color = colors.text.secondary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isGrid) {
            e.currentTarget.style.color = colors.text.muted;
          }
        }}
        aria-label="Grid view"
        aria-pressed={isGrid}
        type="button"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleChange(VIEW_MODES.LIST)}
        className="p-2 transition-colors"
        style={getButtonStyle(isList)}
        onMouseEnter={(e) => {
          if (!isList) {
            e.currentTarget.style.color = colors.text.secondary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isList) {
            e.currentTarget.style.color = colors.text.muted;
          }
        }}
        aria-label="List view"
        aria-pressed={isList}
        type="button"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
});

ViewModeToggle.propTypes = {
  viewMode: PropTypes.oneOf([VIEW_MODES.GRID, VIEW_MODES.LIST]).isRequired,
  onChange: PropTypes.func.isRequired,
};

ViewModeToggle.displayName = 'ViewModeToggle';

/**
 * Upload button
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Callback when button is clicked
 * @returns {JSX.Element} Upload button component
 */
const UploadButton = memo(function UploadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
      style={{
        backgroundColor: colors.accent.DEFAULT,
        color: colors.text.primary,
        boxShadow: shadows.glowBlue,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.accent.hover;
        e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.accent.DEFAULT;
        e.currentTarget.style.boxShadow = shadows.glowBlue;
      }}
      aria-label="Upload new document"
      type="button"
    >
      <Upload className="w-4 h-4" aria-hidden="true" />
      Upload
    </button>
  );
});

UploadButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

UploadButton.displayName = 'UploadButton';

/**
 * Bulk selection bar with actions
 * 
 * @param {Object} props - Component props
 * @param {number} props.count - Number of selected items
 * @param {Function} props.onClear - Callback to clear selection
 * @param {Function} props.onDelete - Callback to delete selected items
 * @returns {JSX.Element} Bulk selection bar component
 */
const BulkSelectionBar = memo(function BulkSelectionBar({ count, onClear, onDelete }) {
  /**
   * Handles delete action
   */
  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  /**
   * Handles clear action
   */
  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  return (
    <div 
      className="flex items-center justify-between gap-3 px-4 py-2.5 border-b"
      style={{ 
        backgroundColor: colors.accent.muted,
        borderColor: colors.accent.glow 
      }}
      role="status"
      aria-live="polite"
      aria-label={`${count} items selected`}
    >
      <span 
        className="text-sm font-medium"
        style={{ color: colors.accent.light }}
      >
        {count} item{count !== 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
          style={{
            backgroundColor: colors.danger.muted,
            color: colors.danger.light,
            borderColor: colors.danger.border,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.danger.glow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.danger.muted;
          }}
          aria-label={`Delete ${count} selected items`}
          type="button"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          Delete selected
        </button>
        <button
          onClick={handleClear}
          className="p-1.5 rounded-lg transition-colors"
          style={{ 
            color: colors.text.muted,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.text.secondary;
            e.currentTarget.style.backgroundColor = colors.surface.elevated;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.text.muted;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Clear selection"
          aria-label="Clear selection"
          type="button"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

BulkSelectionBar.propTypes = {
  count: PropTypes.number.isRequired,
  onClear: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

BulkSelectionBar.displayName = 'BulkSelectionBar';

/**
 * Drag overlay for file drop zone
 * @returns {JSX.Element} Drag overlay component
 */
const DragOverlay = memo(function DragOverlay() {
  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center m-4 rounded-xl border-2 border-dashed"
      style={{ 
        backgroundColor: colors.accent.muted,
        borderColor: colors.accent.DEFAULT 
      }}
      role="region"
      aria-label="Drop files here to upload"
    >
      <div className="text-center">
        <Upload 
          className="w-12 h-12 mx-auto mb-2" 
          style={{ color: colors.accent.DEFAULT }}
          aria-hidden="true"
        />
        <p 
          className="font-medium"
          style={{ color: colors.text.primary }}
        >
          Drop files to upload
        </p>
      </div>
    </div>
  );
});

DragOverlay.displayName = 'DragOverlay';

/**
 * Virtualized list for documents
 * 
 * @param {Object} props - Component props
 * @param {Array} props.projects - Array of document projects
 * @param {Set} props.selectedItems - Set of selected item IDs
 * @param {Function} props.onToggleSelection - Callback to toggle item selection
 * @param {Function} props.onSelectProject - Callback when a project is selected
 * @param {Function} props.onDelete - Callback when a project is deleted
 * @returns {JSX.Element} Virtualized list component
 */
const VirtualizedList = memo(function VirtualizedList({ 
  projects, 
  selectedItems, 
  onToggleSelection, 
  onSelectProject, 
  onDelete 
}) {
  const listParentRef = useRef(null);
  
  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  /**
   * Creates toggle handler for a project
   * @param {string} id - Project ID
   * @returns {Function} Toggle handler
   */
  const createToggleHandler = useCallback((id) => {
    return () => onToggleSelection(id);
  }, [onToggleSelection]);

  /**
   * Creates select handler for a project
   * @param {Object} project - Project data
   * @returns {Function} Select handler
   */
  const createSelectHandler = useCallback((project) => {
    return () => onSelectProject(project);
  }, [onSelectProject]);

  /**
   * Creates delete handler for a project
   * @param {string} id - Project ID
   * @returns {Function} Delete handler
   */
  const createDeleteHandler = useCallback((id) => {
    return () => onDelete(id);
  }, [onDelete]);

  return (
    <div
      ref={listParentRef}
      className="h-[calc(100vh-260px)] overflow-auto relative"
      role="list"
      aria-label="Documents list"
    >
      <div 
        className="relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const project = projects[virtualRow.index];
          return (
            <div
              key={project.id}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <DocumentListItem
                project={project}
                isSelected={selectedItems.has(project.id)}
                onSelect={createToggleHandler(project.id)}
                onClick={createSelectHandler(project)}
                onDelete={createDeleteHandler(project.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualizedList.propTypes = {
  projects: PropTypes.array.isRequired,
  selectedItems: PropTypes.instanceOf(Set).isRequired,
  onToggleSelection: PropTypes.func.isRequired,
  onSelectProject: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

VirtualizedList.displayName = 'VirtualizedList';

/**
 * Documents grid view
 * 
 * @param {Object} props - Component props
 * @param {Array} props.projects - Array of document projects
 * @param {Set} props.selectedItems - Set of selected item IDs
 * @param {Function} props.onToggleSelection - Callback to toggle item selection
 * @param {Function} props.onSelectProject - Callback when a project is selected
 * @param {Function} props.onDelete - Callback when a project is deleted
 * @returns {JSX.Element} Documents grid component
 */
const DocumentsGrid = memo(function DocumentsGrid({ 
  projects, 
  selectedItems, 
  onToggleSelection, 
  onSelectProject, 
  onDelete 
}) {
  /**
   * Creates toggle handler for a project
   * @param {string} id - Project ID
   * @returns {Function} Toggle handler
   */
  const createToggleHandler = useCallback((id) => {
    return () => onToggleSelection(id);
  }, [onToggleSelection]);

  /**
   * Creates select handler for a project
   * @param {Object} project - Project data
   * @returns {Function} Select handler
   */
  const createSelectHandler = useCallback((project) => {
    return () => onSelectProject(project);
  }, [onSelectProject]);

  /**
   * Creates delete handler for a project
   * @param {string} id - Project ID
   * @returns {Function} Delete handler
   */
  const createDeleteHandler = useCallback((id) => {
    return () => onDelete(id);
  }, [onDelete]);

  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      role="grid"
      aria-label="Documents grid"
    >
      {projects.map((project) => (
        <DocumentCard
          key={project.id}
          project={project}
          isSelected={selectedItems.has(project.id)}
          onSelect={createToggleHandler(project.id)}
          onClick={createSelectHandler(project)}
          onDelete={createDeleteHandler(project.id)}
        />
      ))}
    </div>
  );
});

DocumentsGrid.propTypes = {
  projects: PropTypes.array.isRequired,
  selectedItems: PropTypes.instanceOf(Set).isRequired,
  onToggleSelection: PropTypes.func.isRequired,
  onSelectProject: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

DocumentsGrid.displayName = 'DocumentsGrid';

/**
 * Load more button
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Callback when button is clicked
 * @param {boolean} props.isLoading - Whether more items are loading
 * @returns {JSX.Element} Load more button component
 */
const LoadMoreButton = memo(function LoadMoreButton({ onClick, isLoading }) {
  /**
   * Handles button click
   */
  const handleClick = useCallback(() => {
    if (!isLoading) {
      onClick();
    }
  }, [onClick, isLoading]);

  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
          color: colors.text.primary,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = colors.surface.elevated;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.surface.card;
        }}
        aria-label={isLoading ? 'Loading more documents' : 'Load more documents'}
        aria-busy={isLoading}
        type="button"
      >
        {isLoading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
});

LoadMoreButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

LoadMoreButton.displayName = 'LoadMoreButton';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DocumentsLibrary - Main documents library component with grid/list views,
 * search, sort, selection, and drag-and-drop upload support.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.projects - Array of document projects
 * @param {boolean} props.isLoading - Whether initial documents are loading
 * @param {boolean} props.isFetchingMore - Whether more documents are being fetched
 * @param {boolean} props.hasMore - Whether there are more documents to load
 * @param {Function} props.onLoadMore - Callback to load more documents
 * @param {string} props.viewMode - Current view mode ('grid' or 'list')
 * @param {Function} props.setViewMode - Callback to set view mode
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.setSearchQuery - Callback to set search query
 * @param {string} props.sortBy - Current sort field ('date', 'name', 'size')
 * @param {Function} props.setSortBy - Callback to set sort field
 * @param {Set} props.selectedItems - Set of selected item IDs
 * @param {Function} props.setSelectedItems - Callback to set selected items
 * @param {Function} props.onSelectProject - Callback when a project is selected
 * @param {Function} props.onDelete - Callback when a project is deleted
 * @param {Function} [props.onBulkDelete] - Callback when bulk delete is requested
 * @param {Function} props.onOpenUpload - Callback to open upload dialog
 * @returns {JSX.Element} Documents library component
 */
function DocumentsLibrary({
  projects,
  isLoading,
  isFetchingMore,
  hasMore,
  onLoadMore,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedItems,
  setSelectedItems,
  onSelectProject,
  onDelete,
  onBulkDelete,
  onOpenUpload,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Sort projects based on sortBy
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return 0;
    });
  }, [projects, sortBy]);

  /**
   * Handles drag enter event
   * @param {React.DragEvent} e - Drag event
   */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  /**
   * Handles drag leave event
   * @param {React.DragEvent} e - Drag event
   */
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Handles drag over event
   * @param {React.DragEvent} e - Drag event
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  /**
   * Handles drop event
   * @param {React.DragEvent} e - Drag event
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    onOpenUpload?.();
  }, [onOpenUpload]);

  /**
   * Toggles selection for a document
   * @param {string} id - Document ID
   */
  const toggleSelection = useCallback((id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, [setSelectedItems]);

  /**
   * Clears all selections
   */
  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, [setSelectedItems]);

  /**
   * Handles bulk delete action
   */
  const handleBulkDelete = useCallback(() => {
    onBulkDelete?.(Array.from(selectedItems));
  }, [onBulkDelete, selectedItems]);

  /**
   * Handles delete for a single project
   * @param {string} id - Project ID to delete
   */
  const handleDelete = useCallback((id) => {
    onDelete(id);
  }, [onDelete]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="region"
      aria-label="Documents library"
    >
      {/* Toolbar */}
      <div 
        className="flex flex-wrap items-center justify-between gap-3 p-4 border-b"
        style={{ borderColor: colors.border.default }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="flex items-center gap-2">
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          <UploadButton onClick={onOpenUpload} />
        </div>
      </div>

      {/* Bulk selection bar */}
      {selectedItems.size > 0 && (
        <BulkSelectionBar
          count={selectedItems.size}
          onClear={handleClearSelection}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Drop zone overlay */}
      {isDragging && <DragOverlay />}

      {/* Documents grid/list */}
      <div className="p-4">
        {sortedProjects.length === 0 ? (
          <NoDocumentsEmpty onUpload={onOpenUpload} />
        ) : viewMode === VIEW_MODES.GRID ? (
          <DocumentsGrid
            projects={sortedProjects}
            selectedItems={selectedItems}
            onToggleSelection={toggleSelection}
            onSelectProject={onSelectProject}
            onDelete={handleDelete}
          />
        ) : (
          <VirtualizedList
            projects={sortedProjects}
            selectedItems={selectedItems}
            onToggleSelection={toggleSelection}
            onSelectProject={onSelectProject}
            onDelete={handleDelete}
          />
        )}

        {/* Load more */}
        {hasMore && sortedProjects.length > 0 && (
          <LoadMoreButton 
            onClick={onLoadMore} 
            isLoading={isFetchingMore} 
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

DocumentsLibrary.propTypes = {
  projects: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isFetchingMore: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  viewMode: PropTypes.oneOf([VIEW_MODES.GRID, VIEW_MODES.LIST]).isRequired,
  setViewMode: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  sortBy: PropTypes.oneOf(['date', 'name', 'size']).isRequired,
  setSortBy: PropTypes.func.isRequired,
  selectedItems: PropTypes.instanceOf(Set).isRequired,
  setSelectedItems: PropTypes.func.isRequired,
  onSelectProject: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onBulkDelete: PropTypes.func,
  onOpenUpload: PropTypes.func.isRequired,
};

DocumentsLibrary.defaultProps = {
  onBulkDelete: null,
};

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

export default memo(DocumentsLibrary);
