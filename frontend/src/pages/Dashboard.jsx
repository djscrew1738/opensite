import { Plus, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ensureArray } from '../utils/safeArray';
import JobPulseHome from '../components/dashboard/JobPulseHome';
import { DashboardSkeleton } from '../components/shared/LoadingStates';

/**
 * Dashboard Page — Job Pulse Command Center
 * Mobile-first with FAB → Quick Add bottom sheet
 * Connected to live API data with auto-refresh
 */

// Format relative time (e.g., "2 seconds ago")
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

// Compute focus items from jobs data
function computeFocusItems(jobs) {
  // Robust validation - ensure jobs is actually an array
  const safeJobs = ensureArray(jobs);
  if (safeJobs.length === 0) return [];
  
  const items = [];
  
  // Find overdue jobs (in phase > 10 days)
  const overdue = safeJobs
    .filter(j => j && (j.daysInPhase > 10 || j.status === 'overdue'))
    .sort((a, b) => (b?.daysInPhase || 0) - (a?.daysInPhase || 0))
    .slice(0, 2);
  
  overdue.forEach(job => {
    items.push({
      job,
      reason: `Overdue ${job.daysInPhase} days`,
      reasonColor: 'text-accent-red',
      priority: 1
    });
  });
  
  // Find jobs due today or soon
  const dueSoon = safeJobs
    .filter(j => j && (j.status === 'due-today' || j.daysInPhase >= 7))
    .slice(0, 2);
  
  dueSoon.forEach(job => {
    items.push({
      job,
      reason: job.status === 'due-today' ? 'Due today' : 'Inspection soon',
      reasonColor: 'text-accent-amber',
      priority: 2
    });
  });
  
  return items.slice(0, 4);
}

// Compute metrics from jobs data
function computeMetrics(jobs, stats) {
  // Ensure jobs is an array
  const safeJobs = ensureArray(jobs);
  
  const activeJobs = safeJobs.filter(j => j && j.status !== 'completed').length;
  const overdueJobs = safeJobs.filter(j => j && (j.status === 'overdue' || j.daysInPhase > 10)).length;
  const inspectionsDue = safeJobs.filter(j => j && j.status === 'due-today').length;
  
  // Calculate revenue from estimates if available
  const totalRevenue = safeJobs.reduce((sum, j) => {
    if (!j) return sum;
    const estimate = j.estimate?.total || j.totalPrice || 0;
    return sum + estimate;
  }, 0);
  
  // Pipeline = jobs in early phases
  const pipelineJobs = safeJobs.filter(j => 
    j && ['underground', 'roughin', 'rough-in'].includes(j.phase)
  ).length;
  
  return [
    { 
      label: 'Active Jobs', 
      value: String(activeJobs), 
      icon: 'HardHat', 
      color: 'text-accent', 
      bg: 'bg-accent/10' 
    },
    { 
      label: 'Inspections', 
      value: String(inspectionsDue || stats?.inspectionsDue || 0), 
      icon: 'Calendar', 
      color: 'text-accent-purple', 
      bg: 'bg-accent-purple/10' 
    },
    { 
      label: 'Overdue', 
      value: String(overdueJobs), 
      icon: 'AlertTriangle', 
      color: 'text-accent-red', 
      bg: 'bg-accent-red/10' 
    },
    { 
      label: 'Revenue', 
      value: totalRevenue > 0 
        ? `$${(totalRevenue / 1000).toFixed(1)}K` 
        : '$' + (stats?.revenue || '0'),
      icon: 'DollarSign', 
      color: 'text-accent-green', 
      bg: 'bg-accent-green/10' 
    },
    { 
      label: 'Pipeline', 
      value: String(pipelineJobs), 
      icon: 'TrendingUp', 
      color: 'text-accent-amber', 
      bg: 'bg-accent-amber/10' 
    },
  ];
}

// Compute status based on days in phase
function computeStatus(job) {
  const days = job.daysInPhase || job.daysInCurrentPhase || 0;
  if (days > 10) return 'overdue';
  if (days >= 7) return 'due-today';
  return 'healthy';
}

export default function Dashboard() {
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
  
  // Combine loading states
  const isLoading = isLoadingJobs || isLoadingStats;
  const error = jobsError || statsError;
  
  // Transform API data
  const jobs = useMemo(() => {
    // Defensive: ensure jobsData is an object before accessing properties
    const data = jobsData && typeof jobsData === 'object' ? jobsData : {};
    const rawJobs = ensureArray(data.projects ?? data.jobs);
    
    // Normalize job structure to match JobPulseHome expectations
    return rawJobs.map(job => {
      if (!job || typeof job !== 'object') return null;
      const days = job.daysInPhase || job.daysInCurrentPhase || Math.floor((new Date() - new Date(job.updatedAt)) / (1000 * 60 * 60 * 24)) || 0;
      return {
        id: job.id || job.jobId,
        address: job.address || job.name || 'Unknown Address',
        city: job.city || 'Unknown City',
        zip: job.zip || job.zipCode || '',
        builder: job.builder || job.builderName || 'Unknown Builder',
        phase: (job.phase || job.currentPhase || 'underground').replace(/-/g, ''),
        daysInPhase: days,
        status: job.status || computeStatus({ daysInPhase: days }),
        estimate: job.estimate,
        totalPrice: job.totalPrice || job.estimate?.total
      };
    }).filter(Boolean); // Remove any null entries
  }, [jobsData]);
  
  // Compute derived data
  const focusItems = useMemo(() => computeFocusItems(jobs), [jobs]);
  const metrics = useMemo(() => 
    computeMetrics(jobs, statsData), 
    [jobs, statsData]
  );
  
  const [timeAgo, setTimeAgo] = useState('just now');
  
  // Update time ago string every minute
  useEffect(() => {
    const update = () => {
      setTimeAgo(formatRelativeTime(lastUpdated));
    };
    
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    refetchJobs();
    refetchStats();
    setLastUpdated(new Date());
  };
  
  // Error state
  if (error && !isLoading) {
    return (
      <div className="relative min-h-screen p-4 md:p-8">
        <div className="card p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Failed to load dashboard
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error.message || 'Unable to fetch job data. Please try again.'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
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
      />
    </div>
  );
}
