import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, Search } from 'lucide-react';
import LeadCard from '../components/leads/LeadCard';
import LeadModal from '../components/leads/LeadModal';
import PermitLeadCard from '../components/leads/PermitLeadCard';

export default function LeadFinder() {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'permits'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [selectedPermit, setSelectedPermit] = useState(null);

  const queryClient = useQueryClient();

  // Manual leads query
  const { data: manualData, isLoading: manualLoading } = useQuery({
    queryKey: ['leads', { status: statusFilter, search }],
    queryFn: () => api.leads.getAll({ status: statusFilter || undefined, search: search || undefined }),
    enabled: activeTab === 'manual'
  });

  // Permit leads query
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

  const handleViewPermitDetails = (permit) => {
    setSelectedPermit(permit);
    // TODO: Implement permit details modal
    alert('Permit details modal - to be implemented');
  };

  const manualLeads = manualData?.leads || [];
  const permits = permitData || [];
  const isLoading = activeTab === 'manual' ? manualLoading : permitLoading;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lead Finder</h1>
        {activeTab === 'manual' && (
          <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Lead
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manual Leads
          </button>
          <button
            onClick={() => setActiveTab('permits')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'permits'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Permit Leads 🏗️
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'permits' ? "Search by contractor, address..." : "Search by name, company, or location..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full pl-10"
              />
            </div>
          </div>

          {activeTab === 'permits' && (
            <div className="min-w-[150px]">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Tiers</option>
                <option value="hot">🔥 Hot</option>
                <option value="warm">🟡 Warm</option>
                <option value="cold">⚪ Cold</option>
              </select>
            </div>
          )}

          <div className="min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
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
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : activeTab === 'manual' ? (
        // Manual Leads Tab
        manualLeads.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Showing {manualLeads.length} lead{manualLeads.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manualLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onEdit={handleEditLead} />
              ))}
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No leads found</p>
            <button onClick={handleAddNew} className="btn-primary">
              Add Your First Lead
            </button>
          </div>
        )
      ) : (
        // Permit Leads Tab
        permits.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Showing {permits.length} permit lead{permits.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">
              {tierFilter || statusFilter || search
                ? 'No permits match your filters'
                : 'No permit leads found'}
            </p>
            <p className="text-sm text-gray-400">
              Permit leads are automatically ingested daily from Fort Worth and other sources.
            </p>
          </div>
        )
      )}

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
