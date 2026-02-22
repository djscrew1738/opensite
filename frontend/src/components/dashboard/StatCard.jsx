import { TrendingUp, TrendingDown } from 'lucide-react';

const palette = {
  primary: { bar: '#3B82F6', accent: '#3B82F6', bg: 'rgba(59,130,246,0.07)' },
  accent:  { bar: '#3B82F6', accent: '#3B82F6', bg: 'rgba(59,130,246,0.07)' },
  hot:     { bar: '#ef4444', accent: '#ef4444', bg: 'rgba(239,68,68,0.07)' },
  warm:    { bar: '#f59e0b', accent: '#d97706', bg: 'rgba(245,158,11,0.07)' },
  emerald: { bar: '#10b981', accent: '#10b981', bg: 'rgba(16,185,129,0.07)' },
  blue:    { bar: '#3b82f6', accent: '#3b82f6', bg: 'rgba(59,130,246,0.07)' },
  purple:  { bar: '#8b5cf6', accent: '#8b5cf6', bg: 'rgba(139,92,246,0.07)' },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
  color = 'primary',
  onClick,
  edgeBar = false,
}) {
  const c = palette[color] || palette.primary;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white dark:bg-surface-900/80 rounded-2xl border border-surface-200/60 dark:border-surface-800/40 overflow-hidden${
        onClick
          ? ' cursor-pointer transition-all duration-200 hover:shadow-elevation-2 hover:-translate-y-0.5 active:scale-[0.99]'
          : ''
      }`}
    >
      {/* Slim left accent bar */}
      {edgeBar && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ background: c.bar }}
        />
      )}

      <div className={`py-5 ${edgeBar ? 'pl-[18px] pr-4' : 'px-5'}`}>
        {/* Label + icon */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-surface-400 dark:text-surface-600 leading-none">
            {label}
          </span>
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: c.bg }}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2} style={{ color: c.accent }} />
          </div>
        </div>

        {/* Value — hero number */}
        <div className="text-[2.1rem] leading-none font-display font-bold text-surface-950 dark:text-white tracking-tight tabular-nums mb-2.5">
          {value}
        </div>

        {/* Subtext + trend */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-surface-400 dark:text-surface-600 font-medium truncate">
            {subtext}
          </span>
          {trend && trendValue && (
            <span
              className={`text-[11px] font-bold flex items-center gap-0.5 shrink-0 ${
                trend === 'up' ? 'text-emerald-500' : 'text-hot-500'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
              ) : (
                <TrendingDown className="w-3 h-3" strokeWidth={2.5} />
              )}
              {trendValue}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
