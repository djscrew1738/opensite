import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import JobPulseHome from '../components/dashboard/JobPulseHome';
import { DashboardSkeleton } from '../components/shared/LoadingStates';

/**
 * Dashboard Page — Job Pulse Command Center
 * Mobile-first with live API data and auto-refresh
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    jobs, 
    metrics, 
    focusItems, 
    weather, 
    isLoading, 
    error, 
    timeAgo, 
    handleRefresh 
  } = useDashboardData();

  // Navigate to Jobs page when a job card is clicked
  const handleJobClick = () => {
    navigate('/jobs');
  };

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
        weather={weather}
        isLoading={isLoading}
        onJobClick={handleJobClick}
      />
    </div>
  );
}
