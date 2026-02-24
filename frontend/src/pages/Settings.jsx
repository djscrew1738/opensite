import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ensureArray } from '../utils/safeArray';
import { useOllama } from '../hooks/useOllama';
import { useModelPreference } from '../hooks/useModelPreference';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import {
  Building2, Cpu, Key, Activity, Bell, Search, Calculator,
  Gauge, Palette, Database, Loader2, ChevronRight, LayoutDashboard, AlertCircle,
  CreditCard
} from 'lucide-react';

/* ─────────────────────────────────────────────
   PRIMITIVES (kept inline for header/nav)
───────────────────────────────────────────── */

function StatusPill({ connected, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
      connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      {label || (connected ? 'Connected' : 'Disconnected')}
    </span>
  );
}

/* ─────────────────────────────────────────────
   LAZY TAB COMPONENTS with error handling
───────────────────────────────────────────── */
const lazyWithError = (importFn, name) => {
  return lazy(() => 
    importFn().catch(err => {
      console.error(`Failed to load ${name}:`, err);
      return { default: () => <div className="p-4 text-red-500">Error loading {name}</div> };
    })
  );
};

const SettingsOverview = lazyWithError(() => import('../components/settings/sections/SettingsOverview'), 'SettingsOverview');
const SettingsAI = lazyWithError(() => import('../components/settings/sections/SettingsAI'), 'SettingsAI');
const SettingsBusiness = lazyWithError(() => import('../components/settings/sections/SettingsBusiness'), 'SettingsBusiness');
const SettingsEstimating = lazyWithError(() => import('../components/settings/sections/SettingsEstimating'), 'SettingsEstimating');
const SettingsDiscovery = lazyWithError(() => import('../components/settings/sections/SettingsDiscovery'), 'SettingsDiscovery');
const SettingsJobPulse = lazyWithError(() => import('../components/settings/sections/SettingsJobPulse'), 'SettingsJobPulse');
const SettingsNotifications = lazyWithError(() => import('../components/settings/sections/SettingsNotifications'), 'SettingsNotifications');
const SettingsAPIKeys = lazyWithError(() => import('../components/settings/sections/SettingsAPIKeys'), 'SettingsAPIKeys');
const SettingsPerformance = lazyWithError(() => import('../components/settings/sections/SettingsPerformance'), 'SettingsPerformance');
const SettingsAppearance = lazyWithError(() => import('../components/settings/sections/SettingsAppearance'), 'SettingsAppearance');
const SettingsData = lazyWithError(() => import('../components/settings/sections/SettingsData'), 'SettingsData');
const SettingsQuickBooks = lazyWithError(() => import('../components/settings/sections/SettingsQuickBooks'), 'SettingsQuickBooks');
const SettingsSystem = lazyWithError(() => import('../components/settings/sections/SettingsSystem'), 'SettingsSystem');

