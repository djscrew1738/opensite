/**
 * Notifications Section
 * Notification preferences and channels
 */

import { Bell, Mail, Smartphone, CheckCircle, Clock, Calendar, Loader2, Save } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow, Toggle } from '../primitives';

export default function NotificationsSection() {
  const ctx = useSettings();
  const { handleSaveNotifications } = useSettingsActions();
  
  const {
    notifyEnabled, setNotifyEnabled, notifyEmailEnabled, setNotifyEmailEnabled,
    notifyEmailAddr, setNotifyEmailAddr, notifySmsEnabled, setNotifySmsEnabled,
    notifyAdminPhone, setNotifyAdminPhone, notifyOnNewLead, setNotifyOnNewLead,
    notifyOnHighScore, setNotifyOnHighScore, notifyOnPermit, setNotifyOnPermit,
    notifyDigestEnabled, setNotifyDigestEnabled, notifyDigestDay, setNotifyDigestDay,
    notifyDigestTime, setNotifyDigestTime, savingNotifications, settings
  } = ctx;

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      <Section icon={Bell} title="Notification Preferences">
        <div className="space-y-5">
          <SettingsRow 
            label="Enable Notifications" 
            description="Master switch for all notifications"
          >
            <Toggle enabled={notifyEnabled} onChange={setNotifyEnabled} />
          </SettingsRow>

          {notifyEnabled && (
            <div className="pl-4 border-l-2 border-accent-200 dark:border-accent-800 space-y-3">
              <SettingsRow 
                label="Email Notifications" 
                description="Send notifications via email"
              >
                <Toggle enabled={notifyEmailEnabled} onChange={setNotifyEmailEnabled} />
              </SettingsRow>
              
              {notifyEmailEnabled && (
                <div className="pl-4">
                  <label className="label">Email Address</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={notifyEmailAddr} 
                      onChange={e => setNotifyEmailAddr(e.target.value)} 
                      className="input flex-1" 
                      placeholder={settings.notify_email_address || 'admin@company.com'}
                    />
                  </div>
                </div>
              )}

              <SettingsRow 
                label="SMS Notifications" 
                description="Send notifications via SMS (requires Twilio)"
              >
                <Toggle enabled={notifySmsEnabled} onChange={setNotifySmsEnabled} />
              </SettingsRow>

              {notifySmsEnabled && (
                <div className="pl-4">
                  <label className="label">Admin Phone Number</label>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      value={notifyAdminPhone} 
                      onChange={e => setNotifyAdminPhone(e.target.value)} 
                      className="input flex-1" 
                      placeholder={settings.notify_admin_phone || '+1 (555) 123-4567'}
                    />
                  </div>
                  {!settings.twilio_account_sid_configured && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Configure Twilio credentials in API Keys section to enable SMS
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {notifyEnabled && (
        <>
          <Section icon={CheckCircle} title="Event Triggers">
            <div className="space-y-3">
              <SettingsRow 
                label="New Lead Alert" 
                description="Notify when a new lead is discovered"
              >
                <Toggle enabled={notifyOnNewLead} onChange={setNotifyOnNewLead} />
              </SettingsRow>

              <SettingsRow 
                label="High-Score Lead" 
                description="Notify when a lead scores 8 or higher"
              >
                <Toggle enabled={notifyOnHighScore} onChange={setNotifyOnHighScore} />
              </SettingsRow>

              <SettingsRow 
                label="New Permit Filed" 
                description="Notify when a new permit is detected in your area"
              >
                <Toggle enabled={notifyOnPermit} onChange={setNotifyOnPermit} />
              </SettingsRow>
            </div>
          </Section>

          <Section icon={Calendar} title="Digest Settings">
            <div className="space-y-5">
              <SettingsRow 
                label="Weekly Digest" 
                description="Receive a summary of weekly activity"
              >
                <Toggle enabled={notifyDigestEnabled} onChange={setNotifyDigestEnabled} />
              </SettingsRow>

              {notifyDigestEnabled && (
                <div className="pl-4 border-l-2 border-accent-200 dark:border-accent-800 space-y-4">
                  <div>
                    <label className="label flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" /> Day of Week
                    </label>
                    <select 
                      value={notifyDigestDay} 
                      onChange={e => setNotifyDigestDay(e.target.value)} 
                      className="input w-40"
                    >
                      {weekDays.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" /> Time
                    </label>
                    <input 
                      type="time" 
                      value={notifyDigestTime} 
                      onChange={e => setNotifyDigestTime(e.target.value)} 
                      className="input w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>

          <div className="flex justify-end">
            <button onClick={handleSaveNotifications} disabled={savingNotifications} className="btn-primary text-sm">
              {savingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Notification Settings
            </button>
          </div>
        </>
      )}
    </div>
  );
}
