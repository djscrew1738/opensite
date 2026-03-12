import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import JobPulseHome from '../components/dashboard/JobPulseHome';
import { DashboardSkeleton } from '../components/shared/LoadingStates';
import { colors } from '../styles/tokens';

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
          style={{ 
            backgroundColor: colors.surface.card, 
            border: `1px solid ${colors.danger.border}`,
          }}
        >
          <div className="flex items-start gap-4">
            <AlertCircle 
              className="w-8 h-8 flex-shrink-0" 
              style={{ color: colors.danger.light }}
            />
            <div>
              <h2 
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                Failed to load dashboard
              </h2>
              <p 
                className="text-sm mt-1"
                style={{ color: colors.text.secondary }}
              >
                {error.message || 'Unable to fetch job data. Please try again.'}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ 
                  backgroundColor: colors.danger.muted, 
                  color: colors.danger.light,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.danger.DEFAULT}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.danger.muted;
                }}
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
    <div className="relative min-h-screen page-transition-wrapper">
      {/* Refresh indicator */}
      <div 
        className="absolute top-4 right-4 flex items-center gap-2 text-xs z-10"
        style={{ color: colors.text.muted }}
      >
        <Clock className="w-3 h-3" />
        <span>Updated {timeAgo}</span>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md transition-colors"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
