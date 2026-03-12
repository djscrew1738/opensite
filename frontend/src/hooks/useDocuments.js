import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../api/client';

/**
 * useDocuments - Hook for managing document list operations
 * @param {Object} options
 * @param {boolean} options.autoFetch - Whether to fetch documents on mount
 * @returns {Object} Document list state and operations
 */
export function useDocuments({ autoFetch = true } = {}) {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.documents.list();
      if (response.success) {
        setDocuments(response.data.documents || []);
      }
    } catch (err) {
      setError({ type: 'FETCH_FAILED', message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.documents.upload(file);
      if (response.success) {
        setDocuments(prev => [response.data.document, ...prev]);
        setSelectedId(response.data.document.id);
        return response.data.document;
      }
    } catch (err) {
      setError({ type: 'UPLOAD_FAILED', message: err.message });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id) => {
    setError(null);
    
    try {
      const response = await api.documents.delete(id);
      if (response.success) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
        }
      }
    } catch (err) {
      setError({ type: 'DELETE_FAILED', message: err.message });
      throw err;
    }
  }, [selectedId]);

  const selectDocument = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const selectedDocument = documents.find(d => d.id === selectedId) || null;

  useEffect(() => {
    if (autoFetch && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchDocuments();
    }
  }, [autoFetch, fetchDocuments]);

  return {
    documents,
    selectedId,
    selectedDocument,
    isLoading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    selectDocument,
    clearError,
  };
}

/**
 * useRelativeTime - Hook for formatting relative time that updates
 * @param {string} dateStr - ISO date string
 * @param {number} updateInterval - Update interval in ms (default: 60000)
 * @returns {string} Relative time string
 */
export function useRelativeTime(dateStr, updateInterval = 60000) {
  const [relativeTime, setRelativeTime] = useState(() => 
    formatRelativeTime(dateStr)
  );

  useEffect(() => {
    setRelativeTime(formatRelativeTime(dateStr));
    
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(dateStr));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [dateStr, updateInterval]);

  return relativeTime;
}

/**
 * Format a date to relative time
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time string
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

/**
 * Truncate a filename while preserving extension
 * @param {string} name - Filename
 * @param {number} max - Maximum length
 * @returns {string} Truncated filename
 */
export function truncateFilename(name, max = 28) {
  if (!name || name.length <= max) return name;
  
  const ext = name.lastIndexOf('.');
  if (ext === -1) return name.slice(0, max - 3) + '...';
  
  const extension = name.slice(ext);
  const stem = name.slice(0, ext);
  const available = max - extension.length - 3;
  
  if (available <= 0) return name.slice(0, max - 3) + '...';
  return stem.slice(0, available) + '...' + extension;
}

/**
 * Format word count with k suffix for large numbers
 * @param {number} count - Word count
 * @returns {string|null} Formatted word count or null
 */
export function formatWordCount(count) {
  if (count == null) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

/**
 * Format file size to human readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
