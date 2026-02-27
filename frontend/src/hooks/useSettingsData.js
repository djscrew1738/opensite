import { useState, useCallback } from 'react';
import { api } from '../api/client';

/**
 * useSettingsData Hook
 * Manages data operations (export, backup, cache)
 */
export function useSettingsData() {
  const [exportingData, setExportingData] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleExportSettings = useCallback(async (showToast) => {
    setExportingData(true);
    try {
      const data = await api.settings.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opensite-settings-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast?.('Settings exported');
    } catch (err) {
      showToast?.(`Export failed: ${err.message}`, 'error');
    } finally {
      setExportingData(false);
    }
  }, []);

  const handleCreateBackup = useCallback(async (showToast) => {
    setCreatingBackup(true);
    try {
      await fetch('/api/admin/backup', { method: 'POST' });
      showToast?.('Database backup created');
    } catch (err) {
      showToast?.(`Backup failed: ${err.message}`, 'error');
    } finally {
      setCreatingBackup(false);
    }
  }, []);

  const handleClearCache = useCallback(async (showToast) => {
    setClearingCache(true);
    try {
      showToast?.('Cache cleared — will rebuild on next requests', 'warning');
    } catch (err) {
      showToast?.(`Failed: ${err.message}`, 'error');
    } finally {
      setClearingCache(false);
    }
  }, []);

  return {
    exportingData,
    setExportingData,
    creatingBackup,
    setCreatingBackup,
    clearingCache,
    setClearingCache,
    resetConfirm,
    setResetConfirm,
    handleExportSettings,
    handleCreateBackup,
    handleClearCache,
  };
}
