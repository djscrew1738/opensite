import { useState, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, Upload, Search, Grid3X3, List, Trash2, X } from 'lucide-react';
import { NoDocumentsEmpty } from '../empty-states';
import { VIEW_MODES } from './docHelpers';
import DocumentCard from './DocumentCard';
import DocumentListItem from './DocumentListItem';

export default function DocumentsLibrary({
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
  const listParentRef = useRef(null);
  const sortedProjects = useMemo(() => [...projects].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
    return 0;
  }), [projects, sortBy]);
  const rowVirtualizer = useVirtualizer({
    count: sortedProjects.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    onOpenUpload?.();
  }, [onOpenUpload]);

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div
      className="h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-4"
        style={{ borderBottom: '1px solid #1F2430' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: '#0F1117',
                border: '1px solid #2D3548',
                color: '#F1F5F9'
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              background: '#0F1117',
              border: '1px solid #2D3548',
              color: '#94A3B8'
            }}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #2D3548' }}>
            <button
              onClick={() => setViewMode(VIEW_MODES.GRID)}
              className="p-2 transition-colors"
              style={{
                background: viewMode === VIEW_MODES.GRID ? '#181C24' : '#0F1117',
                color: viewMode === VIEW_MODES.GRID ? '#F1F5F9' : '#64748B'
              }}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              className="p-2 transition-colors"
              style={{
                background: viewMode === VIEW_MODES.LIST ? '#181C24' : '#0F1117',
                color: viewMode === VIEW_MODES.LIST ? '#F1F5F9' : '#64748B'
              }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: '#3B82F6',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Bulk selection bar */}
      {selectedItems.size > 0 && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5"
          style={{ background: 'rgba(59, 130, 246, 0.08)', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}
        >
          <span className="text-sm font-medium" style={{ color: '#93C5FD' }}>
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkDelete?.(Array.from(selectedItems))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.25)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete selected
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#64748B' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = '#1F2430'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drop zone overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center m-4 rounded-xl"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px dashed #3B82F6'
          }}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-2" style={{ color: '#3B82F6' }} />
            <p className="font-medium" style={{ color: '#F1F5F9' }}>Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Documents grid/list */}
      <div className="p-4">
        {isLoading && projects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
          </div>
        ) : sortedProjects.length === 0 ? (
          <NoDocumentsEmpty onUpload={onOpenUpload} />
        ) : viewMode === VIEW_MODES.GRID ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedProjects.map((project) => (
              <DocumentCard
                key={project.id}
                project={project}
                isSelected={selectedItems.has(project.id)}
                onSelect={() => toggleSelection(project.id)}
                onClick={() => onSelectProject(project)}
                onDelete={(e) => onDelete(project.id, e)}
              />
            ))}
          </div>
        ) : (
          <div
            ref={listParentRef}
            style={{ height: 'calc(100vh - 260px)', overflow: 'auto', position: 'relative' }}
          >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const project = sortedProjects[virtualRow.index];
                return (
                  <div
                    key={project.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <DocumentListItem
                      project={project}
                      isSelected={selectedItems.has(project.id)}
                      onSelect={() => toggleSelection(project.id)}
                      onClick={() => onSelectProject(project)}
                      onDelete={(e) => onDelete(project.id, e)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Load more */}
        {hasMore && sortedProjects.length > 0 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onLoadMore}
              disabled={isFetchingMore}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#111318', border: '1px solid #1F2430', color: '#F1F5F9' }}
            >
              {isFetchingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
