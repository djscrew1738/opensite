import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ensureArray } from '../utils/safeArray';
import JobPulseHome from '../components/dashboard/JobPulseHome';
import { DashboardSkeleton } from '../components/shared/LoadingStates';

/**
 * Dashboard Page — Job Pulse Command Center
 * Mobile-first with live API data and auto-refresh
 */

// Phase normalization map — handles API variations
const PHASE_NORMALIZE = {
  'underground': 'underground',
  'rough-in': 'roughin',
  'roughin': 'roughin',
  'rough_in': 'roughin',
  'top-out': 'topout',
  'topout': 'topout',
  'top_out': 'topout',
  'trim': 'trim',
  'final': 'final',
  'complete': 'final',
};

const EARLY_PHASES = ['underground', 'roughin'];

function formatRelativeTime(date) {
  if (!date) return 'never';
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (isNaN(diff)) return 'unknown';
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  return `${Math.floor(diff / 3600)} hours ago`;
}

function computeFocusItems(jobs) {
  const safeJobs = ensureArray(jobs);
  if (safeJobs.length === 0) return [];

  const items = [];

  // Overdue: in phase > 10 days
  safeJobs
    .filter(j => j && j.daysInPhase > 10)
    .sort((a, b) => (b.daysInPhase || 0) - (a.daysInPhase || 0))
    .slice(0, 2)
    .forEach(job => {
      items.push({
        job,
        reason: `Overdue ${job.daysInPhase} days`,
        reasonColor: 'text-accent-red',
      });
    });

  // Due soon: 7-10 days in phase (exclude overdue already captured)
  safeJobs
    .filter(j => j && j.daysInPhase >= 7 && j.daysInPhase <= 10)
    .slice(0, 2)
    .forEach(job => {
      items.push({
        job,
        reason: 'Inspection soon',
        reasonColor: 'text-accent-amber',
      });
    });

  return items.slice(0, 4);
}

function computeMetrics(jobs, stats) {
  const safeJobs = ensureArray(jobs);

  const activeJobs = safeJobs.filter(j => j && j.status !== 'completed').length;
  const overdueJobs = safeJobs.filter(j => j && j.daysInPhase > 10).length;
  const inspectionsDue = safeJobs.filter(j => j && j.daysInPhase >= 7 && j.daysInPhase <= 10).length;

  const totalRevenue = safeJobs.reduce((sum, j) => {
    if (!j) return sum;
    return sum + (j.estimate?.total || j.totalPrice || 0);
  }, 0);

  const pipelineJobs = safeJobs.filter(j =>
    j && EARLY_PHASES.includes(j.phase)
  ).length;

  return [
    { label: 'Active Jobs', value: String(activeJobs), icon: 'HardHat', color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Inspections', value: String(inspectionsDue || stats?.inspectionsDue || 0), icon: 'Calendar', color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
    { label: 'Overdue', value: String(overdueJobs), icon: 'AlertTriangle', color: 'text-accent-red', bg: 'bg-accent-red/10' },
    { label: 'Revenue', value: totalRevenue > 0 ? `$${(totalRevenue / 1000).toFixed(1)}K` : '$' + (stats?.revenue || '0'), icon: 'DollarSign', color: 'text-accent-green', bg: 'bg-accent-green/10' },
    { label: 'Pipeline', value: String(pipelineJobs), icon: 'TrendingUp', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  ];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch jobs data
  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    error: jobsError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['dashboard-jobs'],
    queryFn: async () => {
      const response = await api.projects.getAll();
      setLastUpdated(new Date());
      return response;
    },
    staleTime: 120000,
  });

  // Fetch dashboard stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 120000,
  });

  const isLoading = isLoadingJobs || isLoadingStats;
  const error = jobsError || statsError;

  // Transform API data — normalize job structure
  const jobs = useMemo(() => {
    const data = jobsData && typeof jobsData === 'object' ? jobsData : {};
    const rawJobs = ensureArray(data.projects ?? data.jobs);

    return rawJobs.map(job => {
      if (!job || typeof job !== 'object') return null;
      const days = job.daysInPhase || job.daysInCurrentPhase || Math.floor((new Date() - new Date(job.updatedAt)) / (1000 * 60 * 60 * 24)) || 0;
      const normalizedPhase = PHASE_NORMALIZE[job.phase || job.currentPhase] || 'underground';
      return {
        id: job.id || job.jobId,
        address: job.address || job.name || 'Unknown Address',
        city: job.city || 'Unknown City',
        zip: job.zip || job.zipCode || '',
        builder: job.builder || job.builderName || 'Unknown Builder',
        phase: normalizedPhase,
        daysInPhase: days,
        status: days > 10 ? 'overdue' : days >= 7 ? 'due-today' : (job.status || 'healthy'),
        estimate: job.estimate,
        totalPrice: job.totalPrice || job.estimate?.total
      };
    }).filter(Boolean);
  }, [jobsData]);

  const focusItems = useMemo(() => computeFocusItems(jobs), [jobs]);
  const metrics = useMemo(() => computeMetrics(jobs, statsData), [jobs, statsData]);

  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    const update = () => setTimeAgo(formatRelativeTime(lastUpdated));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = useCallback(() => {
    refetchJobs();
    refetchStats();
    setLastUpdated(new Date());
  }, [refetchJobs, refetchStats]);

  // Navigate to Jobs page when a job card is clicked
  const handleJobClick = useCallback((job) => {
    navigate('/jobs');
  }, [navigate]);

  // Error state
  if (error && !isLoading) {
    return (
      <div className="relative min-h-screen p-4 md:p-8">
        <div
          className="rounded-xl p-6"
          style={{ background: '#111318', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-[#F1F5F9]">
                Failed to load dashboard
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                {error.message || 'Unable to fetch job data. Please try again.'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#F87171' }}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-screen p-4 md:p-8">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Refresh indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-text-muted z-10">
        <Clock className="w-3 h-3" />
        <span>Updated {timeAgo}</span>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
          title="Refresh now"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <JobPulseHome
        jobs={jobs}
        metrics={metrics}
        focusItems={focusItems}
        isLoading={isLoading}
        onJobClick={handleJobClick}
      />
    </div>
  );
}
