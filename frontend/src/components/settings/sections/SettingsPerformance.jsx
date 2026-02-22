import { memo } from 'react';
import { Layers, Shield, CircuitBoard, Cog, Loader2, Save } from 'lucide-react';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

function SettingsPerformance({
  perfCacheTtl,
  setPerfCacheTtl,
  perfLowMemory,
  setPerfLowMemory,
  perfRateLimit,
  setPerfRateLimit,
  perfTimeout,
  setPerfTimeout,
  perfCbEnabled,
  setPerfCbEnabled,
  perfCbThreshold,
  setPerfCbThreshold,
  perfBgJobs,
  setPerfBgJobs,
  cbState,
  savingPerformance,
  handleSavePerformance,
}) {
  return (
    <div className="space-y-6">
      <Section icon={Layers} title="Caching">
        <div className="space-y-5">
          <SliderField label="Cache TTL" value={perfCacheTtl} onChange={setPerfCacheTtl} min={1} max={60} step={1} unit=" min" markers={['1min','15min','30min','60min']} />
          <SettingsRow label="Low Memory Mode" description="Reduces cache size and GC interval — recommended for devices under 4GB RAM">
            <Toggle enabled={perfLowMemory} onChange={setPerfLowMemory} />
          </SettingsRow>
        </div>
      </Section>

      <Section icon={Shield} title="Rate Limiting">
        <div className="space-y-5">
          <SliderField label="Max API Requests (per window)" value={perfRateLimit} onChange={setPerfRateLimit} min={20} max={500} step={10} unit=" req" markers={['20','100','250','500']} />
          <SliderField label="Request Timeout" value={perfTimeout} onChange={setPerfTimeout} min={5} max={120} step={5} unit="s" markers={['5s','30s','60s','120s']} />
        </div>
      </Section>

      <Section icon={CircuitBoard} title="Circuit Breaker">
        <div className="space-y-5">
          <SettingsRow label="Enable Circuit Breaker" description="Automatically halt requests to a failing AI provider to prevent cascading errors">
            <Toggle enabled={perfCbEnabled} onChange={setPerfCbEnabled} />
          </SettingsRow>
          {perfCbEnabled && (
            <SliderField label="Failure Threshold (consecutive failures to trip)" value={perfCbThreshold} onChange={setPerfCbThreshold} min={2} max={15} step={1} unit=" failures" markers={['2','5','10','15']} />
          )}
          <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
            cbState === 'closed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
            : cbState === 'open' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300'
            : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300'
          }`}>
            <CircuitBoard className="w-4 h-4 shrink-0" />
            <span>Circuit breaker is currently <strong>{cbState}</strong></span>
          </div>
        </div>
      </Section>

      <Section icon={Cog} title="Background Jobs">
        <SettingsRow label="Enable Background Jobs" description="Permit ingestion, scoring, and notification jobs. Disabling stops all background work.">
          <Toggle enabled={perfBgJobs} onChange={setPerfBgJobs} />
        </SettingsRow>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSavePerformance} disabled={savingPerformance} className="btn-primary text-sm">
          {savingPerformance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Performance Config
        </button>
      </div>
    </div>
  );
}

export default memo(SettingsPerformance);
