/**
 * AnalysisJobsDashboard Component
 * Real-time dashboard for monitoring blueprint analysis jobs
 * 
 * @module components/dashboard/AnalysisJobsDashboard
 */

import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo } from 'react';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  FileSearch,
  TrendingUp
} from 'lucide-react';
import { api } from '../../api/client';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, {icon: React.ComponentType, color: string, bg: string, label: string}>} */
const STATUS_STYLES = {
  completed: { 
    icon: CheckCircle, 
    color: colors.success.light, 
    bg: colors.success.muted, 
    label: 'Completed' 
  },
  failed: { 
    icon: AlertCircle, 
    color: colors.danger.light, 
    bg: colors.danger.muted, 
    label: 'Failed' 
  },
  pending: { 
    icon: Clock, 
    color: colors.warning.light, 
    bg: colors.warning.muted, 
    label: 'Pending' 
  },
  processing: { 
    icon: Loader2, 
    color: colors.accent.light, 
    bg: colors.accent.muted, 
    label: 'Processing' 
  },
};

/** @type {number} Polling interval in milliseconds */
const POLLING_INTERVAL = 10000;

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to fetch analysis jobs with automatic polling
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
function useAnalysisJobs() {
  return useQuery({
    queryKey: ['analysis-jobs'],
    queryFn: () => api.jobs.getAll(),
    refetchInterval: POLLING_INTERVAL,
    staleTime: POLLING_INTERVAL / 2,
  });
}

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Format a date string to localized format
 * @param {string | null | undefined} dateString
 * @returns {string}
 */
const formatDate = (dateString) => {
  if (!dateString) return '--';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return '--';
  }
};

/**
 * Truncate a job ID for display
 * @param {string | number} id
 * @returns {string}
 */
const truncateId = (id) => {
  const str = String(id);
  return str.length > 8 ? str.slice(0, 8) + '...' : str;
};

/**
 * Get progress bar color based on status
 * @param {string} status
 * @returns {string}
 */
