/**
 * Settings Context
 * Centralized state management for all settings sections
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useOllama } from '../../hooks/useOllama';
import { useModelPreference } from '../../hooks/useModelPreference';
import { useToast } from '../../hooks/useToast';
import { NAV_ITEMS, getTabOrder } from './navigation';

const SettingsContext = createContext(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

export function SettingsProvider({ children }) {
  const queryClient = useQueryClient();
  const { connected, model, available, refetch: refetchOllama } = useOllama();
  const { defaultModel, setDefaultModel } = useModelPreference();
  const { success: showToastSuccess, error: showToastError, warning: showToastWarning } = useToast();
  
  const showToast = useCallback((message, type = 'success') => {
    if (type === 'success') showToastSuccess(message);
    else if (type === 'error') showToastError(message);
    else showToastWarning(message);
  }, [showToastSuccess, showToastError, showToastWarning]);

  /* ── Tab navigation ── */
  const [activeTab, setActiveTab] = useState('overview');
  const [tabDirection, setTabDirection] = useState(null);
  const prevTab = useRef('overview');
  const TAB_ORDER = useMemo(() => getTabOrder(), []);
  
  const handleTabChange = useCallback((newTab) => {
    if (newTab === activeTab) return;
    const direction = TAB_ORDER[newTab] > TAB_ORDER[prevTab.current] ? 'left' : 'right';
    setTabDirection(direction);
    prevTab.current = newTab;
    setActiveTab(newTab);
    
    // Update URL hash for direct linking
    window.location.hash = newTab;
  }, [activeTab, TAB_ORDER]);
  
  // Handle URL hash on load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && TAB_ORDER[hash] !== undefined && hash !== activeTab) {
      setActiveTab(hash);
      prevTab.current = hash;
    }
  }, [activeTab, TAB_ORDER]);
  
  useEffect(() => {
    const timer = setTimeout(() => setTabDirection(null), 350);
    return () => clearTimeout(timer);
  }, [activeTab]);

  /* ── AI provider ── */
  const [activeProvider, setActiveProvider] = useState('openclaw');
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [groqKey, setGroqKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqTemperature, setGroqTemperature] = useState(0.7);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [anthropicTemperature, setAnthropicTemperature] = useState(0.7);
  const [openclawUrl, setOpenclawUrl] = useState('http://localhost:18789');
  const [openclawToken, setOpenclawToken] = useState('');
  const [showOpenclawToken, setShowOpenclawToken] = useState(false);
  const [openclawTemperature, setOpenclawTemperature] = useState(0.7);

  /* ── AI advanced ── */
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');

  /* ── Business ── */
  const [companyName, setCompanyName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [businessInsurance, setBusinessInsurance] = useState('');
  const [businessState, setBusinessState] = useState('');
  const [businessZip, setBusinessZip] = useState('');

  /* ── Estimating ── */
  const [laborRate, setLaborRate] = useState(85);
  const [materialMarkup, setMaterialMarkup] = useState(30);
  const [overheadFactor, setOverheadFactor] = useState(15);
  const [taxRate, setTaxRate] = useState(8.25);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [depositPct, setDepositPct] = useState(25);
  const [expiryDays, setExpiryDays] = useState(30);
  const [includeTax, setIncludeTax] = useState(true);
  const [autoMarkup, setAutoMarkup] = useState(true);

  /* ── Discovery ── */
  const [maxResults, setMaxResults] = useState(50);
  const [minScore, setMinScore] = useState(5);
  const [autoScore, setAutoScore] = useState(true);
  const [excludedKeywords, setExcludedKeywords] = useState('');
  const [searchRadius, setSearchRadius] = useState(25);
  const [autoArchive, setAutoArchive] = useState(false);
  const [archiveThreshold, setArchiveThreshold] = useState(3);
  const [followupDays, setFollowupDays] = useState(7);

  /* ── Notifications ── */
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

  /* ── Email Monitor (Legacy IMAP) ── */
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

  /* ── API keys ── */
  const [serperKey, setSerperKey] = useState('');
  const [showSerperKey, setShowSerperKey] = useState(false);
  const [placesKey, setPlacesKey] = useState('');
  const [showPlacesKey, setShowPlacesKey] = useState(false);
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [twilioPhone, setTwilioPhone] = useState('');
  const [sendgridKey, setSendgridKey] = useState('');
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [stripeKey, setStripeKey] = useState('');
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);

  /* ── Email Watcher (Microsoft Graph) ── */
  const [msClientId, setMsClientId] = useState('');
  const [msClientSecret, setMsClientSecret] = useState('');
  const [showMsClientSecret, setShowMsClientSecret] = useState(false);
  const [testingMicrosoft, setTestingMicrosoft] = useState(false);
  const [connectingMicrosoft, setConnectingMicrosoft] = useState(false);
  
  /* ── Email Watcher (Google Gmail) ── */
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showGoogleClientSecret, setShowGoogleClientSecret] = useState(false);
  const [testingGoogle, setTestingGoogle] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  
  /* ── Telegram ── */
  const [telegramToken, setTelegramToken] = useState('');
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [ewPollInterval, setEwPollInterval] = useState(60);
  const [ewMarkAsRead, setEwMarkAsRead] = useState(false);

  /* ── Performance ── */
  const [perfCacheTtl, setPerfCacheTtl] = useState(5);
  const [perfRateLimit, setPerfRateLimit] = useState(100);
  const [perfTimeout, setPerfTimeout] = useState(30);
  const [perfCbEnabled, setPerfCbEnabled] = useState(true);
  const [perfCbThreshold, setPerfCbThreshold] = useState(5);
  const [perfLowMemory, setPerfLowMemory] = useState(false);
  const [perfBgJobs, setPerfBgJobs] = useState(true);

  /* ── Appearance (localStorage) ── */
  const [themePreference, setThemePreference] = useState(() =>
    localStorage.getItem('theme_preference') || 'system'
  );
  const [compactSidebar, setCompactSidebar] = useState(() =>
    localStorage.getItem('compact_sidebar') === 'true'
  );
  const [denseMode, setDenseMode] = useState(() =>
    localStorage.getItem('dense_mode') === 'true'
  );
  const [animationsEnabled, setAnimationsEnabled] = useState(() =>
    localStorage.getItem('animations_enabled') !== 'false'
  );
  const [dateFormat, setDateFormat] = useState(() =>
    localStorage.getItem('date_format') || 'MM/DD/YYYY'
  );
  const [numberFormat, setNumberFormat] = useState(() =>
    localStorage.getItem('number_format') || 'US'
  );

  /* ── Misc ── */
  const [pullModelName, setPullModelName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* ── Loading states ── */
  const [testingOllama, setTestingOllama] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [testingOpenClaw, setTestingOpenClaw] = useState(false);
  const [testingSerper, setTestingSerper] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testingTwilio, setTestingTwilio] = useState(false);
  const [testingSendgrid, setTestingSendgrid] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingGoogleMaps, setTestingGoogleMaps] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [savingEstimating, setSavingEstimating] = useState(false);
  const [savingDiscovery, setSavingDiscovery] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingPerformance, setSavingPerformance] = useState(false);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [pullingModel, setPullingModel] = useState(false);
  const [deletingModel, setDeletingModel] = useState(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  /* ── Queries ── */
  // Settings query with aggressive caching - settings rarely change
  const { data: settingsData, refetch: refetchSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => api.settings.get(),
    staleTime: 120000,     // 2 minutes - settings are relatively static
    gcTime: 1800000,       // 30 minutes - keep in cache longer
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Models query with provider-specific caching
  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['ollama-models', activeProvider],
    queryFn: () => api.ai.getModels(),
    enabled: connected || ['groq', 'openclaw', 'anthropic', 'openai'].includes(activeProvider),
    staleTime: 60000,      // 1 minute - models change infrequently
    gcTime: 300000,        // 5 minutes
    retry: 1,
    retryDelay: 2000,
    // Prefetch next provider's models when hovering over provider selector
    placeholderData: (previousData) => previousData,
  });

  // Metrics query with reduced polling frequency
  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['ollama-metrics'],
    queryFn: () => api.settings.getMetrics(),
    staleTime: 10000,      // 10 seconds
    refetchInterval: 30000, // Poll every 30s instead of 15s (reduces server load)
    refetchIntervalInBackground: false, // Don't poll when tab is inactive
  });

  const availableModels = useMemo(() => modelsData?.models || [], [modelsData]);
  const settings = useMemo(() => settingsData || {}, [settingsData]);
  const metrics = useMemo(() => metricsData?.metrics || {}, [metricsData]);
  const config = useMemo(() => metricsData?.config || {}, [metricsData]);

  /* ── Sync settings → state ── */
  // Helper functions for type conversion (memoized)
  const bool = useCallback((v, fallback = false) => v === undefined ? fallback : String(v) === 'true', []);
  const num = useCallback((v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback, []);

  // Split sync into logical groups to reduce re-render cascade
  // Group 1: AI Provider settings (highest priority)
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    
    setActiveProvider(prev => s.ai_provider || prev);
    setOllamaUrl(s.ollama_url || 'http://localhost:11434');
    setTemperature(num(s.ollama_temperature, 0.7));
    setGroqTemperature(num(s.groq_temperature, 0.7));
    setOpenaiTemperature(num(s.openai_temperature, 0.7));
    setAnthropicTemperature(num(s.anthropic_temperature, 0.7));
    setOpenclawUrl(s.openclaw_url || 'http://localhost:18789');
    setOpenclawTemperature(num(s.openclaw_temperature, 0.7));
    setMaxTokens(num(s.ai_max_tokens, 2048));
    setTopP(num(s.ai_top_p, 0.9));
    setStreamingEnabled(bool(s.ai_streaming, true));
    setSystemPrompt(s.ai_system_prompt || '');
  }, [
    settingsData?.ai_provider,
    settingsData?.ollama_url,
    settingsData?.ollama_temperature,
    settingsData?.groq_temperature,
    settingsData?.openai_temperature,
    settingsData?.anthropic_temperature,
    settingsData?.openclaw_url,
    settingsData?.openclaw_temperature,
    settingsData?.ai_max_tokens,
    settingsData?.ai_top_p,
    settingsData?.ai_streaming,
    settingsData?.ai_system_prompt,
  ]);

  // Group 2: Business settings
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    
    setCompanyName(s.company_name || '');
    setServiceArea(s.service_area || '');
    setSpecialization(s.specialization || '');
    setBusinessPhone(s.business_phone || '');
    setBusinessEmail(s.business_email || '');
    setBusinessWebsite(s.business_website || '');
    setBusinessLicense(s.business_license || '');
    setBusinessInsurance(s.business_insurance || '');
    setBusinessState(s.business_state || '');
    setBusinessZip(s.business_zip || '');
  }, [
    settingsData?.company_name,
    settingsData?.service_area,
    settingsData?.specialization,
    settingsData?.business_phone,
    settingsData?.business_email,
    settingsData?.business_website,
    settingsData?.business_license,
    settingsData?.business_insurance,
    settingsData?.business_state,
    settingsData?.business_zip,
  ]);

  // Group 3: Estimating settings
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    
    setLaborRate(num(s.estimate_labor_rate, 85));
    setMaterialMarkup(num(s.estimate_markup, 30));
    setOverheadFactor(num(s.estimate_overhead, 15));
    setTaxRate(num(s.estimate_tax_rate, 8.25));
    setPaymentTerms(s.estimate_terms || 'Net 30');
    setDepositPct(num(s.estimate_deposit_pct, 25));
    setExpiryDays(num(s.estimate_expiry_days, 30));
    setIncludeTax(bool(s.estimate_include_tax, true));
    setAutoMarkup(bool(s.estimate_auto_markup, true));
  }, [
    settingsData?.estimate_labor_rate,
    settingsData?.estimate_markup,
    settingsData?.estimate_overhead,
    settingsData?.estimate_tax_rate,
    settingsData?.estimate_terms,
    settingsData?.estimate_deposit_pct,
    settingsData?.estimate_expiry_days,
    settingsData?.estimate_include_tax,
    settingsData?.estimate_auto_markup,
  ]);

  // Group 4: Discovery settings
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    
    setMaxResults(num(s.discovery_max_results, 50));
    setMinScore(num(s.discovery_min_score, 5));
    setAutoScore(bool(s.discovery_auto_score, true));
    setExcludedKeywords(s.discovery_excluded_keywords || '');
    setSearchRadius(num(s.discovery_radius, 25));
    setAutoArchive(bool(s.discovery_auto_archive, false));
    setArchiveThreshold(num(s.discovery_archive_threshold, 3));
    setFollowupDays(num(s.discovery_followup_days, 7));
  }, [
    settingsData?.discovery_max_results,
    settingsData?.discovery_min_score,
    settingsData?.discovery_auto_score,
    settingsData?.discovery_excluded_keywords,
    settingsData?.discovery_radius,
    settingsData?.discovery_auto_archive,
    settingsData?.discovery_archive_threshold,
    settingsData?.discovery_followup_days,
  ]);

  // Group 5: Notification settings
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    
    setNotifyEnabled(bool(s.notify_enabled, false));
    setNotifyEmailEnabled(bool(s.notify_email_enabled, false));
    setNotifyEmailAddr(s.notify_email_address || '');
    setNotifySmsEnabled(bool(s.notify_sms_enabled, false));
    setNotifyAdminPhone(s.notify_admin_phone || '');
    setNotifyOnNewLead(bool(s.notify_on_new_lead, true));
    setNotifyOnHighScore(bool(s.notify_on_high_score, true));
    setNotifyOnPermit(bool(s.notify_on_permit, true));
    setNotifyDigestEnabled(bool(s.notify_digest_enabled, false));
    setNotifyDigestDay(s.notify_digest_day || 'Monday');
    setNotifyDigestTime(s.notify_digest_time || '08:00');
  }, [
    settingsData?.notify_enabled,
    settingsData?.notify_email_enabled,
    settingsData?.notify_email_address,
    settingsData?.notify_sms_enabled,
    settingsData?.notify_admin_phone,
    settingsData?.notify_on_new_lead,
    settingsData?.notify_on_high_score,
    settingsData?.notify_on_permit,
    settingsData?.notify_digest_enabled,
    settingsData?.notify_digest_day,
    settingsData?.notify_digest_time,
  ]);

  // Group 6: Email Monitor settings
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    
    setEmEnabled(bool(s.email_monitor_enabled, false));
    setEmHost(s.email_monitor_host || 'outlook.office365.com');
    setEmPort(String(s.email_monitor_port || '993'));
    setEmUser(s.email_monitor_user || '');
    setEmKeywords(s.email_monitor_keywords || '');
  }, [
    settingsData?.email_monitor_enabled,
    settingsData?.email_monitor_host,
    settingsData?.email_monitor_port,
    settingsData?.email_monitor_user,
    settingsData?.email_monitor_keywords,
  ]);

  // Group 7: Performance settings
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    
    setPerfCacheTtl(num(s.perf_cache_ttl, 5));
    setPerfRateLimit(num(s.perf_rate_limit, 100));
    setPerfTimeout(num(s.perf_timeout, 30));
    setPerfCbEnabled(bool(s.perf_cb_enabled, true));
    setPerfCbThreshold(num(s.perf_cb_threshold, 5));
    setPerfLowMemory(bool(s.perf_low_memory, false));
    setPerfBgJobs(bool(s.perf_bg_jobs, true));
  }, [
    settingsData?.perf_cache_ttl,
    settingsData?.perf_rate_limit,
    settingsData?.perf_timeout,
    settingsData?.perf_cb_enabled,
    settingsData?.perf_cb_threshold,
    settingsData?.perf_low_memory,
    settingsData?.perf_bg_jobs,
  ]);

  // Context value
  const value = {
    // Navigation
    activeTab, setActiveTab, handleTabChange, tabDirection, NAV_ITEMS,
    
    // Data
    settings, availableModels, metrics, config,
    connected, model, available, defaultModel, setDefaultModel,
    isLoadingSettings,
    
    // AI Provider
    activeProvider, setActiveProvider,
    ollamaUrl, setOllamaUrl,
    temperature, setTemperature,
    groqKey, setGroqKey, showGroqKey, setShowGroqKey,
    groqTemperature, setGroqTemperature,
    openaiKey, setOpenaiKey, showOpenaiKey, setShowOpenaiKey,
    openaiTemperature, setOpenaiTemperature,
    anthropicKey, setAnthropicKey, showAnthropicKey, setShowAnthropicKey,
    anthropicTemperature, setAnthropicTemperature,
    openclawUrl, setOpenclawUrl,
    openclawToken, setOpenclawToken, showOpenclawToken, setShowOpenclawToken,
    openclawTemperature, setOpenclawTemperature,
    
    // AI Advanced
    maxTokens, setMaxTokens,
    topP, setTopP,
    streamingEnabled, setStreamingEnabled,
    systemPrompt, setSystemPrompt,
    
    // Business
    companyName, setCompanyName,
    serviceArea, setServiceArea,
    specialization, setSpecialization,
    businessPhone, setBusinessPhone,
    businessEmail, setBusinessEmail,
    businessWebsite, setBusinessWebsite,
    businessLicense, setBusinessLicense,
    businessInsurance, setBusinessInsurance,
    businessState, setBusinessState,
    businessZip, setBusinessZip,
    
    // Estimating
    laborRate, setLaborRate,
    materialMarkup, setMaterialMarkup,
    overheadFactor, setOverheadFactor,
    taxRate, setTaxRate,
    paymentTerms, setPaymentTerms,
    depositPct, setDepositPct,
    expiryDays, setExpiryDays,
    includeTax, setIncludeTax,
    autoMarkup, setAutoMarkup,
    
    // Discovery
    maxResults, setMaxResults,
    minScore, setMinScore,
    autoScore, setAutoScore,
    excludedKeywords, setExcludedKeywords,
    searchRadius, setSearchRadius,
    autoArchive, setAutoArchive,
    archiveThreshold, setArchiveThreshold,
    followupDays, setFollowupDays,
    
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
    
    // API Keys
    serperKey, setSerperKey, showSerperKey, setShowSerperKey,
    placesKey, setPlacesKey, showPlacesKey, setShowPlacesKey,
    twilioSid, setTwilioSid,
    twilioToken, setTwilioToken, showTwilioToken, setShowTwilioToken,
    twilioPhone, setTwilioPhone,
    sendgridKey, setSendgridKey, showSendgridKey, setShowSendgridKey,
    stripeKey, setStripeKey, showStripeKey, setShowStripeKey,
    googleMapsKey, setGoogleMapsKey, showGoogleMapsKey, setShowGoogleMapsKey,
    
    // Email Watchers
    msClientId, setMsClientId,
    msClientSecret, setMsClientSecret, showMsClientSecret, setShowMsClientSecret,
    testingMicrosoft, setTestingMicrosoft,
    connectingMicrosoft, setConnectingMicrosoft,
    googleClientId, setGoogleClientId,
    googleClientSecret, setGoogleClientSecret, showGoogleClientSecret, setShowGoogleClientSecret,
    testingGoogle, setTestingGoogle,
    connectingGoogle, setConnectingGoogle,
    telegramToken, setTelegramToken, showTelegramToken, setShowTelegramToken,
    telegramChatId, setTelegramChatId,
    ewPollInterval, setEwPollInterval,
    ewMarkAsRead, setEwMarkAsRead,
    
    // Performance
    perfCacheTtl, setPerfCacheTtl,
    perfRateLimit, setPerfRateLimit,
    perfTimeout, setPerfTimeout,
    perfCbEnabled, setPerfCbEnabled,
    perfCbThreshold, setPerfCbThreshold,
    perfLowMemory, setPerfLowMemory,
    perfBgJobs, setPerfBgJobs,
    
    // Appearance
    themePreference, setThemePreference,
    compactSidebar, setCompactSidebar,
    denseMode, setDenseMode,
    animationsEnabled, setAnimationsEnabled,
    dateFormat, setDateFormat,
    numberFormat, setNumberFormat,
    
    // Misc
    pullModelName, setPullModelName,
    deleteConfirm, setDeleteConfirm,
    
    // Loading states
    testingOllama, setTestingOllama,
    testingGroq, setTestingGroq,
    testingOpenClaw, setTestingOpenClaw,
    testingSerper, setTestingSerper,
    testingAnthropic, setTestingAnthropic,
    testingOpenai, setTestingOpenai,
    testingTwilio, setTestingTwilio,
    testingSendgrid, setTestingSendgrid,
    testingStripe, setTestingStripe,
    testingGoogleMaps, setTestingGoogleMaps,
    testingTelegram, setTestingTelegram,
    savingBusiness, setSavingBusiness,
    savingAI, setSavingAI,
    savingEstimating, setSavingEstimating,
    savingDiscovery, setSavingDiscovery,
    savingNotifications, setSavingNotifications,
    savingPerformance, setSavingPerformance,
    switchingProvider, setSwitchingProvider,
    pullingModel, setPullingModel,
    deletingModel, setDeletingModel,
    creatingBackup, setCreatingBackup,
    clearingCache, setClearingCache,
    exportingData, setExportingData,
    resetConfirm, setResetConfirm,
    
    // Utils
    showToast,
    refetchSettings,
    refetchModels,
    refetchMetrics,
    refetchOllama,
    queryClient,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
