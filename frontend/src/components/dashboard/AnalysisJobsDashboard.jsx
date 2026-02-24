// frontend/src/components/dashboard/AnalysisJobsDashboard.jsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const JobStatusIcon = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="text-green-500" />;
    case 'failed':
      return <AlertCircle className="text-red-500" />;
    case 'pending':
      return <Clock className="text-yellow-500" />;
    default:
      return <Loader2 className="animate-spin text-blue-500" />;
  }
};

export default function AnalysisJobsDashboard() {
  const { data: jobs, isLoading, isError, error } = useQuery({
    queryKey: ['analysis-jobs'],
    queryFn: () => api.jobs.getAll(), // Assuming an endpoint exists
  });

  if (isLoading) {
    return <div className="flex justify-center items-center"><Loader2 className="animate-spin" /></div>;
  }

  if (isError) {
    return <div className="text-red-500"><AlertCircle className="inline mr-2" />Error fetching jobs: {error.message}</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Analysis Jobs</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Blueprint</th>
                <th>Type</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {jobs?.map(job => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.blueprintId}</td>
                  <td>{job.jobType}</td>
                  <td><JobStatusIcon status={job.status} /> {job.status}</td>
                  <td>
                    <progress className="progress progress-primary w-56" value={job.progress} max="100"></progress>
                  </td>
                  <td>{new Date(job.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
