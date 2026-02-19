import { useState, useCallback } from 'react';

export function useBulkSelect(items = []) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

  const toggleSelect = useCallback((id, index, shiftKey = false) => {
    setSelectedIds(prev => {
      const next = new Set(prev);

      if (shiftKey && lastSelectedIndex !== null && index !== undefined) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          if (items[i]) next.add(items[i].id);
        }
      } else {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }

      return next;
    });

    if (index !== undefined) setLastSelectedIndex(index);
  }, [items, lastSelectedIndex]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(i => i.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  return {
    selectedIds,
    selectionCount: selectedIds.size,
    isSelected: (id) => selectedIds.has(id),
    toggleSelect,
    selectAll,
    clearSelection
  };
}
