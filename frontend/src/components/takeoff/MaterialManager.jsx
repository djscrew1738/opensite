import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  Plus, Edit3, Trash2, Search, Package, X, Save, Filter,
  Star, Copy, Download, Upload, ChevronDown, ChevronRight,
  DollarSign, TrendingUp, TrendingDown, BarChart3, Grid3X3,
  List, Table2, Percent, Check, AlertCircle, Clock, Heart,
  ArrowUpDown, SlidersHorizontal, FileSpreadsheet, MoreVertical,
  Eye, History, Hash, ExternalLink
} from 'lucide-react';
import MaterialDetailModal from './MaterialDetailModal';

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

const UNIT_OPTIONS = ['ft', 'ea', 'lb', 'gal', 'roll', 'box', 'set', 'bag', 'pair', 'kit'];

const SORT_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'cost', label: 'Price (Low-High)' },
  { value: 'cost_desc', label: 'Price (High-Low)' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'usage', label: 'Most Used' },
  { value: 'recent', label: 'Recently Used' },
  { value: 'updated', label: 'Recently Updated' }
];

const VIEW_MODES = {
  GROUPED: 'grouped',
  TABLE: 'table',
  CARD: 'card'
};

const QUICK_FILTERS = {
  ALL: 'all',
  FAVORITES: 'favorites',
  RECENT: 'recent',
  MOST_USED: 'most_used'
};