const getProgressColor = (status) => {
  switch (status) {
    case 'failed': return colors.danger.DEFAULT;
    case 'completed': return colors.success.DEFAULT;
    default: return colors.accent.DEFAULT;
  }
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Status badge with icon
 * @param {{status: string}} props
 */
const StatusBadge = memo(function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.processing;
  const Icon = style.icon;
  
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ 
        color: style.color, 
        backgroundColor: style.bg,
      }}
    >
      <Icon 
        className="w-3 h-3" 
        style={status === 'processing' ? { animation: 'spin 1s linear infinite' } : undefined}
      />
      {style.label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

/**
 * Progress bar for job
 * @param {{progress: number, status: string}} props
 */
const JobProgress = memo(function JobProgress({ progress, status }) {
  const clampedProgress = Math.min(Math.max(progress || 0, 0), 100);
  const barColor = getProgressColor(status);

  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[120px]"
        style={{ backgroundColor: colors.border.default }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedProgress}%`, background: barColor }}
        />
      </div>
      <span 
        className="text-xs font-mono"
        style={{ color: colors.text.muted }}
      >
        {clampedProgress}%
      </span>
    </div>
  );
});

JobProgress.displayName = 'JobProgress';

/**
 * Individual job row
 * @param {{job: {id: string | number, jobType?: string, type?: string, status: string, progress: number, createdAt: string}}} props
 */
const JobRow = memo(function JobRow({ job }) {
  const jobType = job.jobType || job.type || '--';

  return (
    <tr 
      className="transition-colors hover:bg-surface-elevated"
      style={{ borderBottom: `1px solid ${colors.border.default}` }}
    >
      <td 
        className="px-4 py-3 font-mono text-xs"
        style={{ color: colors.text.secondary }}
        title={String(job.id)}
      >
        {truncateId(job.id)}
      </td>
      <td 
        className="px-4 py-3"
        style={{ color: colors.text.primary }}
      >
        {jobType}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3">
        <JobProgress progress={job.progress} status={job.status} />
      </td>
      <td 
        className="px-4 py-3 text-xs"
        style={{ color: colors.text.muted }}
      >
        {formatDate(job.createdAt)}
      </td>
    </tr>
  );
});

JobRow.displayName = 'JobRow';

/**
 * Jobs table
 * @param {{jobs: Array<Record<string, any>>}} props
 */
const JobsTable = memo(function JobsTable({ jobs }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr 
            className="text-left text-xs uppercase tracking-wider"
            style={{ 
              color: colors.text.muted,
              borderBottom: `1px solid ${colors.border.strong}`,
            }}
          >
            <th className="px-4 py-3 font-medium">Job ID</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <JobRow key={job.id} job={job} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

JobsTable.displayName = 'JobsTable';

/**
 * Stats card for dashboard summary
 * @param {{icon: React.ComponentType, label: string, value: string | number, color: string}} props
 */
const StatsCard = memo(function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ 
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p 
          className="text-lg font-bold"
          style={{ color: colors.text.primary }}
        >
          {value}
        </p>
        <p 
          className="text-xs"
          style={{ color: colors.text.muted }}
        >
          {label}
        </p>
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';

/**
 * Dashboard stats summary
 * @param {{jobs: Array<Record<string, any>>}} props
 */
const DashboardStats = memo(function DashboardStats({ jobs }) {
  const stats = useMemo(() => {
    const total = jobs.length;
    const processing = jobs.filter(j => j.status === 'processing').length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    
    return { total, processing, completed, failed };
  }, [jobs]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <StatsCard 
        icon={FileSearch} 
        label="Total Jobs" 
        value={stats.total} 
        color={colors.accent.DEFAULT}
      />
      <StatsCard 
        icon={Loader2} 
        label="Processing" 
        value={stats.processing} 
        color={colors.accent.DEFAULT}
      />
      <StatsCard 
        icon={CheckCircle} 
        label="Completed" 
        value={stats.completed} 
        color={colors.success.DEFAULT}
      />
      <StatsCard 
        icon={TrendingUp} 
        label="Success Rate" 
        value={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'} 
        color={colors.warning.DEFAULT}
      />
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

/**
 * Loading state
 */
const LoadingState = memo(function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 
        className="w-6 h-6 animate-spin" 
        style={{ color: colors.accent.DEFAULT }}
      />
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

/**
 * Error state with retry
 * @param {{onRetry: () => void}} props
 */
const ErrorState = memo(function ErrorState({ onRetry }) {
  return (
    <div className="p-6">
      <div 
        className="max-w-md mx-auto p-6 rounded-xl text-center"
        style={{ 
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <AlertCircle 
          className="w-10 h-10 mx-auto mb-3" 
          style={{ color: colors.danger.light }}
        />
        <p 
          className="text-sm mb-4"
          style={{ color: colors.text.secondary }}
        >
          Failed to load analysis jobs
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ 
            backgroundColor: colors.accent.DEFAULT,
            color: 'white',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accent.hover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accent.DEFAULT}
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
});

ErrorState.displayName = 'ErrorState';

/**
 * Empty state
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="p-6">
      <div 
        className="max-w-md mx-auto p-8 rounded-xl text-center"
        style={{ 
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <Clock 
          className="w-10 h-10 mx-auto mb-3" 
          style={{ color: colors.text.muted }}
        />
        <h3 
          className="font-semibold mb-1"
          style={{ color: colors.text.primary }}
        >
          No Analysis Jobs
        </h3>
        <p 
          className="text-sm"
          style={{ color: colors.text.secondary }}
        >
          Analysis jobs will appear here when blueprints or documents are processed.
        </p>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Dashboard header with refresh button
 * @param {{onRefresh: () => void, isRefreshing?: boolean}} props
 */
const DashboardHeader = memo(function DashboardHeader({ onRefresh, isRefreshing = false }) {
  return (
    <div 
      className="px-4 py-3 flex items-center justify-between"
      style={{ borderBottom: `1px solid ${colors.border.default}` }}
    >
      <h3 
        className="font-semibold text-sm"
        style={{ color: colors.text.primary }}
      >
        Analysis Jobs
      </h3>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
        style={{ color: colors.text.muted }}
        onMouseEnter={(e) => !isRefreshing && (e.currentTarget.style.color = colors.text.primary)}
        onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
        title="Refresh"
        type="button"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * AnalysisJobsDashboard - Dashboard view for monitoring blueprint analysis jobs
 * Features real-time updates via polling every 10 seconds
 */
export default function AnalysisJobsDashboard() {
  const { data: jobs, isLoading, isError, refetch, isFetching } = useAnalysisJobs();

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const jobList = useMemo(() => {
    if (Array.isArray(jobs?.data)) return jobs.data;
    if (Array.isArray(jobs)) return jobs;
    return [];
  }, [jobs]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={handleRetry} />;
  }

  if (jobList.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="p-6">
      <div 
        className="rounded-xl overflow-hidden"
        style={{ 
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
          boxShadow: shadows.card,
        }}
      >
        <DashboardHeader onRefresh={refetch} isRefreshing={isFetching} />
        <div className="p-4">
          <DashboardStats jobs={jobList} />
          <JobsTable jobs={jobList} />
        </div>
      </div>
    </div>
  );
}

AnalysisJobsDashboard.displayName = 'AnalysisJobsDashboard';
