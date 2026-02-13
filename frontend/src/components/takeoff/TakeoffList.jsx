import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  Plus, FileText, Trash2, Clock, DollarSign, ChevronRight, Loader
} from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700'
};

export default function TakeoffList({ onSelectTakeoff, selectedId }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: takeoffsData, isLoading } = useQuery({
    queryKey: ['takeoffs'],
    queryFn: () => api.takeoff.getAll()
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.takeoff.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['takeoffs'] });
      setShowCreate(false);
      setNewName('');
      if (onSelectTakeoff) onSelectTakeoff(data);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.takeoff.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takeoffs'] });
    }
  });

  const takeoffs = takeoffsData?.takeoffs || [];

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim() });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this takeoff?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-3">
      {/* Create button */}
      {showCreate ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
            placeholder="Takeoff name..."
            className="input flex-1 text-sm"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || createMutation.isPending}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : 'Create'}
          </button>
          <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Takeoff
        </button>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : takeoffs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No takeoffs yet</p>
          <p className="text-xs mt-1">Create one to start measuring</p>
        </div>
      ) : (
        <div className="space-y-2">
          {takeoffs.map(takeoff => (
            <div
              key={takeoff.id}
              onClick={() => onSelectTakeoff(takeoff)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedId === takeoff.id
                  ? 'border-primary-300 bg-primary-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate text-sm">
                      {takeoff.name}
                    </h4>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[takeoff.status] || STATUS_COLORS.draft}`}>
                      {takeoff.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(takeoff.updatedAt).toLocaleDateString()}
                    </span>
                    {takeoff.totalCost > 0 && (
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <DollarSign className="w-3 h-3" />
                        {takeoff.totalCost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => handleDelete(e, takeoff.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
