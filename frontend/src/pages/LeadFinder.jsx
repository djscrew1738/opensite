import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import {
  Plus, Search, Filter, X, Command, Trash2,
  ArrowUpDown, CheckSquare, Square, Building2,
  MapPin, Users, Compass, FileText, Download, Sparkles,
  LayoutDashboard, Building, AlertCircle, RefreshCw
} from 'lucide-react';
import LeadPulseHome from '../components/leads/LeadPulseHome';
import LeadCard from '../components/leads/LeadCard';
import LeadModal from '../components/leads/LeadModal';
import PermitLeadCard from '../components/leads/PermitLeadCard';
import PermitDetailModal from '../components/leads/PermitDetailModal';
import DiscoveryTab from '../components/discovery/DiscoveryTab';
import BuilderIntelligenceTab from '../components/leads/BuilderIntelligenceTab';
import CityDashboardTab from '../components/leads/CityDashboardTab';
import CitySearch from '../components/leads/CitySearch';
import UnifiedSearch from '../components/leads/UnifiedSearch';
import LeadFunnel from '../components/leads/LeadFunnel';
import StatusProgressBar from '../components/leads/StatusProgressBar';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { 
  AnimatedCard,
  PulseLoader,
  cx
} from '../components/shared';
import { 
  Button,
  EmptyLeads,
  SkeletonCard 
} from '../components/ui';
import { useBulkSelect } from '../hooks/useBulkSelect';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { formatCurrency, formatDate } from '../utils/format';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileTabBar } from '../components/tabs';

/**
 * Mobile-only floating action button for adding leads
 */
function AddLeadFAB({ onClick }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed right-6 bottom-24 z-40 w-14 h-14 rounded-2xl bg-accent-500 text-white shadow-xl shadow-accent-500/40 flex items-center justify-center border border-accent-400 md:hidden"
    >
      <Plus className="w-7 h-7" strokeWidth={2.5} />
    </motion.button>
  );
}

