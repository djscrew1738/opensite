/**
 * Notifications Section
 * Alerts, digests, and multi-channel messaging
 */

import { memo } from 'react';
import { 
  Bell, Mail, Smartphone, Calendar, Clock, 
  Save, Loader2, MessageSquare, ShieldCheck,
  Send, Laptop, AlertTriangle
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow, Toggle } from '../primitives';

export default memo(function NotificationsSection() {
  const ctx = useSettings();
  const { handleSaveNotifications } = useSettingsActions();

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Bell} 
        title="Global Notifications"
        description="Configure how and when you receive system alerts and business digests"
      >
        <div className="space-y-6 mt-4">
          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <SettingsRow 
              label="Master Notification Switch" 
              description="Enable or disable all outgoing system notifications"
              icon={ShieldCheck}
            >
              <Toggle enabled={ctx.notifyEnabled} onChange={ctx.setNotifyEnabled} />
            </SettingsRow>
          </div>

          <div className={`grid md:grid-cols-2 gap-6 transition-all duration-300 ${ctx.notifyEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Email Channel */}
            <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-4">
              <SettingsRow 
                label="Email Alerts" 
                description="Receive critical alerts via email"
                icon={Mail}
              >
                <Toggle enabled={ctx.notifyEmailEnabled} onChange={ctx.setNotifyEmailEnabled} />
              </SettingsRow>
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Target Email Address</label>
                <input 
                  type="email" 
                  value={ctx.notifyEmailAddr} 
                  onChange={e => ctx.setNotifyEmailAddr(e.target.value)} 
                  className="input h-10 text-sm" 
                  placeholder="alerts@company.com" 
                  disabled={!ctx.notifyEmailEnabled}
                />
              </div>
            </div>

            {/* SMS Channel */}
            <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-4">
              <SettingsRow 
                label="SMS Alerts" 
                description="Instant text messages for leads"
                icon={Smartphone}
              >
                <Toggle enabled={ctx.notifySmsEnabled} onChange={ctx.setNotifySmsEnabled} />
              </SettingsRow>
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Admin Phone Number</label>
                <input 
                  type="tel" 
                  value={ctx.notifyAdminPhone} 
                  onChange={e => ctx.setNotifyAdminPhone(e.target.value)} 
                  className="input h-10 text-sm font-mono" 
                  placeholder="+1 (000) 000-0000" 
                  disabled={!ctx.notifySmsEnabled}
                />
              </div>
            </div>
          </div>

          {/* Trigger Events */}
          <div className={`p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-1 transition-all duration-300 ${ctx.notifyEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-1">Trigger Events</h3>
            
            <SettingsRow 
              label="New Lead Detected" 
              description="Alert when a new lead is found during discovery"
            >
              <Toggle enabled={ctx.notifyOnNewLead} onChange={ctx.setNotifyOnNewLead} />
            </SettingsRow>

            <SettingsRow 
              label="High Score Leads" 
              description="Special alert for leads matching 80%+ of profile"
            >
              <Toggle enabled={ctx.notifyOnHighScore} onChange={ctx.setNotifyOnHighScore} />
            </SettingsRow>

            <SettingsRow 
              label="Permit Filings" 
              description="Alert when new plumbing permits are filed in service area"
            >
              <Toggle enabled={ctx.notifyOnPermit} onChange={ctx.setNotifyOnPermit} />
            </SettingsRow>
          </div>

          {/* Business Digest */}
          <div className={`p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-4 transition-all duration-300 ${ctx.notifyEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <SettingsRow 
              label="Automated Business Digest" 
              description="Receive a periodic summary of all activity and lead performance"
              icon={Calendar}
            >
              <Toggle enabled={ctx.notifyDigestEnabled} onChange={ctx.setNotifyDigestEnabled} />
            </SettingsRow>

            {ctx.notifyDigestEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Delivery Day</label>
                  <select 
                    value={ctx.notifyDigestDay} 
                    onChange={e => ctx.setNotifyDigestDay(e.target.value)} 
                    className="input h-10 text-sm font-bold"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Daily'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Delivery Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input 
                      type="time" 
                      value={ctx.notifyDigestTime} 
                      onChange={e => ctx.setNotifyDigestTime(e.target.value)} 
                      className="input pl-9 h-10 text-sm font-bold" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-border-default">
            <button 
              onClick={handleSaveNotifications} 
              disabled={ctx.savingNotifications} 
              className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20 transition-all active:scale-95"
            >
              {ctx.savingNotifications ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
              Save Notification Preferences
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
});
