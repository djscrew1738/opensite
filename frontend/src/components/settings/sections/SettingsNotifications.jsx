import { memo } from 'react';
import {
  Bell, Mail, MessageSquare, CalendarDays, Phone, Key,
  Loader2, Save, Zap, RefreshCw, CheckCircle, Eye, EyeOff,
  ExternalLink, Info
} from 'lucide-react';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

function SettingsNotifications({
  notifyEnabled,
  setNotifyEnabled,
  notifyEmailEnabled,
  setNotifyEmailEnabled,
  notifyEmailAddr,
  setNotifyEmailAddr,
  notifyOnNewLead,
  setNotifyOnNewLead,
  notifyOnHighScore,
  setNotifyOnHighScore,
  notifyOnPermit,
  setNotifyOnPermit,
  notifySmsEnabled,
  setNotifySmsEnabled,
  notifyAdminPhone,
  setNotifyAdminPhone,
  notifyDigestEnabled,
  setNotifyDigestEnabled,
  notifyDigestDay,
  setNotifyDigestDay,
  notifyDigestTime,
  setNotifyDigestTime,
  savingNotifications,
  handleSaveNotifications,
  // Email Monitor
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
  // Email Watcher Multi-Provider
  settings,
  googleClientId,
  setGoogleClientId,
  googleClientSecret,
  setGoogleClientSecret,
  showGoogleClientSecret,
  setShowGoogleClientSecret,
  testingGoogle,
  handleTestGoogle,
  handleSaveGoogle,
  msClientId,
  setMsClientId,
  msClientSecret,
  setMsClientSecret,
  showMsClientSecret,
  setShowMsClientSecret,
  testingMicrosoft,
  handleTestMicrosoft,
  handleSaveMicrosoft,
  ewPollInterval,
  setEwPollInterval,
  ewMarkAsRead,
  setEwMarkAsRead,
  handleSaveEmailWatcher,
}) {
  return (
    <div className="space-y-6">
      <Section icon={Bell} title="Notifications">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingsRow label="Enable Notifications" description="Master toggle — disabling this silences all alerts">
            <Toggle enabled={notifyEnabled} onChange={setNotifyEnabled} />
          </SettingsRow>
        </div>
      </Section>

      <Section icon={Mail} title="Email Notifications">
        <div className={`space-y-4 ${!notifyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <SettingsRow label="Email Alerts" description="Send notifications via email">
            <Toggle enabled={notifyEmailEnabled} onChange={setNotifyEmailEnabled} />
          </SettingsRow>
          {notifyEmailEnabled && (
            <div>
              <label className="label">Notification Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={notifyEmailAddr} onChange={e => setNotifyEmailAddr(e.target.value)} className="input pl-10 text-sm" placeholder="you@ctlplumbing.com" />
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Email me when...</p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <SettingsRow label="New lead discovered" description="Any permit or lead above min score"><Toggle enabled={notifyOnNewLead} onChange={setNotifyOnNewLead} /></SettingsRow>
              <SettingsRow label="High-score lead" description="Lead scores 8 or above"><Toggle enabled={notifyOnHighScore} onChange={setNotifyOnHighScore} /></SettingsRow>
              <SettingsRow label="New permit ingested" description="Fresh permits pulled from county"><Toggle enabled={notifyOnPermit} onChange={setNotifyOnPermit} /></SettingsRow>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={MessageSquare} title="SMS Notifications">
        <div className={`space-y-4 ${!notifyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <SettingsRow label="SMS Alerts" description="Send urgent alerts via SMS (requires Twilio)">
            <Toggle enabled={notifySmsEnabled} onChange={setNotifySmsEnabled} />
          </SettingsRow>
          {notifySmsEnabled && (
            <div>
              <label className="label">Admin Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={notifyAdminPhone} onChange={e => setNotifyAdminPhone(e.target.value)} className="input pl-10 text-sm" placeholder="+18175550100" />
              </div>
              <p className="text-xs text-gray-500 mt-1">SMS is for urgent/high-score leads only to limit costs</p>
            </div>
          )}
        </div>
      </Section>

      <Section icon={CalendarDays} title="Weekly Digest">
        <div className={`space-y-4 ${!notifyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <SettingsRow label="Weekly Digest Email" description="Receive a weekly summary of leads, revenue, and activity">
            <Toggle enabled={notifyDigestEnabled} onChange={setNotifyDigestEnabled} />
          </SettingsRow>
          {notifyDigestEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Send On</label>
                <select value={notifyDigestDay} onChange={e => setNotifyDigestDay(e.target.value)} className="input">
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Send At</label>
                <input type="time" value={notifyDigestTime} onChange={e => setNotifyDigestTime(e.target.value)} className="input font-mono text-sm" />
              </div>
            </div>
          )}
        </div>
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSaveNotifications} disabled={savingNotifications} className="btn-primary text-sm">
          {savingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Notifications
        </button>
      </div>

      {/* Email Monitor Section */}
      <Section icon={Mail} title="Email Monitor (Outlook)"
        badge={emStatus?.enabled ? (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Active</span>
        ) : (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Off</span>
        )}
      >
        <div className="space-y-4">
          <SettingsRow label="Enable Email Monitor" description="Scans your Outlook inbox every 10 min for plumbing/permit keywords and sends SMS alerts via Twilio">
            <Toggle enabled={emEnabled} onChange={setEmEnabled} />
          </SettingsRow>

          {emEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={emUser} onChange={e => setEmUser(e.target.value)} className="input pl-10 text-sm" placeholder="you@outlook.com" />
                  </div>
                </div>
                <div>
                  <label className="label">Password / App Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={emPass} onChange={e => setEmPass(e.target.value)} className="input pl-10 text-sm" placeholder="Enter password (leave blank to keep current)" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">If MFA is on, use an app password from your Microsoft account security settings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">IMAP Server</label>
                  <input type="text" value={emHost} onChange={e => setEmHost(e.target.value)} className="input text-sm font-mono" placeholder="outlook.office365.com" />
                </div>
                <div>
                  <label className="label">IMAP Port</label>
                  <input type="number" value={emPort} onChange={e => setEmPort(e.target.value)} className="input text-sm font-mono" placeholder="993" />
                </div>
              </div>

              <div>
                <label className="label">Alert Keywords</label>
                <textarea value={emKeywords} onChange={e => setEmKeywords(e.target.value)} className="input text-sm font-mono" rows={3}
                  placeholder="permit, inspection, plumbing, rough-in, schedule change, urgent, failed, approved..." />
                <p className="text-xs text-gray-500 mt-1">Comma-separated. Emails matching any keyword in subject or body trigger an SMS alert.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={handleTestEmailMonitor} disabled={emTesting} className="btn-secondary text-sm whitespace-nowrap">
                  {emTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test Connection
                </button>
                <button onClick={handleCheckNow} disabled={emChecking} className="btn-secondary text-sm whitespace-nowrap">
                  {emChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Check Now
                </button>
                <button onClick={handleSaveEmailMonitor} disabled={emSaving} className="btn-primary text-sm whitespace-nowrap">
                  {emSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Email Monitor
                </button>
              </div>

              {/* Status */}
              {emStatus && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${emStatus.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {emStatus.enabled ? 'Monitoring active' : 'Monitor disabled'}
                    </span>
                  </div>
                  {emStatus.lastCheckTime && (
                    <p className="text-gray-500 dark:text-gray-400">Last check: {new Date(emStatus.lastCheckTime).toLocaleString()}</p>
                  )}
                  <p className="text-gray-500 dark:text-gray-400">Total alerts: {emStatus.totalAlerts || 0} | SMS sent: {emStatus.totalSmsSent || 0}</p>
                </div>
              )}

              {/* Recent Alerts */}
              {emAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Alerts</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {emAlerts.map((a, i) => (
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
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-block">SMS sent</span>
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

      {/* Email Watcher Section - Multi-Provider */}
      <Section icon={Mail} title="Email Watcher (Multi-Provider)"
        badge={
          settings.microsoft_client_id_configured || settings.google_client_id_configured ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Configured</span>
          ) : (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Not Configured</span>
          )
        }
      >
        <div className="space-y-5">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 inline mr-2" />
              The Email Watcher monitors Gmail and Outlook inboxes via OAuth2, sending keyword-based alerts via SMS and Telegram.
            </p>
          </div>

          {/* Google OAuth */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Google Gmail OAuth</p>
              {settings.google_client_id_configured && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Client ID</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">From <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Cloud Console <ExternalLink className="w-3 h-3 inline" /></a></p>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={e => setGoogleClientId(e.target.value)}
                  className="input font-mono text-sm"
                  placeholder={settings.google_client_id_masked || 'xxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com'}
                />
              </div>
              <div>
                <label className="label">Client Secret</label>
                <div className="relative">
                  <input
                    type={showGoogleClientSecret ? 'text' : 'password'}
                    value={googleClientSecret}
                    onChange={e => setGoogleClientSecret(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.google_client_secret_masked || 'Enter Client Secret'}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowGoogleClientSecret(!showGoogleClientSecret)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showGoogleClientSecret ? 'Hide client secret' : 'Show client secret'}
                  >
                    {showGoogleClientSecret ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={handleTestGoogle} disabled={testingGoogle} className="btn-secondary text-sm whitespace-nowrap">
                  {testingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                </button>
                <button onClick={handleSaveGoogle} disabled={!googleClientId.trim() && !googleClientSecret.trim()} className="btn-primary text-sm whitespace-nowrap">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>

          {/* Microsoft OAuth */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Microsoft Outlook OAuth</p>
              {settings.microsoft_client_id_configured && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Application (Client) ID</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Register an app at <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">portal.azure.com <ExternalLink className="w-3 h-3 inline" /></a></p>
                <input
                  type="text"
                  value={msClientId}
                  onChange={e => setMsClientId(e.target.value)}
                  className="input font-mono text-sm"
                  placeholder={settings.microsoft_client_id_masked || 'Enter Client ID'}
                />
              </div>
              <div>
                <label className="label">Client Secret</label>
                <div className="relative">
                  <input
                    type={showMsClientSecret ? 'text' : 'password'}
                    value={msClientSecret}
                    onChange={e => setMsClientSecret(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.microsoft_client_secret_masked || 'Enter Client Secret'}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowMsClientSecret(!showMsClientSecret)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showMsClientSecret ? 'Hide client secret' : 'Show client secret'}
                  >
                    {showMsClientSecret ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={handleTestMicrosoft} disabled={testingMicrosoft} className="btn-secondary text-sm whitespace-nowrap">
                  {testingMicrosoft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                </button>
                <button onClick={handleSaveMicrosoft} disabled={!msClientId.trim() && !msClientSecret.trim()} className="btn-primary text-sm whitespace-nowrap">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>

          {/* Watcher Configuration */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Watcher Configuration</p>
            <div className="space-y-4">
              <SliderField
                label="Poll Interval"
                value={ewPollInterval}
                onChange={setEwPollInterval}
                min={30}
                max={300}
                step={30}
                unit=" sec"
                markers={['30s','60s','120s','300s']}
              />
              <SettingsRow label="Mark Emails as Read" description="Automatically mark matched emails as read">
                <Toggle enabled={ewMarkAsRead} onChange={setEwMarkAsRead} />
              </SettingsRow>
              <div className="flex justify-end">
                <button onClick={handleSaveEmailWatcher} className="btn-primary text-sm whitespace-nowrap">
                  <Save className="w-4 h-4" /> Save Config
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default memo(SettingsNotifications);
