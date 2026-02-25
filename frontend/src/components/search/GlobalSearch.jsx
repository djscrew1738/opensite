import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Command, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import SearchResultRow from '../leads/SearchResultRow';

/**
 * GlobalSearch - Universal search across all entity types
 * 
 * Features:
 * - Searches leads, permits, builders, jobs, estimates simultaneously
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Filter by type
 * - Grouped results by entity type
 * - Quick navigation to entity detail pages
 */
export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Clear search when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
      setTypeFilter('all');
    }
  }, [isOpen]);

  // Search effect with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.permits.search({ 
          q: query.trim(), 
          type: typeFilter === 'all' ? undefined : typeFilter 
        });
        setResults(data);
        setHighlightedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, typeFilter]);

  // Flatten results for keyboard navigation
  const flatResults = useCallback(() => {
    if (!results) return [];
    const flat = [];
    if (results.permits?.length) results.permits.forEach(r => flat.push({ ...r, _type: 'permit' }));
    if (results.leads?.length) results.leads.forEach(r => flat.push({ ...r, _type: 'lead' }));
    if (results.builders?.length) results.builders.forEach(r => flat.push({ ...r, _type: 'builder' }));
    if (results.jobs?.length) results.jobs.forEach(r => flat.push({ ...r, _type: 'job' }));
    if (results.estimates?.length) results.estimates.forEach(r => flat.push({ ...r, _type: 'estimate' }));
    return flat;
  }, [results]);

  const allResults = flatResults();
  const totalCount = allResults.length;

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, totalCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[highlightedIndex]) {
      e.preventDefault();
      handleNavigate(allResults[highlightedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Navigate to entity detail page
  const handleNavigate = (item) => {
    const { _type, id } = item;
    
    switch (_type) {
      case 'permit':
        navigate('/leads?tab=permits');
        break;
      case 'lead':
        navigate('/leads?tab=manual');
        break;
      case 'builder':
        navigate('/leads?tab=builders');
        break;
      case 'job':
        navigate(`/jobs?id=${id}`);
        break;
      case 'estimate':
        navigate(`/jobs?tab=estimating&id=${id}`);
        break;
      default:
        break;
    }
    
    onClose();
  };

  // Filter buttons configuration
  const filterButtons = [
    { key: 'all', label: 'All' },
    { key: 'permits', label: 'Permits' },
    { key: 'leads', label: 'Leads' },
    { key: 'builders', label: 'Builders' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'estimates', label: 'Estimates' },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface-card rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Search className="w-5 h-5 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search across leads, permits, jobs, estimates..."
              className="flex-1 bg-transparent text-lg font-medium text-text-primary placeholder-text-muted outline-none"
            />
            {isSearching && (
              <Loader2 className="w-5 h-5 text-accent-blue animate-spin shrink-0" />
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted transition-colors"
            >
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono text-text-muted bg-surface-elevated border border-border">
                esc
              </kbd>
              <X className="w-4 h-4 sm:hidden" />
            </button>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-surface-elevated/50" role="tablist" aria-label="Filter results by type">
            {filterButtons.map(f => (
              <button
                key={f.key}
                role="tab"
                aria-selected={typeFilter === f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  typeFilter === f.key
                    ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30'
                    : 'text-text-muted hover:bg-surface-elevated'
                }`}
              >
                {f.label}
              </button>
            ))}

            {totalCount > 0 && (
              <span className="ml-auto text-xs text-text-muted font-medium tabular-nums" aria-live="polite">
                {totalCount} result{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {!query || query.length < 2 ? (
              <div className="px-5 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-text-muted mb-3">
                  <Command className="w-4 h-4" />
                  <span className="text-sm font-medium">Type to search across all data</span>
                </div>
                <p className="text-xs text-text-muted">
                  Search by name, address, city, company, job number...
                </p>
              </div>
            ) : totalCount === 0 && !isSearching ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-text-secondary font-medium">
                  No results for "{query}"
                </p>
                <p className="text-xs text-text-muted mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="py-1">
                {/* Jobs */}
                {results?.jobs?.length > 0 && (typeFilter === 'all' || typeFilter === 'jobs') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-text-muted">Jobs</span>
                    </div>
                    {results.jobs.map((r) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'job');
                      return (
                        <SearchResultRow
                          key={`job-${r.id}`}
                          result={r}
                          type="job"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => handleNavigate({ ...r, _type: 'job' })}
                        />
                      );
                    })}
                  </>
                )}

                {/* Permits */}
                {results?.permits?.length > 0 && (typeFilter === 'all' || typeFilter === 'permits') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-text-muted">Permits</span>
                    </div>
                    {results.permits.map((r) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'permit');
                      return (
                        <SearchResultRow
                          key={`permit-${r.id}`}
                          result={r}
                          type="permit"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => handleNavigate({ ...r, _type: 'permit' })}
                        />
                      );
                    })}
                  </>
                )}

                {/* Leads */}
                {results?.leads?.length > 0 && (typeFilter === 'all' || typeFilter === 'leads') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-text-muted">Leads</span>
                    </div>
                    {results.leads.map((r) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'lead');
                      return (
                        <SearchResultRow
                          key={`lead-${r.id}`}
                          result={r}
                          type="lead"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => handleNavigate({ ...r, _type: 'lead' })}
                        />
                      );
                    })}
                  </>
                )}

                {/* Builders */}
                {results?.builders?.length > 0 && (typeFilter === 'all' || typeFilter === 'builders') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-text-muted">Builders</span>
                    </div>
                    {results.builders.map((r) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'builder');
                      return (
                        <SearchResultRow
                          key={`builder-${r.id}`}
                          result={r}
                          type="builder"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => handleNavigate({ ...r, _type: 'builder' })}
                        />
                      );
                    })}
                  </>
                )}

                {/* Estimates */}
                {results?.estimates?.length > 0 && (typeFilter === 'all' || typeFilter === 'estimates') && (
                  <>
                    <div className="px-5 py-2">
                      <span className="text-2xs font-bold uppercase tracking-widest text-text-muted">Estimates</span>
                    </div>
                    {results.estimates.map((r) => {
                      const globalIdx = allResults.findIndex(a => a.id === r.id && a._type === 'estimate');
                      return (
                        <SearchResultRow
                          key={`estimate-${r.id}`}
                          result={r}
                          type="estimate"
                          isHighlighted={globalIdx === highlightedIndex}
                          onClick={() => handleNavigate({ ...r, _type: 'estimate' })}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center gap-4 bg-surface-elevated/30">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated font-mono text-2xs border border-border">↑↓</kbd>
              <span>navigate</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated font-mono text-2xs border border-border">↵</kbd>
              <span>open</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated font-mono text-2xs border border-border">esc</kbd>
              <span>close</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
