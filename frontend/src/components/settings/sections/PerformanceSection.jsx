/**
 * Performance Section
 * System optimization and resource management
 */

import { memo } from 'react';
import { 
  Gauge, Clock, Zap, Shield, Server, 
  Save, Loader2, HardDrive, Cpu, Database
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

export default memo(function PerformanceSection() {
  const ctx = useSettings();
  const { handleSavePerformance } = useSettingsActions();

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Gauge} 
        title="Performance & Optimization"
        description="Fine-tune system resource usage and response times"
      >
        <div className="space-y-6 mt-4">
          <div className="grid gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <SliderField 
              label="Cache TTL (Time-to-Live)" 
              value={ctx.perfCacheTtl} 
              onChange={ctx.setPerfCacheTtl} 
              min={1} max={60} step={1} 
              unit=" minutes" 
              markers={['1min', '30min', '60min']} 
            />

            <div className="border-t border-border-muted pt-6">
              <SliderField 
                label="API Rate Limit" 
                value={ctx.perfRateLimit} 
                onChange={ctx.setPerfRateLimit} 
                min={10} max={1000} step={10} 
                unit=" req/min" 
                markers={['10', '500', '1000']} 
              />
            </div>

            <div className="border-t border-border-muted pt-6">
              <SliderField 
                label="Request Timeout" 
                value={ctx.perfTimeout} 
                onChange={ctx.setPerfTimeout} 
                min={5} max={120} step={5} 
                unit=" seconds" 
                markers={['5s', '60s', '120s']} 
              />
            </div>
          </div>

          <div className="grid gap-4 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <SettingsRow 
              label="Circuit Breaker" 
              description="Protect system by failing fast when downstream services are unstable"
              icon={Shield}
            >
              <Toggle enabled={ctx.perfCbEnabled} onChange={ctx.setPerfCbEnabled} />
            </SettingsRow>

            {ctx.perfCbEnabled && (
              <div className="pl-11 pr-2 pb-2">
                <SliderField 
                  label="Error Threshold" 
                  value={ctx.perfCbThreshold} 
                  onChange={ctx.setPerfCbThreshold} 
                  min={1} max={20} step={1} 
                  unit=" errors" 
                />
              </div>
            )}

            <SettingsRow 
              label="Low Memory Mode" 
              description="Disable non-critical background processes to save RAM"
              icon={Cpu}
            >
              <Toggle enabled={ctx.perfLowMemory} onChange={ctx.setPerfLowMemory} />
            </SettingsRow>

            <SettingsRow 
              label="Background Workers" 
              description="Allow scheduled tasks and automated discovery to run"
              icon={Server}
            >
              <Toggle enabled={ctx.perfBgJobs} onChange={ctx.setPerfBgJobs} />
            </SettingsRow>
          </div>

          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-card text-text-muted">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Database Persistence</h4>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">SQLite (WAL Mode)</p>
                </div>
              </div>
              <div className="text-xs font-bold text-success-light uppercase tracking-widest px-2 py-1 bg-success-muted rounded border border-success-border">
                Optimized
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-default">
            <button 
              onClick={handleSavePerformance} 
              disabled={ctx.savingPerformance} 
              className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20 transition-all active:scale-95"
            >
              {ctx.savingPerformance ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
              Apply Optimizations
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
});
