// frontend/src/components/admin/UserManagement.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, AlertCircle, Edit, Trash2, Plus } from 'lucide-react';
import { ConfirmDialog } from '../shared';
import Modal from '../ui/Modal';

function UserForm({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'viewer',
    isActive: user?.isActive !== undefined ? user.isActive : true,
    password: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Username</label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} className="input input-bordered w-full" required />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} className="input input-bordered w-full" required />
      </div>
      <div>
        <label className="label">Password</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} className="input input-bordered w-full" placeholder={user ? 'Leave blank to keep unchanged' : ''} />
      </div>
      <div>
        <label className="label">Role</label>
        <select name="role" value={formData.role} onChange={handleChange} className="select select-bordered w-full">
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">Active</span>
          <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="toggle toggle-primary" />
        </label>
      </div>
      <div className="modal-action">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save</button>
      </div>
    </form>
  );
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirm(null);
    },
  });

  const handleSave = (data) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div>;
  }

  if (isError) {
    return <div className="text-red-500"><AlertCircle className="inline mr-2" />Error fetching users: {error.message}</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">User Management</h2>
          <button className="btn btn-primary" onClick={() => { setEditingUser(null); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? 'Yes' : 'No'}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditingUser(user); setShowModal(true); }}><Edit className="w-4 h-4" /></button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(user)}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editingUser ? 'Edit User' : 'Add User'} onClose={() => setShowModal(false)}>
          <UserForm user={editingUser} onSave={handleSave} onCancel={() => setShowModal(false)} />
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete User?"
          message={`Are you sure you want to delete ${deleteConfirm.username}?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
