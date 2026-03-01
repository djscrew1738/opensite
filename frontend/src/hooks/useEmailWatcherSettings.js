import { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * Manages Microsoft Graph + Google Gmail OAuth watcher credentials,
 * connection state, and poll interval settings.
 */
export function useEmailWatcherSettings({ settingsData, refetchSettings, showToast }) {
  /* ── Microsoft Graph ── */
  const [msClientId, setMsClientId] = useState('');
  const [msClientSecret, setMsClientSecret] = useState('');
  const [showMsClientSecret, setShowMsClientSecret] = useState(false);
  const [testingMicrosoft, setTestingMicrosoft] = useState(false);
  const [connectingMicrosoft, setConnectingMicrosoft] = useState(false);

  /* ── Google Gmail ── */
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showGoogleClientSecret, setShowGoogleClientSecret] = useState(false);
  const [testingGoogle, setTestingGoogle] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  /* ── Watcher global settings ── */
  const [ewPollInterval, setEwPollInterval] = useState(60);
  const [ewMarkAsRead, setEwMarkAsRead] = useState(false);

  /* ── Sync from server ── */
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;
    setEwPollInterval(num(s.email_watcher_poll_interval, 60));
    setEwMarkAsRead(String(s.email_watcher_mark_read) === 'true');
  }, [settingsData]);

  /* ── Handlers ── */
  const handleSaveMicrosoft = async () => {
    try {
      const u = {};
      if (msClientId) u.microsoft_client_id = msClientId;
      if (msClientSecret) u.microsoft_client_secret = msClientSecret;
      await api.settings.update(u);
      setMsClientId(''); setMsClientSecret('');
      refetchSettings();
      showToast('Microsoft OAuth credentials saved');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleTestMicrosoft = async () => {
    setTestingMicrosoft(true);
    try {
      const r = await api.settings.testMicrosoft(msClientId || undefined, msClientSecret || undefined);
      if (r.valid) showToast('Microsoft OAuth credentials valid');
      else showToast(r.error || 'Invalid credentials', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingMicrosoft(false);
    }
  };

  const handleConnectMicrosoft = async () => {
    setConnectingMicrosoft(true);
    try {
      const r = await api.emailAlerts.addAccount('outlook', 'Outlook Account');
      if (r?.authUrl) window.location.href = r.authUrl;
      else showToast('Failed to get Microsoft auth URL', 'error');
    } catch (err) {
      showToast(`Failed to start OAuth: ${err.message}`, 'error');
    } finally {
      setConnectingMicrosoft(false);
    }
  };

  const handleSaveGoogle = async () => {
    try {
      const u = {};
      if (googleClientId) u.google_client_id = googleClientId;
      if (googleClientSecret) u.google_client_secret = googleClientSecret;
      await api.settings.update(u);
      setGoogleClientId(''); setGoogleClientSecret('');
      refetchSettings();
      showToast('Google OAuth credentials saved');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleTestGoogle = async () => {
    setTestingGoogle(true);
    try {
      const r = await api.settings.testGoogle(googleClientId || undefined, googleClientSecret || undefined);
      if (r.valid) showToast(r.message || 'Google OAuth credentials valid');
      else showToast(r.error || 'Invalid credentials', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingGoogle(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const r = await api.emailAlerts.addAccount('gmail', 'Gmail Account');
      if (r?.authUrl) window.location.href = r.authUrl;
      else showToast('Failed to get Google auth URL', 'error');
    } catch (err) {
      showToast(`Failed to start OAuth: ${err.message}`, 'error');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const handleSaveEmailWatcher = async () => {
    try {
      await api.settings.update({
        email_watcher_poll_interval: String(ewPollInterval),
        email_watcher_mark_read: String(ewMarkAsRead),
      });
      refetchSettings();
      showToast('Email watcher settings saved');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  return {
    msClientId, setMsClientId,
    msClientSecret, setMsClientSecret,
    showMsClientSecret, setShowMsClientSecret,
    testingMicrosoft, connectingMicrosoft,
    googleClientId, setGoogleClientId,
    googleClientSecret, setGoogleClientSecret,
    showGoogleClientSecret, setShowGoogleClientSecret,
    testingGoogle, connectingGoogle,
    ewPollInterval, setEwPollInterval,
    ewMarkAsRead, setEwMarkAsRead,
    handleSaveMicrosoft, handleTestMicrosoft, handleConnectMicrosoft,
    handleSaveGoogle, handleTestGoogle, handleConnectGoogle,
    handleSaveEmailWatcher,
  };
}