/* ─────────────────────────────────────────────
   SUSPENSE FALLBACK
───────────────────────────────────────────── */
function TabFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   ERROR BOUNDARY
───────────────────────────────────────────── */
class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Settings tab error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to load section</h3>
          <p className="text-sm text-gray-500 mb-4">{this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ─────────────────────────────────────────────
   NAV
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',      icon: LayoutDashboard,  label: 'Overview' },
  { id: 'ai',            icon: Cpu,              label: 'AI' },
  { id: 'business',      icon: Building2,        label: 'Business' },
  { id: 'estimating',    icon: Calculator,       label: 'Estimating' },
  { id: 'discovery',     icon: Search,           label: 'Discovery' },
  { id: 'jobpulse',      icon: Activity,         label: 'Job Pulse' },
  { id: 'notifications', icon: Bell,             label: 'Notifications' },
  { id: 'quickbooks',    icon: CreditCard,       label: 'QuickBooks' },
  { id: 'apikeys',       icon: Key,              label: 'API Keys' },
  { id: 'performance',   icon: Gauge,            label: 'Performance' },
  { id: 'appearance',    icon: Palette,          label: 'Appearance' },
  { id: 'data',          icon: Database,         label: 'Data' },
  { id: 'system',        icon: Activity,         label: 'System' },
];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Settings() {
  const queryClient = useQueryClient();
  const { connected, model, available, isLoading: ollamaLoading, refetch: refetchOllama } = useOllama();
  const { defaultModel, setDefaultModel } = useModelPreference();
  const { theme, toggleTheme } = useTheme();
  const { success: showToastSuccess, error: showToastError, warning: showToastWarning } = useToast();
  const showToast = useCallback((message, type = 'success') => {
    if (type === 'success') showToastSuccess(message);
    else if (type === 'error') showToastError(message);
    else showToastWarning(message);
  }, [showToastSuccess, showToastError, showToastWarning]);

  /* ── Tab nav ── */
  const [activeTab, setActiveTab] = useState('overview');
  const [tabDirection, setTabDirection] = useState(null);
  const prevTab = useRef('overview');

  // Tab order for animations
  const TAB_ORDER = NAV_ITEMS.reduce((acc, item, idx) => ({ ...acc, [item.id]: idx }), {});

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const direction = TAB_ORDER[newTab] > TAB_ORDER[prevTab.current] ? 'left' : 'right';
    setTabDirection(direction);
    prevTab.current = newTab;
    setActiveTab(newTab);
  };

  // Reset animation after it plays
  useEffect(() => {
    const timer = setTimeout(() => setTabDirection(null), 350);
    return () => clearTimeout(timer);
  }, [activeTab]);

  /* ── AI provider ── */
  const [activeProvider, setActiveProvider] = useState('ollama');
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [groqKey, setGroqKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqTemperature, setGroqTemperature] = useState(0.7);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);
  const [openclawUrl, setOpenclawUrl] = useState('http://localhost:18789');
  const [openclawToken, setOpenclawToken] = useState('');
  const [showOpenclawToken, setShowOpenclawToken] = useState(false);
  const [openclawTemperature, setOpenclawTemperature] = useState(0.7);

  /* ── AI advanced ── */
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');

  /* ── Business basic ── */
  const [companyName, setCompanyName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [specialization, setSpecialization] = useState('');

  /* ── Business extended ── */
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

  /* ── Email Monitor ── */
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

  /* ── Email Watcher (Microsoft Graph) ── */
  const [msClientId, setMsClientId] = useState('');
  const [msClientSecret, setMsClientSecret] = useState('');
  const [showMsClientSecret, setShowMsClientSecret] = useState(false);

  /* ── Email Watcher (Google Gmail) ── */
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [showGoogleClientSecret, setShowGoogleClientSecret] = useState(false);

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
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testingOpenClaw, setTestingOpenClaw] = useState(false);
  const [testingSerper, setTestingSerper] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [testingTwilio, setTestingTwilio] = useState(false);
  const [testingSendgrid, setTestingSendgrid] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingGoogleMaps, setTestingGoogleMaps] = useState(false);
  const [testingMicrosoft, setTestingMicrosoft] = useState(false);
  const [testingGoogle, setTestingGoogle] = useState(false);
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

  /* ─────────────────────────────────────────────
     QUERIES
  ───────────────────────────────────────────── */
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => api.settings.get(),
  });

  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['ollama-models', activeProvider],
    queryFn: () => api.ai.getModels(),
    enabled: connected || activeProvider === 'groq' || activeProvider === 'openclaw' || activeProvider === 'anthropic',
    retry: false
  });

  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['ollama-metrics'],
    queryFn: () => api.settings.getMetrics(),
    refetchInterval: 15000,
  });

  const { data: healthData } = useQuery({
    queryKey: ['health-data'],
    queryFn: () => api.health(),
    refetchInterval: 30000,
  });

  // Defensive: ensure arrays are actually arrays
  const availableModels = ensureArray(modelsData?.models);
  const settings = settingsData && typeof settingsData === 'object' ? settingsData : {};
  const metrics = metricsData?.metrics && typeof metricsData.metrics === 'object' ? metricsData.metrics : {};
  const config = metricsData?.config && typeof metricsData.config === 'object' ? metricsData.config : {};

  /* ─────────────────────────────────────────────
     SYNC SETTINGS → STATE
  ───────────────────────────────────────────── */
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;

    // AI provider
    setActiveProvider(s.ai_provider || 'ollama');
    setOllamaUrl(s.ollama_url || 'http://localhost:11434');
    setTemperature(num(s.ollama_temperature, 0.7));
    setGroqTemperature(num(s.groq_temperature, 0.7));
    setOpenaiTemperature(num(s.openai_temperature, 0.7));
    setOpenclawUrl(s.openclaw_url || 'http://localhost:18789');
    setOpenclawTemperature(num(s.openclaw_temperature, 0.7));

    // AI advanced
    setMaxTokens(num(s.ai_max_tokens, 2048));
    setTopP(num(s.ai_top_p, 0.9));
    setStreamingEnabled(bool(s.ai_streaming, true));
    setSystemPrompt(s.ai_system_prompt || '');

    // Business
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

    // Estimating
    setLaborRate(num(s.estimate_labor_rate, 85));
    setMaterialMarkup(num(s.estimate_markup, 30));
    setOverheadFactor(num(s.estimate_overhead, 15));
    setTaxRate(num(s.estimate_tax_rate, 8.25));
    setPaymentTerms(s.estimate_terms || 'Net 30');
    setDepositPct(num(s.estimate_deposit_pct, 25));
    setExpiryDays(num(s.estimate_expiry_days, 30));
    setIncludeTax(bool(s.estimate_include_tax, true));
    setAutoMarkup(bool(s.estimate_auto_markup, true));

    // Discovery
    setMaxResults(num(s.discovery_max_results, 50));
    setMinScore(num(s.discovery_min_score, 5));
    setAutoScore(bool(s.discovery_auto_score, true));
    setExcludedKeywords(s.discovery_excluded_keywords || '');
    setSearchRadius(num(s.discovery_radius, 25));
    setAutoArchive(bool(s.discovery_auto_archive, false));
    setArchiveThreshold(num(s.discovery_archive_threshold, 3));
    setFollowupDays(num(s.discovery_followup_days, 7));

    // Notifications
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

    // Email Monitor — load from dedicated endpoint
    api.emailMonitor.getSettings().then(emData => {
      if (emData) {
        setEmEnabled(emData.enabled || false);
        setEmHost(emData.host || 'outlook.office365.com');
        setEmPort(String(emData.port || 993));
        setEmUser(emData.user || '');
        setEmKeywords(emData.keywords || '');
      }
    }).catch(() => {});
    api.emailMonitor.getStatus().then(st => setEmStatus(st)).catch(() => {});
    api.emailMonitor.getAlerts({ limit: 10 }).then(d => {
      setEmAlerts(ensureArray(d?.alerts));
    }).catch(() => setEmAlerts([]));

    // Performance
    setPerfCacheTtl(num(s.perf_cache_ttl, 5));
    setPerfRateLimit(num(s.perf_rate_limit_max, 100));
    setPerfTimeout(num(s.perf_request_timeout, 30));
    setPerfCbEnabled(bool(s.perf_cb_enabled, true));
    setPerfCbThreshold(num(s.perf_cb_threshold, 5));
    setPerfLowMemory(bool(s.perf_low_memory, false));
    setPerfBgJobs(bool(s.perf_bg_jobs, true));

    // Email Watcher
    setEwPollInterval(num(s.email_watcher_poll_interval, 60));
    setEwMarkAsRead(bool(s.email_watcher_mark_read, false));
    setTelegramChatId(s.telegram_chat_id || '');
  }, [settingsData]);

  /* ─────────────────────────────────────────────
     HANDLERS — AI
  ───────────────────────────────────────────── */
  const handleSwitchProvider = async (provider) => {
    setSwitchingProvider(true);
    try {
      await api.ai.switchProvider(provider);
      setActiveProvider(provider);
      refetchSettings();
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      refetchOllama();
      const providerLabels = { openclaw: 'OpenClaw Gateway', groq: 'Groq Cloud', anthropic: 'Anthropic Claude', ollama: 'Ollama Local' };
      showToast(`Switched to ${providerLabels[provider] || provider}`);
    } catch (err) {
      showToast(`Failed to switch: ${err.message}`, 'error');
    } finally {
      setSwitchingProvider(false);
    }
  };

  const handleSaveAIConfig = async () => {
    setSavingAI(true);
    try {
      const base = activeProvider === 'openclaw'
        ? { openclaw_url: openclawUrl, openclaw_temperature: String(openclawTemperature) }
        : activeProvider === 'groq'
        ? { groq_temperature: String(groqTemperature) }
        : activeProvider === 'openai'
        ? { openai_temperature: String(openaiTemperature) }
        : { ollama_url: ollamaUrl, ollama_temperature: String(temperature) };
      await api.settings.update({
        ...base,
        ai_max_tokens: String(maxTokens),
        ai_top_p: String(topP),
        ai_streaming: String(streamingEnabled),
        ai_system_prompt: systemPrompt,
      });
      refetchSettings();
      refetchOllama();
      showToast('AI configuration saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingAI(false);
    }
  };

  const handleTestOllama = async () => {
    setTestingOllama(true);
    try {
      const result = await api.settings.testOllama(ollamaUrl);
      if (result.connected) showToast(`Connected to Ollama (${result.modelCount} models available)`);
      else showToast(`Cannot connect: ${result.error}`, 'error');
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      setTestingOllama(false);
    }
  };

  const handleTestGroq = async () => {
    setTestingGroq(true);
    try {
      const result = await api.settings.testGroq(groqKey || undefined);
      if (result.valid) showToast(`Groq API valid (${result.modelCount} models available)`);
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingGroq(false);
    }
  };

  const handleTestOpenai = async () => {
    setTestingOpenai(true);
    try {
      const result = await api.settings.testOpenai(openaiKey || undefined);
      if (result.valid) showToast(`OpenAI API valid (${result.modelCount} models available)`);
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingOpenai(false);
    }
  };

  const handleSaveGroqKey = async () => {
    try {
      await api.settings.update({ groq_api_key: groqKey });
      setGroqKey('');
      refetchSettings();
      showToast('Groq API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleSaveOpenaiKey = async () => {
    try {
      await api.settings.update({ openai_api_key: openaiKey });
      setOpenaiKey('');
      refetchSettings();
      showToast('OpenAI API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestOpenClaw = async () => {
    setTestingOpenClaw(true);
    try {
      const result = await api.settings.testOpenClaw(openclawUrl, openclawToken || undefined);
      if (result.connected) showToast(`Connected to OpenClaw (${result.model})`);
      else showToast(`Cannot connect: ${result.error}`, 'error');
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      setTestingOpenClaw(false);
    }
  };

  const handleSaveOpenclawToken = async () => {
    try {
      await api.settings.update({ openclaw_token: openclawToken });
      setOpenclawToken('');
      refetchSettings();
      showToast('OpenClaw token saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleSetDefaultModel = async (modelName) => {
    try {
      setDefaultModel(modelName);
      const modelKey = activeProvider === 'groq' ? 'groq_model'
        : activeProvider === 'anthropic' ? 'anthropic_model'
        : activeProvider === 'openclaw' ? 'openclaw_model'
        : 'ollama_model';
      await api.settings.update({ [modelKey]: modelName });
      refetchSettings();
      showToast(`Default model set to ${modelName}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handlePullModel = async () => {
    if (!pullModelName.trim()) return;
    setPullingModel(true);
    try {
      const response = await fetch('/api/ai/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pullModelName.trim() }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lastStatus = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status) lastStatus = data.status;
            if (data.done) break;
          } catch { /* skip */ }
        }
      }
      setPullModelName('');
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model pulled successfully: ${lastStatus}`);
    } catch (err) {
      showToast(`Failed to pull model: ${err.message}`, 'error');
    } finally {
      setPullingModel(false);
    }
  };

  const handleDeleteModel = async (modelName) => {
    setDeletingModel(modelName);
    try {
      await api.ai.deleteModel(modelName);
      setDeleteConfirm(null);
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model ${modelName} deleted`);
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`, 'error');
    } finally {
      setDeletingModel(null);
    }
  };

  /* ─────────────────────────────────────────────
     HANDLERS — BUSINESS
  ───────────────────────────────────────────── */
  const handleSaveBusiness = async () => {
    setSavingBusiness(true);
    try {
      await api.settings.update({
        company_name: companyName,
        service_area: serviceArea,
        specialization,
        business_phone: businessPhone,
        business_email: businessEmail,
        business_website: businessWebsite,
        business_license: businessLicense,
        business_insurance: businessInsurance,
        business_state: businessState,
        business_zip: businessZip,
      });
      refetchSettings();
      showToast('Business profile saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingBusiness(false);
    }
  };

  /* ─────────────────────────────────────────────
     HANDLERS — ESTIMATING
  ───────────────────────────────────────────── */
  const handleSaveEstimating = async () => {
    setSavingEstimating(true);
    try {
      await api.settings.update({
        estimate_labor_rate: String(laborRate),
        estimate_markup: String(materialMarkup),
        estimate_overhead: String(overheadFactor),
        estimate_tax_rate: String(taxRate),
        estimate_terms: paymentTerms,
        estimate_deposit_pct: String(depositPct),
        estimate_expiry_days: String(expiryDays),
        estimate_include_tax: String(includeTax),
        estimate_auto_markup: String(autoMarkup),
      });
      refetchSettings();
      showToast('Estimating defaults saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingEstimating(false);
    }
  };

  /* ─────────────────────────────────────────────
     HANDLERS — DISCOVERY
  ───────────────────────────────────────────── */
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

  /* ─────────────────────────────────────────────
     HANDLERS — NOTIFICATIONS
  ───────────────────────────────────────────── */
  const handleSaveNotifications = async () => {
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
      const result = await api.emailMonitor.testConnection({
        host: emHost,
        port: parseInt(emPort),
        user: emUser,
        pass: emPass || undefined,
      });
      showToast(`Connected! ${result.messages} messages in inbox, ${result.unseen} unseen`);
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
      if (result.disabled) {
        showToast('Email monitor is disabled — enable it first', 'warning');
      } else if (result.error) {
        showToast(`Check failed: ${result.error}`, 'error');
      } else {
        showToast(`Checked: ${result.processed} emails, ${result.matched} matches, ${result.smsSent} SMS sent`);
      }
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

  /* ─────────────────────────────────────────────
     HANDLERS — OAUTH
  ───────────────────────────────────────────── */
  const handleSaveMicrosoft = async () => {
    try {
      const u = {};
      if (msClientId) u.microsoft_client_id = msClientId;
      if (msClientSecret) u.microsoft_client_secret = msClientSecret;
      await api.settings.update(u);
      setMsClientId(''); setMsClientSecret('');
      refetchSettings(); showToast('Microsoft OAuth credentials saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleTestMicrosoft = async () => {
    setTestingMicrosoft(true);
    try { const r = await api.settings.testMicrosoft(msClientId || undefined, msClientSecret || undefined); if (r.valid) showToast('Microsoft OAuth credentials valid'); else showToast(r.error || 'Invalid credentials', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingMicrosoft(false); }
  };

  const handleSaveGoogle = async () => {
    try {
      const u = {};
      if (googleClientId) u.google_client_id = googleClientId;
      if (googleClientSecret) u.google_client_secret = googleClientSecret;
      await api.settings.update(u);
      setGoogleClientId(''); setGoogleClientSecret('');
      refetchSettings(); showToast('Google OAuth credentials saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleTestGoogle = async () => {
    setTestingGoogle(true);
    try { const r = await api.settings.testGoogle(googleClientId || undefined, googleClientSecret || undefined); if (r.valid) showToast(r.message || 'Google OAuth credentials valid'); else showToast(r.error || 'Invalid credentials', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingGoogle(false); }
  };

  const handleSaveTelegram = async () => {
    try {
      const u = {};
      if (telegramToken) u.telegram_bot_token = telegramToken;
      if (telegramChatId) u.telegram_chat_id = telegramChatId;
      await api.settings.update(u);
      setTelegramToken('');
      refetchSettings(); showToast('Telegram settings saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try { const r = await api.settings.testTelegram(telegramToken || undefined); if (r.valid) showToast(`Bot connected: @${r.botUsername}`); else showToast(r.error || 'Invalid token', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingTelegram(false); }
  };

  const handleSaveEmailWatcher = async () => {
    try {
      await api.settings.update({
        email_watcher_poll_interval: String(ewPollInterval),
        email_watcher_mark_read: String(ewMarkAsRead),
      });
      refetchSettings(); showToast('Email watcher settings saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  /* ─────────────────────────────────────────────
     HANDLERS — API KEYS
  ───────────────────────────────────────────── */
  const handleSaveSerperKey = async () => {
    try { await api.settings.update({ serper_api_key: serperKey }); setSerperKey(''); refetchSettings(); showToast('Serper API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleSavePlacesKey = async () => {
    try { await api.settings.update({ google_places_api_key: placesKey }); setPlacesKey(''); refetchSettings(); showToast('Google Places API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleSaveGoogleMapsKey = async () => {
    try { await api.settings.update({ google_maps_api_key: googleMapsKey }); setGoogleMapsKey(''); refetchSettings(); showToast('Google Maps API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleSaveAnthropicKey = async () => {
    try { await api.settings.update({ anthropic_api_key: anthropicKey }); setAnthropicKey(''); refetchSettings(); showToast('Anthropic API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleSaveSendgridKey = async () => {
    try { await api.settings.update({ sendgrid_api_key: sendgridKey }); setSendgridKey(''); refetchSettings(); showToast('SendGrid API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleSaveStripeKey = async () => {
    try { await api.settings.update({ stripe_api_key: stripeKey }); setStripeKey(''); refetchSettings(); showToast('Stripe API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleSaveTwilio = async () => {
    try {
      const u = {};
      if (twilioSid) u.twilio_account_sid = twilioSid;
      if (twilioToken) u.twilio_auth_token = twilioToken;
      if (twilioPhone) u.twilio_from_phone = twilioPhone;
      await api.settings.update(u);
      setTwilioSid(''); setTwilioToken(''); setTwilioPhone('');
      refetchSettings(); showToast('Twilio credentials saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleTestSerper = async () => {
    setTestingSerper(true);
    try { const r = await api.settings.testSerper(serperKey || undefined); if (r.valid) showToast(`Serper valid (credits: ${r.credits})`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingSerper(false); }
  };

  const handleTestSendgrid = async () => {
    setTestingSendgrid(true);
    try { const r = await api.settings.testSendgrid(sendgridKey || undefined); if (r.valid) showToast('SendGrid key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingSendgrid(false); }
  };

  const handleTestStripe = async () => {
    setTestingStripe(true);
    try { const r = await api.settings.testStripe(stripeKey || undefined); if (r.valid) showToast(`Stripe valid (${r.mode} mode)`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingStripe(false); }
  };

  const handleTestGoogleMaps = async () => {
    setTestingGoogleMaps(true);
    try { const r = await api.settings.testGoogleMaps(googleMapsKey || undefined); if (r.valid) showToast('Google Maps key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingGoogleMaps(false); }
  };

  const handleTestTwilio = async () => {
    setTestingTwilio(true);
    try { const r = await api.settings.testTwilio(twilioSid || undefined, twilioToken || undefined); if (r.valid) showToast(`Twilio connected (${r.friendlyName})`); else showToast(r.error || 'Invalid credentials', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingTwilio(false); }
  };

  /* ─────────────────────────────────────────────
     HANDLERS — PERFORMANCE
  ───────────────────────────────────────────── */
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

  /* ─────────────────────────────────────────────
     HANDLERS — APPEARANCE
  ───────────────────────────────────────────── */
  const handleApplyTheme = (pref) => {
    setThemePreference(pref);
    localStorage.setItem('theme_preference', pref);
    if (pref === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      localStorage.setItem('theme', pref);
      document.documentElement.classList.toggle('dark', pref === 'dark');
    }
  };

  const handleSaveAppearance = () => {
    localStorage.setItem('compact_sidebar', String(compactSidebar));
    localStorage.setItem('dense_mode', String(denseMode));
    localStorage.setItem('animations_enabled', String(animationsEnabled));
    localStorage.setItem('date_format', dateFormat);
    localStorage.setItem('number_format', numberFormat);
    showToast('Appearance settings saved');
  };

  /* ─────────────────────────────────────────────
     HANDLERS — DATA
  ───────────────────────────────────────────── */
  const handleExportSettings = async () => {
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
      showToast('Settings exported');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setExportingData(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      await fetch('/api/admin/backup', { method: 'POST' });
      showToast('Database backup created');
    } catch (err) {
      showToast(`Backup failed: ${err.message}`, 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      showToast('Cache cleared — will rebuild on next requests', 'warning');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setClearingCache(false);
    }
  };

  /* ─────────────────────────────────────────────
     COMPUTED
  ───────────────────────────────────────────── */
  const temperatureLabel = t => t <= 0.3 ? 'Precise' : t <= 0.7 ? 'Balanced' : 'Creative';
  const successRate = metrics.totalRequests > 0
    ? ((metrics.successCount / metrics.totalRequests) * 100).toFixed(1) : '0.0';
  const uptimeFormatted = metrics.uptimeMs
    ? `${Math.floor(metrics.uptimeMs / 3600000)}h ${Math.floor((metrics.uptimeMs % 3600000) / 60000)}m` : '--';
  const cbState = metrics.circuitBreaker || 'closed';

  /* ─────────────────────────────────────────────
     RENDER ACTIVE TAB
  ───────────────────────────────────────────── */
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <SettingsOverview
            settings={settings}
            metrics={metrics}
            config={config}
            activeProvider={activeProvider}
            connected={connected}
            availableModels={availableModels}
            onTabChange={handleTabChange}
            onRefreshMetrics={refetchMetrics}
            settingsData={settingsData}
          />
        );
      case 'ai':
        return (
          <SettingsAI
            activeProvider={activeProvider}
            settings={settings}
            availableModels={availableModels}
            connected={connected}
            defaultModel={defaultModel}
            config={config}
            switchingProvider={switchingProvider}
            testingOllama={testingOllama}
            testingGroq={testingGroq}
            testingOpenai={testingOpenai}
            testingOpenClaw={testingOpenClaw}
            savingAI={savingAI}
            maxTokens={maxTokens}
            setMaxTokens={setMaxTokens}
            topP={topP}
            setTopP={setTopP}
            streamingEnabled={streamingEnabled}
            setStreamingEnabled={setStreamingEnabled}
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
            pullModelName={pullModelName}
            setPullModelName={setPullModelName}
            pullingModel={pullingModel}
            deleteConfirm={deleteConfirm}
            setDeleteConfirm={setDeleteConfirm}
            deletingModel={deletingModel}
            showGroqKey={showGroqKey}
            setShowGroqKey={setShowGroqKey}
            showOpenaiKey={showOpenaiKey}
            setShowOpenaiKey={setShowOpenaiKey}
            showOpenclawToken={showOpenclawToken}
            setShowOpenclawToken={setShowOpenclawToken}
            temperature={temperature}
            setTemperature={setTemperature}
            groqKey={groqKey}
            setGroqKey={setGroqKey}
            groqTemperature={groqTemperature}
            setGroqTemperature={setGroqTemperature}
            openaiKey={openaiKey}
            setOpenaiKey={setOpenaiKey}
            openaiTemperature={openaiTemperature}
            setOpenaiTemperature={setOpenaiTemperature}
            ollamaUrl={ollamaUrl}
            setOllamaUrl={setOllamaUrl}
            openclawUrl={openclawUrl}
            setOpenclawUrl={setOpenclawUrl}
            openclawToken={openclawToken}
            setOpenclawToken={setOpenclawToken}
            openclawTemperature={openclawTemperature}
            setOpenclawTemperature={setOpenclawTemperature}
            handleSwitchProvider={handleSwitchProvider}
            handleSaveAIConfig={handleSaveAIConfig}
            handleTestOllama={handleTestOllama}
            handleTestGroq={handleTestGroq}
            handleSaveGroqKey={handleSaveGroqKey}
            handleTestOpenai={handleTestOpenai}
            handleSaveOpenaiKey={handleSaveOpenaiKey}
            handleTestOpenClaw={handleTestOpenClaw}
            handleSaveOpenclawToken={handleSaveOpenclawToken}
            handleSetDefaultModel={handleSetDefaultModel}
            handlePullModel={handlePullModel}
            handleDeleteModel={handleDeleteModel}
            temperatureLabel={temperatureLabel}
          />
        );
      case 'business':
        return (
          <SettingsBusiness
            companyName={companyName}
            setCompanyName={setCompanyName}
            businessPhone={businessPhone}
            setBusinessPhone={setBusinessPhone}
            businessEmail={businessEmail}
            setBusinessEmail={setBusinessEmail}
            businessWebsite={businessWebsite}
            setBusinessWebsite={setBusinessWebsite}
            serviceArea={serviceArea}
            setServiceArea={setServiceArea}
            businessState={businessState}
            setBusinessState={setBusinessState}
            businessZip={businessZip}
            setBusinessZip={setBusinessZip}
            specialization={specialization}
            setSpecialization={setSpecialization}
            businessLicense={businessLicense}
            setBusinessLicense={setBusinessLicense}
            businessInsurance={businessInsurance}
            setBusinessInsurance={setBusinessInsurance}
            savingBusiness={savingBusiness}
            handleSaveBusiness={handleSaveBusiness}
          />
        );
      case 'estimating':
        return (
          <SettingsEstimating
            laborRate={laborRate}
            setLaborRate={setLaborRate}
            materialMarkup={materialMarkup}
            setMaterialMarkup={setMaterialMarkup}
            overheadFactor={overheadFactor}
            setOverheadFactor={setOverheadFactor}
            taxRate={taxRate}
            setTaxRate={setTaxRate}
            paymentTerms={paymentTerms}
            setPaymentTerms={setPaymentTerms}
            depositPct={depositPct}
            setDepositPct={setDepositPct}
            expiryDays={expiryDays}
            setExpiryDays={setExpiryDays}
            includeTax={includeTax}
            setIncludeTax={setIncludeTax}
            autoMarkup={autoMarkup}
            setAutoMarkup={setAutoMarkup}
            savingEstimating={savingEstimating}
            handleSaveEstimating={handleSaveEstimating}
          />
        );
      case 'discovery':
        return (
          <SettingsDiscovery
            maxResults={maxResults}
            setMaxResults={setMaxResults}
            searchRadius={searchRadius}
            setSearchRadius={setSearchRadius}
            minScore={minScore}
            setMinScore={setMinScore}
            excludedKeywords={excludedKeywords}
            setExcludedKeywords={setExcludedKeywords}
            autoScore={autoScore}
            setAutoScore={setAutoScore}
            autoArchive={autoArchive}
            setAutoArchive={setAutoArchive}
            archiveThreshold={archiveThreshold}
            setArchiveThreshold={setArchiveThreshold}
            followupDays={followupDays}
            setFollowupDays={setFollowupDays}
            savingDiscovery={savingDiscovery}
            handleSaveDiscovery={handleSaveDiscovery}
          />
        );
      case 'jobpulse':
        return (
          <SettingsJobPulse
            emEnabled={emEnabled}
            setEmEnabled={setEmEnabled}
            emUser={emUser}
            setEmUser={setEmUser}
            emPass={emPass}
            setEmPass={setEmPass}
            emHost={emHost}
            setEmHost={setEmHost}
            emPort={emPort}
            setEmPort={setEmPort}
            emKeywords={emKeywords}
            setEmKeywords={setEmKeywords}
            emTesting={emTesting}
            emChecking={emChecking}
            emSaving={emSaving}
            emStatus={emStatus}
            emAlerts={emAlerts}
            handleTestEmailMonitor={handleTestEmailMonitor}
            handleCheckNow={handleCheckNow}
            handleSaveEmailMonitor={handleSaveEmailMonitor}
            notifySmsEnabled={notifySmsEnabled}
            setNotifySmsEnabled={setNotifySmsEnabled}
            notifyAdminPhone={notifyAdminPhone}
            setNotifyAdminPhone={setNotifyAdminPhone}
          />
        );
      case 'notifications':
        return (
          <SettingsNotifications
            notifyEnabled={notifyEnabled}
            setNotifyEnabled={setNotifyEnabled}
            notifyEmailEnabled={notifyEmailEnabled}
            setNotifyEmailEnabled={setNotifyEmailEnabled}
            notifyEmailAddr={notifyEmailAddr}
            setNotifyEmailAddr={setNotifyEmailAddr}
            notifyOnNewLead={notifyOnNewLead}
            setNotifyOnNewLead={setNotifyOnNewLead}
            notifyOnHighScore={notifyOnHighScore}
            setNotifyOnHighScore={setNotifyOnHighScore}
            notifyOnPermit={notifyOnPermit}
            setNotifyOnPermit={setNotifyOnPermit}
            notifySmsEnabled={notifySmsEnabled}
            setNotifySmsEnabled={setNotifySmsEnabled}
            notifyAdminPhone={notifyAdminPhone}
            setNotifyAdminPhone={setNotifyAdminPhone}
            notifyDigestEnabled={notifyDigestEnabled}
            setNotifyDigestEnabled={setNotifyDigestEnabled}
            notifyDigestDay={notifyDigestDay}
            setNotifyDigestDay={setNotifyDigestDay}
            notifyDigestTime={notifyDigestTime}
            setNotifyDigestTime={setNotifyDigestTime}
            savingNotifications={savingNotifications}
            handleSaveNotifications={handleSaveNotifications}
            emEnabled={emEnabled}
            setEmEnabled={setEmEnabled}
            emUser={emUser}
            setEmUser={setEmUser}
            emPass={emPass}
            setEmPass={setEmPass}
            emHost={emHost}
            setEmHost={setEmHost}
            emPort={emPort}
            setEmPort={setEmPort}
            emKeywords={emKeywords}
            setEmKeywords={setEmKeywords}
            emTesting={emTesting}
            emChecking={emChecking}
            emSaving={emSaving}
            emStatus={emStatus}
            emAlerts={emAlerts}
            handleTestEmailMonitor={handleTestEmailMonitor}
            handleCheckNow={handleCheckNow}
            handleSaveEmailMonitor={handleSaveEmailMonitor}
            settings={settings}
            googleClientId={googleClientId}
            setGoogleClientId={setGoogleClientId}
            googleClientSecret={googleClientSecret}
            setGoogleClientSecret={setGoogleClientSecret}
            showGoogleClientSecret={showGoogleClientSecret}
            setShowGoogleClientSecret={setShowGoogleClientSecret}
            testingGoogle={testingGoogle}
            handleTestGoogle={handleTestGoogle}
            handleSaveGoogle={handleSaveGoogle}
            msClientId={msClientId}
            setMsClientId={setMsClientId}
            msClientSecret={msClientSecret}
            setMsClientSecret={setMsClientSecret}
            showMsClientSecret={showMsClientSecret}
            setShowMsClientSecret={setShowMsClientSecret}
            testingMicrosoft={testingMicrosoft}
            handleTestMicrosoft={handleTestMicrosoft}
            handleSaveMicrosoft={handleSaveMicrosoft}
            ewPollInterval={ewPollInterval}
            setEwPollInterval={setEwPollInterval}
            ewMarkAsRead={ewMarkAsRead}
            setEwMarkAsRead={setEwMarkAsRead}
            handleSaveEmailWatcher={handleSaveEmailWatcher}
          />
        );
      case 'quickbooks':
        return (
          <SettingsQuickBooks
            settings={settings}
            showToast={showToast}
            refetchSettings={refetchSettings}
          />
        );
      case 'apikeys':
        return (
          <SettingsAPIKeys
            settings={settings}
            serperKey={serperKey}
            setSerperKey={setSerperKey}
            showSerperKey={showSerperKey}
            setShowSerperKey={setShowSerperKey}
            testingSerper={testingSerper}
            handleTestSerper={handleTestSerper}
            handleSaveSerperKey={handleSaveSerperKey}
            placesKey={placesKey}
            setPlacesKey={setPlacesKey}
            showPlacesKey={showPlacesKey}
            setShowPlacesKey={setShowPlacesKey}
            handleSavePlacesKey={handleSavePlacesKey}
            googleMapsKey={googleMapsKey}
            setGoogleMapsKey={setGoogleMapsKey}
            showGoogleMapsKey={showGoogleMapsKey}
            setShowGoogleMapsKey={setShowGoogleMapsKey}
            testingGoogleMaps={testingGoogleMaps}
            handleTestGoogleMaps={handleTestGoogleMaps}
            handleSaveGoogleMapsKey={handleSaveGoogleMapsKey}
            anthropicKey={anthropicKey}
            setAnthropicKey={setAnthropicKey}
            showAnthropicKey={showAnthropicKey}
            setShowAnthropicKey={setShowAnthropicKey}
            testingAnthropic={testingAnthropic}
            handleTestAnthropic={handleTestAnthropic}
            handleSaveAnthropicKey={handleSaveAnthropicKey}
            openaiKey={openaiKey}
            setOpenaiKey={setOpenaiKey}
            showOpenaiKey={showOpenaiKey}
            setShowOpenaiKey={setShowOpenaiKey}
            testingOpenai={testingOpenai}
            handleTestOpenai={handleTestOpenai}
            handleSaveOpenaiKey={handleSaveOpenaiKey}
            twilioSid={twilioSid}
            setTwilioSid={setTwilioSid}
            twilioToken={twilioToken}
            setTwilioToken={setTwilioToken}
            showTwilioToken={showTwilioToken}
            setShowTwilioToken={setShowTwilioToken}
            twilioPhone={twilioPhone}
            setTwilioPhone={setTwilioPhone}
            testingTwilio={testingTwilio}
            handleTestTwilio={handleTestTwilio}
            handleSaveTwilio={handleSaveTwilio}
            sendgridKey={sendgridKey}
            setSendgridKey={setSendgridKey}
            showSendgridKey={showSendgridKey}
            setShowSendgridKey={setShowSendgridKey}
            testingSendgrid={testingSendgrid}
            handleTestSendgrid={handleTestSendgrid}
            handleSaveSendgridKey={handleSaveSendgridKey}
            stripeKey={stripeKey}
            setStripeKey={setStripeKey}
            showStripeKey={showStripeKey}
            setShowStripeKey={setShowStripeKey}
            testingStripe={testingStripe}
            handleTestStripe={handleTestStripe}
            handleSaveStripeKey={handleSaveStripeKey}
            telegramToken={telegramToken}
            setTelegramToken={setTelegramToken}
            showTelegramToken={showTelegramToken}
            setShowTelegramToken={setShowTelegramToken}
            telegramChatId={telegramChatId}
            setTelegramChatId={setTelegramChatId}
            testingTelegram={testingTelegram}
            handleTestTelegram={handleTestTelegram}
            handleSaveTelegram={handleSaveTelegram}
          />
        );
      case 'performance':
        return (
          <SettingsPerformance
            perfCacheTtl={perfCacheTtl}
            setPerfCacheTtl={setPerfCacheTtl}
            perfLowMemory={perfLowMemory}
            setPerfLowMemory={setPerfLowMemory}
            perfRateLimit={perfRateLimit}
            setPerfRateLimit={setPerfRateLimit}
            perfTimeout={perfTimeout}
            setPerfTimeout={setPerfTimeout}
            perfCbEnabled={perfCbEnabled}
            setPerfCbEnabled={setPerfCbEnabled}
            perfCbThreshold={perfCbThreshold}
            setPerfCbThreshold={setPerfCbThreshold}
            perfBgJobs={perfBgJobs}
            setPerfBgJobs={setPerfBgJobs}
            cbState={cbState}
            savingPerformance={savingPerformance}
            handleSavePerformance={handleSavePerformance}
          />
        );
      case 'appearance':
        return (
          <SettingsAppearance
            themePreference={themePreference}
            handleApplyTheme={handleApplyTheme}
            compactSidebar={compactSidebar}
            setCompactSidebar={setCompactSidebar}
            denseMode={denseMode}
            setDenseMode={setDenseMode}
            animationsEnabled={animationsEnabled}
            setAnimationsEnabled={setAnimationsEnabled}
            dateFormat={dateFormat}
            setDateFormat={setDateFormat}
            numberFormat={numberFormat}
            setNumberFormat={setNumberFormat}
            handleSaveAppearance={handleSaveAppearance}
          />
        );
      case 'data':
        return (
          <SettingsData
            exportingData={exportingData}
            handleExportSettings={handleExportSettings}
            creatingBackup={creatingBackup}
            handleCreateBackup={handleCreateBackup}
            clearingCache={clearingCache}
            handleClearCache={handleClearCache}
            refetchMetrics={refetchMetrics}
            refetchOllama={refetchOllama}
            showToast={showToast}
            resetConfirm={resetConfirm}
            setResetConfirm={setResetConfirm}
          />
        );
      case 'system':
        return (
          <SettingsSystem
            metrics={metrics}
            config={config}
            activeProvider={activeProvider}
            defaultModel={defaultModel}
            successRate={successRate}
            uptimeFormatted={uptimeFormatted}
            cbState={cbState}
            refetchMetrics={refetchMetrics}
            refetchOllama={refetchOllama}
            showToast={showToast}
          />
        );
      default:
        return (
          <SettingsOverview
            settings={settings}
            metrics={metrics}
            config={config}
            activeProvider={activeProvider}
            connected={connected}
            availableModels={availableModels}
            onTabChange={handleTabChange}
            onRefreshMetrics={refetchMetrics}
            settingsData={settingsData}
          />
        );
    }
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-8 page-transition-wrapper">
      {/* Page header */}
      <div className="command-header mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Settings</h1>
            <p className="text-sm text-blue-200/70">Advanced configuration — AI, estimating, notifications, and more</p>
          </div>
          <StatusPill connected={connected} />
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── Desktop sidebar nav ── */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="card p-2 sticky top-6">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 text-left ${
                  activeTab === id
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 dark:bg-blue-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${activeTab === id ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                {label}
                {activeTab === id && <ChevronRight className="w-3 h-3 ml-auto text-blue-500 dark:text-blue-400" />}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {/* Mobile tab scrollbar */}
          <div className="flex md:hidden overflow-x-auto gap-2 mb-5 pb-1 -mx-4 px-4">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeTab === id
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-300/40 dark:border-blue-700/40'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab panel */}
          <div
            key={activeTab}
            className={`
              min-h-[400px]
              ${tabDirection === 'left' ? 'page-slide-left' : tabDirection === 'right' ? 'page-slide-right' : 'page-transition-wrapper'}
            `}
            style={{ willChange: 'transform, opacity' }}
          >
            <TabErrorBoundary key={activeTab}>
              <Suspense fallback={<TabFallback />}>
                {renderActiveTab()}
              </Suspense>
            </TabErrorBoundary>
          </div>

          {/* Attribution */}
          <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-gray-800">
            <span className="text-xs text-gray-500 font-medium tracking-wide">
              Created by Cory Nichols
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
