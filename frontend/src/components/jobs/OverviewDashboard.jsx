import { memo } from 'react';
import { HardHat, Clock, CheckCircle2, DollarSign, ChevronRight, Trash2 } from 'lucide-react';
import { NoJobsEmpty } from '../empty-states';
import { AccessibleCard } from '../ui';

const STAT_CARDS = [
  { key: 'active', label: 'Active Jobs', icon: HardHat, color: '#3B82F6' },
  { key: 'pending', label: 'Pending', icon: Clock, color: '#F59E0B' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: '#10B981' },
  { key: 'totalValue', label: 'Total Value', icon: DollarSign, color: '#8B5CF6', isCurrency: true },
];

const OverviewDashboard = memo(function OverviewDashboard({ jobs, stats, onSelectJob, onDeleteJob }) {
  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => (
          <AccessibleCard
            key={stat.key}
            isHoverable
            ariaLabel={`${stat.label}: ${stat.isCurrency ? `$${(stats[stat.key] || 0).toLocaleString()}` : stats[stat.key] || 0}`}
            className="p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}20` }}
                aria-hidden="true"
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-100">
                  {stat.isCurrency ? `$${(stats[stat.key] || 0).toLocaleString()}` : stats[stat.key] || 0}
                </p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            </div>
          </AccessibleCard>
        ))}
      </div>

      {/* Recent Jobs */}
      <div>
        <h3 className="font-semibold mb-4 text-surface-100">Recent Jobs</h3>
        {jobs.length === 0 ? (
          <AccessibleCard ariaLabel="No jobs available">
            <NoJobsEmpty onCreate={() => {}} />
          </AccessibleCard>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="relative group">
                <AccessibleCard
                  isInteractive
                  isHoverable
                  onClick={() => onSelectJob(job)}
                  ariaLabel={`${job.name || 'Untitled Job'}, ${job.builder || 'No builder'}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-100 truncate">
                      {job.name || 'Untitled'}
                    </p>
                    <p className="text-sm text-surface-500">
                      {job.builder} · {job.phase}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteJob(job);
                      }}
                      className="p-2 text-surface-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-surface-500" aria-hidden="true" />
                  </div>
                </AccessibleCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default OverviewDashboard;
