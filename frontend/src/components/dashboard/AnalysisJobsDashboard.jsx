import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useCallback, memo } from 'react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STATUS_STYLES = {
  completed: { 
    icon: CheckCircle, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    label: 'Completed' 
  },
  failed: { 
    icon: AlertCircle, 
    color: 'text-red-400', 
    bg: 'bg-red-500/10', 
    label: 'Failed' 
  },
  pending: { 
    icon: Clock, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    label: 'Pending' 
  },
  processing: { 
    icon: Loader2, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10', 
    label: 'Processing' 
  },
};

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to fetch analysis jobs
 */
function useAnalysisJobs() {
  return useQuery({
    queryKey: ['analysis-jobs'],
    queryFn: () => api.jobs.getAll(),
    refetchInterval: 10000,
  });
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Status badge with icon
 */
const StatusBadge = memo(function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.processing;
  const Icon = style.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${style.color} ${style.bg}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {style.label}
    </span>
  );
});

/**
 * Progress bar for job
 */
const JobProgress = memo(function JobProgress({ progress, status }) {
  const getBarColor = () => {
    if (status === 'failed') return '#EF4444';
    if (status === 'completed') return '#10B981';
    return '#3B82F6';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#1F2430] overflow-hidden max-w-[120px]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress || 0}%`, background: getBarColor() }}
        />
      </div>
      <span className="text-xs font-mono text-[#64748B]">{progress || 0}%</span>
    </div>
  );
});

/**
 * Individual job row
 */
const JobRow = memo(function JobRow({ job }) {
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString();
  };

  return (
    <tr className="hover:bg-[#181C24] transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">
        {String(job.id).slice(0, 8)}
      </td>
      <td className="px-4 py-3 text-[#F1F5F9]">
        {job.jobType || job.type || '--'}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3">
        <JobProgress progress={job.progress} status={job.status} />
      </td>
      <td className="px-4 py-3 text-xs text-[#64748B]">
        {formatDate(job.createdAt)}
      </td>
    </tr>
  );
});

/**
 * Jobs table
 */
const JobsTable = memo(function JobsTable({ jobs }) {
  return (
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
          {jobs.map(job => (
            <JobRow key={job.id} job={job} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

/**
 * Loading state
 */
const LoadingState = memo(function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );
});

/**
 * Error state with retry
 */
const ErrorState = memo(function ErrorState({ onRetry }) {
  return (
    <div className="p-6">
      <div className="max-w-md mx-auto p-6 rounded-xl text-center bg-[#111318] border border-[#1F2430]">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p className="text-sm text-[#94A3B8] mb-4">
          Failed to load analysis jobs
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
});

/**
 * Empty state
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="p-6">
      <div className="max-w-md mx-auto p-8 rounded-xl text-center bg-[#111318] border border-[#1F2430]">
        <Clock className="w-10 h-10 mx-auto mb-3 text-[#64748B]" />
        <h3 className="font-semibold text-[#F1F5F9] mb-1">No Analysis Jobs</h3>
        <p className="text-sm text-[#94A3B8]">
          Analysis jobs will appear here when blueprints or documents are processed.
        </p>
      </div>
    </div>
  );
});

/**
 * Dashboard header with refresh button
 */
const DashboardHeader = memo(function DashboardHeader({ onRefresh }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-[#1F2430]">
      <h3 className="font-semibold text-sm text-[#F1F5F9]">Analysis Jobs</h3>
      <button
        onClick={onRefresh}
        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1F2430] transition-colors"
        title="Refresh"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function AnalysisJobsDashboard() {
  const { data: jobs, isLoading, isError, refetch } = useAnalysisJobs();

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={handleRetry} />;
  }

  const jobList = Array.isArray(jobs?.data) 
    ? jobs.data 
    : Array.isArray(jobs) 
      ? jobs 
      : [];

  if (jobList.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="p-6">
      <div className="rounded-xl overflow-hidden bg-[#111318] border border-[#1F2430]">
        <DashboardHeader onRefresh={refetch} />
        <JobsTable jobs={jobList} />
      </div>
    </div>
  );
}
