import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DataTable - Industrial-grade data table with sorting, pagination, and mobile support
 */
export function DataTable({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowClassName,
  emptyState,
  loading = false,
  pageSize = 10,
  sortable = true,
  stickyHeader = true,
  mobileCardView = true,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, sortable]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={5} />;
  }

  if (data.length === 0 && emptyState) {
    return emptyState;
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className={`
        hidden md:block rounded-xl border border-surface-200 dark:border-surface-700
        ${stickyHeader ? 'max-h-[600px] overflow-auto' : 'overflow-x-auto'}
      `}>
        <table className="w-full text-sm">
          <thead className={stickyHeader ? 'sticky top-0 z-20' : ''}>
            <tr className={`
              bg-surface-100/95 dark:bg-surface-800/95 
              backdrop-blur-sm
              border-b border-surface-200 dark:border-surface-700
              ${stickyHeader ? 'shadow-sm shadow-black/5' : ''}
            `}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  role="columnheader"
                  scope="col"
                  aria-sort={sortConfig.key === column.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  tabIndex={column.sortable !== false && sortable ? 0 : undefined}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      column.sortable !== false && handleSort(column.key);
                    }
                  }}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400
                    ${column.sortable !== false && sortable ? 'cursor-pointer hover:text-surface-900 dark:hover:text-surface-200 select-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset' : ''}
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {sortable && column.sortable !== false && sortConfig.key === column.key && (
                      <span aria-hidden="true">
                        {sortConfig.direction === 'asc' 
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />
                        }
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {paginatedData.map((row, index) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : index}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
                className={`
                  bg-white dark:bg-surface-900 
                  table-row-hover
                  ${onRowClick ? 'cursor-pointer hover:translate-x-0.5 active:translate-x-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset' : ''}
                  ${rowClassName?.(row) || ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-surface-900 dark:text-surface-100 ${column.cellClassName || ''}`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {mobileCardView && (
        <div className="md:hidden space-y-3">
          {paginatedData.map((row, index) => (
            <div
              key={keyExtractor ? keyExtractor(row) : index}
              onClick={() => onRowClick?.(row)}
              className={`
                card p-4 space-y-3
                transition-all duration-150 ease-out
                ${onRowClick ? 'cursor-pointer hover:shadow-lg hover:border-surface-300 dark:hover:border-surface-600 active:scale-[0.98] active:bg-surface-100 dark:active:bg-surface-800' : ''}
                ${rowClassName?.(row) || ''}
              `}
            >
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start gap-2">
                  <span className="text-xs uppercase tracking-wide font-medium text-surface-500 dark:text-surface-400">
                    {column.header}
                  </span>
                  <span className="text-sm text-surface-900 dark:text-surface-100 text-right">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary p-2 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm px-3 text-surface-600 dark:text-surface-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary p-2 disabled:opacity-40 hover:scale-105 active:scale-95 transition-all"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton({ columns, rows }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-100 dark:bg-surface-800">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-surface-300 dark:bg-surface-600 rounded w-20 skeleton-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="bg-white dark:bg-surface-900">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-full skeleton-shimmer" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
