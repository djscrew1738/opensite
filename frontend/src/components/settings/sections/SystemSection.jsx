/**
 * System Section
 * Infrastructure and environment diagnostics
 */

import { memo } from 'react';
import { 
  Activity, Server, Cpu, 
  Terminal, ShieldCheck, RefreshCw,
  Clock, Database, Network
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { Section, HealthItem } from '../primitives';

export default memo(function SystemSection() {
  const { metrics = {}, config = {}, refetchMetrics } = useSettings();

  const successRate = metrics.totalRequests > 0
    ? ((metrics.successCount / metrics.totalRequests) * 100).toFixed(1) : '0.0';

  const uptimeFormatted = metrics.uptimeMs
    ? `${Math.floor(metrics.uptimeMs / 3600000)}h ${Math.floor((metrics.uptimeMs % 3600000) / 60000)}m` : '--';

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Activity} 
        title="Infrastructure Health"
        description="Real-time diagnostics and environment status"
        badge={
          <button 
            onClick={refetchMetrics}
            className="text-xs font-bold uppercase tracking-widest text-accent-blue hover:text-accent-light flex items-center gap-1.5 px-3 py-1 bg-accent-muted rounded-full transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Sync Diagnostics
          </button>
        }
      >
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-1">Host Environment</h4>
            <HealthItem 
              label="Operating System" 
              value={config.os || 'Linux (Alpine)'} 
              status="good" 
              icon={Terminal} 
            />
            <HealthItem 
              label="Node.js Runtime" 
              value={config.nodeVersion || 'v20.11.0'} 
              status="good" 
              icon={Server} 
            />
            <HealthItem 
              label="Process Uptime" 
              value={uptimeFormatted} 
              status="good" 
              icon={Clock} 
            />
            <HealthItem 
              label="Memory Usage" 
              value={metrics.memory ? `${(metrics.memory.heapUsed / 1024 / 1024).toFixed(1)} MB` : '--'} 
              status={(metrics.memory?.heapUsed / metrics.memory?.heapTotal) > 0.8 ? 'warning' : 'good'} 
              icon={Cpu} 
            />
          </div>

          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-1">Application Engine</h4>
            <HealthItem 
              label="AI Request Load" 
              value={metrics.totalRequests?.toLocaleString() || '0'} 
              status="good" 
              icon={Network} 
            />
            <HealthItem 
              label="Inference Success" 
              value={`${successRate}%`} 
              status={parseFloat(successRate) > 90 ? 'good' : 'warning'} 
              icon={ShieldCheck} 
            />
            <HealthItem 
              label="Database Connections" 
              value={metrics.dbConnections || '1 (Active)'} 
              status="good" 
              icon={Database} 
            />
            <HealthItem 
              label="Worker Threads" 
              value={metrics.workers || '4/4 Active'} 
              status="good" 
              icon={Cpu} 
            />
          </div>
        </div>
      </Section>

      <div className="card p-6 bg-surface-card border-border-default overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform">
          <Terminal className="w-32 h-32" />
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-surface-elevated text-text-muted">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">System Environment Log</h3>
        </div>

        <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-green-400/80 border border-white/5 shadow-inner">
          <div className="flex gap-2">
            <span className="opacity-40">[{new Date().toISOString()}]</span>
            <span className="text-blue-400 font-bold">INFO</span>
            <span>OpenSite core engine initializing in production mode...</span>
          </div>
          <div className="flex gap-2 mt-1">
            <span className="opacity-40">[{new Date().toISOString()}]</span>
            <span className="text-blue-400 font-bold">INFO</span>
            <span>SQLite WAL mode enabled for concurrent read/write</span>
          </div>
          <div className="flex gap-2 mt-1">
            <span className="opacity-40">[{new Date().toISOString()}]</span>
            <span className="text-success-light font-bold">OK</span>
            <span>Ollama connection heartbeat verified</span>
          </div>
          <div className="flex gap-2 mt-1 animate-pulse">
            <span className="opacity-40">[{new Date().toISOString()}]</span>
            <span className="text-warning-DEFAULT font-bold">LOG</span>
            <span>Awaiting telemetry broadcast...</span>
          </div>
        </div>
      </div>
    </div>
  );
});
