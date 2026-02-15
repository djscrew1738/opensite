import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, Search, Filter, X, MapPin, DollarSign, Calendar, Hash, Building2, FileText, Phone, Mail } from 'lucide-react';
import LeadCard from '../components/leads/LeadCard';
import LeadModal from '../components/leads/LeadModal';
import PermitLeadCard from '../components/leads/PermitLeadCard';
import DiscoveryTab from '../components/discovery/DiscoveryTab';
import { formatCurrency, formatDate } from '../utils/format';

function PermitDetailModal({ permit, onClose, onStatusUpdate }) {
  if (!permit) return null;
  const tierColors = {
    hot: 'from-hot-500 to-hot-600',
    warm: 'from-warm-500 to-warm-600',
    cold: 'from-gray-400 to-gray-500'
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-concrete-200 dark:border-gray-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with score */}
        <div className={`bg-gradient-to-r ${tierColors[permit.leadTier] || tierColors.cold} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wide">{permit.leadTier} Lead</p>
              <p className="text-white text-4xl font-display font-bold">{permit.leadScore}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Contractor */}
          {permit.contractorName && (
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-500" />
                {permit.contractorName}
              </h2>
            </div>
          )}

          {/* Permit Type */}
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{permit.permitType}</p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-concrete-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                <MapPin className="w-3.5 h-3.5" /> Address
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {permit.address}{permit.city ? `, ${permit.city}` : ''} {permit.zipCode || ''}
              </p>
            </div>

            {permit.estimatedCost && (
              <div className="p-3 bg-concrete-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <DollarSign className="w-3.5 h-3.5" /> Est. Cost
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(permit.estimatedCost)}</p>
              </div>
            )}

            {permit.issuedDate && (
              <div className="p-3 bg-concrete-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Issued
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(permit.issuedDate)}</p>
              </div>
            )}

            {permit.permitNumber && (
              <div className="p-3 bg-concrete-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  <Hash className="w-3.5 h-3.5" /> Permit #
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">{permit.permitNumber}</p>
              </div>
            )}
          </div>

          {/* Metrics row */}
          {(permit.units || permit.squareFootage) && (
            <div className="flex gap-4">
              {permit.units && (
                <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-center">
                  <p className="text-2xl font-display font-bold text-blue-700 dark:text-blue-400">{permit.units}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Units</p>
                </div>
              )}
              {permit.squareFootage && (
                <div className="flex-1 p-3 bg-accent-50 dark:bg-accent-950/20 rounded-xl text-center">
                  <p className="text-2xl font-display font-bold text-accent-700 dark:text-accent-400">{permit.squareFootage.toLocaleString()}</p>
                  <p className="text-xs text-accent-600 dark:text-accent-500 font-medium">Sq. Ft.</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {permit.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{permit.description}</p>
            </div>
          )}

          {/* Contact info if available */}
          {(permit.contractorPhone || permit.contractorEmail) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contact</p>
              {permit.contractorPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {permit.contractorPhone}
                </div>
              )}
              {permit.contractorEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {permit.contractorEmail}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {permit.leadStatus === 'new' && (
              <button
                onClick={() => { onStatusUpdate(permit.id, 'contacted'); onClose(); }}
                className="btn-primary flex-1"
              >
                Mark Contacted
              </button>
            )}
            {permit.leadStatus === 'contacted' && (
              <button
                onClick={() => { onStatusUpdate(permit.id, 'quoted'); onClose(); }}
                className="btn-primary flex-1"
              >
                Mark Quoted
              </button>
            )}
            <button onClick={onClose} className="btn-secondary flex-1">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadFinder() {
  const [activeTab, setActiveTab] = useState('manual');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);

  const queryClient = useQueryClient();

  const { data: manualData, isLoading: manualLoading } = useQuery({
    queryKey: ['leads', { status: statusFilter, search }],
    queryFn: () => api.leads.getAll({ status: statusFilter || undefined, search: search || undefined }),
    enabled: activeTab === 'manual'
  });

  const { data: permitData, isLoading: permitLoading } = useQuery({
    queryKey: ['permits', { tier: tierFilter, status: statusFilter, search }],
    queryFn: () => api.permits.getAll({
      tier: tierFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined
    }),
    enabled: activeTab === 'permits'
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
      setEditingLead(null);
    },
    onError: (err) => console.error('Failed to create lead:', err)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.leads.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
      setEditingLead(null);
    },
    onError: (err) => console.error('Failed to update lead:', err)
  });

  const permitStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.permits.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    },
    onError: (err) => console.error('Failed to update permit status:', err)
  });

  const handleSaveLead = (data) => {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setShowModal(true);
  };

  const handlePermitStatusUpdate = (permitId, status) => {
    permitStatusMutation.mutate({ id: permitId, status });
  };

  const handleViewPermitDetails = (permit) => {
    setSelectedPermit(permit);
  };

  const manualLeads = manualData?.leads || [];
  const permits = permitData || [];
  const isLoading = activeTab === 'manual' ? manualLoading : permitLoading;

  const hasActiveFilters = search || statusFilter || tierFilter;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-primary-950 dark:text-gray-100 tracking-tight">
            Lead Finder
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
            Manage and track your leads
          </p>
        </div>

        {activeTab === 'manual' && (
          <button
            onClick={handleAddNew}
            className="btn-primary shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b-2 border-concrete-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('manual')}
            className={`relative px-6 py-4 font-bold text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === 'manual'
                ? 'text-accent-600 dark:text-accent-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Manual Leads
            {activeTab === 'manual' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('permits')}
            className={`relative px-6 py-4 font-bold text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === 'permits'
                ? 'text-accent-600 dark:text-accent-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Permit Leads
            {activeTab === 'permits' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('discovery')}
            className={`relative px-6 py-4 font-bold text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === 'discovery'
                ? 'text-accent-600 dark:text-accent-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Discovery
            {activeTab === 'discovery' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600" />
            )}
          </button>
        </div>
      </div>

      {/* Discovery Tab */}
      {activeTab === 'discovery' && <DiscoveryTab />}

      {/* Search and Filters (Manual & Permits only) */}
      {activeTab !== 'discovery' && (<>
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'permits'
                      ? "Search by contractor, address..."
                      : "Search by name, company, location..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-12"
                />
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary md:hidden ${
                  hasActiveFilters ? 'ring-2 ring-accent-500' : ''
                }`}
              >
                <Filter className="w-5 h-5" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters - Mobile Collapsible, Desktop Always Visible */}
        <div
          className={`card transition-all duration-300 ${
            showFilters ? 'block md:block' : 'hidden md:block'
          }`}
        >
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-3 md:hidden">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="tap-target text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeTab === 'permits' && (
                <div>
                  <label className="label text-xs">Tier</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="input"
                  >
                    <option value="">All Tiers</option>
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">🟡 Warm</option>
                    <option value="cold">⚪ Cold</option>
                  </select>
                </div>
              )}

              <div>
                <label className="label text-xs">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
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
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setTierFilter('');
                }}
                className="btn-ghost text-sm mt-3 w-full"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        // Manual Leads Tab
        manualLeads.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {manualLeads.length} lead{manualLeads.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manualLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onEdit={handleEditLead} />
              ))}
            </div>
          </>
        ) : (
          <div className="card">
            <div className="card-body text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-concrete-100 to-concrete-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
                No leads found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first lead'}
              </p>
              {!hasActiveFilters && (
                <button onClick={handleAddNew} className="btn-primary">
                  <Plus className="w-5 h-5" />
                  Add Your First Lead
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        // Permit Leads Tab
        permits.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {permits.length} permit lead{permits.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permits.map((permit) => (
                <PermitLeadCard
                  key={permit.id}
                  permit={permit}
                  onStatusUpdate={handlePermitStatusUpdate}
                  onViewDetails={handleViewPermitDetails}
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
              <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
                {hasActiveFilters ? 'No permits match your filters' : 'No permit leads found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or filters'
                  : 'Permit leads are automatically ingested daily from Fort Worth and other sources.'}
              </p>
            </div>
          </div>
        )
      )}
      </>)}

      {/* Lead Modal */}
      {showModal && (
        <LeadModal
          lead={editingLead}
          onClose={() => {
            setShowModal(false);
            setEditingLead(null);
          }}
          onSave={handleSaveLead}
        />
      )}

      {/* Permit Detail Modal */}
      {selectedPermit && (
        <PermitDetailModal
          permit={selectedPermit}
          onClose={() => setSelectedPermit(null)}
          onStatusUpdate={handlePermitStatusUpdate}
        />
      )}
    </div>
  );
}
