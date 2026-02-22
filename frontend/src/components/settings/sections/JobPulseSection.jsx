/**
 * JobPulse Section
 * Job monitoring and email alert configuration
 */

import { Activity, Mail, Bell, RefreshCw, Clock, Filter, Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow, Toggle } from '../primitives';

export default function JobPulseSection() {
  const ctx = useSettings();
  const { 
    handleSaveEmailMonitor, handleTestEmailMonitor, handleCheckNow,
    handleSaveMicrosoft, handleTestMicrosoft, handleSaveGoogle, handleTestGoogle,
    handleSaveTelegram, handleTestTelegram, handleSaveEmailWatcher
  } = useSettingsActions();
  
  const {
    emEnabled, setEmEnabled, emHost, setEmHost, emPort, setEmPort,
    emUser, setEmUser, emPass, setEmPass, emKeywords, setEmKeywords,
    emTesting, emChecking, emSaving, msClientId, setMsClientId,
    msClientSecret, setMsClientSecret, showMsClientSecret, setShowMsClientSecret,
    testingMicrosoft, googleClientId, setGoogleClientId, googleClientSecret,
    setGoogleClientSecret, showGoogleClientSecret, setShowGoogleClientSecret,
    testingGoogle, telegramToken, setTelegramToken, showTelegramToken,
    setShowTelegramToken, telegramChatId, setTelegramChatId, testingTelegram,
    ewPollInterval, setEwPollInterval, ewMarkAsRead, setEwMarkAsRead,
    settings, testingOllama, connected
  } = ctx;

  return (
    <div className="space-y-6">
      <Section icon={Activity} title="JobPulse Monitor">
        <div className="space-y-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">What is JobPulse?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  JobPulse monitors your email for job-related messages and automatically extracts 
                  potential leads. It supports Microsoft 365, Gmail, and Telegram notifications.
                </p>
              </div>
            </div>
          </div>

          <SettingsRow 
            label="Enable Email Monitoring" 
            description="Monitor inbox for new job opportunities"
          >
            <Toggle enabled={emEnabled} onChange={setEmEnabled} />
          </SettingsRow>
        </div>
      </Section>

      {emEnabled && (
        <>
          <Section icon={Mail} title="Legacy IMAP Monitor">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">IMAP Host</label>
                  <input 
                    type="text" 
                    value={emHost} 
                    onChange={e => setEmHost(e.target.value)} 
                    className="input font-mono text-sm" 
                    placeholder="outlook.office365.com"
                  />
                </div>
                <div>
                  <label className="label">Port</label>
                  <input 
                    type="text" 
                    value={emPort} 
                    onChange={e => setEmPort(e.target.value)} 
                    className="input w-24 font-mono text-sm" 
                    placeholder="993"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email Address</label>
                <input 
                  type="email" 
                  value={emUser} 
                  onChange={e => setEmUser(e.target.value)} 
                  className="input" 
                  placeholder="leads@company.com"
                />
              </div>

              <div>
                <label className="label">Password / App Token</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={emPass} 
                    onChange={e => setEmPass(e.target.value)} 
                    className="input pr-10 font-mono text-sm" 
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use an app-specific password for better security
                </p>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" /> Keywords
                </label>
                <input 
                  type="text" 
                  value={emKeywords} 
                  onChange={e => setEmKeywords(e.target.value)} 
                  className="input" 
                  placeholder="permit, plumbing, contractor, bid"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Comma-separated keywords to filter relevant emails
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={handleTestEmailMonitor} disabled={emTesting} className="btn-secondary text-sm">
                  {emTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Test Connection
                </button>
                <button onClick={handleSaveEmailMonitor} disabled={emSaving} className="btn-primary text-sm">
                  {emSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={handleCheckNow} disabled={emChecking} className="btn-ghost text-sm">
                  {emChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Check Now
                </button>
              </div>
            </div>
          </Section>

          <Section icon={Mail} title="Microsoft 365 (Graph API)">
            <div className="space-y-5">
              <div>
                <label className="label">Client ID</label>
                <input 
                  type="text" 
                  value={msClientId} 
                  onChange={e => setMsClientId(e.target.value)} 
                  className="input font-mono text-sm" 
                  placeholder={settings.microsoft_client_id ? '••••••••' : 'Enter Microsoft Client ID'}
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
                    placeholder="Enter Client Secret"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowMsClientSecret(!showMsClientSecret)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showMsClientSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleTestMicrosoft} disabled={testingMicrosoft} className="btn-secondary text-sm">
                  {testingMicrosoft ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Test
                </button>
                <button onClick={handleSaveMicrosoft} className="btn-primary text-sm">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </Section>

          <Section icon={Mail} title="Gmail (Google OAuth)">
            <div className="space-y-5">
              <div>
                <label className="label">Client ID</label>
                <input 
                  type="text" 
                  value={googleClientId} 
                  onChange={e => setGoogleClientId(e.target.value)} 
                  className="input font-mono text-sm" 
                  placeholder={settings.google_client_id ? '••••••••' : 'Enter Google Client ID'}
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
                    placeholder="Enter Client Secret"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowGoogleClientSecret(!showGoogleClientSecret)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showGoogleClientSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleTestGoogle} disabled={testingGoogle} className="btn-secondary text-sm">
                  {testingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Test
                </button>
                <button onClick={handleSaveGoogle} className="btn-primary text-sm">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </Section>

          <Section icon={Activity} title="Telegram Notifications">
            <div className="space-y-5">
              <div>
                <label className="label">Bot Token</label>
                <div className="relative">
                  <input 
                    type={showTelegramToken ? 'text' : 'password'} 
                    value={telegramToken} 
                    onChange={e => setTelegramToken(e.target.value)} 
                    className="input pr-10 font-mono text-sm" 
                    placeholder={settings.telegram_bot_token ? '••••••••' : 'Enter Bot Token'}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowTelegramToken(!showTelegramToken)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showTelegramToken ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Chat ID</label>
                <input 
                  type="text" 
                  value={telegramChatId} 
                  onChange={e => setTelegramChatId(e.target.value)} 
                  className="input font-mono text-sm" 
                  placeholder={settings.telegram_chat_id || 'e.g. 123456789'}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleTestTelegram} disabled={testingTelegram} className="btn-secondary text-sm">
                  {testingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Test
                </button>
                <button onClick={handleSaveTelegram} className="btn-primary text-sm">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </Section>

          <Section icon={Clock} title="Watcher Settings">
            <div className="space-y-5">
              <div>
                <label className="label">Poll Interval (seconds)</label>
                <input 
                  type="number" 
                  value={ewPollInterval} 
                  onChange={e => setEwPollInterval(Number(e.target.value))} 
                  className="input w-32" 
                  min="30" max="600"
                />
              </div>
              <SettingsRow 
                label="Mark as Read" 
                description="Mark processed emails as read"
              >
                <Toggle enabled={ewMarkAsRead} onChange={setEwMarkAsRead} />
              </SettingsRow>
              <div className="flex justify-end">
                <button onClick={handleSaveEmailWatcher} className="btn-primary text-sm">
                  <Save className="w-4 h-4" /> Save Watcher Settings
                </button>
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
