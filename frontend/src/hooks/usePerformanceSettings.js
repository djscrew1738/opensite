import { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * Manages performance tuning state (cache TTL, rate limits, circuit breaker, etc.)
 */
export function usePerformanceSettings({ settingsData, refetchSettings, showToast }) {
  const [perfCacheTtl, setPerfCacheTtl] = useState(5);
  const [perfRateLimit, setPerfRateLimit] = useState(100);
  const [perfTimeout, setPerfTimeout] = useState(30);
  const [perfCbEnabled, setPerfCbEnabled] = useState(true);
  const [perfCbThreshold, setPerfCbThreshold] = useState(5);
  const [perfLowMemory, setPerfLowMemory] = useState(false);
  const [perfBgJobs, setPerfBgJobs] = useState(true);
  const [savingPerformance, setSavingPerformance] = useState(false);

  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';

    setPerfCacheTtl(num(s.perf_cache_ttl, 5));
    setPerfRateLimit(num(s.perf_rate_limit_max, 100));
    setPerfTimeout(num(s.perf_request_timeout, 30));
    setPerfCbEnabled(bool(s.perf_cb_enabled, true));
    setPerfCbThreshold(num(s.perf_cb_threshold, 5));
    setPerfLowMemory(bool(s.perf_low_memory));
    setPerfBgJobs(bool(s.perf_bg_jobs, true));
  }, [settingsData]);

  const handleSavePerformance = async () => {
    setSavingPerformance(true);
    try {
      await api.settings.update({
        perf_cache_ttl: String(perfCacheTtl),
        perf_rate_limit_max: String(perfRateLimit),
        perf_request_timeout: String(perfTimeout),
        perf_cb_enabled: String(perfCbEnabled),
        perf_cb_threshold: String(perfCbThreshold),
        perf_low_memory: String(perfLowMemory),
        perf_bg_jobs: String(perfBgJobs),
      });
      refetchSettings();
      showToast('Performance settings saved — some changes require a server restart');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setSavingPerformance(false);
    }
  };

  return {
    perfCacheTtl, setPerfCacheTtl,
    perfRateLimit, setPerfRateLimit,
    perfTimeout, setPerfTimeout,
    perfCbEnabled, setPerfCbEnabled,
    perfCbThreshold, setPerfCbThreshold,
    perfLowMemory, setPerfLowMemory,
    perfBgJobs, setPerfBgJobs,
    savingPerformance,
    handleSavePerformance,
  };
}
