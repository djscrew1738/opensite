/**
 * Job Pulse Section
 * Real-time email monitoring and job alert configuration
 */

import { memo } from 'react';
import { 
  Activity, Mail, Bell, Shield, Smartphone, 
  RefreshCw, Loader2, Save, Zap, AlertCircle,
  ExternalLink, CheckCircle2, History, Clock
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow, Toggle, StatusPill } from '../primitives';
import { colors } from '../../../styles/tokens';

export default memo(function JobPulseSection() {
  const ctx = useSettings();
  const { 
    handleTestEmailMonitor, handleCheckNow, handleSaveEmailMonitor 
  } = useSettingsActions();

  const {
    emEnabled, emHost, emPort, emUser, emPass, emKeywords,
    emTesting, emChecking, emSaving, emStatus, emAlerts
  } = ctx;

  const statusColor = emStatus?.status === 'running' ? colors.success.DEFAULT 
    : emStatus?.status === 'error' ? colors.danger.DEFAULT 
    : colors.text.muted;

  return (
    <div className="space-y-6 page-transition-wrapper">
      {/* Engine Status */}
      <Section 
        icon={Activity} 
        title="Job Pulse Engine"
        badge={
          <div className="flex items-center gap-3">
            <StatusPill connected={emEnabled} label={emEnabled ? 'Active' : 'Standby'} />
            {emEnabled && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-tighter bg-surface-elevated border border-border-muted" style={{ color: statusColor }}>
                <span className={`w-1 h-1 rounded-full ${emStatus?.status === 'running' ? 'animate-ping' : ''}`} style={{ backgroundColor: statusColor }} />
                {emStatus?.status || 'idle'}
              </span>
            )}
          </div>
        }
        description="Monitor inbound project opportunities via real-time email analysis"
      >
        <div className="space-y-6 mt-4">
          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <SettingsRow 
              label="Real-time Monitoring" 
              description="Enable automated background scanning of the configured inbox"
              icon={Mail}
            >
              <Toggle enabled={emEnabled} onChange={ctx.setEmEnabled} />
            </SettingsRow>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6 border-t border-border-muted pt-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">IMAP Host</label>
                <input 
                  type="text" 
                  value={emHost} 
                  onChange={e => ctx.setEmHost(e.target.value)} 
                  className="input font-mono text-sm tracking-tight h-11" 
                  placeholder="outlook.office365.com" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">IMAP Port</label>
                <input 
                  type="text" 
                  value={emPort} 
                  onChange={e => ctx.setEmPort(e.target.value)} 
                  className="input font-mono text-sm tracking-tight h-11 w-24" 
                  placeholder="993" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Auth Identity (User)</label>
                <input 
                  type="email" 
                  value={emUser} 
                  onChange={e => ctx.setEmUser(e.target.value)} 
                  className="input text-sm h-11" 
                  placeholder="notifications@company.com" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Auth Secret (App Password)</label>
                <input 
                  type="password" 
                  value={emPass} 
                  onChange={e => ctx.setEmPass(e.target.value)} 
                  className="input text-sm h-11" 
                  placeholder="••••••••••••••••" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-6 border-t border-border-muted pt-6">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Shield className="w-3 h-3" /> Intelligence Filter Keywords
              </label>
              <textarea 
                value={emKeywords} 
                onChange={e => ctx.setEmKeywords(e.target.value)} 
                className="input py-3 min-h-[80px] resize-none text-sm font-medium" 
                placeholder="e.g. plumbing, bid, estimate, permit, contract (comma separated)" 
              />
              <p className="text-xs text-text-muted italic px-1">Emails matching these terms will trigger analysis and SMS alerts.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6 pt-6 border-t border-border-muted">
              <button onClick={handleTestEmailMonitor} disabled={emTesting} className="btn-secondary h-11 px-6 text-xs font-semibold uppercase tracking-widest">
                {emTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Zap className="w-3.5 h-3.5 mr-2" />} Test Auth
              </button>
              <button onClick={handleCheckNow} disabled={emChecking || !emEnabled} className="btn-secondary h-11 px-6 text-xs font-semibold uppercase tracking-widest">
                {emChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />} Force Check
              </button>
              <button onClick={handleSaveEmailMonitor} disabled={emSaving} className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em]">
                {emSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Pulse Config
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Activity Log */}
      <Section 
        icon={History} 
        title="Intelligence Activity"
        description="Last 10 detected opportunities and processing status"
      >
        <div className="mt-4 overflow-hidden rounded-2xl border border-border-default bg-surface-card">
          {emAlerts.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-20" />
              <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No alerts detected yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border-muted">
              {emAlerts.map((alert, idx) => (
                <div key={idx} className="p-4 hover:bg-surface-elevated transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${alert.sms_sent ? 'bg-success-DEFAULT' : 'bg-warning-DEFAULT'}`} />
                        <h4 className="text-xs font-semibold text-text-primary truncate">{alert.subject}</h4>
                      </div>
                      <p className="text-xs text-text-muted truncate ml-3.5">
                        Matched: <span className="text-accent-blue font-bold">{alert.matched_keyword}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-text-muted">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-tighter text-text-muted mt-0.5">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
});
