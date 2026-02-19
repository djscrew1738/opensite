import { useState, useMemo } from 'react';

export function useSorting(defaultField = 'score', defaultDirection = 'desc') {
  const [sortField, setSortField] = useState(defaultField);
  const [sortDirection, setSortDirection] = useState(defaultDirection);

  const toggleSort = (field) => {
    if (field === sortField) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortData = useMemo(() => {
    return (data) => {
      if (!data || !data.length) return data;
      return [...data].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle nulls
        if (aVal == null) aVal = sortDirection === 'desc' ? -Infinity : Infinity;
        if (bVal == null) bVal = sortDirection === 'desc' ? -Infinity : Infinity;

        // String comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        // Numeric comparison
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    };
  }, [sortField, sortDirection]);

  return { sortField, sortDirection, toggleSort, sortData };
}
