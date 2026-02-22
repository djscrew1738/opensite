import { memo } from 'react';
import {
  Activity, Bell, Mail, Phone, Key,
  Loader2, Save, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import { Section, SettingsRow, Toggle } from '../primitives';

function SettingsJobPulse({
  emEnabled,
  setEmEnabled,
  emUser,
  setEmUser,
  emPass,
  setEmPass,
  emHost,
  setEmHost,
  emPort,
  setEmPort,
  emKeywords,
  setEmKeywords,
  emTesting,
  emChecking,
  emSaving,
  emStatus,
  emAlerts,
  handleTestEmailMonitor,
  handleCheckNow,
  handleSaveEmailMonitor,
  notifySmsEnabled,
  setNotifySmsEnabled,
  notifyAdminPhone,
  setNotifyAdminPhone,
}) {
  return (
    <div className="space-y-6">
      <Section icon={Activity} title="Job Pulse Email Login"
        badge={emStatus?.enabled ? (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Connected</span>
        ) : (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Not Connected</span>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your email to Job Pulse for automatic job site monitoring.
            Job Pulse scans your inbox for permit updates, inspection notices, schedule changes,
            and other job-related communications, then sends SMS alerts for urgent items.
          </p>

          <SettingsRow label="Enable Job Pulse Email Monitoring" description="Automatically scan emails for job site updates">
            <Toggle enabled={emEnabled} onChange={setEmEnabled} />
          </SettingsRow>

          {emEnabled && (
            <>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Use an <strong>App Password</strong> if your email has 2FA/MFA enabled.
                    For Outlook, generate one at account.microsoft.com/security.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={emUser}
                      onChange={e => setEmUser(e.target.value)}
                      className="input pl-10 text-sm"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Password / App Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={emPass}
                      onChange={e => setEmPass(e.target.value)}
                      className="input pl-10 text-sm"
                      placeholder="Enter password (leave blank to keep current)"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Server (IMAP)</label>
                  <select
                    value={emHost}
                    onChange={e => {
                      const host = e.target.value;
                      setEmHost(host);
                      // Auto-set port based on host
                      if (host === 'outlook.office365.com') setEmPort('993');
                      else if (host === 'imap.gmail.com') setEmPort('993');
                      else if (host === 'imap.mail.yahoo.com') setEmPort('993');
                      else if (host === 'imap.office365.com') setEmPort('993');
                    }}
                    className="input text-sm"
                  >
                    <option value="outlook.office365.com">Microsoft 365 / Outlook</option>
                    <option value="imap.gmail.com">Gmail (Google)</option>
                    <option value="imap.mail.yahoo.com">Yahoo Mail</option>
                    <option value="">Custom Server...</option>
                  </select>
                </div>
                <div>
                  <label className="label">IMAP Port</label>
                  <input
                    type="number"
                    value={emPort}
                    onChange={e => setEmPort(e.target.value)}
                    className="input text-sm font-mono"
                    placeholder="993"
                  />
                </div>
              </div>

              {!emHost && (
                <div>
                  <label className="label">Custom IMAP Server</label>
                  <input
                    type="text"
                    value={emHost}
                    onChange={e => setEmHost(e.target.value)}
                    className="input text-sm font-mono"
                    placeholder="mail.yourcompany.com"
                  />
                </div>
              )}

              <div>
                <label className="label">Alert Keywords</label>
                <textarea
                  value={emKeywords}
                  onChange={e => setEmKeywords(e.target.value)}
                  className="input text-sm font-mono"
                  rows={3}
                  placeholder="permit, inspection, plumbing, rough-in, schedule change, urgent, failed, approved..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated keywords. Job Pulse sends SMS alerts when emails match these terms.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={handleTestEmailMonitor} disabled={emTesting} className="btn-secondary text-sm whitespace-nowrap">
                  {emTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test Connection
                </button>
                <button onClick={handleCheckNow} disabled={emChecking} className="btn-secondary text-sm whitespace-nowrap">
                  {emChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Check Now
                </button>
                <button onClick={handleSaveEmailMonitor} disabled={emSaving} className="btn-primary text-sm whitespace-nowrap">
                  {emSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Job Pulse Email
                </button>
              </div>

              {/* Connection Status */}
              {emStatus && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${emStatus.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {emStatus.enabled ? 'Job Pulse Monitoring Active' : 'Job Pulse Monitoring Disabled'}
                    </span>
                  </div>
                  {emStatus.lastCheckTime && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last check: {new Date(emStatus.lastCheckTime).toLocaleString()}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 text-xs">Total Alerts</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{emStatus.totalAlerts || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 text-xs">SMS Sent</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{emStatus.totalSmsSent || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 text-xs">Keywords</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{emStatus.keywords?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Alerts */}
              {emAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Job Alerts</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {emAlerts.slice(0, 5).map((a, i) => (
                      <div key={a.id || i} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{a.fromName || a.fromAddress}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{a.processedAt ? new Date(a.processedAt).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 truncate">{a.subject}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(a.matchedKeywords || '').split(', ').filter(Boolean).map(kw => (
                            <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-mono">{kw}</span>
                          ))}
                        </div>
                        {a.smsSent ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-block">✓ SMS sent</span>
                        ) : (
                          <span className="text-xs text-gray-500 mt-1 inline-block">No SMS</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      <Section icon={Bell} title="SMS Alert Settings">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure SMS notifications for Job Pulse alerts. Requires Twilio credentials in API Keys section.
          </p>
          <SettingsRow label="Send SMS for Job Alerts" description="Get text messages when important job emails arrive">
            <Toggle enabled={notifySmsEnabled} onChange={setNotifySmsEnabled} />
          </SettingsRow>
          <div>
            <label className="label">Admin Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={notifyAdminPhone}
                onChange={e => setNotifyAdminPhone(e.target.value)}
                className="input pl-10 text-sm"
                placeholder="+1 (817) 555-0100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Phone number to receive SMS alerts from Job Pulse</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default memo(SettingsJobPulse);
