// frontend/src/components/admin/UserManagement.jsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, AlertCircle, Edit, Trash2 } from 'lucide-react';

export default function UserManagement() {
  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(), // Assuming an endpoint exists
  });

  if (isLoading) {
    return <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div>;
  }

  if (isError) {
    return <div className="text-red-500"><AlertCircle className="inline mr-2" />Error fetching users: {error.message}</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">User Management</h2>
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
                    <button className="btn btn-sm btn-ghost"><Edit className="w-4 h-4" /></button>
                    <button className="btn btn-sm btn-ghost"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
