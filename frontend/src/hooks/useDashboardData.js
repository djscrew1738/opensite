import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { formatRelativeTime } from '../utils/dateUtils';
import { computeFocusItems, computeMetrics, transformJobs } from '../utils/dashboard/jobCalculations';

/**
 * useDashboardData Hook
 * Manages dashboard data fetching, transformation, and refresh logic
 * 
 * @returns {Object} Dashboard data and controls
 */
export function useDashboardData() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch jobs data
  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    error: jobsError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['dashboard-jobs'],
    queryFn: async () => {
      const response = await api.projects.getAll();
      setLastUpdated(new Date());
      return response;
    },
    staleTime: 120000,
  });

  // Fetch dashboard stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 120000,
  });

  // Fetch weather — non-blocking, fails silently
  const { data: weatherData } = useQuery({
    queryKey: ['weather-forecast'],
    queryFn: () => api.weather.getForecast(),
    staleTime: 30 * 60 * 1000, // 30 min — matches backend cache
    retry: 1,
  });

  const isLoading = isLoadingJobs || isLoadingStats;
  const error = jobsError || statsError;

  // Transform and memoize jobs data
  const jobs = useMemo(() => transformJobs(jobsData), [jobsData]);
  const focusItems = useMemo(() => computeFocusItems(jobs), [jobs]);
  const metrics = useMemo(() => computeMetrics(jobs, statsData), [jobs, statsData]);

  // Time ago for refresh indicator
  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    const update = () => setTimeAgo(formatRelativeTime(lastUpdated));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleRefresh = useCallback(() => {
    refetchJobs();
    refetchStats();
    setLastUpdated(new Date());
  }, [refetchJobs, refetchStats]);

  return {
    // Data
    jobs,
    metrics,
    focusItems,
    weather: Array.isArray(weatherData) ? weatherData : null,
    stats: statsData,
    
    // Loading & Error states
    isLoading,
    error,
    
    // Refresh
    timeAgo,
    handleRefresh,
  };
}
