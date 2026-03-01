import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ensureArray } from '../utils/safeArray';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

/**
 * Manages notification preferences and IMAP email-monitor state.
 * Isolated so editing notification fields doesn't re-render unrelated sections.
 */
export function useNotificationsSettings({ settingsData, refetchSettings, showToast }) {
  /* ── Notification toggles ── */
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(false);
  const [notifyEmailAddr, setNotifyEmailAddr] = useState('');
  const [notifySmsEnabled, setNotifySmsEnabled] = useState(false);
  const [notifyAdminPhone, setNotifyAdminPhone] = useState('');
  const [notifyOnNewLead, setNotifyOnNewLead] = useState(true);
  const [notifyOnHighScore, setNotifyOnHighScore] = useState(true);
  const [notifyOnPermit, setNotifyOnPermit] = useState(true);
  const [notifyDigestEnabled, setNotifyDigestEnabled] = useState(false);
  const [notifyDigestDay, setNotifyDigestDay] = useState('Monday');
  const [notifyDigestTime, setNotifyDigestTime] = useState('08:00');
  const [savingNotifications, setSavingNotifications] = useState(false);

  /* ── IMAP email monitor ── */
  const [emEnabled, setEmEnabled] = useState(false);
  const [emHost, setEmHost] = useState('outlook.office365.com');
  const [emPort, setEmPort] = useState('993');
  const [emUser, setEmUser] = useState('');
  const [emPass, setEmPass] = useState('');
  const [emKeywords, setEmKeywords] = useState('');
  const [emTesting, setEmTesting] = useState(false);
  const [emChecking, setEmChecking] = useState(false);
  const [emSaving, setEmSaving] = useState(false);
  const [emStatus, setEmStatus] = useState(null);
  const [emAlerts, setEmAlerts] = useState([]);

  /* ── Sync from server ── */
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';

    setNotifyEnabled(bool(s.notify_enabled));
    setNotifyEmailEnabled(bool(s.notify_email_enabled));
    setNotifyEmailAddr(s.notify_email_address || '');
    setNotifySmsEnabled(bool(s.notify_sms_enabled));
    setNotifyAdminPhone(s.notify_admin_phone || '');
    setNotifyOnNewLead(bool(s.notify_on_new_lead, true));
    setNotifyOnHighScore(bool(s.notify_on_high_score, true));
    setNotifyOnPermit(bool(s.notify_on_permit, true));
    setNotifyDigestEnabled(bool(s.notify_digest_enabled));
    setNotifyDigestDay(s.notify_digest_day || 'Monday');
    setNotifyDigestTime(s.notify_digest_time || '08:00');

    // Email monitor loaded from dedicated endpoint
    api.emailMonitor.getSettings().then(d => {
      if (d) {
        setEmEnabled(d.enabled || false);
        setEmHost(d.host || 'outlook.office365.com');
        setEmPort(String(d.port || 993));
        setEmUser(d.user || '');
        setEmKeywords(d.keywords || '');
      }
    }).catch(() => {});
    api.emailMonitor.getStatus().then(st => setEmStatus(st)).catch(() => {});
    api.emailMonitor.getAlerts({ limit: 10 }).then(d => {
      setEmAlerts(ensureArray(d?.alerts));
    }).catch(() => setEmAlerts([]));
  }, [settingsData]);

  /* ── Handlers ── */
  const handleSaveNotifications = async () => {
    if (notifyEmailEnabled && notifyEmailAddr && !EMAIL_RE.test(notifyEmailAddr)) {
      showToast('Invalid notification email address', 'error'); return;
    }
    if (notifySmsEnabled && notifyAdminPhone && !PHONE_RE.test(notifyAdminPhone)) {
      showToast('Invalid admin phone number for SMS', 'error'); return;
    }
    setSavingNotifications(true);
    try {
      await api.settings.update({
        notify_enabled: String(notifyEnabled),
        notify_email_enabled: String(notifyEmailEnabled),
        notify_email_address: notifyEmailAddr,
        notify_sms_enabled: String(notifySmsEnabled),
        notify_admin_phone: notifyAdminPhone,
        notify_on_new_lead: String(notifyOnNewLead),
        notify_on_high_score: String(notifyOnHighScore),
        notify_on_permit: String(notifyOnPermit),
        notify_digest_enabled: String(notifyDigestEnabled),
        notify_digest_day: notifyDigestDay,
        notify_digest_time: notifyDigestTime,
      });
      refetchSettings();
      showToast('Notification settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveEmailMonitor = async () => {
    setEmSaving(true);
    try {
      await api.emailMonitor.saveSettings({
        enabled: emEnabled,
        host: emHost,
        port: parseInt(emPort),
        user: emUser,
        ...(emPass ? { pass: emPass } : {}),
        keywords: emKeywords,
      });
      setEmPass('');
      showToast('Email monitor settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setEmSaving(false);
    }
  };

  const handleTestEmailMonitor = async () => {
    if (!emUser) { showToast('Enter email address first', 'error'); return; }
    setEmTesting(true);
    try {
      const r = await api.emailMonitor.testConnection({
        host: emHost, port: parseInt(emPort), user: emUser, pass: emPass || undefined,
      });
      showToast(`Connected! ${r.messages} messages in inbox, ${r.unseen} unseen`);
    } catch (err) {
      showToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      setEmTesting(false);
    }
  };

  const handleCheckNow = async () => {
    setEmChecking(true);
    try {
      const result = await api.emailMonitor.checkNow();
      if (result.disabled) showToast('Email monitor is disabled — enable it first', 'warning');
      else if (result.error) showToast(`Check failed: ${result.error}`, 'error');
      else showToast(`Checked: ${result.processed} emails, ${result.matched} matches, ${result.smsSent} SMS sent`);
      const alerts = await api.emailMonitor.getAlerts({ limit: 10 });
      setEmAlerts(ensureArray(alerts?.alerts));
      const st = await api.emailMonitor.getStatus();
      setEmStatus(st);
    } catch (err) {
      showToast(`Check failed: ${err.message}`, 'error');
    } finally {
      setEmChecking(false);
    }
  };

  return {
    notifyEnabled, setNotifyEnabled,
    notifyEmailEnabled, setNotifyEmailEnabled,
    notifyEmailAddr, setNotifyEmailAddr,
    notifySmsEnabled, setNotifySmsEnabled,
    notifyAdminPhone, setNotifyAdminPhone,
    notifyOnNewLead, setNotifyOnNewLead,
    notifyOnHighScore, setNotifyOnHighScore,
    notifyOnPermit, setNotifyOnPermit,
    notifyDigestEnabled, setNotifyDigestEnabled,
    notifyDigestDay, setNotifyDigestDay,
    notifyDigestTime, setNotifyDigestTime,
    savingNotifications,
    emEnabled, setEmEnabled,
    emHost, setEmHost,
    emPort, setEmPort,
    emUser, setEmUser,
    emPass, setEmPass,
    emKeywords, setEmKeywords,
    emTesting, emChecking, emSaving,
    emStatus, setEmStatus,
    emAlerts, setEmAlerts,
    handleSaveNotifications,
    handleSaveEmailMonitor,
    handleTestEmailMonitor,
    handleCheckNow,
  };
}
