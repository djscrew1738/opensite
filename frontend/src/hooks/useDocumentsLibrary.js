import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useToast } from './useToast';
import { visionApi } from '../api/vision';

/**
 * useDocumentsLibrary Hook
 * Manages document library state, pagination, search, and operations
 * 
 * @param {Object} options
 * @param {number} options.gridPageSize - Page size for grid view
 * @param {number} options.listPageSize - Page size for list view
 * @returns {Object} Library data and operations
 */
export function useDocumentsLibrary(options = {}) {
  const { 
    gridPageSize = 24, 
    listPageSize = 50 
  } = options;

  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const pageSize = viewMode === 'list' ? listPageSize : gridPageSize;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setHasMore(true);
      setDocuments([]);
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch paged projects
  const { data: pageData = [], isLoading, isFetching } = useQuery({
    queryKey: ['vision-projects', { page, pageSize, debouncedQuery, sortBy }],
    queryFn: () => visionApi.getProjects({
      limit: pageSize,
      offset: page * pageSize,
      q: debouncedQuery || undefined,
      sort: sortBy,
    }),
    placeholderData: keepPreviousData,
  });

  // Merge pages
  useEffect(() => {
    if (!pageData) return;
    setDocuments(prev => page === 0 ? pageData : [...prev, ...pageData]);
    setHasMore((pageData?.length || 0) === pageSize);
  }, [pageData, page, pageSize]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage(p => p + 1);
    }
  }, [hasMore, isFetching]);

  const handleDeleteRequest = useCallback((id, e) => {
    e?.stopPropagation();
    const project = documents.find(p => p.id === id);
    setDocumentToDelete(project || { id });
  }, [documents]);

  const confirmDelete = useCallback(async () => {
    if (!documentToDelete) return;
    try {
      await visionApi.deleteProject(documentToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
      setDocumentToDelete(null);
      success('Document deleted');
    } catch {
      showError('Failed to delete document');
    }
  }, [documentToDelete, queryClient, success, showError]);

  const handleBulkDelete = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => visionApi.deleteProject(id)));
      setSelectedItems(new Set());
      setPage(0);
      setDocuments([]);
      queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
      success(`${ids.length} document${ids.length !== 1 ? 's' : ''} deleted`);
    } catch {
      showError('Failed to delete some documents');
    }
  }, [queryClient, success, showError]);

  const clearDelete = useCallback(() => {
    setDocumentToDelete(null);
  }, []);

  return {
    // Data
    documents,
    documentToDelete,
    
    // Pagination
    page,
    hasMore,
    isLoading,
    isFetchingMore: isFetching && documents.length > 0,
    handleLoadMore,
    
    // View & Sort
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Selection
    selectedItems,
    setSelectedItems,
    
    // Delete
    handleDeleteRequest,
    confirmDelete,
    handleBulkDelete,
    clearDelete,
  };
}
