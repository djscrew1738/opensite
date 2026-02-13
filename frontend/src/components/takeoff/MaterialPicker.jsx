import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Search, Package, X, Check, Star, Clock, TrendingUp } from 'lucide-react';

const CATEGORY_LABELS = {
  pipe: 'Pipe',
  fittings: 'Fittings',
  fixtures: 'Fixtures',
  valves: 'Valves',
  water_heater: 'Water Heaters',
  gas: 'Gas',
  misc: 'Miscellaneous'
};

const CATEGORY_COLORS = {
  pipe: '#2563eb',
  fittings: '#7c3aed',
  fixtures: '#0891b2',
  valves: '#dc2626',
  water_heater: '#ea580c',
  gas: '#ca8a04',
  misc: '#6b7280'
};

export default function MaterialPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'favorites', 'recent'

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials', categoryFilter, search],
    queryFn: () => api.takeoff.getMaterials({
      category: categoryFilter || undefined,
      search: search || undefined
    }),
    enabled: activeSection === 'all'
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['material-favorites'],
    queryFn: () => api.takeoff.getFavorites()
  });

  const { data: recentData } = useQuery({
    queryKey: ['material-recent'],
    queryFn: () => api.takeoff.getRecentlyUsed(8)
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['material-categories'],
    queryFn: () => api.takeoff.getCategories()
  });

  const allMaterials = materialsData?.materials || [];
  const favorites = favoritesData?.materials || [];
  const recent = recentData?.materials || [];
  const categories = categoriesData?.categories || [];

  // Determine which materials to display
  let displayMaterials = allMaterials;
  if (activeSection === 'favorites') displayMaterials = favorites;
  if (activeSection === 'recent') displayMaterials = recent;

  // Apply search filter to favorites/recent
  if (search && activeSection !== 'all') {
    const searchLower = search.toLowerCase();
    displayMaterials = displayMaterials.filter(m =>
      m.name.toLowerCase().includes(searchLower) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchLower))
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            Select Material
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick section tabs */}
        <div className="px-4 pt-3 flex gap-1.5">
          {[
            { id: 'all', label: 'All', icon: Package },
            ...(favorites.length > 0 ? [{ id: 'favorites', label: `Favorites (${favorites.length})`, icon: Star }] : []),
            ...(recent.length > 0 ? [{ id: 'recent', label: 'Recent', icon: Clock }] : [])
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeSection === id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9 text-sm"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {activeSection === 'all' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Materials List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && activeSection === 'all' ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : displayMaterials.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No materials found</p>
              {activeSection === 'favorites' && (
                <p className="text-xs mt-1">Star materials in the catalog to see them here</p>
              )}
              {activeSection === 'recent' && (
                <p className="text-xs mt-1">Materials you assign to takeoffs will appear here</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {displayMaterials.map(material => (
                <button
                  key={material.id}
                  onClick={() => { onSelect(material); onClose(); }}
                  className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {material.isFavorite && (
                        <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" />
                      )}
                      <p className="font-medium text-gray-900 text-sm truncate">{material.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] px-1 py-0 rounded"
                        style={{
                          backgroundColor: (CATEGORY_COLORS[material.category] || '#6b7280') + '15',
                          color: CATEGORY_COLORS[material.category] || '#6b7280'
                        }}
                      >
                        {CATEGORY_LABELS[material.category] || material.category}
                      </span>
                      {material.supplier && (
                        <span className="text-xs text-gray-400">{material.supplier}</span>
                      )}
                      {material.usageCount > 0 && (
                        <span className="text-[10px] text-gray-400">&middot; {material.usageCount}x</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-700">
                      ${Number(material.unitCost).toFixed(2)}/{material.unit}
                    </span>
                    <Check className="w-4 h-4 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {displayMaterials.length} material{displayMaterials.length !== 1 ? 's' : ''}
          </span>
          <button onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
