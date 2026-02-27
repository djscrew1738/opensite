import { useState, useMemo, memo } from 'react';
import {
  LayoutDashboard,
  Target,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  HardHat,
  CloudSun,
} from 'lucide-react';
import { JobCard } from '../jobs';
import { PHASES, PHASE_MAP } from '../../styles/tokens';
import { DashboardSkeleton } from '../shared/LoadingStates';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const ICON_MAP = {
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

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Individual metric card
 */
const MetricCard = memo(function MetricCard({ metric }) {
  if (!metric) return null;
  
  const Icon = ICON_MAP[metric.icon] || HardHat;
  
  return (
    <div className="snap-start flex-shrink-0 w-[140px] rounded-xl border border-border bg-surface-card p-3.5 transition-colors hover:border-border-strong">
      <div className={`${metric.bg} ${metric.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
        <Icon size={18} />
      </div>
      <p className="font-mono text-2xl font-extrabold tabular-nums text-text-primary leading-none">
        {metric.value}
      </p>
      <p className="text-xs text-text-muted mt-1 truncate">{metric.label}</p>
    </div>
  );
});

/**
 * Metrics strip section
 */
const MetricsStrip = memo(function MetricsStrip({ metrics }) {
  if (!Array.isArray(metrics)) return null;

  return (
    <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
      <div className="flex gap-3 w-max">
        {metrics.map(m => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>
    </div>
  );
});

/**
 * Weather day item (mini)
 */
const WeatherDay = memo(function WeatherDay({ day }) {
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0 w-12 text-center">
      <p className="text-xs font-medium" style={{ color: '#64748B' }}>{day.day}</p>
      <span className="text-xl leading-none" role="img" aria-label={day.forecast}>
        {day.icon}
      </span>
      <p className="text-xs font-bold tabular-nums" style={{ color: '#CBD5E1' }}>{day.hi}°</p>
      {day.lo !== null && (
        <p className="text-[10px] tabular-nums" style={{ color: '#475569' }}>{day.lo}°</p>
      )}
    </div>
  );
});

/**
 * Today's weather display
 */
const TodayWeather = memo(function TodayWeather({ today }) {
  const precipColor = today.precip >= 50 
    ? '#60A5FA' 
    : today.precip >= 20 
      ? '#94A3B8' 
      : '#475569';

  return (
    <div 
      className="flex items-center gap-3 shrink-0 pr-4"
      style={{ borderRight: '1px solid #1F2430' }}
    >
      <span className="text-3xl leading-none" role="img" aria-label={today.forecast}>
        {today.icon}
      </span>
      <div>
        <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Today</p>
        <p className="text-lg font-extrabold tabular-nums leading-tight" style={{ color: '#F1F5F9' }}>
          {today.hi}°
          {today.lo !== null && (
            <span className="text-sm font-normal ml-1" style={{ color: '#64748B' }}>/{today.lo}°</span>
          )}
        </p>
        <p className="text-xs truncate max-w-[120px]" style={{ color: '#64748B' }}>
          {today.forecast}
        </p>
        {today.precip > 0 && (
          <p className="text-xs mt-0.5 font-medium" style={{ color: precipColor }}>
            {today.precip}% precip
          </p>
        )}
      </div>
    </div>
  );
});

/**
 * Weather strip component
 */
const WeatherStrip = memo(function WeatherStrip({ weather }) {
  if (!weather?.length) return null;

  const today = weather[0];
  const upcoming = weather.slice(1, 5);

  return (
    <div 
      className="rounded-xl border overflow-hidden"
      style={{ background: '#0D1117', borderColor: '#1F2430' }}
    >
      <div 
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: '1px solid #1F2430', background: '#111318' }}
      >
        <CloudSun size={14} style={{ color: '#64748B' }} />
        <span 
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: '#64748B' }}
        >
          DFW Weather
        </span>
      </div>

      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        <TodayWeather today={today} />
        
        <div className="flex items-center gap-3">
          {upcoming.map(d => (
            <WeatherDay key={d.date} day={d} />
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Individual focus item
 */
const FocusItem = memo(function FocusItem({ item, onClick }) {
  const phase = PHASE_MAP[item.job.phase] || PHASES[0];

  return (
    <button
      type="button"
      onClick={() => onClick?.(item.job)}
      className="w-full flex items-center gap-3 rounded-lg border border-border bg-surface-card h-14 px-3 text-left transition-colors hover:border-border-strong active:scale-[0.99]"
    >
      <span
        className="w-[3px] self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: phase.color }}
      />
      <span className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{item.job.address}</p>
        <p className="text-xs text-text-muted truncate">{item.job.city}, TX {item.job.zip}</p>
      </span>
      <span className={`text-xs font-semibold flex-shrink-0 ${item.reasonColor}`}>
        {item.reason}
      </span>
    </button>
  );
});

/**
 * Today's focus section
 */
const TodaysFocus = memo(function TodaysFocus({ items, onJobClick }) {
  if (!items?.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Target size={18} className="text-accent-amber" />
        <h2 className="text-label font-bold text-text-primary">Today&apos;s Focus</h2>
      </div>

      <div className="space-y-2">
        {items.map(({ job, reason, reasonColor }) => (
          <FocusItem 
            key={job.id} 
            item={{ job, reason, reasonColor }} 
            onClick={onJobClick}
          />
        ))}
      </div>
    </section>
  );
});

/**
 * Phase tab button
 */
const PhaseTab = memo(function PhaseTab({ 
  tab, 
  isActive, 
  count, 
  onClick 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
});

/**
 * Phase tabs section
 */
const PhaseTabs = memo(function PhaseTabs({ 
  activePhase, 
  phaseCounts, 
  onPhaseChange 
}) {
  return (
    <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 mb-4">
      <div className="flex gap-2 w-max">
        {PHASE_TABS.map(tab => (
          <PhaseTab
            key={tab.key}
            tab={tab}
            isActive={activePhase === tab.key}
            count={phaseCounts[tab.key] ?? 0}
            onClick={() => onPhaseChange(tab.key)}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Job board grid
 */
const JobBoard = memo(function JobBoard({ jobs, onJobClick }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-card p-8 text-center">
        <HardHat size={32} className="mx-auto text-text-muted mb-2" />
        <p className="text-sm text-text-secondary">No jobs in this phase</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 stagger-container">
      {jobs.map((job, index) => (
        <JobCard
          key={job.id}
          job={job}
          index={index}
          onClick={() => onJobClick?.(job)}
        />
      ))}
    </div>
  );
});

/**
 * Job board section with tabs
 */
const JobBoardSection = memo(function JobBoardSection({ 
  jobs, 
  phaseCounts, 
  onJobClick 
}) {
  const [activePhase, setActivePhase] = useState('all');

  const filteredJobs = useMemo(() => {
    if (activePhase === 'all') return jobs;
    return jobs.filter(j => j?.phase === activePhase);
  }, [jobs, activePhase]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <LayoutDashboard size={18} className="text-accent" />
        <h2 className="text-label font-bold text-text-primary">Job Board</h2>
      </div>

      <PhaseTabs
        activePhase={activePhase}
        phaseCounts={phaseCounts}
        onPhaseChange={setActivePhase}
      />

      <JobBoard jobs={filteredJobs} onJobClick={onJobClick} />
    </section>
  );
});

/**
 * Attribution footer
 */
const Attribution = memo(function Attribution() {
  return (
    <div className="flex justify-end pt-4">
      <span className="text-[10px] text-text-muted/40 tracking-wide">
        Created by Cory Nichols
      </span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

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
const JobPulseHome = memo(function JobPulseHome({
  jobs = [],
  metrics = [],
  focusItems = [],
  weather = null,
  isLoading = false,
  onJobClick,
}) {
  // Compute safe jobs array
  const safeJobs = useMemo(() => Array.isArray(jobs) ? jobs : [], [jobs]);
  
  // Compute phase counts
  const phaseCounts = useMemo(() => {
    const counts = { all: safeJobs.length };
    for (const p of PHASES) counts[p.key] = 0;
    for (const j of safeJobs) {
      if (j?.phase && counts[j.phase] !== undefined) {
        counts[j.phase]++;
      }
    }
    return counts;
  }, [safeJobs]);

  // Show skeleton during loading (must be after all hooks)
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <MetricsStrip metrics={metrics} />
      <WeatherStrip weather={weather} />
      <TodaysFocus items={focusItems} onJobClick={onJobClick} />
      <JobBoardSection 
        jobs={safeJobs} 
        phaseCounts={phaseCounts}
        onJobClick={onJobClick}
      />
      <Attribution />
    </div>
  );
});

export default JobPulseHome;
