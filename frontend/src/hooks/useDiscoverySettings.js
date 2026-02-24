import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function useDiscoverySettings({ settingsData, refetchSettings, showToast }) {
  const [maxResults, setMaxResults] = useState(50);
  const [minScore, setMinScore] = useState(5);
  const [autoScore, setAutoScore] = useState(true);
  const [excludedKeywords, setExcludedKeywords] = useState('');
  const [searchRadius, setSearchRadius] = useState(25);
  const [autoArchive, setAutoArchive] = useState(false);
  const [archiveThreshold, setArchiveThreshold] = useState(3);
  const [followupDays, setFollowupDays] = useState(7);
  const [savingDiscovery, setSavingDiscovery] = useState(false);

  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;

    setMaxResults(num(s.discovery_max_results, 50));
    setMinScore(num(s.discovery_min_score, 5));
    setAutoScore(bool(s.discovery_auto_score, true));
    setExcludedKeywords(s.discovery_excluded_keywords || '');
    setSearchRadius(num(s.discovery_radius, 25));
    setAutoArchive(bool(s.discovery_auto_archive, false));
    setArchiveThreshold(num(s.discovery_archive_threshold, 3));
    setFollowupDays(num(s.discovery_followup_days, 7));
  }, [settingsData]);

  const handleSaveDiscovery = async () => {
    setSavingDiscovery(true);
    try {
      await api.settings.update({
        discovery_max_results: String(maxResults),
        discovery_min_score: String(minScore),
        discovery_auto_score: String(autoScore),
        discovery_excluded_keywords: excludedKeywords,
        discovery_radius: String(searchRadius),
        discovery_auto_archive: String(autoArchive),
        discovery_archive_threshold: String(archiveThreshold),
        discovery_followup_days: String(followupDays),
      });
      refetchSettings();
      showToast('Discovery settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingDiscovery(false);
    }
  };

  return {
    maxResults, setMaxResults,
    searchRadius, setSearchRadius,
    minScore, setMinScore,
    excludedKeywords, setExcludedKeywords,
    autoScore, setAutoScore,
    autoArchive, setAutoArchive,
    archiveThreshold, setArchiveThreshold,
    followupDays, setFollowupDays,
    savingDiscovery, handleSaveDiscovery,
  };
}
