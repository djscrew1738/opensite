/**
 * Settings Primitives
 * Shared UI components for all settings sections, following Dark Forge design system
 */

import { useState, memo } from 'react';
import { 
  Eye, EyeOff, Loader2, Save, Zap, ExternalLink, 
  AlertCircle, ChevronRight, CheckCircle2, Info,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { colors } from '../../../styles/tokens';

/** Toggle switch component */
export const Toggle = memo(function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue/20 ${
        enabled ? 'bg-blue-500' : 'bg-surface-300 dark:bg-surface-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
});

/** Settings row with label/description and action */
export const SettingsRow = memo(function SettingsRow({ label, description, children, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-surface-100 dark:border-border-default last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {Icon && (
          <div className="mt-0.5 p-1.5 rounded-lg bg-surface-elevated text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-surface-900 dark:text-text-primary block tracking-tight">
            {label}
          </span>
          {description && (
            <p className="text-xs text-surface-500 dark:text-text-muted mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
});

/** Section card with icon and title */
export const Section = memo(function Section({ icon: Icon, title, badge, children, description }) {
  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-accent-muted flex items-center justify-center border border-blue-100 dark:border-accent-blue/10">
            <Icon className="w-5 h-5 text-blue-600 dark:text-accent-blue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-text-primary tracking-tight">{title}</h2>
            {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
          </div>
        </div>
        {badge}
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
});

/** Status pill for connection states */
export const StatusPill = memo(function StatusPill({ connected, label, loading = false }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-elevated text-text-muted border border-border-default">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking...
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
      connected 
        ? 'bg-success-muted text-success-light border-success-border'
        : 'bg-danger-muted text-danger-light border-danger-border'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-success-DEFAULT animate-pulse' : 'bg-danger-DEFAULT'}`} />
      {label || (connected ? 'Connected' : 'Disconnected')}
    </span>
  );
});

/** Metric display box */
export const MetricBox = memo(function MetricBox({ label, value, sub, icon: Icon, color = colors.accent.blue }) {
  return (
    <div className="bg-surface-card rounded-xl p-5 border border-border-default hover:border-accent-blue/20 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-text-muted group-hover:text-accent-blue transition-colors" />}
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{label}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary font-mono tracking-tighter tabular-nums mb-1">{value}</p>
      {sub && <p className="text-xs font-medium text-text-muted truncate">{sub}</p>}
    </div>
  );
});

/** Quick action button */
export const QuickAction = memo(function QuickAction({ icon: Icon, label, onClick, color, description, badge = null }) {
  if (!Icon) return null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 min-w-[100px] shrink-0 active:scale-95 group"
      style={{
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.border.default}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${colors.accent.DEFAULT}66`;
        e.currentTarget.style.backgroundColor = colors.surface.elevated;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
        e.currentTarget.style.backgroundColor = colors.surface.card;
      }}
    >
      <div className="relative p-2 rounded-lg bg-surface-elevated group-hover:bg-surface-card transition-colors">
        <Icon style={{ color, width: '20px', height: '20px' }} />
        {badge && (
          <span 
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-xs font-bold flex items-center justify-center px-1 shadow-lg"
            style={{ backgroundColor: colors.danger.DEFAULT, color: colors.text.inverse }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="text-center">
        <span className="text-xs font-semibold block text-text-primary mb-0.5">{label}</span>
        {description && (
          <span className="text-xs font-medium text-text-muted block opacity-70 group-hover:opacity-100 transition-opacity">
            {description}
          </span>
        )}
      </div>
    </button>
  );
});

/** Status card for alerts */
export const StatusCard = memo(function StatusCard({ title, status, message, icon: Icon, onAction, actionLabel }) {
  const STATUS_MAP = {
    success: { 
      border: colors.success.border, 
      bg: colors.success.muted, 
      icon: CheckCircle2, 
      iconColor: colors.success.DEFAULT, 
      text: colors.success.light 
    },
    warning: { 
      border: colors.warning.border, 
      bg: colors.warning.muted, 
      icon: AlertTriangle, 
      iconColor: colors.warning.DEFAULT, 
      text: colors.warning.light 
    },
    error: { 
      border: colors.danger.border, 
      bg: colors.danger.muted, 
      icon: AlertCircle, 
      iconColor: colors.danger.DEFAULT, 
      text: colors.danger.light 
    },
    info: { 
      border: colors.info.border, 
      bg: colors.info.muted, 
      icon: Info, 
      iconColor: colors.info.DEFAULT, 
      text: colors.info.light 
    },
  };

  const config = STATUS_MAP[status || 'info'];
  const DisplayIcon = Icon || config.icon;

  return (
    <div 
      className="p-4 rounded-xl border transition-all hover:shadow-lg"
      style={{ 
        borderColor: config.border,
        backgroundColor: config.bg,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 p-1 rounded-lg" style={{ backgroundColor: `${config.iconColor}20` }}>
          <DisplayIcon 
            className="w-5 h-5 shrink-0" 
            style={{ color: config.iconColor }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm tracking-tight" style={{ color: config.text }}>
            {title}
          </h4>
          <p className="text-xs mt-1 leading-relaxed opacity-90" style={{ color: colors.text.secondary }}>
            {message}
          </p>
          {onAction && actionLabel && (
            <button 
              onClick={onAction} 
              className="mt-2.5 text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all group/btn"
              style={{ color: colors.accent.DEFAULT }}
            >
              {actionLabel} 
              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/** Configuration category button */
export const ConfigCategory = memo(function ConfigCategory({ icon: Icon, title, description, status, onClick }) {
  const CONFIG_STATUS_COLORS = {
    configured: { dot: colors.success.DEFAULT, text: colors.success.DEFAULT, label: 'Configured' },
    partial: { dot: colors.warning.DEFAULT, text: colors.warning.DEFAULT, label: 'Partial' },
    empty: { dot: colors.text.muted, text: colors.text.muted, label: 'Not Configured' },
  };

  const statusColors = CONFIG_STATUS_COLORS[status || 'empty'];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group active:scale-[0.99]"
      style={{
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.border.default}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${colors.accent.DEFAULT}66`;
        e.currentTarget.style.backgroundColor = colors.surface.elevated;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
        e.currentTarget.style.backgroundColor = colors.surface.card;
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-border-muted bg-surface-elevated group-hover:bg-surface-card group-hover:border-accent-blue/20 transition-all"
      >
        <Icon 
          className="w-6 h-6 text-text-muted group-hover:text-accent-blue transition-colors"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-bold text-sm text-text-primary tracking-tight">{title}</h4>
          <span 
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-elevated border border-border-muted"
            style={{ color: statusColors.text }}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusColors.dot }}
            />
            {statusColors.label}
          </span>
        </div>
        <p className="text-xs text-text-muted truncate">
          {description}
        </p>
      </div>
      <ChevronRight 
        className="w-5 h-5 text-border-strong group-hover:text-accent-blue transition-all group-hover:translate-x-0.5"
      />
    </button>
  );
});

/** Slider input with markers */
export const SliderField = memo(function SliderField({ label, value, onChange, min, max, step = 1, unit = '', markers }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-text-primary tracking-tight">{label}</label>
        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-surface-elevated text-accent-blue border border-border-muted">
          {value}{unit}
        </span>
      </div>
      <div className="relative px-1">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-2 bg-surface-200 dark:bg-border-default rounded-full appearance-none cursor-pointer accent-accent-blue"
        />
        {markers && (
          <div className="flex justify-between mt-2">
            {markers.map(m => (
              <span key={m} className="text-xs font-bold text-text-muted opacity-60 uppercase tracking-widest">{m}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

/** API key input with show/hide, test, save, and validation */
export const KeyInput = memo(function KeyInput({ 
  label, 
  description, 
  value, 
  onChange, 
  show, 
  onToggleShow, 
  onSave, 
  onTest, 
  saving, 
  testing, 
  placeholder, 
  href, 
  hrefLabel,
  validate,
  formatHint,
  required = false,
}) {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (touched && validate) setError(validate(newValue));
  };
  
  const handleBlur = () => {
    setTouched(true);
    if (validate) setError(validate(value));
  };
  
  const isValid = !error && (!required || value.trim());
  const showError = touched && error;
  
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-text-primary tracking-tight">
          {label}
          {required && <span className="text-danger-DEFAULT ml-1">*</span>}
        </label>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-accent-blue hover:text-accent-light flex items-center gap-1 transition-colors">
            {hrefLabel || 'Get API Key'} <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-text-muted mb-3 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input pr-10 font-mono text-sm tracking-tight bg-surface-elevated border-border-default hover:border-accent-blue/30 focus:border-accent-blue transition-all h-[44px] ${showError ? 'border-danger-DEFAULT focus:border-danger-DEFAULT focus:ring-danger-glow' : ''}`}
            placeholder={placeholder || `Enter your ${label}`}
            aria-invalid={showError}
          />
          <button 
            type="button" 
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
            aria-label={show ? `Hide ${label}` : `Show ${label}`}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        {onTest && (
          <button 
            onClick={onTest} 
            disabled={testing || !value.trim() || !!error} 
            className="btn-secondary h-[44px] px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Test
          </button>
        )}
        
        <button 
          onClick={onSave} 
          disabled={!value.trim() || saving || !isValid} 
          className="btn-primary h-[44px] px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>

      {showError && (
        <p className="mt-2 text-xs font-bold text-danger-light flex items-center gap-1.5 uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      
      {formatHint && !showError && (
        <p className="mt-2 text-xs font-medium text-text-muted opacity-60 italic">
          Format: {formatHint}
        </p>
      )}
    </div>
  );
});

/** Settings page header */
export const SettingsHeader = memo(function SettingsHeader({ title, subtitle, status }) {
  return (
    <div className="command-header mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">{title}</h1>
          <p className="text-sm font-medium text-blue-200/60 leading-relaxed">{subtitle}</p>
        </div>
        <div className="shrink-0">
          {status}
        </div>
      </div>
    </div>
  );
});

/** Empty state for settings sections */
export const EmptySettingsSection = memo(function EmptySettingsSection({ icon: Icon, title, description }) {
  return (
    <div className="card p-12 text-center border-dashed border-2 border-border-default bg-transparent">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-surface-elevated flex items-center justify-center border border-border-muted shadow-inner">
        <Icon className="w-8 h-8 text-text-muted opacity-40" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed">{description}</p>
    </div>
  );
});

/** Health item for system health section */
export const HealthItem = memo(function HealthItem({ label, value, status, icon: Icon }) {
  if (!Icon) return null;

  const HEALTH_COLORS = {
    good: { text: colors.success.DEFAULT, bg: colors.success.muted },
    warning: { text: colors.warning.DEFAULT, bg: colors.warning.muted },
    error: { text: colors.danger.DEFAULT, bg: colors.danger.muted },
  };

  const colors_set = HEALTH_COLORS[status || 'good'];

  return (
    <div 
      className="flex items-center justify-between py-3.5 border-b border-border-default last:border-0 group"
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-1.5 rounded-lg transition-transform group-hover:scale-110"
          style={{ backgroundColor: colors_set.bg }}
        >
          <Icon style={{ color: colors_set.text, width: '16px', height: '16px' }} />
        </div>
        <span className="text-sm font-medium text-text-secondary tracking-tight">
          {label}
        </span>
      </div>
      <span className="text-sm font-bold text-text-primary font-mono tracking-tight">
        {value}
      </span>
    </div>
  );
});

/** Stat card for metrics dashboard */
export const StatCard = memo(function StatCard({ label, value, subtext, icon: Icon, color, onClick }) {
  if (!Icon) return null;

  return (
    <button
      onClick={onClick}
      className="p-5 rounded-xl transition-all cursor-pointer group text-left bg-surface-card border border-border-default hover:border-accent-blue/30 hover:shadow-lg active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-surface-elevated group-hover:bg-surface-card transition-colors border border-border-muted group-hover:border-accent-blue/20">
          <Icon style={{ color, width: '18px', height: '18px' }} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <RefreshCw className="w-3 h-3 text-text-muted" />
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary font-mono tracking-tighter mb-1">
        {value}
      </div>
      <div className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors tracking-tight mb-0.5">
        {label}
      </div>
      {subtext && (
        <div className="text-xs font-medium text-text-muted opacity-70 group-hover:opacity-100 transition-opacity">
          {subtext}
        </div>
      )}
    </button>
  );
});

/** Progress bar component */
export const ProgressBar = memo(function ProgressBar({ percentage, label, color = colors.accent.blue }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</span>
        <span className="text-xs font-mono font-bold text-text-primary">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-border-muted/30">
        <div 
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`
          }}
        />
      </div>
    </div>
  );
});
