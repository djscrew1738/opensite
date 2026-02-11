import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, Search } from 'lucide-react';
import LeadCard from '../components/leads/LeadCard';
import LeadModal from '../components/leads/LeadModal';

export default function LeadFinder() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leads', { status: statusFilter, search }],
    queryFn: () => api.leads.getAll({ status: statusFilter || undefined, search: search || undefined })
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

  const leads = data?.leads || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Lead Finder</h1>
        <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Lead
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, company, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full pl-10"
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">All Status</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
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
      ) : leads.length > 0 ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
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
