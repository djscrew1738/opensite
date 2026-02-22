/**
 * Performance Section
 * System performance and optimization settings
 */

import { Gauge, Zap, Shield, Clock, Server, MemoryStick, Loader2, Save } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

export default function PerformanceSection() {
  const ctx = useSettings();
  const { handleSavePerformance } = useSettingsActions();
  
  const {
    perfCacheTtl, setPerfCacheTtl, perfRateLimit, setPerfRateLimit,
    perfTimeout, setPerfTimeout, perfCbEnabled, setPerfCbEnabled,
    perfCbThreshold, setPerfCbThreshold, perfLowMemory, setPerfLowMemory,
    perfBgJobs, setPerfBgJobs, savingPerformance, metrics
  } = ctx;

  const circuitBreakerStatus = metrics.circuitBreaker || 'closed';
  const isHealthy = circuitBreakerStatus === 'closed';

  return (
    <div className="space-y-6">
      <Section 
        icon={Gauge} 
        title="Performance Settings"
        badge={
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            isHealthy 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
            Circuit: {circuitBreakerStatus}
          </span>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderField 
              label="Cache TTL" 
              value={perfCacheTtl} 
              onChange={setPerfCacheTtl} 
              min={1} max={60} step={1} 
              unit=" minutes" 
            />
            <SliderField 
              label="Rate Limit" 
              value={perfRateLimit} 
              onChange={setPerfRateLimit} 
              min={10} max={500} step={10} 
              unit=" req/min" 
            />
          </div>

          <div>
            <SliderField 
              label="Request Timeout" 
              value={perfTimeout} 
              onChange={setPerfTimeout} 
              min={5} max={120} step={5} 
              unit=" seconds" 
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <SettingsRow 
              label="Circuit Breaker" 
              description="Automatically disable failing services to prevent cascade failures"
            >
              <Toggle enabled={perfCbEnabled} onChange={setPerfCbEnabled} />
            </SettingsRow>

            {perfCbEnabled && (
              <div className="mt-4 pl-4 border-l-2 border-accent-200 dark:border-accent-800">
                <SliderField 
                  label="Failure Threshold" 
                  value={perfCbThreshold} 
                  onChange={setPerfCbThreshold} 
                  min={1} max={20} step={1} 
                  unit=" failures" 
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <SettingsRow 
              label="Low Memory Mode" 
              description="Reduce memory usage at the cost of performance"
            >
              <Toggle enabled={perfLowMemory} onChange={setPerfLowMemory} />
            </SettingsRow>

            <SettingsRow 
              label="Background Jobs" 
              description="Enable background processing for long-running tasks"
            >
              <Toggle enabled={perfBgJobs} onChange={setPerfBgJobs} />
            </SettingsRow>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleSavePerformance} disabled={savingPerformance} className="btn-primary text-sm">
              {savingPerformance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Performance Settings
            </button>
          </div>
        </div>
      </Section>

      <Section icon={Zap} title="Current Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Avg Response</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {metrics.avgResponseMs ? `${metrics.avgResponseMs}ms` : '--'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Success Rate</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {metrics.totalRequests > 0 
                ? `${((metrics.successCount / metrics.totalRequests) * 100).toFixed(1)}%`
                : '--'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Cache Hit Rate</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {metrics.cacheHitRate !== undefined 
                ? `${metrics.cacheHitRate.toFixed(1)}%`
                : '--'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center gap-2 mb-1">
              <MemoryStick className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Total Requests</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {metrics.totalRequests?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
