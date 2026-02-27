import { useState, useCallback } from 'react';

/**
 * useSettingsNotifications Hook
 * Manages notification settings state
 */
export function useSettingsNotifications() {
  // Notification settings
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

  // Email Monitor (IMAP)
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

  // Microsoft OAuth
  const [msClientId, setMsClientId] = useState('');
  const [msClientSecret, setMsClientSecret] = useState('');
  const [showMsClientSecret, setShowMsClientSecret] = useState(false);
  const [testingMicrosoft, setTestingMicrosoft] = useState(false);
  const [connectingMicrosoft, setConnectingMicrosoft] = useState(false);

  // Google OAuth
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showGoogleClientSecret, setShowGoogleClientSecret] = useState(false);
  const [testingGoogle, setTestingGoogle] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Email Watcher settings
  const [ewPollInterval, setEwPollInterval] = useState(60);
  const [ewMarkAsRead, setEwMarkAsRead] = useState(false);

  // Loading states
  const [savingNotifications, setSavingNotifications] = useState(false);

  const syncFromSettings = useCallback((settings) => {
    if (!settings) return;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';

    setNotifyEnabled(bool(settings.notify_enabled, false));
    setNotifyEmailEnabled(bool(settings.notify_email_enabled, false));
    setNotifyEmailAddr(settings.notify_email_address || '');
    setNotifySmsEnabled(bool(settings.notify_sms_enabled, false));
    setNotifyAdminPhone(settings.notify_admin_phone || '');
    setNotifyOnNewLead(bool(settings.notify_on_new_lead, true));
    setNotifyOnHighScore(bool(settings.notify_on_high_score, true));
    setNotifyOnPermit(bool(settings.notify_on_permit, true));
    setNotifyDigestEnabled(bool(settings.notify_digest_enabled, false));
    setNotifyDigestDay(settings.notify_digest_day || 'Monday');
    setNotifyDigestTime(settings.notify_digest_time || '08:00');
    setEwPollInterval(parseFloat(settings.email_watcher_poll_interval) || 60);
    setEwMarkAsRead(bool(settings.email_watcher_mark_read, false));
  }, []);

  return {
    // Notifications
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

    // Email Monitor
    emEnabled, setEmEnabled,
    emHost, setEmHost,
    emPort, setEmPort,
    emUser, setEmUser,
    emPass, setEmPass,
    emKeywords, setEmKeywords,
    emTesting, setEmTesting,
    emChecking, setEmChecking,
    emSaving, setEmSaving,
    emStatus, setEmStatus,
    emAlerts, setEmAlerts,

    // Microsoft OAuth
    msClientId, setMsClientId,
    msClientSecret, setMsClientSecret,
    showMsClientSecret, setShowMsClientSecret,
    testingMicrosoft, setTestingMicrosoft,
    connectingMicrosoft, setConnectingMicrosoft,

    // Google OAuth
    googleClientId, setGoogleClientId,
    googleClientSecret, setGoogleClientSecret,
    showGoogleClientSecret, setShowGoogleClientSecret,
    testingGoogle, setTestingGoogle,
    connectingGoogle, setConnectingGoogle,

    // Email Watcher
    ewPollInterval, setEwPollInterval,
    ewMarkAsRead, setEwMarkAsRead,

    // Loading
    savingNotifications, setSavingNotifications,

    syncFromSettings,
  };
}
