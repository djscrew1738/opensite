import { useState, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, AlertCircle, Edit, Trash2, Plus, UserPlus } from 'lucide-react';
import { ConfirmDialog } from '../shared';
import Modal from '../ui/Modal';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const USER_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'editor', label: 'Editor', description: 'Can create and edit content' },
  { value: 'viewer', label: 'Viewer', description: 'View-only access' },
];

const INITIAL_FORM_STATE = {
  username: '',
  email: '',
  role: 'viewer',
  isActive: true,
  password: '',
};

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage toggle state (modal visibility, confirmation, etc.)
 */
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, toggle, setTrue, setFalse, setValue };
}

/**
 * Hook for form state management with validation
 */
function useUserForm(initialUser = null) {
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM_STATE,
    username: initialUser?.username || '',
    email: initialUser?.email || '',
    role: initialUser?.role || 'viewer',
    isActive: initialUser?.isActive ?? true,
  }));

  const [errors, setErrors] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!initialUser && !formData.password.trim()) {
      newErrors.password = 'Password is required for new users';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, initialUser]);

  const reset = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
  }, []);

  return { formData, errors, handleChange, validate, reset, setFormData };
}

/**
 * Hook for user data and mutations
 */
function useUserManagement() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    users,
    isLoading,
    isError,
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}

// ═══════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════

/**
 * User form component for create/edit
 */
function UserForm({ user, onSave, onCancel, isSubmitting }) {
  const { formData, errors, handleChange, validate } = useUserForm(user);
  const isEditing = Boolean(user);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (validate()) {
      // Only include password if it's provided (for edits)
      const dataToSave = {
        ...formData,
        password: formData.password.trim() || undefined,
      };
      onSave(dataToSave);
    }
  }, [formData, onSave, validate]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
        required
        placeholder="Enter username"
      />
      
      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        placeholder="user@example.com"
      />
      
      <FormField
        label={isEditing ? 'Password (leave blank to keep unchanged)' : 'Password'}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required={!isEditing}
        placeholder={isEditing ? '••••••••' : 'Enter password'}
      />

      <div>
        <label className="label">
          <span className="label-text">Role</span>
        </label>
        <select 
          name="role" 
          value={formData.role} 
          onChange={handleChange} 
          className="select select-bordered w-full"
        >
          {USER_ROLES.map(role => (
            <option key={role.value} value={role.value}>
              {role.label} — {role.description}
            </option>
          ))}
        </select>
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input 
            type="checkbox" 
            name="isActive" 
            checked={formData.isActive} 
            onChange={handleChange} 
            className="toggle toggle-primary" 
          />
          <div>
            <span className="label-text font-medium">Active Account</span>
            <p className="text-xs text-text-muted">
              {formData.isActive ? 'User can log in and use the system' : 'Account is disabled'}
            </p>
          </div>
        </label>
      </div>

      <div className="modal-action pt-4">
        <button 
          type="button" 
          className="btn btn-ghost" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save User'
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * Reusable form field with error handling
 */
function FormField({ label, name, error, ...props }) {
  return (
    <div>
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <input 
        name={name}
        className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && (
        <span className="label-text-alt text-error mt-1">{error}</span>
      )}
    </div>
  );
}

/**
 * Table row for a single user - memoized for performance
 */
const UserTableRow = memo(function UserTableRow({ user, onEdit, onDelete }) {
  const roleColorClass = {
    admin: 'badge-error',
    editor: 'badge-warning',
    viewer: 'badge-info',
  }[user.role] || 'badge-ghost';

  return (
    <tr className="hover:bg-surface-elevated/50 transition-colors">
      <td className="font-medium">{user.username}</td>
      <td className="text-text-secondary">{user.email}</td>
      <td>
        <span className={`badge ${roleColorClass} badge-sm`}>
          {user.role}
        </span>
      </td>
      <td>
        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-ghost'} badge-sm`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div className="flex gap-1">
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={() => onEdit(user)}
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="btn btn-sm btn-ghost text-error hover:bg-error/10" 
            onClick={() => onDelete(user)}
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

/**
 * Empty state when no users exist
 */
function EmptyState({ onAddUser }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
        <UserPlus className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        No Users Yet
      </h3>
      <p className="text-text-secondary mb-4">
        Get started by adding your first team member
      </p>
      <button className="btn btn-primary" onClick={onAddUser}>
        <Plus className="w-4 h-4 mr-2" />
        Add User
      </button>
    </div>
  );
}

/**
 * Error state display
 */
function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-error" />
      </div>
      <h3 className="text-lg font-semibold text-error mb-2">
        Error Loading Users
      </h3>
      <p className="text-text-secondary mb-4 max-w-sm mx-auto">
        {error?.message || 'Something went wrong while fetching users'}
      </p>
      <button className="btn btn-outline" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function UserManagement() {
  const { 
    users, 
    isLoading, 
    isError, 
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useUserManagement();

  const modal = useToggle(false);
  const deleteConfirm = useToggle(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleAddUser = useCallback(() => {
    setEditingUser(null);
    modal.setTrue();
  }, [modal]);

  const handleEditUser = useCallback((user) => {
    setEditingUser(user);
    modal.setTrue();
  }, [modal]);

  const handleCloseModal = useCallback(() => {
    modal.setFalse();
    setEditingUser(null);
  }, [modal]);

  const handleSave = useCallback(async (data) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    handleCloseModal();
  }, [editingUser, createMutation, updateMutation, handleCloseModal]);

  const handleDelete = useCallback((user) => {
    setEditingUser(user);
    deleteConfirm.setTrue();
  }, [deleteConfirm]);

  const handleConfirmDelete = useCallback(async () => {
    if (editingUser) {
      await deleteMutation.mutateAsync(editingUser.id);
      deleteConfirm.setFalse();
      setEditingUser(null);
    }
  }, [editingUser, deleteMutation, deleteConfirm]);

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  const hasUsers = users?.length > 0;

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="card-title text-xl">User Management</h2>
            <p className="text-text-secondary text-sm mt-1">
              Manage team members and their access levels
            </p>
          </div>
          {hasUsers && (
            <button 
              className="btn btn-primary" 
              onClick={handleAddUser}
              disabled={isMutating}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          )}
        </div>

        {!hasUsers ? (
          <EmptyState onAddUser={handleAddUser} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-surface-elevated/50">
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <UserTableRow 
                    key={user.id} 
                    user={user} 
                    onEdit={handleEditUser}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal.value && (
        <Modal 
          title={editingUser ? `Edit ${editingUser.username}` : 'Add New User'} 
          onClose={handleCloseModal}
        >
          <UserForm 
            user={editingUser} 
            onSave={handleSave} 
            onCancel={handleCloseModal}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.value && (
        <ConfirmDialog
          title="Delete User?"
          message={`Are you sure you want to delete ${editingUser?.username}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            deleteConfirm.setFalse();
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
