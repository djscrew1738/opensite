/**
 * Settings Primitives
 * Shared UI components for all settings sections
 */

import { useState } from 'react';
import { Eye, EyeOff, Loader2, Save, Zap, ExternalLink, AlertCircle } from 'lucide-react';

/** Toggle switch component */
export function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

/** Settings row with label/description and action */
export function SettingsRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">{label}</span>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Section card with icon and title */
export function Section({ icon: Icon, title, badge, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-copper-950/30 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

/** Status pill for connection states */
export function StatusPill({ connected, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
      connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      {label || (connected ? 'Connected' : 'Disconnected')}
    </span>
  );
}

/** Metric display box */
export function MetricBox({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-surface-50 dark:bg-surface-850/60 rounded-xl p-4 border border-surface-200/60 dark:border-surface-700/60 border-l-2 border-l-blue-400/30 dark:border-l-blue-600/20">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-surface-900 dark:text-surface-100 font-mono tabular-nums">{value}</p>
      {sub && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Slider input with markers */
export function SliderField({ label, value, onChange, min, max, step = 1, unit = '', markers }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      {markers && (
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-0.5">
          {markers.map(m => <span key={m}>{m}</span>)}
        </div>
      )}
    </div>
  );
}

/** API key input with show/hide, test, save, and validation */
export function KeyInput({ 
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
  
  // Validate on change if already touched
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (touched && validate) {
      const validationError = validate(newValue);
      setError(validationError);
    }
  };
  
  // Validate on blur
  const handleBlur = () => {
    setTouched(true);
    if (validate) {
      const validationError = validate(value);
      setError(validationError);
    }
  };
  
  // Check if valid
  const isValid = !error && (!required || value.trim());
  const showError = touched && error;
  
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {(description || href) && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {description}{href && <> Get a key at{' '}
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
              {hrefLabel} <ExternalLink className="w-3 h-3" />
            </a>
          </>}
        </p>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input pr-10 font-mono text-sm ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            placeholder={placeholder}
            aria-invalid={showError}
          />
          <button 
            type="button" 
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={show ? `Hide ${label}` : `Show ${label}`}
          >
            {show ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        {onTest && (
          <button onClick={onTest} disabled={testing || !isValid} className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Test
          </button>
        )}
        <button onClick={onSave} disabled={!value.trim() || saving || !isValid} className="btn-primary text-sm whitespace-nowrap disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
      {showError && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {formatHint && !showError && (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Format: {formatHint}
        </p>
      )}
    </div>
  );
}

/** Settings page header */
export function SettingsHeader({ title, subtitle, status }) {
  return (
    <div className="command-header mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">{title}</h1>
          <p className="text-sm text-blue-200/70">{subtitle}</p>
        </div>
        {status}
      </div>
    </div>
  );
}

/** Empty state for settings sections */
export function EmptySettingsSection({ icon: Icon, title, description }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
        <Icon className="w-8 h-8 text-surface-400" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">{title}</h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