export default function MaterialManager({ onSelect, selectionMode = false }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Core state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [sortBy, setSortBy] = useState('category');
  const [quickFilter, setQuickFilter] = useState(QUICK_FILTERS.ALL);
  const [viewMode, setViewMode] = useState(VIEW_MODES.GROUPED);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: 'pipe', unit: 'ft', unitCost: '',
    supplier: '', partNumber: '', description: '', notes: '', markup: ''
  });

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPricePercent, setBulkPricePercent] = useState('');

  // Import state
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

  // Detail modal
  const [detailMaterialId, setDetailMaterialId] = useState(null);

  // Collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  // Notification state
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // ---- Queries ----

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials', categoryFilter, search, supplierFilter, sortBy, minPrice, maxPrice, quickFilter],
    queryFn: () => {
      if (quickFilter === QUICK_FILTERS.FAVORITES) {
        return api.takeoff.getMaterials({ favorites: true, sort: sortBy, search: search || undefined });
      }
      if (quickFilter === QUICK_FILTERS.RECENT) {
        return api.takeoff.getMaterials({ recentlyUsed: true, sort: 'recent', search: search || undefined });
      }
      if (quickFilter === QUICK_FILTERS.MOST_USED) {
        return api.takeoff.getMaterials({ sort: 'usage', search: search || undefined });
      }
      return api.takeoff.getMaterials({
        category: categoryFilter || undefined,
        search: search || undefined,
        supplier: supplierFilter || undefined,
        sort: sortBy,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined
      });
    }
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['material-categories'],
    queryFn: () => api.takeoff.getCategories()
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['material-suppliers'],
    queryFn: () => api.takeoff.getSuppliers()
  });

  const { data: statsData } = useQuery({
    queryKey: ['material-stats'],
    queryFn: () => api.takeoff.getStats()
  });

  // ---- Mutations ----

  const createMutation = useMutation({
    mutationFn: (data) => api.takeoff.createMaterial(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      queryClient.invalidateQueries({ queryKey: ['material-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
      resetForm();
      showNotification(`"${data.name}" created`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.takeoff.updateMaterial(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
      setEditingId(null);
      setShowAddForm(false);
      showNotification(`"${data.name}" updated`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.takeoff.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      queryClient.invalidateQueries({ queryKey: ['material-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
      showNotification('Material deleted');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => api.takeoff.duplicateMaterial(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
      showNotification(`Duplicated as "${data.name}"`);
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id) => api.takeoff.toggleFavorite(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => api.takeoff.bulkDelete(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      queryClient.invalidateQueries({ queryKey: ['material-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
      setSelectedIds(new Set());
      setShowBulkActions(false);
      showNotification(`${data.deleted} materials deleted`);
    }
  });

  const bulkPriceMutation = useMutation({
    mutationFn: ({ ids, percentageChange }) => api.takeoff.bulkPriceUpdate(ids, percentageChange),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
      setSelectedIds(new Set());
      setShowBulkPriceModal(false);
      setBulkPricePercent('');
      showNotification(`${data.updated} material prices updated`);
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: (materials) => api.takeoff.bulkImport(materials),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      queryClient.invalidateQueries({ queryKey: ['material-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['material-stats'] });
      setShowImportPreview(false);
      setImportData([]);
      showNotification(`${data.imported} materials imported`);
    }
  });

  // ---- Derived data ----

  const materials = materialsData?.materials || [];
  const categories = categoriesData?.categories || [];
  const suppliers = suppliersData?.suppliers || [];
  const stats = statsData || {};

  // Group materials by category for grouped view
  const groupedMaterials = useMemo(() => {
    return materials.reduce((acc, mat) => {
      const cat = mat.category || 'misc';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mat);
      return acc;
    }, {});
  }, [materials]);

  // ---- Handlers ----

  const resetForm = () => {
    setFormData({
      name: '', category: 'pipe', unit: 'ft', unitCost: '',
      supplier: '', partNumber: '', description: '', notes: '', markup: ''
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const data = {
      ...formData,
      unitCost: Number(formData.unitCost) || 0,
      markup: Number(formData.markup) || 0
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (material) => {
    setFormData({
      name: material.name,
      category: material.category,
      unit: material.unit,
      unitCost: String(material.unitCost),
      supplier: material.supplier || '',
      partNumber: material.partNumber || '',
      description: material.description || '',
      notes: material.notes || '',
      markup: String(material.markup || '')
    });
    setEditingId(material.id);
    setShowAddForm(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === materials.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(materials.map(m => m.id)));
    }
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (window.confirm(`Delete ${count} selected material${count !== 1 ? 's' : ''}? This cannot be undone.`)) {
      bulkDeleteMutation.mutate([...selectedIds]);
    }
  };

  const handleBulkPriceUpdate = () => {
    const pct = Number(bulkPricePercent);
    if (isNaN(pct) || pct === 0) return;
    bulkPriceMutation.mutate({ ids: [...selectedIds], percentageChange: pct });
  };

  const toggleCategory = (cat) => {
    const next = new Set(collapsedCategories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    setCollapsedCategories(next);
  };

  // CSV Export
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/takeoff/materials/export/csv${categoryFilter ? `?category=${categoryFilter}` : ''}`, {
        headers: { 'Accept': 'text/csv' }
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `materials-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification('Materials exported to CSV');
    } catch (err) {
      showNotification('Export failed: ' + err.message, 'error');
    }
  };

  // CSV Import
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          showNotification('CSV file must have a header row and at least one data row', 'error');
          return;
        }

        // Parse header
        const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        const nameIdx = header.findIndex(h => h === 'name' || h === 'material');
        const catIdx = header.findIndex(h => h === 'category' || h === 'cat');
        const unitIdx = header.findIndex(h => h === 'unit');
        const costIdx = header.findIndex(h => h.includes('cost') || h.includes('price'));
        const supplierIdx = header.findIndex(h => h.includes('supplier') || h.includes('vendor'));
        const partIdx = header.findIndex(h => h.includes('part') || h.includes('sku'));
        const descIdx = header.findIndex(h => h.includes('desc'));
        const notesIdx = header.findIndex(h => h.includes('note'));
        const markupIdx = header.findIndex(h => h.includes('markup'));

        if (nameIdx === -1) {
          showNotification('CSV must have a "Name" column', 'error');
          return;
        }

        const parsed = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const name = cols[nameIdx]?.trim();
          if (!name) {
            errors.push(`Row ${i + 1}: missing name`);
            continue;
          }

          parsed.push({
            name,
            category: cols[catIdx]?.trim() || 'misc',
            unit: cols[unitIdx]?.trim() || 'ea',
            unitCost: Number(cols[costIdx]?.replace(/[$,]/g, '')) || 0,
            supplier: cols[supplierIdx]?.trim() || '',
            partNumber: cols[partIdx]?.trim() || '',
            description: cols[descIdx]?.trim() || '',
            notes: cols[notesIdx]?.trim() || '',
            markup: Number(cols[markupIdx]?.replace(/%/g, '')) || 0
          });
        }

        setImportData(parsed);
        setImportErrors(errors);
        setShowImportPreview(true);
      } catch (err) {
        showNotification('Failed to parse CSV: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (importData.length === 0) return;
    bulkImportMutation.mutate(importData);
  };

  // ---- Render Helpers ----

  const renderMaterialRow = (material, compact = false) => {
    const isSelected = selectedIds.has(material.id);
    const priceWithMarkup = material.markup
      ? material.unitCost * (1 + material.markup / 100)
      : null;

    return (
      <div
        key={material.id}
        className={`flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors ${
          selectionMode ? 'cursor-pointer' : ''
        } ${isSelected ? 'bg-primary-50' : ''}`}
        onClick={selectionMode ? () => onSelect(material) : undefined}
      >
        {/* Checkbox for bulk ops */}
        {!selectionMode && selectedIds.size > 0 && (
          <label className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleSelect(material.id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        )}

        {/* Favorite star */}
        {!selectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteMutation.mutate(material.id);
            }}
            className={`flex-shrink-0 p-0.5 rounded transition-colors ${
              material.isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            title={material.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className="w-4 h-4" fill={material.isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Material info */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={(e) => {
            if (selectionMode) return;
            e.stopPropagation();
            setDetailMaterialId(material.id);
          }}
        >
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{material.name}</p>
            {material.usageCount > 0 && (
              <span className="flex-shrink-0 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {material.usageCount}x used
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {material.supplier && <span>{material.supplier}</span>}
            {material.supplier && material.partNumber && <span> &middot; </span>}
            {material.partNumber && <span className="font-mono text-xs">{material.partNumber}</span>}
            {!material.supplier && !material.partNumber && <span>{material.unit}</span>}
          </p>
        </div>

        {/* Price info */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <div className="text-right">
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              ${Number(material.unitCost).toFixed(2)}/{material.unit}
            </span>
            {priceWithMarkup && (
              <p className="text-[10px] text-green-600">
                +{material.markup}% = ${priceWithMarkup.toFixed(2)}
              </p>
            )}
          </div>

          {/* Actions */}
          {!selectionMode && (
            <div className="flex gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); setDetailMaterialId(material.id); }}
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                title="View details"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); startEdit(material); }}
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(material.id); }}
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                title="Duplicate"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(material.id, material.name); }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {!selectionMode && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === materials.length && materials.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              <th className="w-8 px-1 py-2"></th>
              <th className="text-left px-3 py-2 text-gray-600 font-semibold">Material</th>
              <th className="text-left px-3 py-2 text-gray-600 font-semibold">Category</th>
              <th className="text-left px-3 py-2 text-gray-600 font-semibold">Supplier</th>
              <th className="text-left px-3 py-2 text-gray-600 font-semibold">Part #</th>
              <th className="text-center px-3 py-2 text-gray-600 font-semibold">Unit</th>
              <th className="text-right px-3 py-2 text-gray-600 font-semibold">Cost</th>
              <th className="text-right px-3 py-2 text-gray-600 font-semibold">Markup</th>
              <th className="text-center px-3 py-2 text-gray-600 font-semibold">Used</th>
              {!selectionMode && (
                <th className="text-right px-3 py-2 text-gray-600 font-semibold w-24">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {materials.map((material) => {
              const isSelected = selectedIds.has(material.id);
              return (
                <tr
                  key={material.id}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50' : ''} ${
                    selectionMode ? 'cursor-pointer' : ''
                  }`}
                  onClick={selectionMode ? () => onSelect(material) : undefined}
                >
                  {!selectionMode && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(material.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  <td className="px-1 py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavoriteMutation.mutate(material.id); }}
                      className={material.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}
                    >
                      <Star className="w-3.5 h-3.5" fill={material.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailMaterialId(material.id); }}
                      className="text-left font-medium text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {material.name}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: (CATEGORY_COLORS[material.category] || '#6b7280') + '15',
                        color: CATEGORY_COLORS[material.category] || '#6b7280'
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[material.category] || '#6b7280' }} />
                      {CATEGORY_LABELS[material.category] || material.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{material.supplier || '-'}</td>
                  <td className="px-3 py-2 text-gray-600 font-mono text-xs">{material.partNumber || '-'}</td>
                  <td className="px-3 py-2 text-center text-gray-600">{material.unit}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    ${Number(material.unitCost).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {material.markup ? `${material.markup}%` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500">
                    {material.usageCount || 0}
                  </td>
                  {!selectionMode && (
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(material); }}
                          className="p-1 text-gray-400 hover:text-primary-600 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(material.id); }}
                          className="p-1 text-gray-400 hover:text-primary-600 rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(material.id, material.name); }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {materials.map((material) => {
        const isSelected = selectedIds.has(material.id);
        const priceWithMarkup = material.markup
          ? material.unitCost * (1 + material.markup / 100)
          : null;

        return (
          <div
            key={material.id}
            className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${
              isSelected ? 'border-primary-300 bg-primary-50 ring-1 ring-primary-200' : 'border-gray-200'
            } ${selectionMode ? 'cursor-pointer' : ''}`}
            onClick={selectionMode ? () => onSelect(material) : undefined}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {!selectionMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavoriteMutation.mutate(material.id); }}
                    className={material.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}
                  >
                    <Star className="w-4 h-4" fill={material.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
                {!selectionMode && selectedIds.size > 0 && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); handleToggleSelect(material.id); }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                )}
              </div>
              <span
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: (CATEGORY_COLORS[material.category] || '#6b7280') + '15',
                  color: CATEGORY_COLORS[material.category] || '#6b7280'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[material.category] || '#6b7280' }} />
                {CATEGORY_LABELS[material.category] || material.category}
              </span>
            </div>

            <button
              onClick={(e) => {
                if (selectionMode) return;
                e.stopPropagation();
                setDetailMaterialId(material.id);
              }}
              className="text-left w-full"
            >
              <h4 className="font-semibold text-gray-900 text-sm leading-tight hover:text-primary-600 transition-colors">
                {material.name}
              </h4>
            </button>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              {material.supplier && <span>{material.supplier}</span>}
              {material.partNumber && (
                <>
                  {material.supplier && <span>&middot;</span>}
                  <span className="font-mono">{material.partNumber}</span>
                </>
              )}
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">${Number(material.unitCost).toFixed(2)}</p>
                <p className="text-xs text-gray-500">per {material.unit}</p>
                {priceWithMarkup && (
                  <p className="text-[10px] text-green-600 font-medium">
                    w/ {material.markup}% markup: ${priceWithMarkup.toFixed(2)}
                  </p>
                )}
              </div>
              {material.usageCount > 0 && (
                <span className="text-xs text-gray-400">{material.usageCount}x used</span>
              )}
            </div>

            {!selectionMode && (
              <div className="mt-3 pt-2 border-t border-gray-100 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailMaterialId(material.id); }}
                  className="flex-1 text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" /> View
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(material); }}
                  className="flex-1 text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(material.id); }}
                  className="flex-1 text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderGroupedView = () => (
    <div className="space-y-3">
      {Object.entries(groupedMaterials).map(([category, items]) => {
        const isCollapsed = collapsedCategories.has(category);
        const categoryTotal = items.reduce((sum, m) => sum + m.unitCost, 0);

        return (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 hover:text-gray-900 transition-colors px-1 py-1"
            >
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
              />
              {CATEGORY_LABELS[category] || category}
              <span className="text-gray-400 font-normal">({items.length})</span>
              <span className="ml-auto text-gray-400 font-normal normal-case text-[10px]">
                avg ${(categoryTotal / items.length).toFixed(2)}
              </span>
            </button>
            {!isCollapsed && (
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {items.map(material => renderMaterialRow(material))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all animate-in ${
          notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {notification.message}
        </div>
      )}

      {/* Stats bar */}
      {!selectionMode && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
              <Package className="w-3.5 h-3.5" />
              Total Materials
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
              <Star className="w-3.5 h-3.5" />
              Favorites
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.favorites || 0}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
              <DollarSign className="w-3.5 h-3.5" />
              Suppliers
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.suppliers || 0}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
              <History className="w-3.5 h-3.5" />
              Price Changes (30d)
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.recentPriceChanges || 0}</p>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: QUICK_FILTERS.ALL, label: 'All Materials', icon: Package },
          { id: QUICK_FILTERS.FAVORITES, label: 'Favorites', icon: Star },
          { id: QUICK_FILTERS.RECENT, label: 'Recently Used', icon: Clock },
          { id: QUICK_FILTERS.MOST_USED, label: 'Most Used', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setQuickFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              quickFilter === id
                ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search, Filters, and Actions Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials, suppliers, part numbers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter controls */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input text-sm"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${
                showAdvancedFilters || supplierFilter || minPrice || maxPrice
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {(supplierFilter || minPrice || maxPrice) && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </button>

            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {[
                { mode: VIEW_MODES.GROUPED, icon: List, label: 'Grouped' },
                { mode: VIEW_MODES.TABLE, icon: Table2, label: 'Table' },
                { mode: VIEW_MODES.CARD, icon: Grid3X3, label: 'Cards' }
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 transition-colors ${
                    viewMode === mode
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters (collapsible) */}
        {showAdvancedFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="label">Supplier</label>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="input text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Min Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input text-sm w-28"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Max Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input text-sm w-28"
                placeholder="999.00"
              />
            </div>
            <button
              onClick={() => {
                setSupplierFilter('');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-2 flex-wrap">
          {!selectionMode && (
            <>
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </button>

              <button
                onClick={handleExport}
                className="btn-secondary flex items-center gap-2 text-sm"
                title="Export materials to CSV"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>

              <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Import CSV
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              {materials.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedIds.size > 0) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(materials.map(m => m.id)));
                      setShowBulkActions(true);
                    }
                  }}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  {selectedIds.size > 0 ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </>
          )}

          {/* Bulk action bar */}
          {selectedIds.size > 0 && !selectionMode && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300">
              <span className="text-sm font-medium text-primary-600">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setShowBulkPriceModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100 transition-colors"
              >
                <Percent className="w-3.5 h-3.5" />
                Update Prices
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          )}

          {/* Material count */}
          <span className="text-xs text-gray-400 ml-auto">
            {materials.length} material{materials.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card border-primary-200 bg-primary-50/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              {editingId ? 'Edit Material' : 'New Material'}
            </h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="input w-full"
                placeholder="Material name"
              />
            </div>
            <div>
              <label className="label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                className="input w-full"
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                className="input w-full"
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCost}
                onChange={(e) => setFormData(p => ({ ...p, unitCost: e.target.value }))}
                className="input w-full"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Markup (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.markup}
                onChange={(e) => setFormData(p => ({ ...p, markup: e.target.value }))}
                className="input w-full"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData(p => ({ ...p, supplier: e.target.value }))}
                className="input w-full"
                placeholder="Supplier name"
                list="supplier-suggestions"
              />
              <datalist id="supplier-suggestions">
                {suppliers.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Part Number</label>
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => setFormData(p => ({ ...p, partNumber: e.target.value }))}
                className="input w-full"
                placeholder="Part # or SKU"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                className="input w-full"
                placeholder="Brief description or specifications"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                className="input w-full h-16 resize-none"
                placeholder="Installation notes, special handling, etc."
              />
            </div>
          </div>
          {formData.unitCost && formData.markup && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              With {formData.markup}% markup: <strong>
                ${(Number(formData.unitCost) * (1 + Number(formData.markup) / 100)).toFixed(2)}/{formData.unit}
              </strong>
            </div>
          )}
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={resetForm} className="btn-secondary">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!formData.name || !formData.category || !formData.unit || createMutation.isPending || updateMutation.isPending}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary-600" />
                  Import Preview
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {importData.length} materials ready to import
                </p>
              </div>
              <button onClick={() => { setShowImportPreview(false); setImportData([]); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {importErrors.length > 0 && (
              <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
                <p className="text-sm text-yellow-700 font-medium">Warnings:</p>
                {importErrors.map((err, i) => (
                  <p key={i} className="text-xs text-yellow-600">{err}</p>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-600 font-semibold">Name</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-semibold">Category</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-semibold">Unit</th>
                    <th className="text-right py-2 px-2 text-gray-600 font-semibold">Cost</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-semibold">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {importData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-900">{item.name}</td>
                      <td className="py-2 px-2 text-gray-600">{CATEGORY_LABELS[item.category] || item.category}</td>
                      <td className="py-2 px-2 text-center text-gray-600">{item.unit}</td>
                      <td className="py-2 px-2 text-right font-medium">${Number(item.unitCost).toFixed(2)}</td>
                      <td className="py-2 px-2 text-gray-600">{item.supplier || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                This will add {importData.length} new materials to your catalog.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowImportPreview(false); setImportData([]); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={bulkImportMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  {bulkImportMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Import {importData.length} Materials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price Update Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-green-600" />
                Bulk Price Update
              </h3>
              <button onClick={() => { setShowBulkPriceModal(false); setBulkPricePercent(''); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Adjust prices for {selectedIds.size} selected material{selectedIds.size !== 1 ? 's' : ''} by a percentage.
            </p>
            <div className="mb-4">
              <label className="label">Percentage Change (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={bulkPricePercent}
                  onChange={(e) => setBulkPricePercent(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. 5 for +5%, -10 for -10%"
                  autoFocus
                />
              </div>
              {bulkPricePercent && (
                <p className="text-xs text-gray-500 mt-2">
                  {Number(bulkPricePercent) > 0 ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Increase by {bulkPricePercent}%
                    </span>
                  ) : Number(bulkPricePercent) < 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Decrease by {Math.abs(Number(bulkPricePercent))}%
                    </span>
                  ) : (
                    <span>No change</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowBulkPriceModal(false); setBulkPricePercent(''); }} className="btn-secondary">Cancel</button>
              <button
                onClick={handleBulkPriceUpdate}
                disabled={!bulkPricePercent || Number(bulkPricePercent) === 0 || bulkPriceMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {bulkPriceMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
                Update Prices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : materials.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No materials found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || categoryFilter || supplierFilter || minPrice || maxPrice || quickFilter !== QUICK_FILTERS.ALL
              ? 'Try adjusting your filters or search terms'
              : 'Add your first material to get started'}
          </p>
          {(search || categoryFilter || supplierFilter || minPrice || maxPrice || quickFilter !== QUICK_FILTERS.ALL) && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setSupplierFilter('');
                setMinPrice('');
                setMaxPrice('');
                setQuickFilter(QUICK_FILTERS.ALL);
              }}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === VIEW_MODES.GROUPED && renderGroupedView()}
          {viewMode === VIEW_MODES.TABLE && renderTableView()}
          {viewMode === VIEW_MODES.CARD && renderCardView()}
        </>
      )}

      {/* Material Detail Modal */}
      {detailMaterialId && (
        <MaterialDetailModal
          materialId={detailMaterialId}
          onClose={() => setDetailMaterialId(null)}
          onEdit={(material) => {
            setDetailMaterialId(null);
            startEdit(material);
          }}
          onDuplicate={(id) => {
            setDetailMaterialId(null);
            duplicateMutation.mutate(id);
          }}
          onDelete={(id, name) => {
            setDetailMaterialId(null);
            handleDelete(id, name);
          }}
        />
      )}
    </div>
  );
}

// CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
