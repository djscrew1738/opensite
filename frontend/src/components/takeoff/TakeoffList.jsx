import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, FileText, Trash2, Clock, DollarSign, ChevronRight, Loader, X 
} from 'lucide-react';
import { api } from '../../api/client';
import ConfirmDialog from '../shared/ConfirmDialog';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STATUS_COLORS = {
  draft: { bg: 'bg-surface-700', text: 'text-surface-300', border: 'border-surface-600' },
  active: { bg: 'bg-accent-500/10', text: 'text-accent-400', border: 'border-accent-500/30' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' }
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Create takeoff form
 */
const CreateTakeoffForm = memo(function CreateTakeoffForm({ 
  value, 
  onChange, 
  onSubmit, 
  onCancel, 
  isPending 
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSubmit();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Takeoff name..."
        className="input flex-1 text-sm"
        autoFocus
        aria-label="Takeoff name"
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim() || isPending}
        className="btn-primary text-sm disabled:opacity-50"
      >
        {isPending ? <Loader className="w-4 h-4 animate-spin" /> : 'Create'}
      </button>
      <button 
        onClick={onCancel} 
        className="btn-secondary text-sm"
        aria-label="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

/**
 * New takeoff button
 */
const NewTakeoffButton = memo(function NewTakeoffButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full btn-primary flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      New Takeoff
    </button>
  );
});

/**
 * Loading skeleton for takeoff list
 */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div 
          key={i} 
          className="h-16 bg-surface-800 rounded-lg animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
  );
});

/**
 * Empty state when no takeoffs exist
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center py-8 text-surface-500">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-800 mb-3">
        <FileText className="w-6 h-6 text-surface-500" />
      </div>
      <p className="text-sm">No takeoffs yet</p>
      <p className="text-xs mt-1 text-surface-600">Create one to start measuring</p>
    </div>
  );
});

/**
 * Individual takeoff list item
 */
const TakeoffItem = memo(function TakeoffItem({ 
  takeoff, 
  isSelected, 
  onSelect, 
  onDelete 
}) {
  const statusStyle = STATUS_COLORS[takeoff.status] || STATUS_COLORS.draft;
  const updatedDate = new Date(takeoff.updatedAt).toLocaleDateString();

  return (
    <div
      onClick={() => onSelect(takeoff)}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-accent-500 bg-accent-500/5 shadow-sm'
          : 'border-surface-700 bg-surface-800 hover:border-surface-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-surface-200 truncate text-sm">
              {takeoff.name}
            </h4>
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {takeoff.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {updatedDate}
            </span>
            {takeoff.totalCost > 0 && (
              <span className="flex items-center gap-1 font-medium text-surface-300">
                <DollarSign className="w-3 h-3" />
                {takeoff.totalCost.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => onDelete(e, takeoff)}
            className="p-1.5 text-surface-500 hover:text-danger-500 hover:bg-danger-500/10 rounded transition-colors"
            title="Delete takeoff"
            aria-label={`Delete ${takeoff.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-4 h-4 text-surface-600" />
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * TakeoffList - Material takeoff management list
 * 
 * Features:
 * - Create new takeoffs
 * - List existing takeoffs with status
 * - Select takeoff for editing
 * - Delete takeoff with confirmation
 * 
 * @param {Object} props
 * @param {Function} props.onSelectTakeoff - Callback when takeoff is selected
 * @param {string|number} props.selectedId - Currently selected takeoff ID
 */
function TakeoffList({ onSelectTakeoff, selectedId }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [takeoffToDelete, setTakeoffToDelete] = useState(null);

  // Fetch takeoffs
  const { data: takeoffsData, isLoading } = useQuery({
    queryKey: ['takeoffs'],
    queryFn: () => api.takeoff.getAll(),
    staleTime: 30000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => api.takeoff.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['takeoffs'] });
      setShowCreate(false);
      setNewName('');
      onSelectTakeoff?.(data);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.takeoff.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['takeoffs'] });
      setTakeoffToDelete(null);
    },
  });

  const takeoffs = takeoffsData?.takeoffs || [];

  // Handlers
  const handleCreate = useCallback(() => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim() });
  }, [newName, createMutation]);

  const handleDeleteClick = useCallback((e, takeoff) => {
    e.stopPropagation();
    setTakeoffToDelete(takeoff);
  }, []);

  const handleSelect = useCallback((takeoff) => {
    onSelectTakeoff?.(takeoff);
  }, [onSelectTakeoff]);

  const handleCancelCreate = useCallback(() => {
    setShowCreate(false);
    setNewName('');
  }, []);

  return (
    <div className="space-y-3">
      {/* Create button or form */}
      {showCreate ? (
        <CreateTakeoffForm
          value={newName}
          onChange={setNewName}
          onSubmit={handleCreate}
          onCancel={handleCancelCreate}
          isPending={createMutation.isPending}
        />
      ) : (
        <NewTakeoffButton onClick={() => setShowCreate(true)} />
      )}

      {/* List content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : takeoffs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {takeoffs.map(takeoff => (
            <TakeoffItem
              key={takeoff.id}
              takeoff={takeoff}
              isSelected={selectedId === takeoff.id}
              onSelect={handleSelect}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {takeoffToDelete && (
        <ConfirmDialog
          title="Delete Takeoff?"
          message={`Are you sure you want to delete "${takeoffToDelete.name}"? All measurements and items will be permanently removed.`}
          confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          onConfirm={() => deleteMutation.mutate(takeoffToDelete.id)}
          onCancel={() => setTakeoffToDelete(null)}
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

TakeoffList.propTypes = {
  onSelectTakeoff: PropTypes.func.isRequired,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

TakeoffList.defaultProps = {
  selectedId: null,
};

CreateTakeoffForm.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isPending: PropTypes.bool.isRequired,
};

NewTakeoffButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

TakeoffItem.propTypes = {
  takeoff: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['draft', 'active', 'completed']),
    updatedAt: PropTypes.string.isRequired,
    totalCost: PropTypes.number,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default memo(TakeoffList);
