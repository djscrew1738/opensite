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

/* ────────────────────────────────────────────────
   Mock data — DFW construction jobs for CTL Plumbing
   ──────────────────────────────────────────────── */
const MOCK_JOBS = [
  { id: 'CTL-1041', address: '2914 Ridgewood Dr', city: 'Aubrey', zip: '76227', builder: 'DR Horton', phase: 'underground', daysInPhase: 4, status: 'healthy' },
  { id: 'CTL-1042', address: '5103 Copper Canyon Trl', city: 'Fort Worth', zip: '76244', builder: 'Horizon Homes', phase: 'roughin', daysInPhase: 7, status: 'due-today' },
  { id: 'CTL-1043', address: '810 Bluebonnet Blvd', city: 'Celina', zip: '75009', builder: 'DR Horton', phase: 'topout', daysInPhase: 12, status: 'overdue' },
  { id: 'CTL-1044', address: '3321 Harvest Bend Ln', city: 'Prosper', zip: '75078', builder: 'DR Horton', phase: 'trim', daysInPhase: 3, status: 'healthy' },
  { id: 'CTL-1045', address: '1204 Prairie Wind Dr', city: 'Sanger', zip: '76266', builder: 'Horizon Homes', phase: 'final', daysInPhase: 2, status: 'due-today' },
  { id: 'CTL-1046', address: '7750 Stampede Dr', city: 'Haslet', zip: '76052', builder: 'DR Horton', phase: 'underground', daysInPhase: 1, status: 'healthy' },
  { id: 'CTL-1047', address: '4460 Ridgepoint Ct', city: 'Denton', zip: '76210', builder: 'Horizon Homes', phase: 'roughin', daysInPhase: 9, status: 'overdue' },
  { id: 'CTL-1048', address: '990 Twin Creeks Pkwy', city: 'Allen', zip: '75013', builder: 'DR Horton', phase: 'topout', daysInPhase: 5, status: 'healthy' },
  { id: 'CTL-1049', address: '6622 Elm Fork Dr', city: 'Frisco', zip: '75033', builder: 'Horizon Homes', phase: 'trim', daysInPhase: 6, status: 'healthy' },
  { id: 'CTL-1050', address: '1180 Cattlemen Dr', city: 'Pilot Point', zip: '76258', builder: 'DR Horton', phase: 'underground', daysInPhase: 11, status: 'overdue' },
];

const METRICS = [
  { label: 'Active Jobs', value: '12', icon: HardHat, color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'Inspections', value: '3', icon: Calendar, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  { label: 'Overdue', value: '2', icon: AlertTriangle, color: 'text-accent-red', bg: 'bg-accent-red/10' },
  { label: 'Revenue', value: '$47.2K', icon: DollarSign, color: 'text-accent-green', bg: 'bg-accent-green/10' },
  { label: 'Pipeline', value: '8', icon: TrendingUp, color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
];

const FOCUS_ITEMS = [
  { job: MOCK_JOBS[2], reason: 'Overdue 12 days', reasonColor: 'text-accent-red' },
  { job: MOCK_JOBS[6], reason: 'Overdue 9 days', reasonColor: 'text-accent-red' },
  { job: MOCK_JOBS[1], reason: 'Inspection today', reasonColor: 'text-accent-amber' },
  { job: MOCK_JOBS[4], reason: 'Due today', reasonColor: 'text-accent-amber' },
];

const PHASE_TABS = [
  { key: 'all', label: 'All', color: '#3B82F6' },
  ...PHASES,
];

/* ────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────── */
export default function JobPulseHome({ jobs = MOCK_JOBS, onJobClick }) {
  const [activePhase, setActivePhase] = useState('all');

  const filteredJobs = useMemo(
    () => activePhase === 'all' ? jobs : jobs.filter(j => j.phase === activePhase),
    [jobs, activePhase],
  );

  const phaseCounts = useMemo(() => {
    const counts = { all: jobs.length };
    for (const p of PHASES) counts[p.key] = 0;
    for (const j of jobs) if (counts[j.phase] !== undefined) counts[j.phase]++;
    return counts;
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* ── 1. METRICS STRIP ─────────────────────── */}
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        <div className="flex gap-3 w-max">
          {METRICS.map(m => (
            <div
              key={m.label}
              className="snap-start flex-shrink-0 w-[140px] rounded-xl border border-border bg-surface-card p-3.5 transition-colors hover:border-border-strong"
            >
              <div className={`${m.bg} ${m.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
                <m.icon size={18} />
              </div>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-text-primary leading-none">
                {m.value}
              </p>
              <p className="text-xs text-text-muted mt-1 truncate">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. TODAY'S FOCUS ──────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-accent-amber" />
          <h2 className="text-label font-bold text-text-primary">Today's Focus</h2>
        </div>

        <div className="space-y-2">
          {FOCUS_ITEMS.map(({ job, reason, reasonColor }) => {
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
            filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
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
    </div>
  );
}
