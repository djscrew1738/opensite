import { memo } from 'react';
import {
  Activity, RefreshCw, Zap, CheckCircle, Thermometer, Clock
} from 'lucide-react';
import { Section, MetricBox } from '../primitives';

function SettingsSystem({
  metrics,
  config,
  activeProvider,
  model,
  successRate,
  uptimeFormatted,
  cbState,
  refetchMetrics,
  refetchOllama,
  showToast,
}) {
  return (
    <Section icon={Activity} title="System & Metrics"
      badge={
        <button onClick={() => { refetchMetrics(); refetchOllama(); showToast('Metrics refreshed'); }} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricBox label="Requests" value={metrics.totalRequests?.toLocaleString() || '0'} icon={Zap} />
        <MetricBox label="Success Rate" value={`${successRate}%`} sub={`${metrics.successCount || 0} / ${metrics.totalRequests || 0}`} icon={CheckCircle} />
        <MetricBox label="Avg Response" value={metrics.avgResponseMs ? `${metrics.avgResponseMs}ms` : '--'} icon={Thermometer} />
        <MetricBox label="Uptime" value={uptimeFormatted} icon={Clock} />
      </div>
      <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
        {[
          ['App Version', '2.0.0'],
          ['Backend API', 'http://localhost:5001'],
          ['Frontend Port', '3000'],
          ['Active AI Provider', activeProvider],
          ['Active Model', config.defaultModel || model || '\u2014'],
          ['Circuit Breaker', cbState],
          ['Last Error', metrics.lastError || 'None'],
          ['Last Error At', metrics.lastErrorAt ? new Date(metrics.lastErrorAt).toLocaleString() : 'N/A'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            <span className={`text-sm font-mono font-medium text-gray-900 dark:text-gray-100 ${label === 'Circuit Breaker' && value !== 'closed' ? 'text-amber-600 dark:text-amber-400' : ''}`}>{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Metrics auto-refresh every 15s</p>
    </Section>
  );
}

export default memo(SettingsSystem);
