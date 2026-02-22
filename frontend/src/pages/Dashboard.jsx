import { Plus, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import JobPulseHome from '../components/dashboard/JobPulseHome';
import { QuickAddSheet } from '../components/ui/BottomSheet';
import { DashboardSkeleton } from '../components/shared/LoadingStates';

/**
 * Dashboard Page — Job Pulse Command Center
 * Mobile-first with FAB → Quick Add bottom sheet
 * Connected to live API data with auto-refresh
 */

// Format relative time (e.g., "2 seconds ago")
function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  return `${Math.floor(diff / 3600)} hours ago`;
}

// Compute focus items from jobs data
function computeFocusItems(jobs) {
  if (!jobs || jobs.length === 0) return [];
  
  const items = [];
  
  // Find overdue jobs (in phase > 10 days)
  const overdue = jobs
    .filter(j => j.daysInPhase > 10 || j.status === 'overdue')
    .sort((a, b) => b.daysInPhase - a.daysInPhase)
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
  const dueSoon = jobs
    .filter(j => j.status === 'due-today' || j.daysInPhase >= 7)
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
  const activeJobs = jobs?.filter(j => j.status !== 'completed').length || 0;
  const overdueJobs = jobs?.filter(j => j.status === 'overdue' || j.daysInPhase > 10).length || 0;
  const inspectionsDue = jobs?.filter(j => j.status === 'due-today').length || 0;
  
  // Calculate revenue from estimates if available
  const totalRevenue = jobs?.reduce((sum, j) => {
    const estimate = j.estimate?.total || j.totalPrice || 0;
    return sum + estimate;
  }, 0) || 0;
  
  // Pipeline = jobs in early phases
  const pipelineJobs = jobs?.filter(j => 
    ['underground', 'roughin'].includes(j.phase)
  ).length || 0;
  
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

export default function Dashboard() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Fetch jobs data
  const { 
    data: jobsData, 
    isLoading: isLoadingJobs, 
    error: jobsError,
    refetch: refetchJobs,
    dataUpdatedAt: jobsUpdatedAt
  } = useQuery({
    queryKey: ['dashboard-jobs'],
    queryFn: async () => {
      const response = await api.projects.getAll();
      setLastUpdated(new Date());
      return response;
    },
    staleTime: 120000, // 2 min — dashboard data doesn't change fast
  });
  
  // Fetch dashboard stats
  const { 
    data: statsData, 
    isLoading: isLoadingStats,
    error: statsError 
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 120000, // 2 min — stats don't change fast
  });
  
  // Combine loading states
  const isLoading = isLoadingJobs || isLoadingStats;
  const error = jobsError || statsError;
  
  // Transform API data
  const jobs = useMemo(() => {
    const rawJobs = jobsData?.projects || jobsData?.jobs || [];
    
    // Normalize job structure to match JobPulseHome expectations
    return rawJobs.map(job => ({
      id: job.id || job.jobId,
      address: job.address || job.name || 'Unknown Address',
      city: job.city || 'Unknown City',
      zip: job.zip || job.zipCode || '',
      builder: job.builder || job.builderName || 'Unknown Builder',
      phase: job.phase || job.currentPhase || 'underground',
      daysInPhase: job.daysInPhase || job.daysInCurrentPhase || 0,
      status: job.status || computeStatus(job),
      estimate: job.estimate,
      totalPrice: job.totalPrice || job.estimate?.total
    }));
  }, [jobsData]);
  
  // Compute status based on days in phase
  function computeStatus(job) {
    const days = job.daysInPhase || job.daysInCurrentPhase || 0;
    if (days > 10) return 'overdue';
    if (days >= 7) return 'due-today';
    return 'healthy';
  }
  
  // Compute derived data
  const focusItems = useMemo(() => computeFocusItems(jobs), [jobs]);
  const metrics = useMemo(() => 
    computeMetrics(jobs, statsData), 
    [jobs, statsData]
  );
  
  // Time since last update
  const timeAgo = useMemo(() => 
    formatRelativeTime(lastUpdated), 
    [lastUpdated, jobsUpdatedAt]
  );
  
  // Handle manual refresh
  const handleRefresh = () => {
    refetchJobs();
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

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => setShowQuickAdd(true)}
        aria-label="Quick add job"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Quick Add Bottom Sheet */}
      <QuickAddSheet
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        title="Quick Add"
        subtitle="Add a new job or inspection"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="label">Job Address</label>
            <input className="input" placeholder="123 Main St, Frisco, 75034" />
          </div>
          <div>
            <label className="label">Builder</label>
            <select className="input select-arrow">
              <option value="">Select builder...</option>
              <option value="drhorton">DR Horton</option>
              <option value="horizon">Horizon Homes</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Starting Phase</label>
            <select className="input select-arrow">
              <option value="underground">Underground</option>
              <option value="roughin">Rough-In</option>
              <option value="topout">Top-Out</option>
              <option value="trim">Trim</option>
              <option value="final">Final</option>
            </select>
          </div>
          <button className="btn-primary w-full">
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </QuickAddSheet>
    </div>
  );
}
