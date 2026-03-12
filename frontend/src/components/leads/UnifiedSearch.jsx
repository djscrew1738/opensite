import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Command } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import SearchResultRow from './SearchResultRow';

export default function UnifiedSearch({ onClose, onNavigate }) {
  const { error: showToastError } = useToast();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.permits.search({ q: query.trim(), type: typeFilter === 'all' ? undefined : typeFilter });
        setResults(data);
        setHighlightedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
        showToastError(`Search failed: ${err.message}`);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, typeFilter]);

  const flatResults = useCallback(() => {
    if (!results) return [];
    const flat = [];
    if (results.permits?.length) results.permits.forEach(r => flat.push({ ...r, _type: 'permit' }));
    if (results.leads?.length) results.leads.forEach(r => flat.push({ ...r, _type: 'lead' }));
    if (results.builders?.length) results.builders.forEach(r => flat.push({ ...r, _type: 'builder' }));
    return flat;
  }, [results]);

  const allResults = flatResults();
  const totalCount = allResults.length;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, totalCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[highlightedIndex]) {
      e.preventDefault();
      const item = allResults[highlightedIndex];
      onNavigate?.(item._type, item.id, item);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'permits', label: 'Permits' },
    { key: 'leads', label: 'Leads' },
    { key: 'builders', label: 'Builders' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-start justify-center pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-concrete-200 dark:border-surface-700 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-concrete-200 dark:border-surface-700">
            <Search className="w-5 h-5 text-surface-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search permits, leads, builders..."
              className="flex-1 bg-transparent text-lg font-medium text-surface-900 dark:text-surface-100 placeholder-gray-400 outline-none"
            />
            {isSearching && (
              <div className="w-5 h-5 border-2 border-copper-200 border-t-blue-500 rounded-full animate-spin shrink-0" />
            )}
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono text-surface-400 bg-concrete-100 dark:bg-surface-800 border border-concrete-200 dark:border-surface-700">
              esc
            </kbd>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-concrete-100 dark:border-surface-800">
            {filterButtons.map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  typeFilter === f.key
                    ? 'bg-blue-100 dark:bg-copper-950/30 text-blue-700 dark:text-blue-400'
                    : 'text-surface-500 dark:text-surface-400 hover:bg-concrete-100 dark:hover:bg-surface-800'
                }`}
              >
                {f.label}
              </button>
            ))}

            {totalCount > 0 && (
              <span className="ml-auto text-xs text-surface-400 font-medium tabular-nums">
                {totalCount} result{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {!query || query.length < 2 ? (
              <div className="px-5 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-surface-400 mb-3">
                  <Command className="w-4 h-4" />
                  <span className="text-sm font-medium">Type to search across all data</span>
                </div>
                <p className="text-xs text-surface-400">
                  Search by contractor name, address, city, company name...
                </p>
              </div>
            ) : totalCount === 0 && !isSearching ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">
                  No results for "{query}"
                </p>
                <p className="text-xs text-surface-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="py-1">
                {/* Permits */}
                {results?.permits?.length > 0 && (typeFilter === 'all' || typeFilter === 'permits') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-surface-400">Permits</span>
                    </div>
                    {results.permits.map((r, i) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'permit');
                      return (
                        <SearchResultRow
                          key={`permit-${r.id}`}
                          result={r}
                          type="permit"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => {
                            onNavigate?.('permit', r.id, r);
                            onClose();
                          }}
                        />
                      );
                    })}
                  </>
                )}

                {/* Leads */}
                {results?.leads?.length > 0 && (typeFilter === 'all' || typeFilter === 'leads') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-surface-400">Leads</span>
                    </div>
                    {results.leads.map((r) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'lead');
                      return (
                        <SearchResultRow
                          key={`lead-${r.id}`}
                          result={r}
                          type="lead"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => {
                            onNavigate?.('lead', r.id, r);
                            onClose();
                          }}
                        />
                      );
                    })}
                  </>
                )}

                {/* Builders */}
                {results?.builders?.length > 0 && (typeFilter === 'all' || typeFilter === 'builders') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-surface-400">Builders</span>
                    </div>
                    {results.builders.map((r) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'builder');
                      return (
                        <SearchResultRow
                          key={`builder-${r.id}`}
                          result={r}
                          type="builder"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => {
                            onNavigate?.('builder', r.id, r);
                            onClose();
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-concrete-100 dark:border-surface-800 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <kbd className="px-1.5 py-0.5 rounded bg-concrete-100 dark:bg-surface-800 font-mono text-2xs">↑↓</kbd>
              <span>navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <kbd className="px-1.5 py-0.5 rounded bg-concrete-100 dark:bg-surface-800 font-mono text-2xs">↵</kbd>
              <span>open</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <kbd className="px-1.5 py-0.5 rounded bg-concrete-100 dark:bg-surface-800 font-mono text-2xs">esc</kbd>
              <span>close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
