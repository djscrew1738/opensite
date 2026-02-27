import { useState, useCallback } from 'react';

/**
 * useSettingsPerformance Hook
 * Manages performance settings state
 */
export function useSettingsPerformance() {
  const [perfCacheTtl, setPerfCacheTtl] = useState(5);
  const [perfRateLimit, setPerfRateLimit] = useState(100);
  const [perfTimeout, setPerfTimeout] = useState(30);
  const [perfCbEnabled, setPerfCbEnabled] = useState(true);
  const [perfCbThreshold, setPerfCbThreshold] = useState(5);
  const [perfLowMemory, setPerfLowMemory] = useState(false);
  const [perfBgJobs, setPerfBgJobs] = useState(true);
  const [savingPerformance, setSavingPerformance] = useState(false);

  const syncFromSettings = useCallback((settings) => {
    if (!settings) return;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;

    setPerfCacheTtl(num(settings.perf_cache_ttl, 5));
    setPerfRateLimit(num(settings.perf_rate_limit_max, 100));
    setPerfTimeout(num(settings.perf_request_timeout, 30));
    setPerfCbEnabled(bool(settings.perf_cb_enabled, true));
    setPerfCbThreshold(num(settings.perf_cb_threshold, 5));
    setPerfLowMemory(bool(settings.perf_low_memory, false));
    setPerfBgJobs(bool(settings.perf_bg_jobs, true));
  }, []);

  return {
    perfCacheTtl,
    setPerfCacheTtl,
    perfRateLimit,
    setPerfRateLimit,
    perfTimeout,
    setPerfTimeout,
    perfCbEnabled,
    setPerfCbEnabled,
    perfCbThreshold,
    setPerfCbThreshold,
    perfLowMemory,
    setPerfLowMemory,
    perfBgJobs,
    setPerfBgJobs,
    savingPerformance,
    setSavingPerformance,
    syncFromSettings,
  };
}
