import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Target,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  HardHat,
} from 'lucide-react';
import { JobCard } from '../jobs';
import { PHASES, PHASE_MAP } from '../../styles/tokens';
import { DashboardSkeleton } from '../shared/LoadingStates';

// Icon mapping for metrics
const iconMap = {
  HardHat,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
};

const PHASE_TABS = [
  { key: 'all', label: 'All', color: '#3B82F6' },
  ...PHASES,
];

/**
 * JobPulseHome - Dashboard view for job management
 * 
 * Props:
 * - jobs: Array of job objects from API
 * - metrics: Array of metric objects { label, value, icon, color, bg }
 * - focusItems: Array of focus items { job, reason, reasonColor }
 * - isLoading: Boolean loading state
 * - onJobClick: Function(job) called when a job is clicked
 */
export default function JobPulseHome({ 
  jobs = [], 
  metrics = [],
  focusItems = [],
  isLoading = false,
  onJobClick 
}) {
  const [activePhase, setActivePhase] = useState('all');
  
  // Show skeleton during loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const safeJobs = Array.isArray(jobs) ? jobs : [];

  const filteredJobs = useMemo(
    () => activePhase === 'all' ? safeJobs : safeJobs.filter(j => j && j.phase === activePhase),
    [safeJobs, activePhase],
  );

  const phaseCounts = useMemo(() => {
    const counts = { all: safeJobs.length };
    for (const p of PHASES) counts[p.key] = 0;
    for (const j of safeJobs) {
      if (j && j.phase && counts[j.phase] !== undefined) {
        counts[j.phase]++;
      }
    }
    return counts;
  }, [safeJobs]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* ── 1. METRICS STRIP ─────────────────────── */}
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        <div className="flex gap-3 w-max">
          {Array.isArray(metrics) && metrics.map(m => {
            if (!m) return null;
            const Icon = iconMap[m.icon] || HardHat;
            return (
              <div
                key={m.label}
                className="snap-start flex-shrink-0 w-[140px] rounded-xl border border-border bg-surface-card p-3.5 transition-colors hover:border-border-strong"
              >
                <div className={`${m.bg} ${m.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
                  <Icon size={18} />
                </div>
                <p className="font-mono text-2xl font-extrabold tabular-nums text-text-primary leading-none">
                  {m.value}
                </p>
                <p className="text-xs text-text-muted mt-1 truncate">{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. TODAY'S FOCUS ──────────────────────── */}
      {focusItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-accent-amber" />
            <h2 className="text-label font-bold text-text-primary">Today's Focus</h2>
          </div>

          <div className="space-y-2">
            {focusItems.map(({ job, reason, reasonColor }) => {
              const phase = PHASE_MAP[job.phase] || PHASES[0];
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onJobClick?.(job)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface-card h-14 px-3 text-left transition-colors hover:border-border-strong active:scale-[0.99]"
                >
                  <span
                    className="w-[3px] self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: phase.color }}
                  />
                  <span className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{job.address}</p>
                    <p className="text-xs text-text-muted truncate">{job.city}, TX {job.zip}</p>
                  </span>
                  <span className={`text-xs font-semibold flex-shrink-0 ${reasonColor}`}>
                    {reason}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 3. PHASE TAB SWITCHER + JOB BOARD ─────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard size={18} className="text-accent" />
          <h2 className="text-label font-bold text-text-primary">Job Board</h2>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 mb-4">
          <div className="flex gap-2 w-max">
            {PHASE_TABS.map(tab => {
              const isActive = activePhase === tab.key;
              const count = phaseCounts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActivePhase(tab.key)}
                  className={`snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:bg-surface-elevated'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`font-mono text-xs tabular-nums px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-elevated text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Job cards grid */}
        <div className="grid gap-3 stagger-container">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                onClick={() => onJobClick?.(job)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-border bg-surface-card p-8 text-center">
              <HardHat size={32} className="mx-auto text-text-muted mb-2" />
              <p className="text-sm text-text-secondary">No jobs in this phase</p>
            </div>
          )}
        </div>
      </section>

      {/* Subtle attribution */}
      <div className="flex justify-end pt-4">
        <span className="text-[10px] text-text-muted/40 tracking-wide">
          by Cory
        </span>
      </div>
    </div>
  );
}
