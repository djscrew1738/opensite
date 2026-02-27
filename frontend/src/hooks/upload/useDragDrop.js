import { useState, useRef, useCallback } from 'react';

/**
 * useDragDrop Hook
 * Manages drag-and-drop state and handlers with counter pattern for nested elements
 * 
 * @param {Object} options
 * @param {boolean} options.disabled - Whether drag-drop is disabled
 * @param {Function} options.onDrop - Callback when files are dropped
 * @param {Function} options.onDragEnter - Optional callback when drag enters
 * @param {Function} options.onDragLeave - Optional callback when drag leaves
 * @returns {Object} Drag-drop state and handlers
 */
export function useDragDrop(options = {}) {
  const { disabled = false, onDrop, onDragEnter, onDragLeave } = options;
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    
    if (disabled) return;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
      onDragEnter?.(e);
    }
  }, [disabled, onDragEnter]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDragging(false);
      onDragLeave?.(e);
    }
  }, [onDragLeave]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onDrop?.(files);
    }
  }, [disabled, onDrop]);

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    dragCounter.current = 0;
  }, []);

  return {
    isDragging,
    dragCounter,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    resetDragState
  };
}

/**
 * useFileInput Hook
 * Manages file input ref and change handling
 * 
 * @param {Object} options
 * @param {Function} options.onSelect - Callback when files are selected
 * @param {boolean} options.disabled - Whether input is disabled
 * @param {boolean} options.resetOnSelect - Reset input after selection (default: true)
 * @returns {Object} Input ref and handlers
 */
export function useFileInput(options = {}) {
  const { onSelect, disabled = false, resetOnSelect = true } = options;
  const inputRef = useRef(null);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onSelect?.(files);
    }
    if (resetOnSelect) {
      e.target.value = ''; // Reset for re-selection
    }
  }, [onSelect, resetOnSelect]);

  return {
    inputRef,
    handlers: {
      onClick: handleClick,
      onChange: handleChange,
    }
  };
}

/**
 * Combined hook for full file selection (drag-drop + click)
 * @param {Object} options
 * @param {Function} options.onFilesSelected - Callback when files are selected (from either method)
 * @param {boolean} options.disabled
 * @returns {Object} Combined state and handlers
 */
export function useFileSelection(options = {}) {
  const { onFilesSelected, disabled = false } = options;

  const handleFiles = useCallback((files) => {
    onFilesSelected?.(files);
  }, [onFilesSelected]);

  const dragDrop = useDragDrop({ disabled, onDrop: handleFiles });
  const fileInput = useFileInput({ disabled, onSelect: handleFiles });

  return {
    isDragging: dragDrop.isDragging,
    inputRef: fileInput.inputRef,
    handlers: {
      // Drag-drop handlers
      ...dragDrop.handlers,
      // Click handler
      onClick: fileInput.handlers.onClick,
      // Input change handler
      onInputChange: fileInput.handlers.onChange,
    },
    reset: dragDrop.resetDragState
  };
}
