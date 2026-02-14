import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, Search, Filter, X } from 'lucide-react';
import LeadCard from '../components/leads/LeadCard';
import LeadModal from '../components/leads/LeadModal';
import PermitLeadCard from '../components/leads/PermitLeadCard';
import DiscoveryTab from '../components/discovery/DiscoveryTab';

export default function LeadFinder() {
  const [activeTab, setActiveTab] = useState('manual');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

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
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.leads.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
      setEditingLead(null);
    }
  });

  const permitStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.permits.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    }
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

  const handleViewPermitDetails = () => {
    alert('Permit details modal - to be implemented');
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
          <h1 className="text-3xl md:text-5xl font-display font-bold text-primary-950 tracking-tight">
            Lead Finder
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
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
        <div className="flex border-b-2 border-concrete-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('manual')}
            className={`relative px-6 py-4 font-bold text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === 'manual'
                ? 'text-accent-600'
                : 'text-gray-500 hover:text-gray-700'
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
                ? 'text-accent-600'
                : 'text-gray-500 hover:text-gray-700'
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
                ? 'text-accent-600'
                : 'text-gray-500 hover:text-gray-700'
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
              <h3 className="font-bold text-gray-900">Filters</h3>
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
              <p className="text-sm font-semibold text-gray-600">
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
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                No leads found
              </h3>
              <p className="text-gray-600 mb-6">
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
              <p className="text-sm font-semibold text-gray-600">
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
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                {hasActiveFilters ? 'No permits match your filters' : 'No permit leads found'}
              </h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or filters'
                  : 'Permit leads are automatically ingested daily from Fort Worth and other sources.'}
              </p>
            </div>
          </div>
        )
      )}
      </>)}

      {/* Modal */}
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
    </div>
  );
}