const tabs = [
  { key: 'cities', label: 'City Search', shortLabel: 'Cities', icon: Building },
  { key: 'permits', label: 'All Permits', shortLabel: 'Permits', icon: FileText },
  { key: 'builders', label: 'Builders', shortLabel: 'Builders', icon: Building2 },
  { key: 'discovery', label: 'Discovery', shortLabel: 'Discovery', icon: Compass },
  { key: 'manual', label: 'My Leads', shortLabel: 'My Leads', icon: Users },
  { key: 'home', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
];

// Tab order for directional animations
const TAB_ORDER = { cities: 0, permits: 1, builders: 2, discovery: 3, manual: 4, home: 5 };

export default function LeadFinder() {
  const { isMobile } = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL-persisted state
  const activeTab = searchParams.get('tab') || 'cities';
  const search = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || '';
  const tierFilter = searchParams.get('tier') || '';
  const permitCityFilter = searchParams.get('city') || '';
  const sortField = searchParams.get('sort') || 'score';
  const sortOrder = searchParams.get('order') || 'desc';
  
  // Local state (not persisted in URL)
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showUnifiedSearch, setShowUnifiedSearch] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);

  const queryClient = useQueryClient();
  
  // Helper to update URL params
  const updateParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    });
  }, [setSearchParams]);

  // Stable sort function — recomputed only when sort params change
  const sortData = useCallback((data) => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      const modifier = sortOrder === 'asc' ? 1 : -1;
      return (aVal > bVal ? 1 : -1) * modifier;
    });
  }, [sortField, sortOrder]);

  // Sorting (from URL params)
  const leadSort = {
    sortField,
    sortOrder,
    setSortField: (field) => updateParams({ sort: field }),
    setSortOrder: (order) => updateParams({ order: order }),
    sortData,
  };
  const permitSort = leadSort;

  // Queries
  const { 
    data: manualData, 
    isLoading: manualLoading, 
    isError: manualIsError, 
    error: manualError,
    refetch: refetchManual 
  } = useQuery({
    queryKey: ['leads', { status: statusFilter, search }],
    queryFn: () => api.leads.getAll({ status: statusFilter || undefined, search: search || undefined }),
    enabled: activeTab === 'manual' || activeTab === 'home',
    staleTime: 5 * 60_000, // 5 min — lead data doesn't change fast
    gcTime: 30 * 60_000,   // keep 30 min in cache
  });

  const { 
    data: permitData, 
    isLoading: permitLoading,
    isError: permitIsError,
    error: permitError,
    refetch: refetchPermits
  } = useQuery({
    queryKey: ['permits', { tier: tierFilter, status: statusFilter, search }],
    queryFn: () => api.permits.getAll({
      tier: tierFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
    }),
    enabled: activeTab === 'permits' || activeTab === 'home',
    staleTime: 5 * 60_000, // 5 min — permit data changes infrequently
    gcTime: 30 * 60_000,
  });

  const manualLeads = manualData?.leads || [];
  const permits = permitData?.permits || [];

  // Bulk selection
  const bulk = useBulkSelect(manualLeads);

  // Sorted data — sortData is stable so these only recompute when data/filter changes
  const sortedLeads = useMemo(() => sortData(manualLeads), [manualLeads, sortData]);
  const sortedPermits = useMemo(() => {
    const filtered = permitCityFilter ? permits.filter(p => p.city === permitCityFilter) : permits;
    return sortData(filtered);
  }, [permits, sortData, permitCityFilter]);

  // Unique cities from permits for filter
  const permitCities = useMemo(() => {
    const cities = [...new Set(permits.map(p => p.city).filter(Boolean))].sort();
    return cities;
  }, [permits]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
      setEditingLead(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.leads.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
      setEditingLead(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.leads.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setDeleteConfirm(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all([...ids].map(id => api.leads.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      bulk.clearSelection();
      setSelectionMode(false);
      setDeleteConfirm(null);
    },
  });

  const permitStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.permits.updateStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permits'] }),
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setShowUnifiedSearch(true),
    onEscape: () => {
      if (showUnifiedSearch) setShowUnifiedSearch(false);
      else if (selectedPermit) setSelectedPermit(null);
      else if (showModal) { setShowModal(false); setEditingLead(null); }
      else if (selectionMode) { setSelectionMode(false); bulk.clearSelection(); }
    },
  });

  // Handlers
  const handleSaveLead = useCallback((data) => {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  }, [editingLead, updateMutation, createMutation]);

  const handleEditLead = useCallback((lead) => { setEditingLead(lead); setShowModal(true); }, []);
  const handleAddNew = useCallback(() => { setEditingLead(null); setShowModal(true); }, []);
  const handlePermitStatusUpdate = useCallback((permitId, status) => permitStatusMutation.mutate({ id: permitId, status }), [permitStatusMutation]);
  const handleViewPermitDetails = useCallback((permit) => setSelectedPermit(permit), []);
  const handleViewLead = useCallback((lead) => { setEditingLead(lead); setShowModal(true); }, []);

  const handleSearchNavigate = useCallback((type, id, item) => {
    if (type === 'permit') { updateParams({ tab: 'permits' }); setSelectedPermit(item); }
    else if (type === 'lead') { updateParams({ tab: 'manual' }); handleEditLead(item); }
    else if (type === 'builder') { updateParams({ tab: 'builders' }); }
  }, [updateParams, handleEditLead]);

  const handleSortFieldChange = useCallback((field) => {
    if (field === sortField) {
      updateParams({ order: sortOrder === 'asc' ? 'desc' : 'asc' });
      return;
    }
    updateParams({ sort: field });
  }, [sortField, sortOrder, updateParams]);

  const handleSearchChange = useCallback((e) => {
    updateParams({ q: e.target.value });
  }, [updateParams]);
  
  // Clear all filters
  const handleClearFilters = () => {
    updateParams({ 
      q: '', 
      status: '', 
      tier: '', 
      city: '',
      sort: '',
      order: ''
    });
  };

  // Tab transition animation
  const [tabDirection, setTabDirection] = useState(null);
  const prevTab = useRef(activeTab);
  
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const direction = TAB_ORDER[newTab] > TAB_ORDER[prevTab.current] ? 'left' : 'right';
    setTabDirection(direction);
    prevTab.current = newTab;
    updateParams({ tab: newTab });
    if (selectionMode) { setSelectionMode(false); bulk.clearSelection(); }
  };
  
  // Reset animation direction after it plays
  useEffect(() => {
    const timer = setTimeout(() => setTabDirection(null), 350);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const isLoading = activeTab === 'manual' ? manualLoading : permitLoading;
  const isError = activeTab === 'manual' ? manualIsError : permitIsError;
  const error = activeTab === 'manual' ? manualError : permitError;
  const refetch = activeTab === 'manual' ? refetchManual : refetchPermits;
  const hasActiveFilters = search || statusFilter || tierFilter || permitCityFilter;

  // Tab definitions for mobile
  const tabDefinitions = useMemo(() => tabs.map(t => ({
    id: t.key,
    label: t.label,
    shortLabel: t.shortLabel,
    icon: t.icon,
  })), []);

  return (
    <div className={`${isMobile ? 'pb-28' : ''} p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6`}>
      {/* Mobile Page Header */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-50 tracking-tight">Lead Finder</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-surface-500 mt-0.5">
              {tabs.find(t => t.key === activeTab)?.label}
            </p>
          </div>
          <button 
            onClick={() => setShowUnifiedSearch(true)}
            className="w-10 h-10 rounded-xl bg-surface-card border border-white/5 flex items-center justify-center text-surface-400"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Actions (Desktop Only) */}
      {!isMobile && (
        <motion.div 
          className="flex items-center justify-end gap-2 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Unified Search Trigger */}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={Command}
            onClick={() => setShowUnifiedSearch(true)}
            className="shrink-0"
          >
            Search
            <kbd className="hidden md:inline ml-2 text-xs font-mono px-1.5 py-0.5 rounded bg-[#1F2430] text-[#64748B]">
              ⌘K
            </kbd>
          </Button>

          {activeTab === 'manual' && (
            <Button 
              variant="primary" 
              size="sm"
              leftIcon={Plus}
              onClick={handleAddNew}
              showRipple
            >
              Add Lead
            </Button>
          )}
        </motion.div>
      )}

      {/* Mobile FAB */}
      {isMobile && activeTab === 'manual' && (
        <AddLeadFAB onClick={handleAddNew} />
      )}
      {/* Desktop Tabs */}
      {!isMobile && (
        <AnimatedCard variant="glass" className="mb-4">
          <div className="flex border-b border-[#1F2430] overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cx(
                    'relative flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 font-semibold text-sm whitespace-nowrap transition-all duration-200',
                    isActive
                      ? 'text-[#3B82F6]'
                      : 'text-[#64748B] hover:text-[#94A3B8]'
                  )}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Icon 
                    className="w-4 h-4" 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
                      layoutId="activeTabIndicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </AnimatedCard>
      )}

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <MobileTabBar
          tabs={tabDefinitions}
          activeTab={activeTab}
          onChange={handleTabChange}
          variant="default"
          showLabels={true}
        />
      )}

      {/* Tab Content with smooth transitions */}
      <div 
        key={activeTab}
        className={`${tabDirection === 'left' ? 'page-slide-left' : tabDirection === 'right' ? 'page-slide-right' : 'page-transition-wrapper'}`}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Home Tab - Lead Pulse */}
        {activeTab === 'home' && (
          <LeadPulseHome
            manualLeads={manualLeads}
            permits={permits}
            onAddLead={handleAddNew}
            onViewLead={handleViewLead}
            onViewPermit={handleViewPermitDetails}
            onTabChange={handleTabChange}
            onOpenSearch={() => setShowUnifiedSearch(true)}
            isLoading={manualLoading || permitLoading}
          />
        )}

        {/* Discovery Tab */}
        {activeTab === 'discovery' && <DiscoveryTab />}

        {/* Builder Intelligence Tab */}
        {activeTab === 'builders' && (
          <BuilderIntelligenceTab onViewPermit={handleViewPermitDetails} />
        )}

        {/* City Search Tab */}
        {activeTab === 'cities' && (
          <CitySearch
            onViewPermit={handleViewPermitDetails}
            onSwitchToBuilders={() => handleTabChange('builders')}
          />
        )}

        {/* Manual & Permits: Search, Filters, Results */}
      {(activeTab === 'manual' || activeTab === 'permits') && (
        <>
          {/* Lead Funnel (manual only) */}
          {activeTab === 'manual' && manualLeads.length > 0 && (
            <LeadFunnel leads={manualLeads} />
          )}

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="card">
              <div className="card-body p-5">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                      type="text"
                      placeholder={
                        activeTab === 'permits'
                          ? 'Search by contractor, address...'
                          : 'Search by name, company, location...'
                      }
                      value={search}
                      onChange={handleSearchChange}
                      className="input pl-12"
                    />
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative hidden md:block">
                    <select
                      value={activeTab === 'manual' ? leadSort.sortField : permitSort.sortField}
                      onChange={(e) => handleSortFieldChange(e.target.value)}
                      className="input py-2 pr-8 text-sm font-semibold appearance-none cursor-pointer"
                    >
                      {activeTab === 'manual' ? (
                        <>
                          <option value="score">Sort: Score</option>
                          <option value="name">Sort: Name</option>
                          <option value="value">Sort: Value</option>
                          <option value="updatedAt">Sort: Date</option>
                        </>
                      ) : (
                        <>
                          <option value="leadScore">Sort: Score</option>
                          <option value="estimatedCost">Sort: Cost</option>
                          <option value="issuedDate">Sort: Date</option>
                          <option value="city">Sort: City</option>
                        </>
                      )}
                    </select>
                    <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                  </div>

                  {/* Selection mode toggle (manual only) */}
                  {activeTab === 'manual' && manualLeads.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectionMode(!selectionMode);
                        if (selectionMode) bulk.clearSelection();
                      }}
                      className={`btn-secondary shrink-0 ${selectionMode ? 'ring-2 ring-blue-400' : ''}`}
                      title="Select multiple leads"
                    >
                      <CheckSquare className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn-secondary md:hidden ${hasActiveFilters ? 'ring-2 ring-accent-500' : ''}`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={`card transition-all duration-300 ${showFilters ? 'block md:block' : 'hidden md:block'}`}>
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-3 md:hidden">
                  <h3 className="font-bold text-surface-900 dark:text-surface-100">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="tap-target text-surface-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeTab === 'permits' && (
                    <div>
                      <label className="label text-xs">Tier</label>
                      <select value={tierFilter} onChange={(e) => updateParams({ tier: e.target.value })} className="input" aria-label="Filter by tier">
                        <option value="">All Tiers</option>
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label text-xs">Status</label>
                    <select value={statusFilter} onChange={(e) => updateParams({ status: e.target.value })} className="input" aria-label="Filter by status">
                      <option value="">All Status</option>
                      {activeTab === 'manual' ? (
                        <>
                          <option value="hot">Hot</option>
                          <option value="warm">Warm</option>
                          <option value="cold">Cold</option>
                        </>
                      ) : (
                        <>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="quoted">Quoted</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </>
                      )}
                    </select>
                  </div>

                  {activeTab === 'permits' && permitCities.length > 0 && (
                    <div>
                      <label className="label text-xs">City</label>
                      <select value={permitCityFilter} onChange={(e) => updateParams({ city: e.target.value })} className="input" aria-label="Filter by city">
                        <option value="">All Cities</option>
                        {permitCities.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="btn-ghost text-sm mt-3 w-full"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          {selectionMode && bulk.selectionCount > 0 && (
            <div className="card border-l-4 border-l-blue-500 animate-slide-up">
              <div className="card-body p-3 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (bulk.selectedIds.size === manualLeads.length) bulk.clearSelection();
                    else bulk.selectAll();
                  }}
                  className="btn-ghost text-sm px-3 py-2"
                >
                  {bulk.selectedIds.size === manualLeads.length ? (
                    <><CheckSquare className="w-4 h-4" /> Deselect All</>
                  ) : (
                    <><Square className="w-4 h-4" /> Select All</>
                  )}
                </button>

                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {bulk.selectionCount} selected
                </span>

                <div className="flex-1" />

                <button
                  onClick={() => setDeleteConfirm({ type: 'bulk', ids: bulk.selectedIds })}
                  className="btn-danger text-sm px-4 py-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {isError ? (
            <div className="card border-l-4 border-l-red-500">
              <div className="card-body p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  Failed to load {activeTab === 'manual' ? 'leads' : 'permits'}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-4 max-w-md mx-auto">
                  {error?.message || 'Something went wrong while fetching the data. Please try again.'}
                </p>
                <button 
                  onClick={() => refetch()}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card">
                  <div className="card-body space-y-3">
                    <div className="skeleton h-6 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'manual' ? (
            sortedLeads.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-surface-600 dark:text-surface-400">
                    {sortedLeads.length} lead{sortedLeads.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedLeads.map((lead, idx) => (
                    <div key={lead.id} className="relative">
                      {/* Selection checkbox */}
                      {selectionMode && (
                        <button
                          onClick={(e) => bulk.toggleSelect(lead.id, idx, e.shiftKey)}
                          className="absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                          style={{
                            background: bulk.isSelected(lead.id) ? '#3B82F6' : 'rgba(255,255,255,0.8)',
                            borderColor: bulk.isSelected(lead.id) ? '#3B82F6' : 'rgba(200,197,191,0.5)',
                          }}
                        >
                          {bulk.isSelected(lead.id) && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                            </svg>
                          )}
                        </button>
                      )}
                      <LeadCard
                        lead={lead}
                        onEdit={handleEditLead}
                        onDelete={(id) => setDeleteConfirm({ type: 'single', id })}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <NoLeadsEmpty 
              onAdd={handleAddNew}
            />
            )
          ) : (
            // Permit Leads
            sortedPermits.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-surface-600 dark:text-surface-400">
                    {sortedPermits.length} permit lead{sortedPermits.length !== 1 ? 's' : ''} found
                    {permitCityFilter && ` in ${permitCityFilter}`}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedPermits.map(permit => (
                    <PermitLeadCard
                      key={permit.id}
                      permit={permit}
                      onStatusUpdate={handlePermitStatusUpdate}
                      onViewDetails={handleViewPermitDetails}
                      onViewBuilder={() => handleTabChange('builders')}
                    />
                  ))}
                </div>
              </>
            ) : (
              <NoPermitsEmpty 
              hasFilters={hasActiveFilters}
              onSearch={handleClearFilters}
            />
            )
          )}
        </>
      )}
      </div>

      {/* Modals */}
      {showModal && (
        <LeadModal
          lead={editingLead}
          onClose={() => { setShowModal(false); setEditingLead(null); }}
          onSave={handleSaveLead}
        />
      )}

      {selectedPermit && (
        <PermitDetailModal
          permit={selectedPermit}
          onClose={() => setSelectedPermit(null)}
          onStatusUpdate={handlePermitStatusUpdate}
        />
      )}

      {showUnifiedSearch && (
        <UnifiedSearch
          onClose={() => setShowUnifiedSearch(false)}
          onNavigate={handleSearchNavigate}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title={deleteConfirm.type === 'bulk' ? `Delete ${deleteConfirm.ids.size} leads?` : 'Delete lead?'}
          message="This action cannot be undone. The lead data will be permanently removed."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            if (deleteConfirm.type === 'bulk') {
              bulkDeleteMutation.mutate(deleteConfirm.ids);
            } else {
              deleteMutation.mutate(deleteConfirm.id);
            }
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
