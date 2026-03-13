/**
 * JobPulseHome Component
 * Dashboard view for job management with metrics, weather, and job board
 *
 * @module components/dashboard/JobPulseHome
 */

import { useState, useMemo, memo, useCallback } from 'react';
import {
  LayoutDashboard,
  Target,
  CloudSun,
  HardHat,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { JobCard } from '../jobs';
import { EmptyState } from '../ui';
import { PHASES, PHASE_MAP } from '../../styles/tokens';
import { DashboardSkeleton } from '../shared/LoadingStates';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, React.ComponentType>} */
const ICON_MAP = {
  HardHat,
  Calendar,
  AlertTriangle,
  DollarSign,
  TrendingUp,
};

/** @type {Array<{key: string, label: string, color: string}>} */
const PHASE_TABS = [
  { key: 'all', label: 'All', color: colors.accent.DEFAULT },
  ...PHASES,
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Individual metric card
 * @param {{metric: {icon: string, value: string | number, label: string, bg: string, color: string}}} props
 */
const MetricCard = memo(function MetricCard({ metric }) {
  if (!metric) return null;

  const Icon = ICON_MAP[metric.icon] || HardHat;

  return (
    <div
      className="snap-start flex-shrink-0 w-[140px] rounded-xl border p-3.5 transition-colors hover:border-border-strong"
      style={{
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
      }}
    >
      <div
        className={`${metric.bg} ${metric.color} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}
      >
        <Icon size={18} />
      </div>
      <p
        className="font-mono text-2xl font-extrabold tabular-nums leading-none"
        style={{ color: colors.text.primary }}
      >
        {metric.value}
      </p>
      <p
        className="text-xs mt-1 truncate"
        style={{ color: colors.text.muted }}
      >
        {metric.label}
      </p>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

/**
 * Metrics strip section
 * @param {{metrics: Array<Record<string, any>>}} props
 */
const MetricsStrip = memo(function MetricsStrip({ metrics }) {
  if (!Array.isArray(metrics)) return null;

  return (
    <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
      <div className="flex gap-3 w-max">
        {metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>
    </div>
  );
});

MetricsStrip.displayName = 'MetricsStrip';

/**
 * Weather day item (mini)
 * @param {{day: {day: string, icon: string, hi: number, lo: number | null, forecast: string}}} props
 */
const WeatherDay = memo(function WeatherDay({ day }) {
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0 w-12 text-center">
      <p
        className="text-xs font-medium"
        style={{ color: colors.text.secondary }}
      >
        {day.day}
      </p>
      <span className="text-xl leading-none" role="img" aria-label={day.forecast}>
        {day.icon}
      </span>
      <p
        className="text-xs font-semibold tabular-nums"
        style={{ color: colors.text.primary }}
      >
        {day.hi}°
      </p>
      {day.lo !== null && (
        <p
          className="text-xs tabular-nums"
          style={{ color: colors.text.muted }}
        >
          {day.lo}°
        </p>
      )}
    </div>
  );
});

WeatherDay.displayName = 'WeatherDay';

/**
 * Today's weather display
 * @param {{today: {icon: string, hi: number, lo: number | null, forecast: string, precip: number}}} props
 */
const TodayWeather = memo(function TodayWeather({ today }) {
  const precipColor = today.precip >= 50
    ? colors.accent.light
    : today.precip >= 20
      ? colors.text.secondary
      : colors.text.muted;

  return (
    <div
      className="flex items-center gap-3 shrink-0 pr-4"
      style={{ borderRight: `1px solid ${colors.border.default}` }}
    >
      <span className="text-3xl leading-none" role="img" aria-label={today.forecast}>
        {today.icon}
      </span>
      <div>
        <p
          className="text-xs font-semibold"
          style={{ color: colors.text.secondary }}
        >
          Today
        </p>
        <p
          className="text-lg font-extrabold tabular-nums leading-tight"
          style={{ color: colors.text.primary }}
        >
          {today.hi}°
          {today.lo !== null && (
            <span
              className="text-sm font-normal ml-1"
              style={{ color: colors.text.muted }}
            >
              /{today.lo}°
            </span>
          )}
        </p>
        <p
          className="text-xs truncate max-w-[120px]"
          style={{ color: colors.text.muted }}
        >
          {today.forecast}
        </p>
        {today.precip > 0 && (
          <p
            className="text-xs mt-0.5 font-medium"
            style={{ color: precipColor }}
          >
            {today.precip}% precip
          </p>
        )}
      </div>
    </div>
  );
});

TodayWeather.displayName = 'TodayWeather';

/**
 * Weather strip component
 * @param {{weather: Array<Record<string, any>>}} props
 */
const WeatherStrip = memo(function WeatherStrip({ weather }) {
  if (!weather?.length) return null;

  const today = weather[0];
  const upcoming = weather.slice(1, 5);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: colors.surface.primary,
        borderColor: colors.border.default,
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{
          borderBottom: `1px solid ${colors.border.default}`,
          backgroundColor: colors.surface.card,
        }}
      >
        <CloudSun size={14} style={{ color: colors.text.muted }} />
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: colors.text.muted }}
        >
          DFW Weather
        </span>
      </div>

      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        <TodayWeather today={today} />

        <div className="flex items-center gap-3">
          {upcoming.map((d) => (
            <WeatherDay key={d.date} day={d} />
          ))}
        </div>
      </div>
    </div>
  );
});

WeatherStrip.displayName = 'WeatherStrip';

/**
 * Individual focus item
 * @param {{item: {job: {phase: string, address: string, city: string, zip: string}, reason: string, reasonColor: string}, onClick?: (job: any) => void}} props
 */
const FocusItem = memo(function FocusItem({ item, onClick }) {
  const { job, reason, reasonColor } = item;
  const phase = PHASE_MAP[job.phase] || PHASES[0];

  const handleClick = useCallback(() => {
    onClick?.(job);
  }, [onClick, job]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center gap-3 rounded-lg border h-14 px-3 text-left transition-all active:scale-[0.99]"
      style={{
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.border.strong}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border.default}
    >
      <span
        className="w-[3px] self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: phase.color }}
      />
      <span className="flex-1 min-w-0">
        <p
          className="text-sm truncate"
          style={{ color: colors.text.primary }}
        >
          {job.address}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: colors.text.muted }}
        >
          {job.city}, TX {job.zip}
        </p>
      </span>
      <span
        className="text-xs font-semibold flex-shrink-0"
        style={{ color: reasonColor }}
      >
        {reason}
      </span>
    </button>
  );
});

FocusItem.displayName = 'FocusItem';

/**
 * Today's focus section
 * @param {{items: Array<Record<string, any>>, onJobClick?: (job: any) => void}} props
 */
const TodaysFocus = memo(function TodaysFocus({ items, onJobClick }) {
  if (!items?.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Target size={18} style={{ color: colors.warning.DEFAULT }} />
        <h2
          className="text-label font-bold"
          style={{ color: colors.text.primary }}
        >
          Today&apos;s Focus
        </h2>
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

TodaysFocus.displayName = 'TodaysFocus';

/**
 * Phase tab button
 * @param {{tab: {key: string, label: string}, isActive: boolean, count: number, onClick: () => void}} props
 */
const PhaseTab = memo(function PhaseTab({
  tab,
  isActive,
  count,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
        isActive
          ? 'text-white'
          : 'hover:bg-surface-elevated'
      }`}
      style={{
        backgroundColor: isActive ? colors.accent.DEFAULT : 'transparent',
        color: isActive ? 'white' : colors.text.secondary,
      }}
    >
      {tab.label}
      <span
        className="font-mono text-xs tabular-nums px-1.5 py-0.5 rounded-md"
        style={{
          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.surface.elevated,
          color: isActive ? 'white' : colors.text.muted,
        }}
      >
        {count}
      </span>
    </button>
  );
});

PhaseTab.displayName = 'PhaseTab';

/**
 * Phase tabs section
 * @param {{activePhase: string, phaseCounts: Record<string, number>, onPhaseChange: (phase: string) => void}} props
 */
const PhaseTabs = memo(function PhaseTabs({
  activePhase,
  phaseCounts,
  onPhaseChange,
}) {
  return (
    <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 mb-4">
      <div className="flex gap-2 w-max">
        {PHASE_TABS.map((tab) => (
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

PhaseTabs.displayName = 'PhaseTabs';

/**
 * Job board grid
 * @param {{jobs: Array<Record<string, any>>, onJobClick?: (job: any) => void}} props
 */
const JobBoard = memo(function JobBoard({ jobs, onJobClick }) {
  if (jobs.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{
          backgroundColor: colors.surface.card,
          borderColor: colors.border.default,
        }}
      >
        <HardHat size={32} style={{ color: colors.text.muted }} className="mx-auto mb-2" />
        <p style={{ color: colors.text.secondary }}>No jobs in this phase</p>
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

JobBoard.displayName = 'JobBoard';

/**
 * Job board section with tabs
 * @param {{jobs: Array<Record<string, any>>, phaseCounts: Record<string, number>, onJobClick?: (job: any) => void}} props
 */
const JobBoardSection = memo(function JobBoardSection({
  jobs,
  phaseCounts,
  onJobClick,
}) {
  const [activePhase, setActivePhase] = useState('all');

  const filteredJobs = useMemo(() => {
    if (activePhase === 'all') return jobs;
    return jobs.filter((j) => j?.phase === activePhase);
  }, [jobs, activePhase]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <LayoutDashboard size={18} style={{ color: colors.accent.DEFAULT }} />
        <h2
          className="text-label font-bold"
          style={{ color: colors.text.primary }}
        >
          Job Board
        </h2>
      </div>

      {jobs.length === 0 ? (
        <div
          className="rounded-xl border"
          style={{
            backgroundColor: colors.surface.card,
            borderColor: colors.border.default,
            boxShadow: shadows.md,
          }}
        >
          <EmptyState
            iconName="clipboard"
            title="No jobs yet"
            description="Open the jobs workspace to create your first job and start organizing production work."
            action={{
              label: 'Open jobs workspace',
              icon: HardHat,
              onClick: () => onJobClick?.(),
            }}
            className="py-10"
          />
        </div>
      ) : (
        <>
          <PhaseTabs
            activePhase={activePhase}
            phaseCounts={phaseCounts}
            onPhaseChange={setActivePhase}
          />

          <JobBoard jobs={filteredJobs} onJobClick={onJobClick} />
        </>
      )}
    </section>
  );
});

JobBoardSection.displayName = 'JobBoardSection';

/**
 * Attribution footer
 */
const Attribution = memo(function Attribution() {
  return (
    <div className="flex justify-end pt-4">
      <span
        className="text-xs tracking-wide"
        style={{ color: `${colors.text.muted}40` }}
      >
        Created by Cory Nichols
      </span>
    </div>
  );
});

Attribution.displayName = 'Attribution';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * JobPulseHome - Dashboard view for job management
 *
 * @param {{
 *   jobs?: Array<Record<string, any>>,
 *   metrics?: Array<Record<string, any>>,
 *   focusItems?: Array<Record<string, any>>,
 *   weather?: Array<Record<string, any>> | null,
 *   isLoading?: boolean,
 *   onJobClick?: (job: any) => void
 * }} props
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

JobPulseHome.displayName = 'JobPulseHome';

export default JobPulseHome;
