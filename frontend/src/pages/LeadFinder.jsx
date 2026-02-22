import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Plus, Search, Filter, X, Command, Trash2,
  ArrowUpDown, CheckSquare, Square, Building2,
  MapPin, Users, Compass, FileText, Download, Sparkles,
  LayoutDashboard, Building
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
import { useBulkSelect } from '../hooks/useBulkSelect';
import { useSorting } from '../hooks/useSorting';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { formatCurrency, formatDate } from '../utils/format';

const tabs = [
  { key: 'cities', label: 'City Search', icon: Building },
  { key: 'permits', label: 'All Permits', icon: FileText },
  { key: 'builders', label: 'Builders', icon: Building2 },
  { key: 'discovery', label: 'Discovery', icon: Compass },
  { key: 'manual', label: 'My Leads', icon: Users },
  { key: 'home', label: 'Overview', icon: LayoutDashboard },
];

// Tab order for directional animations
const TAB_ORDER = { cities: 0, permits: 1, builders: 2, discovery: 3, manual: 4, home: 5 };

export default function LeadFinder() {
  const [activeTab, setActiveTab] = useState('cities');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showUnifiedSearch, setShowUnifiedSearch] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [permitCityFilter, setPermitCityFilter] = useState('');

  const queryClient = useQueryClient();

  // Sorting
  const leadSort = useSorting('score', 'desc');
  const permitSort = useSorting('leadScore', 'desc');

  // Queries
  const { data: manualData, isLoading: manualLoading } = useQuery({
    queryKey: ['leads', { status: statusFilter, search }],
    queryFn: () => api.leads.getAll({ status: statusFilter || undefined, search: search || undefined }),
    enabled: activeTab === 'manual' || activeTab === 'home',
  });

  const { data: permitData, isLoading: permitLoading } = useQuery({
    queryKey: ['permits', { tier: tierFilter, status: statusFilter, search }],
    queryFn: () => api.permits.getAll({
      tier: tierFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
    }),
    enabled: activeTab === 'permits',
  });

  const manualLeads = manualData?.leads || [];
  const permits = permitData || [];

  // Bulk selection
  const bulk = useBulkSelect(manualLeads);

  // Sorted data
  const sortedLeads = useMemo(() => leadSort.sortData(manualLeads), [manualLeads, leadSort.sortData]);
  const sortedPermits = useMemo(() => {
    let filtered = permits;
    if (permitCityFilter) {
      filtered = permits.filter(p => p.city === permitCityFilter);
    }
    return permitSort.sortData(filtered);
  }, [permits, permitSort.sortData, permitCityFilter]);

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
  const handleSaveLead = (data) => {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditLead = (lead) => { setEditingLead(lead); setShowModal(true); };
  const handleAddNew = () => { setEditingLead(null); setShowModal(true); };
  const handlePermitStatusUpdate = (permitId, status) => permitStatusMutation.mutate({ id: permitId, status });
  const handleViewPermitDetails = (permit) => setSelectedPermit(permit);

  const handleSearchNavigate = (type, id, item) => {
    if (type === 'permit') { setActiveTab('permits'); setSelectedPermit(item); }
    else if (type === 'lead') { setActiveTab('manual'); handleEditLead(item); }
    else if (type === 'builder') { setActiveTab('builders'); }
  };

  const handleViewLead = (lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  // Tab transition animation
  const [tabDirection, setTabDirection] = useState(null);
  const prevTab = useRef(activeTab);
  
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const direction = TAB_ORDER[newTab] > TAB_ORDER[prevTab.current] ? 'left' : 'right';
    setTabDirection(direction);
    prevTab.current = newTab;
    setActiveTab(newTab);
    if (selectionMode) { setSelectionMode(false); bulk.clearSelection(); }
  };
  
  // Reset animation direction after it plays
  useEffect(() => {
    const timer = setTimeout(() => setTabDirection(null), 350);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const isLoading = activeTab === 'manual' ? manualLoading : permitLoading;
  const hasActiveFilters = search || statusFilter || tierFilter || permitCityFilter;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-primary-950 dark:text-surface-100 tracking-tight">
            Lead Finder
          </h1>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 font-medium">
            Search permits by city across DFW metroplex
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Unified Search Trigger */}
          <button
            onClick={() => setShowUnifiedSearch(true)}
            className="btn-secondary shrink-0 gap-2"
            title="Search everything (Ctrl+K)"
          >
            <Command className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Search</span>
            <kbd className="hidden md:inline text-2xs font-mono px-1.5 py-0.5 rounded bg-concrete-200/50 dark:bg-surface-700 text-gray-400">
              ⌘K
            </kbd>
          </button>

          {activeTab === 'manual' && (
            <button onClick={handleAddNew} className="btn-primary shrink-0">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Lead</span>
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-surface-200 dark:border-surface-700 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative flex items-center gap-2 px-5 py-4 font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-surface-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={activeTab === tab.key ? 2.5 : 2} />
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

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
            onTabChange={setActiveTab}
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
            onSwitchToBuilders={() => setActiveTab('builders')}
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
              <div className="card-body p-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={
                        activeTab === 'permits'
                          ? 'Search by contractor, address...'
                          : 'Search by name, company, location...'
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input pl-12"
                    />
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative hidden md:block">
                    <select
                      value={activeTab === 'manual' ? leadSort.sortField : permitSort.sortField}
                      onChange={(e) => {
                        if (activeTab === 'manual') leadSort.toggleSort(e.target.value);
                        else permitSort.toggleSort(e.target.value);
                      }}
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
                    <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
              <div className="card-body p-4">
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
                      <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="input">
                        <option value="">All Tiers</option>
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label text-xs">Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
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
                      <select value={permitCityFilter} onChange={(e) => setPermitCityFilter(e.target.value)} className="input">
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
                    onClick={() => { setSearch(''); setStatusFilter(''); setTierFilter(''); setPermitCityFilter(''); }}
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
          {isLoading ? (
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
              <div className="card">
                <div className="card-body text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-concrete-100 to-concrete-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100 mb-2">
                    No leads found
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 mb-6">
                    {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by adding your first lead'}
                  </p>
                  {!hasActiveFilters && (
                    <button onClick={handleAddNew} className="btn-primary">
                      <Plus className="w-5 h-5" /> Add Your First Lead
                    </button>
                  )}
                </div>
              </div>
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
                      onViewBuilder={() => setActiveTab('builders')}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="card">
                <div className="card-body text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-blue-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100 mb-2">
                    {hasActiveFilters ? 'No permits match your filters' : 'No permit leads found'}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 text-sm max-w-md mx-auto">
                    {hasActiveFilters
                      ? 'Try adjusting your search criteria or filters'
                      : 'Permit leads are automatically ingested daily from Fort Worth and other sources.'}
                  </p>
                </div>
              </div>
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
