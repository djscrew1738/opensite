import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const STATUS_STYLES = {
  completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
  failed:    { icon: AlertCircle, color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Failed' },
  pending:   { icon: Clock,       color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Pending' },
  processing:{ icon: Loader2,     color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'Processing' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.processing;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${s.color} ${s.bg}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {s.label}
    </span>
  );
}

export default function AnalysisJobsDashboard() {
  const { data: jobs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analysis-jobs'],
    queryFn: () => api.jobs.getAll(),
    refetchInterval: 10000,
  });

  const jobList = Array.isArray(jobs?.data) ? jobs.data : Array.isArray(jobs) ? jobs : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div
          className="max-w-md mx-auto p-6 rounded-xl text-center"
          style={{ background: '#111318', border: '1px solid #1F2430' }}
        >
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm text-[#94A3B8] mb-4">
            {error?.message || 'Failed to load analysis jobs'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (jobList.length === 0) {
    return (
      <div className="p-6">
        <div
          className="max-w-md mx-auto p-8 rounded-xl text-center"
          style={{ background: '#111318', border: '1px solid #1F2430' }}
        >
          <Clock className="w-10 h-10 mx-auto mb-3 text-[#64748B]" />
          <h3 className="font-semibold text-[#F1F5F9] mb-1">No Analysis Jobs</h3>
          <p className="text-sm text-[#94A3B8]">
            Analysis jobs will appear here when blueprints or documents are processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#111318', border: '1px solid #1F2430' }}
      >
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2430' }}>
          <h3 className="font-semibold text-sm text-[#F1F5F9]">Analysis Jobs</h3>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1F2430] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#64748B] uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Job ID</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2430]">
              {jobList.map(job => (
                <tr key={job.id} className="hover:bg-[#181C24] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">
                    {String(job.id).slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-[#F1F5F9]">{job.jobType || job.type || '--'}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#1F2430] overflow-hidden max-w-[120px]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${job.progress || 0}%`,
                            background: job.status === 'failed' ? '#EF4444'
                              : job.status === 'completed' ? '#10B981'
                              : '#3B82F6',
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[#64748B]">{job.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">
                    {job.createdAt ? new Date(job.createdAt).toLocaleString() : '--'}
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
