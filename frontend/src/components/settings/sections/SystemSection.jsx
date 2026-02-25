/**
 * System Section
 * System information and advanced settings
 */

import { Activity, Server, Cpu, HardDrive, Clock, Globe, Terminal, RefreshCw, Loader2 } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { Section, MetricBox } from '../primitives';

export default function SystemSection() {
  const { metrics, config, refetchMetrics, refetchSettings, connected, activeProvider, availableModels } = useSettings();

  const formatUptime = (ms) => {
    if (!ms) return '--';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '--';
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      <Section icon={Activity} title="System Status">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBox 
            label="Uptime" 
            value={formatUptime(metrics.uptimeMs)} 
            icon={Clock}
          />
          <MetricBox 
            label="AI Provider" 
            value={activeProvider} 
            sub={connected ? 'Connected' : 'Disconnected'}
            icon={Server}
          />
          <MetricBox 
            label="Models Available" 
            value={availableModels.length} 
            icon={Cpu}
          />
          <MetricBox 
            label="Circuit Breaker" 
            value={metrics.circuitBreaker || 'Closed'} 
            sub={!metrics.circuitBreaker || metrics.circuitBreaker === 'closed' ? 'Healthy' : 'Tripped'}
            icon={Activity}
          />
        </div>
      </Section>

      <Section icon={Server} title="Server Configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Environment</label>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">
                {config.env || 'production'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Node Version</label>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">
                {config.nodeVersion || '--'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</label>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">
                {config.platform || '--'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Arch</label>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">
                {config.arch || '--'}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Globe} title="AI Connection Details">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ollama URL</label>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">
                {config.ollamaUrl || 'http://localhost:11434'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Model</label>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1 truncate">
                {config.defaultModel || 'Not set'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {connected ? 'Connected to Ollama' : 'Disconnected from Ollama'}
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Terminal} title="Actions">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => { refetchMetrics(); refetchSettings(); }} 
            className="btn-secondary text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh All Data
          </button>
        </div>
      </Section>
    </div>
  );
}
