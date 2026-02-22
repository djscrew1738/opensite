import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useOllama } from '../hooks/useOllama';
import { useModelPreference } from '../hooks/useModelPreference';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import {
  CheckCircle, XCircle, RefreshCw, Building2, MapPin, Wrench,
  Cpu, Shield, Key, Download, Trash2, Star, Activity,
  Server, Thermometer, AlertTriangle, Loader2, Eye, EyeOff,
  HardDrive, Clock, Zap, CircuitBoard, Save, ExternalLink, Cog,
  Bell, Search, Calculator, Gauge, Palette, Database, Globe,
  Phone, Mail, DollarSign, SlidersHorizontal, MessageSquare,
  Moon, Sun, Monitor, AlertOctagon, FileDown, Hash,
  ChevronRight, LayoutDashboard, RotateCcw, FileText,
  Percent, CalendarDays, Package, Layers, Settings as SettingsIcon,
  AlertCircle
} from 'lucide-react';
import SettingsHome from '../components/settings/SettingsHome';

/* ─────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────── */

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

function SettingsRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">{label}</span>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Section({ icon: Icon, title, badge, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-copper-950/30 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

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

function MetricBox({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-surface-50 dark:bg-surface-850/60 rounded-xl p-4 border border-surface-200/60 dark:border-surface-700/60 border-l-2 border-l-blue-400/30 dark:border-l-blue-600/20">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-surface-900 dark:text-surface-100 font-mono tabular-nums">{value}</p>
      {sub && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step = 1, unit = '', markers }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      {markers && (
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-0.5">
          {markers.map(m => <span key={m}>{m}</span>)}
        </div>
      )}
    </div>
  );
}

function KeyInput({ label, description, value, onChange, show, onToggleShow, onSave, onTest, saving, testing, placeholder, href, hrefLabel }) {
  return (
    <div>
      <label className="label">{label}</label>
      {(description || href) && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {description}{href && <> Get a key at{' '}
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
              {hrefLabel} <ExternalLink className="w-3 h-3" />
            </a>
          </>}
        </p>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="input pr-10 font-mono text-sm"
            placeholder={placeholder}
          />
          <button type="button" onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {onTest && (
          <button onClick={onTest} disabled={testing} className="btn-secondary text-sm whitespace-nowrap">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Test
          </button>
        )}
        <button onClick={onSave} disabled={!value.trim() || saving} className="btn-primary text-sm whitespace-nowrap">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
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
  { id: 'apikeys',       icon: Key,              label: 'API Keys' },
  { id: 'performance',   icon: Gauge,            label: 'Performance' },
  { id: 'appearance',    icon: Palette,          label: 'Appearance' },
  { id: 'data',          icon: Database,         label: 'Data' },
  { id: 'system',        icon: Activity,         label: 'System' },
];

// Icon map for SettingsHome
const NAV_ICON_MAP = {
  overview: LayoutDashboard,
  ai: Cpu,
  business: Building2,
  estimating: Calculator,
  discovery: Search,
  jobpulse: Activity,
  notifications: Bell,
  apikeys: Key,
  performance: Gauge,
  appearance: Palette,
  data: Database,
  system: Activity,
};

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
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
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
  const [testingOpenClaw, setTestingOpenClaw] = useState(false);
  const [testingSerper, setTestingSerper] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
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

  const availableModels = modelsData?.models || [];
  const settings = settingsData || {};
  const metrics = metricsData?.metrics || {};
  const config = metricsData?.config || {};

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
    api.emailMonitor.getAlerts({ limit: 10 }).then(d => setEmAlerts(d?.alerts || [])).catch(() => {});

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
      await api.settings.update({ ai_provider: provider });
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
      setEmAlerts(alerts?.alerts || []);
      const st = await api.emailMonitor.getStatus();
      setEmStatus(st);
    } catch (err) {
      showToast(`Check failed: ${err.message}`, 'error');
    } finally {
      setEmChecking(false);
    }
  };

  /* ─────────────────────────────────────────────
     HANDLERS — API KEYS
  ───────────────────────────────────────────── */
  const handleSaveSerperKey = async () => {
    try { await api.settings.update({ serper_api_key: serperKey }); setSerperKey(''); refetchSettings(); showToast('API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };
  const handleSavePlacesKey = async () => {
    try { await api.settings.update({ google_places_api_key: placesKey }); setPlacesKey(''); refetchSettings(); showToast('Google Places API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };
  const handleSaveAnthropicKey = async () => {
    try { await api.settings.update({ anthropic_api_key: anthropicKey }); setAnthropicKey(''); refetchSettings(); showToast('Anthropic API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };
  const handleSaveOpenaiKey = async () => {
    try { await api.settings.update({ openai_api_key: openaiKey }); setOpenaiKey(''); refetchSettings(); showToast('OpenAI API key saved'); }
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
  const handleSaveSendgridKey = async () => {
    try { await api.settings.update({ sendgrid_api_key: sendgridKey }); setSendgridKey(''); refetchSettings(); showToast('SendGrid API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };
  const handleSaveStripeKey = async () => {
    try { await api.settings.update({ stripe_api_key: stripeKey }); setStripeKey(''); refetchSettings(); showToast('Stripe API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };
  const handleSaveGoogleMapsKey = async () => {
    try { await api.settings.update({ google_maps_api_key: googleMapsKey }); setGoogleMapsKey(''); refetchSettings(); showToast('Google Maps API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  };

  const handleTestSerper = async () => {
    setTestingSerper(true);
    try { const r = await api.settings.testSerper(serperKey || undefined); if (r.valid) showToast(`Serper valid (credits: ${r.credits})`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingSerper(false); }
  };
  const handleTestAnthropic = async () => {
    setTestingAnthropic(true);
    try { const r = await api.settings.testAnthropic(anthropicKey || undefined); if (r.valid) showToast('Anthropic key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingAnthropic(false); }
  };
  const handleTestOpenai = async () => {
    setTestingOpenai(true);
    try { const r = await api.settings.testOpenai(openaiKey || undefined); if (r.valid) showToast(`OpenAI valid (${r.modelCount} models)`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingOpenai(false); }
  };
  const handleTestTwilio = async () => {
    setTestingTwilio(true);
    try { const r = await api.settings.testTwilio(twilioSid || undefined, twilioToken || undefined); if (r.valid) showToast(`Twilio connected (${r.friendlyName})`); else showToast(r.error || 'Invalid credentials', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingTwilio(false); }
  };
  const handleTestSendgrid = async () => {
    setTestingSendgrid(true);
    try { const r = await api.settings.testSendgrid(sendgridKey || undefined); if (r.valid) showToast('SendGrid key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingSendgrid(false); }
  };
  const handleTestStripe = async () => {
    setTestingStripe(true);
    try { const r = await api.settings.testStripe(stripeKey || undefined); if (r.valid) showToast(`Stripe valid (${r.currency || 'USD'})`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingStripe(false); }
  };
  const handleTestGoogleMaps = async () => {
    setTestingGoogleMaps(true);
    try { const r = await api.settings.testGoogleMaps(googleMapsKey || undefined); if (r.valid) showToast('Google Maps key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { setTestingGoogleMaps(false); }
  };

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
     TAB RENDERERS
  ───────────────────────────────────────────── */

  const renderAI = () => (
    <div className="space-y-6">
      {/* Provider */}
      <Section icon={Cpu} title="AI Provider"
        badge={
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            activeProvider === 'openclaw' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            : activeProvider === 'groq' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
            : activeProvider === 'anthropic' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeProvider === 'openclaw' ? 'bg-red-500' : activeProvider === 'groq' ? 'bg-orange-500' : activeProvider === 'anthropic' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            {{ openclaw: 'OpenClaw', groq: 'Groq Cloud', anthropic: 'Anthropic', ollama: 'Ollama Local' }[activeProvider] || activeProvider}
          </span>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'ollama', icon: Server, label: 'Ollama', desc: 'Local, private, no limits', accent: 'blue' },
              { id: 'groq',   icon: Zap,    label: 'Groq',   desc: 'Ultra-fast cloud inference', accent: 'orange' },
              { id: 'openclaw', icon: Cog,  label: 'OpenClaw', desc: 'Local AI gateway — 200k ctx, no API cost', accent: 'red' },
            ].map(({ id, icon: Icon, label, desc, accent }) => (
              <button key={id} onClick={() => handleSwitchProvider(id)} disabled={switchingProvider}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  activeProvider === id
                    ? `border-${accent}-500 bg-${accent}-50/50 dark:bg-${accent}-950/20`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {activeProvider === id && <div className="absolute top-2 right-2"><CheckCircle className={`w-5 h-5 text-${accent}-500`} /></div>}
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 text-${accent}-600 dark:text-${accent}-400`} />
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{label}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </button>
            ))}
          </div>

          {/* Ollama */}
          {activeProvider === 'ollama' && (
            <>
              <div>
                <label className="label">Ollama Server URL</label>
                <div className="flex gap-2">
                  <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} className="input flex-1 font-mono text-sm" placeholder="http://localhost:11434" />
                  <button onClick={handleTestOllama} disabled={testingOllama} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOllama ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Model</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>{connected ? 'Loading...' : model || 'No models'}</option>}
                  {availableModels.map(m => <option key={m.name} value={m.name}>{m.name} {m.size ? `(${(m.size/(1024**3)).toFixed(1)} GB)` : ''}</option>)}
                </select>
              </div>
              <SliderField label="Temperature" value={temperature} onChange={setTemperature} min={0} max={1} step={0.05} unit={` — ${temperatureLabel(temperature)}`} markers={['Precise','Balanced','Creative']} />
            </>
          )}

          {/* Groq */}
          {activeProvider === 'groq' && (
            <>
              <div>
                <label className="label">Groq API Key</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Get a free key at console.groq.com</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showGroqKey ? 'text' : 'password'} value={groqKey} onChange={e => setGroqKey(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.groq_api_key_masked || 'gsk_...'} />
                    <button type="button" onClick={() => setShowGroqKey(!showGroqKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleTestGroq} disabled={testingGroq} className="btn-secondary text-sm whitespace-nowrap">
                    {testingGroq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveGroqKey} disabled={!groqKey.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Model</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>Loading Groq models...</option>}
                  {availableModels.map(m => <option key={m.name} value={m.name}>{m.label || m.name} {m.context ? `(${Math.round(m.context/1000)}k ctx)` : ''}</option>)}
                </select>
              </div>
              <SliderField label="Temperature" value={groqTemperature} onChange={setGroqTemperature} min={0} max={1} step={0.05} unit={` — ${temperatureLabel(groqTemperature)}`} markers={['Precise','Balanced','Creative']} />
            </>
          )}

          {/* OpenClaw */}
          {activeProvider === 'openclaw' && (
            <>
              <div>
                <label className="label">OpenClaw Gateway URL</label>
                <div className="flex gap-2">
                  <input type="text" value={openclawUrl} onChange={e => setOpenclawUrl(e.target.value)} className="input flex-1 font-mono text-sm" placeholder="http://localhost:18789" />
                  <button onClick={handleTestOpenClaw} disabled={testingOpenClaw} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOpenClaw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Gateway Token (optional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showOpenclawToken ? 'text' : 'password'} value={openclawToken} onChange={e => setOpenclawToken(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.openclaw_token_masked || 'Enter token if configured'} />
                    <button type="button" onClick={() => setShowOpenclawToken(!showOpenclawToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showOpenclawToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleSaveOpenclawToken} disabled={!openclawToken.trim()} className="btn-primary text-sm whitespace-nowrap"><Save className="w-4 h-4" /> Save</button>
                </div>
              </div>
              <div>
                <label className="label">Default Agent</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>openclaw:main</option>}
                  {availableModels.map(m => <option key={m.name} value={m.name}>{m.label || m.name}</option>)}
                </select>
              </div>
              <SliderField label="Temperature" value={openclawTemperature} onChange={setOpenclawTemperature} min={0} max={1} step={0.05} unit={` — ${temperatureLabel(openclawTemperature)}`} markers={['Precise','Balanced','Creative']} />
            </>
          )}
        </div>
      </Section>

      {/* Advanced AI */}
      <Section icon={SlidersHorizontal} title="Advanced AI Parameters">
        <div className="space-y-5">
          <SliderField label="Max Tokens" value={maxTokens} onChange={setMaxTokens} min={256} max={8192} step={256} unit=" tokens" markers={['256','2048','4096','8192']} />
          <SliderField label="Top P (nucleus sampling)" value={topP} onChange={setTopP} min={0} max={1} step={0.05} markers={['Focused','Balanced','Diverse']} />
          <SettingsRow label="Streaming Responses" description="Stream tokens as they generate — better UX, slight overhead">
            <Toggle enabled={streamingEnabled} onChange={setStreamingEnabled} />
          </SettingsRow>
          <div>
            <label className="label">System Prompt Prefix</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Prepended to every AI request. Use to inject business context or persona.</p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={4}
              className="input font-mono text-sm resize-none"
              placeholder="You are an expert plumbing estimator for CTL Plumbing LLC in the DFW area..."
            />
            <p className="text-xs text-gray-400 mt-1">{systemPrompt.length} characters</p>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleSaveAIConfig} disabled={savingAI} className="btn-primary text-sm">
              {savingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save AI Config
            </button>
          </div>
        </div>
      </Section>

      {/* Model Library */}
      <Section icon={HardDrive} title="Model Library"
        badge={<span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{availableModels.length} model{availableModels.length !== 1 ? 's' : ''}</span>}
      >
        {activeProvider === 'ollama' && (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Pull New Model</label>
            <div className="flex gap-2">
              <input type="text" value={pullModelName} onChange={e => setPullModelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePullModel()} className="input flex-1 font-mono text-sm" placeholder="e.g. llama3.1, qwen2.5-coder:7b" disabled={pullingModel} />
              <button onClick={handlePullModel} disabled={pullingModel || !pullModelName.trim()} className="btn-primary text-sm whitespace-nowrap">
                {pullingModel ? <><Loader2 className="w-4 h-4 animate-spin" />Pulling...</> : <><Download className="w-4 h-4" />Pull</>}
              </button>
            </div>
          </div>
        )}
        {activeProvider === 'groq' && (
          <div className="mb-5 p-4 bg-orange-50/50 dark:bg-orange-950/10 rounded-xl border border-orange-200/60 dark:border-orange-800/40">
            <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2"><Zap className="w-4 h-4" />Groq models are cloud-hosted. Select below.</p>
          </div>
        )}
        {(!connected && activeProvider === 'ollama') ? (
          <div className="text-center py-8 text-gray-500"><XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Connect to Ollama to manage models</p></div>
        ) : availableModels.length === 0 ? (
          <div className="text-center py-8 text-gray-500"><HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No models found</p></div>
        ) : (
          <div className="space-y-3">
            {availableModels.map(m => {
              const isDefault = m.name === defaultModel || m.name === config.defaultModel;
              const isGroq = activeProvider === 'groq';
              const isOC = activeProvider === 'openclaw';
              return (
                <div key={m.name} className={`relative p-4 rounded-xl border transition-all ${isDefault ? 'bg-accent-50/50 border-accent-200 dark:bg-accent-950/20 dark:border-accent-800/50' : 'bg-gray-50 border-gray-200/60 dark:bg-gray-800/40 dark:border-gray-700/60'}`}>
                  {isDefault && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 rounded-l-xl" />}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{m.label || m.name}</h3>
                        {isDefault && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 text-xs font-bold rounded-full"><Star className="w-3 h-3" />Default</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {isGroq || isOC ? (
                          <>{m.context && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{Math.round(m.context/1000)}k context</span>}</>
                        ) : (
                          <><span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{(m.size/(1024**3)).toFixed(2)} GB</span>
                          {m.modified && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.modified).toLocaleDateString()}</span>}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!isDefault && <button onClick={() => handleSetDefaultModel(m.name)} className="btn-ghost text-xs px-3 py-1.5 min-h-0">Set Default</button>}
                      {!isGroq && !isOC && (
                        deleteConfirm === m.name ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeleteModel(m.name)} disabled={deletingModel === m.name} className="btn-danger text-xs px-3 py-1.5 min-h-0">
                              {deletingModel === m.name ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-xs px-2 py-1.5 min-h-0">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(m.name)} className="btn-ghost text-xs px-2 py-1.5 min-h-0 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );

  const renderBusiness = () => (
    <Section icon={Building2} title="Business Profile">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Company Name</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input" placeholder="CTL Plumbing LLC" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} className="input pl-10" placeholder="(817) 555-0100" />
            </div>
          </div>
          <div>
            <label className="label">Business Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} className="input pl-10" placeholder="info@ctlplumbing.com" />
            </div>
          </div>
          <div>
            <label className="label">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="url" value={businessWebsite} onChange={e => setBusinessWebsite(e.target.value)} className="input pl-10" placeholder="https://ctlplumbing.com" />
            </div>
          </div>
          <div>
            <label className="label">Service Area</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={serviceArea} onChange={e => setServiceArea(e.target.value)} className="input pl-10" placeholder="DFW Metroplex" />
            </div>
          </div>
          <div>
            <label className="label">State</label>
            <select value={businessState} onChange={e => setBusinessState(e.target.value)} className="input">
              <option value="">Select state...</option>
              {['TX','OK','NM','AR','LA','CO','KS','MO'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ZIP Code</label>
            <input type="text" value={businessZip} onChange={e => setBusinessZip(e.target.value)} className="input font-mono" placeholder="76001" maxLength={10} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Specialization</label>
            <div className="relative">
              <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className="input pl-10" placeholder="Commercial and Multi-family Plumbing" />
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Licensing & Insurance</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contractor License #</label>
              <input type="text" value={businessLicense} onChange={e => setBusinessLicense(e.target.value)} className="input font-mono text-sm" placeholder="M-12345" />
            </div>
            <div>
              <label className="label">Insurance Company</label>
              <input type="text" value={businessInsurance} onChange={e => setBusinessInsurance(e.target.value)} className="input text-sm" placeholder="State Farm Commercial" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveBusiness} disabled={savingBusiness} className="btn-primary text-sm">
            {savingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </div>
      </div>
    </Section>
  );

  const renderEstimating = () => (
    <div className="space-y-6">
      <Section icon={DollarSign} title="Pricing Defaults">
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Labor Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">$</span>
                <input type="number" value={laborRate} onChange={e => setLaborRate(Number(e.target.value))} className="input pl-7 font-mono text-sm" min="0" step="5" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/hr</span>
              </div>
            </div>
            <div>
              <label className="label">Material Markup</label>
              <div className="relative">
                <input type="number" value={materialMarkup} onChange={e => setMaterialMarkup(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="200" step="1" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="label">Overhead</label>
              <div className="relative">
                <input type="number" value={overheadFactor} onChange={e => setOverheadFactor(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="100" step="1" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="label">Tax Rate</label>
              <div className="relative">
                <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="20" step="0.25" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Effective Rate Preview</p>
            <div className="flex gap-6 text-sm">
              <div><span className="text-gray-500">Labor:</span> <span className="font-mono font-bold">${laborRate}/hr</span></div>
              <div><span className="text-gray-500">Materials at cost + markup:</span> <span className="font-mono font-bold">{materialMarkup}%</span></div>
              <div><span className="text-gray-500">With overhead:</span> <span className="font-mono font-bold">{(laborRate * (1 + overheadFactor/100)).toFixed(0)}/hr eff.</span></div>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={FileText} title="Quote Settings">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Payment Terms</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="input">
                {['Due on Receipt','Net 15','Net 30','Net 45','Net 60','2/10 Net 30'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Required Deposit</label>
              <div className="relative">
                <input type="number" value={depositPct} onChange={e => setDepositPct(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="100" step="5" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="label">Quote Valid For</label>
              <div className="relative">
                <input type="number" value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} className="input pr-12 font-mono text-sm" min="1" max="180" step="1" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <SettingsRow label="Include Tax in Estimates" description="Automatically add tax line to all estimates">
              <Toggle enabled={includeTax} onChange={setIncludeTax} />
            </SettingsRow>
            <SettingsRow label="Auto-Apply Markup" description="Automatically apply material markup when adding line items">
              <Toggle enabled={autoMarkup} onChange={setAutoMarkup} />
            </SettingsRow>
          </div>
        </div>
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSaveEstimating} disabled={savingEstimating} className="btn-primary text-sm">
          {savingEstimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Estimating Config
        </button>
      </div>
    </div>
  );

  const renderDiscovery = () => (
    <div className="space-y-6">
      <Section icon={Search} title="Search Configuration">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SliderField label="Max Results Per Scan" value={maxResults} onChange={setMaxResults} min={10} max={200} step={10} unit=" leads" markers={['10','50','100','200']} />
            <SliderField label="Default Search Radius" value={searchRadius} onChange={setSearchRadius} min={5} max={100} step={5} unit=" mi" markers={['5','25','50','100']} />
          </div>
          <SliderField label="Minimum Score Threshold" value={minScore} onChange={setMinScore} min={1} max={10} step={1} unit={` / 10`} markers={['1','3','5','7','10']} />
          <div>
            <label className="label">Excluded Keywords</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Comma-separated terms to exclude from search results (e.g. competitor names)</p>
            <input type="text" value={excludedKeywords} onChange={e => setExcludedKeywords(e.target.value)} className="input text-sm" placeholder="competitor1, competitor2, residential only..." />
          </div>
        </div>
      </Section>

      <Section icon={Zap} title="Automation">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingsRow label="Auto-Score New Leads" description="Automatically run AI scoring when new permits or leads come in">
            <Toggle enabled={autoScore} onChange={setAutoScore} />
          </SettingsRow>
          <SettingsRow label="Auto-Archive Low-Score Leads" description="Move leads below the archive threshold to archive automatically">
            <Toggle enabled={autoArchive} onChange={setAutoArchive} />
          </SettingsRow>
          {autoArchive && (
            <div className="py-4">
              <SliderField label="Archive Threshold (score ≤)" value={archiveThreshold} onChange={setArchiveThreshold} min={1} max={5} step={1} unit={` / 10`} markers={['1','2','3','4','5']} />
            </div>
          )}
          <div className="py-4">
            <SliderField label="Follow-Up Reminder (days after contact)" value={followupDays} onChange={setFollowupDays} min={1} max={30} step={1} unit=" days" markers={['1','7','14','30']} />
          </div>
        </div>
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSaveDiscovery} disabled={savingDiscovery} className="btn-primary text-sm">
          {savingDiscovery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Discovery Config
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <Section icon={Bell} title="Notifications">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingsRow label="Enable Notifications" description="Master toggle — disabling this silences all alerts">
            <Toggle enabled={notifyEnabled} onChange={setNotifyEnabled} />
          </SettingsRow>
        </div>
      </Section>

      <Section icon={Mail} title="Email Notifications">
        <div className={`space-y-4 ${!notifyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <SettingsRow label="Email Alerts" description="Send notifications via email">
            <Toggle enabled={notifyEmailEnabled} onChange={setNotifyEmailEnabled} />
          </SettingsRow>
          {notifyEmailEnabled && (
            <div>
              <label className="label">Notification Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={notifyEmailAddr} onChange={e => setNotifyEmailAddr(e.target.value)} className="input pl-10 text-sm" placeholder="you@ctlplumbing.com" />
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Email me when...</p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <SettingsRow label="New lead discovered" description="Any permit or lead above min score"><Toggle enabled={notifyOnNewLead} onChange={setNotifyOnNewLead} /></SettingsRow>
              <SettingsRow label="High-score lead" description="Lead scores 8 or above"><Toggle enabled={notifyOnHighScore} onChange={setNotifyOnHighScore} /></SettingsRow>
              <SettingsRow label="New permit ingested" description="Fresh permits pulled from county"><Toggle enabled={notifyOnPermit} onChange={setNotifyOnPermit} /></SettingsRow>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={MessageSquare} title="SMS Notifications">
        <div className={`space-y-4 ${!notifyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <SettingsRow label="SMS Alerts" description="Send urgent alerts via SMS (requires Twilio)">
            <Toggle enabled={notifySmsEnabled} onChange={setNotifySmsEnabled} />
          </SettingsRow>
          {notifySmsEnabled && (
            <div>
              <label className="label">Admin Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={notifyAdminPhone} onChange={e => setNotifyAdminPhone(e.target.value)} className="input pl-10 text-sm" placeholder="+18175550100" />
              </div>
              <p className="text-xs text-gray-500 mt-1">SMS is for urgent/high-score leads only to limit costs</p>
            </div>
          )}
        </div>
      </Section>

      <Section icon={CalendarDays} title="Weekly Digest">
        <div className={`space-y-4 ${!notifyEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <SettingsRow label="Weekly Digest Email" description="Receive a weekly summary of leads, revenue, and activity">
            <Toggle enabled={notifyDigestEnabled} onChange={setNotifyDigestEnabled} />
          </SettingsRow>
          {notifyDigestEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Send On</label>
                <select value={notifyDigestDay} onChange={e => setNotifyDigestDay(e.target.value)} className="input">
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Send At</label>
                <input type="time" value={notifyDigestTime} onChange={e => setNotifyDigestTime(e.target.value)} className="input font-mono text-sm" />
              </div>
            </div>
          )}
        </div>
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSaveNotifications} disabled={savingNotifications} className="btn-primary text-sm">
          {savingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Notifications
        </button>
      </div>

      {/* Email Monitor Section */}
      <Section icon={Mail} title="Email Monitor (Outlook)"
        badge={emStatus?.enabled ? (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Active</span>
        ) : (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Off</span>
        )}
      >
        <div className="space-y-4">
          <SettingsRow label="Enable Email Monitor" description="Scans your Outlook inbox every 10 min for plumbing/permit keywords and sends SMS alerts via Twilio">
            <Toggle enabled={emEnabled} onChange={setEmEnabled} />
          </SettingsRow>

          {emEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={emUser} onChange={e => setEmUser(e.target.value)} className="input pl-10 text-sm" placeholder="you@outlook.com" />
                  </div>
                </div>
                <div>
                  <label className="label">Password / App Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={emPass} onChange={e => setEmPass(e.target.value)} className="input pl-10 text-sm" placeholder="Enter password (leave blank to keep current)" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">If MFA is on, use an app password from your Microsoft account security settings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">IMAP Server</label>
                  <input type="text" value={emHost} onChange={e => setEmHost(e.target.value)} className="input text-sm font-mono" placeholder="outlook.office365.com" />
                </div>
                <div>
                  <label className="label">IMAP Port</label>
                  <input type="number" value={emPort} onChange={e => setEmPort(e.target.value)} className="input text-sm font-mono" placeholder="993" />
                </div>
              </div>

              <div>
                <label className="label">Alert Keywords</label>
                <textarea value={emKeywords} onChange={e => setEmKeywords(e.target.value)} className="input text-sm font-mono" rows={3}
                  placeholder="permit, inspection, plumbing, rough-in, schedule change, urgent, failed, approved..." />
                <p className="text-xs text-gray-500 mt-1">Comma-separated. Emails matching any keyword in subject or body trigger an SMS alert.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={handleTestEmailMonitor} disabled={emTesting} className="btn-secondary text-sm whitespace-nowrap">
                  {emTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test Connection
                </button>
                <button onClick={handleCheckNow} disabled={emChecking} className="btn-secondary text-sm whitespace-nowrap">
                  {emChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Check Now
                </button>
                <button onClick={handleSaveEmailMonitor} disabled={emSaving} className="btn-primary text-sm whitespace-nowrap">
                  {emSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Email Monitor
                </button>
              </div>

              {/* Status */}
              {emStatus && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${emStatus.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {emStatus.enabled ? 'Monitoring active' : 'Monitor disabled'}
                    </span>
                  </div>
                  {emStatus.lastCheckTime && (
                    <p className="text-gray-500 dark:text-gray-400">Last check: {new Date(emStatus.lastCheckTime).toLocaleString()}</p>
                  )}
                  <p className="text-gray-500 dark:text-gray-400">Total alerts: {emStatus.totalAlerts || 0} | SMS sent: {emStatus.totalSmsSent || 0}</p>
                </div>
              )}

              {/* Recent Alerts */}
              {emAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Alerts</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {emAlerts.map((a, i) => (
                      <div key={a.id || i} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{a.fromName || a.fromAddress}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{a.processedAt ? new Date(a.processedAt).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 truncate">{a.subject}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(a.matchedKeywords || '').split(', ').filter(Boolean).map(kw => (
                            <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-mono">{kw}</span>
                          ))}
                        </div>
                        {a.smsSent ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-block">SMS sent</span>
                        ) : (
                          <span className="text-xs text-gray-500 mt-1 inline-block">No SMS</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {/* Email Watcher Section - Multi-Provider */}
      <Section icon={Mail} title="Email Watcher (Multi-Provider)"
        badge={
          settings.microsoft_client_id_configured || settings.google_client_id_configured ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Configured</span>
          ) : (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Not Configured</span>
          )
        }
      >
        <div className="space-y-5">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 inline mr-2" />
              The Email Watcher monitors Gmail and Outlook inboxes via OAuth2, sending keyword-based alerts via SMS and Telegram.
            </p>
          </div>

          {/* Google OAuth */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Google Gmail OAuth</p>
              {settings.google_client_id_configured && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Client ID</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">From <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Cloud Console <ExternalLink className="w-3 h-3 inline" /></a></p>
                <input 
                  type="text" 
                  value={googleClientId} 
                  onChange={e => setGoogleClientId(e.target.value)} 
                  className="input font-mono text-sm" 
                  placeholder={settings.google_client_id_masked || 'xxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com'} 
                />
              </div>
              <div>
                <label className="label">Client Secret</label>
                <div className="relative">
                  <input 
                    type={showGoogleClientSecret ? 'text' : 'password'} 
                    value={googleClientSecret} 
                    onChange={e => setGoogleClientSecret(e.target.value)} 
                    className="input pr-10 font-mono text-sm" 
                    placeholder={settings.google_client_secret_masked || 'Enter Client Secret'} 
                  />
                  <button type="button" onClick={() => setShowGoogleClientSecret(!showGoogleClientSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showGoogleClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={handleTestGoogle} disabled={testingGoogle} className="btn-secondary text-sm whitespace-nowrap">
                  {testingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                </button>
                <button onClick={handleSaveGoogle} disabled={!googleClientId.trim() && !googleClientSecret.trim()} className="btn-primary text-sm whitespace-nowrap">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>

          {/* Microsoft OAuth */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Microsoft Outlook OAuth</p>
              {settings.microsoft_client_id_configured && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Application (Client) ID</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Register an app at <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">portal.azure.com <ExternalLink className="w-3 h-3 inline" /></a></p>
                <input 
                  type="text" 
                  value={msClientId} 
                  onChange={e => setMsClientId(e.target.value)} 
                  className="input font-mono text-sm" 
                  placeholder={settings.microsoft_client_id_masked || 'Enter Client ID'} 
                />
              </div>
              <div>
                <label className="label">Client Secret</label>
                <div className="relative">
                  <input 
                    type={showMsClientSecret ? 'text' : 'password'} 
                    value={msClientSecret} 
                    onChange={e => setMsClientSecret(e.target.value)} 
                    className="input pr-10 font-mono text-sm" 
                    placeholder={settings.microsoft_client_secret_masked || 'Enter Client Secret'} 
                  />
                  <button type="button" onClick={() => setShowMsClientSecret(!showMsClientSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showMsClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={handleTestMicrosoft} disabled={testingMicrosoft} className="btn-secondary text-sm whitespace-nowrap">
                  {testingMicrosoft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                </button>
                <button onClick={handleSaveMicrosoft} disabled={!msClientId.trim() && !msClientSecret.trim()} className="btn-primary text-sm whitespace-nowrap">
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>

          {/* Watcher Configuration */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Watcher Configuration</p>
            <div className="space-y-4">
              <SliderField 
                label="Poll Interval" 
                value={ewPollInterval} 
                onChange={setEwPollInterval} 
                min={30} 
                max={300} 
                step={30} 
                unit=" sec" 
                markers={['30s','60s','120s','300s']} 
              />
              <SettingsRow label="Mark Emails as Read" description="Automatically mark matched emails as read">
                <Toggle enabled={ewMarkAsRead} onChange={setEwMarkAsRead} />
              </SettingsRow>
              <div className="flex justify-end">
                <button onClick={handleSaveEmailWatcher} className="btn-primary text-sm whitespace-nowrap">
                  <Save className="w-4 h-4" /> Save Config
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );

  const renderAPIKeys = () => (
    <Section icon={Key} title="API Keys"
      badge={
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'serper_api_key_configured', label: 'Serper' },
            { key: 'anthropic_api_key_configured', label: 'Anthropic' },
            { key: 'openai_api_key_configured', label: 'OpenAI' },
            { key: 'twilio_account_sid_configured', label: 'Twilio' },
            { key: 'sendgrid_api_key_configured', label: 'SendGrid' },
            { key: 'google_client_id_configured', label: 'Google' },
            { key: 'microsoft_client_id_configured', label: 'Microsoft' },
            { key: 'telegram_bot_token_configured', label: 'Telegram' },
          ].map(({ key, label }) => (
            <StatusPill key={key} connected={settings[key]} label={settings[key] ? label : `${label} N/A`} />
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        <KeyInput label="Serper.dev API Key" description="Lead discovery via Google Maps search. " href="https://serper.dev" hrefLabel="serper.dev"
          value={serperKey} onChange={setSerperKey} show={showSerperKey} onToggleShow={() => setShowSerperKey(!showSerperKey)}
          placeholder={settings.serper_api_key_masked || 'Enter Serper API key'}
          onTest={handleTestSerper} testing={testingSerper} onSave={handleSaveSerperKey} />

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput label="Google Places API Key" description="Zone-based discovery with Nearby Search. " href="https://console.cloud.google.com" hrefLabel="console.cloud.google.com"
            value={placesKey} onChange={setPlacesKey} show={showPlacesKey} onToggleShow={() => setShowPlacesKey(!showPlacesKey)}
            placeholder={settings.google_places_api_key_masked || 'Enter Google Places API key'}
            onSave={handleSavePlacesKey} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput label="Google Maps API Key" description="Geocoding, routing, and job site maps. " href="https://console.cloud.google.com/apis/credentials" hrefLabel="console.cloud.google.com"
            value={googleMapsKey} onChange={setGoogleMapsKey} show={showGoogleMapsKey} onToggleShow={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
            placeholder={settings.google_maps_api_key_masked || 'Enter Google Maps API key'}
            onTest={handleTestGoogleMaps} testing={testingGoogleMaps} onSave={handleSaveGoogleMapsKey} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Premium AI Providers</p>
          <div className="space-y-5">
            <KeyInput label="Anthropic API Key" description="Claude AI for premium analysis. " href="https://console.anthropic.com" hrefLabel="console.anthropic.com"
              value={anthropicKey} onChange={setAnthropicKey} show={showAnthropicKey} onToggleShow={() => setShowAnthropicKey(!showAnthropicKey)}
              placeholder={settings.anthropic_api_key_masked || 'sk-ant-...'}
              onTest={handleTestAnthropic} testing={testingAnthropic} onSave={handleSaveAnthropicKey} />
            <KeyInput label="OpenAI API Key" description="GPT models for alternative AI. " href="https://platform.openai.com" hrefLabel="platform.openai.com"
              value={openaiKey} onChange={setOpenaiKey} show={showOpenaiKey} onToggleShow={() => setShowOpenaiKey(!showOpenaiKey)}
              placeholder={settings.openai_api_key_masked || 'sk-...'}
              onTest={handleTestOpenai} testing={testingOpenai} onSave={handleSaveOpenaiKey} />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Communications</p>
          <div className="space-y-5">
            <div>
              <label className="label">Twilio (SMS)</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">SMS notifications. Get credentials at <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">console.twilio.com <ExternalLink className="w-3 h-3 inline" /></a></p>
              <div className="space-y-3">
                <input type="text" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} className="input font-mono text-sm" placeholder={settings.twilio_account_sid_masked || 'Account SID (AC...)'} />
                <div className="relative">
                  <input type={showTwilioToken ? 'text' : 'password'} value={twilioToken} onChange={e => setTwilioToken(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.twilio_auth_token_masked || 'Auth Token'} />
                  <button type="button" onClick={() => setShowTwilioToken(!showTwilioToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showTwilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input type="text" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} className="input font-mono text-sm" placeholder={settings.twilio_from_phone || 'From Number (+1...)'} />
                <div className="flex gap-2 justify-end">
                  <button onClick={handleTestTwilio} disabled={testingTwilio} className="btn-secondary text-sm whitespace-nowrap">
                    {testingTwilio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveTwilio} disabled={!twilioSid.trim() && !twilioToken.trim() && !twilioPhone.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </div>
            <KeyInput label="SendGrid API Key" description="Email outreach and notifications. " href="https://app.sendgrid.com" hrefLabel="app.sendgrid.com"
              value={sendgridKey} onChange={setSendgridKey} show={showSendgridKey} onToggleShow={() => setShowSendgridKey(!showSendgridKey)}
              placeholder={settings.sendgrid_api_key_masked || 'SG....'}
              onTest={handleTestSendgrid} testing={testingSendgrid} onSave={handleSaveSendgridKey} />
            
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Messaging</p>
              <div className="space-y-5">
                <div>
                  <label className="label">Telegram Bot Token</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@BotFather <ExternalLink className="w-3 h-3 inline" /></a></p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type={showTelegramToken ? 'text' : 'password'} 
                        value={telegramToken} 
                        onChange={e => setTelegramToken(e.target.value)} 
                        className="input pr-10 font-mono text-sm" 
                        placeholder={settings.telegram_bot_token_masked || 'Enter bot token'} 
                      />
                      <button type="button" onClick={() => setShowTelegramToken(!showTelegramToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button onClick={handleTestTelegram} disabled={testingTelegram} className="btn-secondary text-sm whitespace-nowrap">
                      {testingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                    </button>
                    <button onClick={handleSaveTelegram} disabled={!telegramToken.trim() && !telegramChatId.trim()} className="btn-primary text-sm whitespace-nowrap">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Telegram Chat ID</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your personal chat ID or group chat ID</p>
                  <input 
                    type="text" 
                    value={telegramChatId} 
                    onChange={e => setTelegramChatId(e.target.value)} 
                    className="input font-mono text-sm" 
                    placeholder={settings.telegram_chat_id || 'e.g. 123456789 or -1001234567890'} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Payments</p>
          <KeyInput label="Stripe API Key" description="Invoicing and payment processing. " href="https://dashboard.stripe.com/apikeys" hrefLabel="dashboard.stripe.com"
            value={stripeKey} onChange={setStripeKey} show={showStripeKey} onToggleShow={() => setShowStripeKey(!showStripeKey)}
            placeholder={settings.stripe_api_key_masked || 'sk_live_... or sk_test_...'}
            onTest={handleTestStripe} testing={testingStripe} onSave={handleSaveStripeKey} />
        </div>
      </div>
    </Section>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <Section icon={Layers} title="Caching">
        <div className="space-y-5">
          <SliderField label="Cache TTL" value={perfCacheTtl} onChange={setPerfCacheTtl} min={1} max={60} step={1} unit=" min" markers={['1min','15min','30min','60min']} />
          <SettingsRow label="Low Memory Mode" description="Reduces cache size and GC interval — recommended for devices under 4GB RAM">
            <Toggle enabled={perfLowMemory} onChange={setPerfLowMemory} />
          </SettingsRow>
        </div>
      </Section>

      <Section icon={Shield} title="Rate Limiting">
        <div className="space-y-5">
          <SliderField label="Max API Requests (per window)" value={perfRateLimit} onChange={setPerfRateLimit} min={20} max={500} step={10} unit=" req" markers={['20','100','250','500']} />
          <SliderField label="Request Timeout" value={perfTimeout} onChange={setPerfTimeout} min={5} max={120} step={5} unit="s" markers={['5s','30s','60s','120s']} />
        </div>
      </Section>

      <Section icon={CircuitBoard} title="Circuit Breaker">
        <div className="space-y-5">
          <SettingsRow label="Enable Circuit Breaker" description="Automatically halt requests to a failing AI provider to prevent cascading errors">
            <Toggle enabled={perfCbEnabled} onChange={setPerfCbEnabled} />
          </SettingsRow>
          {perfCbEnabled && (
            <SliderField label="Failure Threshold (consecutive failures to trip)" value={perfCbThreshold} onChange={setPerfCbThreshold} min={2} max={15} step={1} unit=" failures" markers={['2','5','10','15']} />
          )}
          <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
            cbState === 'closed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
            : cbState === 'open' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300'
            : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300'
          }`}>
            <CircuitBoard className="w-4 h-4 shrink-0" />
            <span>Circuit breaker is currently <strong>{cbState}</strong></span>
          </div>
        </div>
      </Section>

      <Section icon={Cog} title="Background Jobs">
        <SettingsRow label="Enable Background Jobs" description="Permit ingestion, scoring, and notification jobs. Disabling stops all background work.">
          <Toggle enabled={perfBgJobs} onChange={setPerfBgJobs} />
        </SettingsRow>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSavePerformance} disabled={savingPerformance} className="btn-primary text-sm">
          {savingPerformance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Performance Config
        </button>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      <Section icon={Moon} title="Theme">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', icon: Sun, label: 'Light', desc: 'Bright, high contrast' },
            { id: 'dark',  icon: Moon, label: 'Dark',  desc: 'Easy on the eyes' },
            { id: 'system', icon: Monitor, label: 'System', desc: 'Follow OS setting' },
          ].map(({ id, icon: Icon, label, desc }) => (
            <button key={id} onClick={() => handleApplyTheme(id)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                themePreference === id
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-copper-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {themePreference === id && <div className="absolute top-2 right-2"><CheckCircle className="w-5 h-5 text-blue-500" /></div>}
              <Icon className={`w-5 h-5 mb-2 ${themePreference === id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{label}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={LayoutDashboard} title="Layout">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingsRow label="Compact Sidebar" description="Reduce sidebar to icons only — hover to see labels">
            <Toggle enabled={compactSidebar} onChange={setCompactSidebar} />
          </SettingsRow>
          <SettingsRow label="Dense Mode" description="Tighter spacing throughout the UI — fits more content on screen">
            <Toggle enabled={denseMode} onChange={setDenseMode} />
          </SettingsRow>
          <SettingsRow label="Enable Animations" description="Transitions and micro-animations — disable for accessibility or performance">
            <Toggle enabled={animationsEnabled} onChange={setAnimationsEnabled} />
          </SettingsRow>
        </div>
      </Section>

      <Section icon={Hash} title="Formatting">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Date Format</label>
            <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="input">
              <option value="MM/DD/YYYY">MM/DD/YYYY (02/19/2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (19/02/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-02-19)</option>
              <option value="MMM D, YYYY">MMM D, YYYY (Feb 19, 2026)</option>
            </select>
          </div>
          <div>
            <label className="label">Number Format</label>
            <select value={numberFormat} onChange={e => setNumberFormat(e.target.value)} className="input">
              <option value="US">US — 1,234.56</option>
              <option value="EU">EU — 1.234,56</option>
              <option value="IN">IN — 1,23,456.00</option>
            </select>
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSaveAppearance} className="btn-primary text-sm">
          <Save className="w-4 h-4" /> Save Appearance
        </button>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="space-y-6">
      <Section icon={FileDown} title="Export & Backup">
        <div className="space-y-3">
          {[
            { label: 'Export Settings', desc: 'Download all current settings as a JSON file', action: handleExportSettings, loading: exportingData, icon: FileDown },
            { label: 'Create Database Backup', desc: 'Snapshot the SQLite database to the backups folder on the server', action: handleCreateBackup, loading: creatingBackup, icon: Database },
          ].map(({ label, desc, action, loading, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <button onClick={action} disabled={loading} className="btn-secondary text-sm whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                {label.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={RotateCcw} title="Maintenance">
        <div className="space-y-3">
          {[
            { label: 'Clear API Cache', desc: 'Flush in-memory cache — all data will reload from the database on next request', action: handleClearCache, loading: clearingCache, color: 'warning' },
            { label: 'Refresh Metrics', desc: 'Reset AI usage counters and circuit breaker state', action: () => { refetchMetrics(); refetchOllama(); showToast('Metrics refreshed'); }, loading: false, color: 'normal' },
          ].map(({ label, desc, action, loading, color }) => (
            <div key={label} className={`flex items-center justify-between p-4 rounded-xl border ${
              color === 'warning' ? 'bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-800/40'
              : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200/60 dark:border-gray-700/60'
            }`}>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <button onClick={action} disabled={loading} className="btn-secondary text-sm whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Run
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={AlertOctagon} title="Danger Zone">
        <div className="p-4 border-2 border-red-200 dark:border-red-900/60 rounded-xl bg-red-50/50 dark:bg-red-950/10">
          <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">Factory Reset</p>
          <p className="text-xs text-red-700 dark:text-red-300 mb-4">Permanently deletes all settings, leads, estimates, and AI history. This action cannot be undone.</p>
          {!resetConfirm ? (
            <button onClick={() => setResetConfirm(true)} className="btn-danger text-sm">
              <AlertOctagon className="w-4 h-4" /> Reset All Data
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">Are you absolutely sure?</p>
              <button onClick={() => { showToast('Factory reset requires manual database deletion for safety', 'warning'); setResetConfirm(false); }} className="btn-danger text-sm">Yes, Reset</button>
              <button onClick={() => setResetConfirm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          )}
        </div>
      </Section>
    </div>
  );

  const renderSystem = () => (
    <Section icon={Activity} title="System & Metrics"
      badge={
        <button onClick={() => { refetchMetrics(); refetchOllama(); showToast('Metrics refreshed'); }} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricBox label="Requests" value={metrics.totalRequests?.toLocaleString() || '0'} icon={Zap} />
        <MetricBox label="Success Rate" value={`${successRate}%`} sub={`${metrics.successCount || 0} / ${metrics.totalRequests || 0}`} icon={CheckCircle} />
        <MetricBox label="Avg Response" value={metrics.avgResponseMs ? `${metrics.avgResponseMs}ms` : '--'} icon={Thermometer} />
        <MetricBox label="Uptime" value={uptimeFormatted} icon={Clock} />
      </div>
      <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
        {[
          ['App Version', '2.0.0'],
          ['Backend API', 'http://localhost:5001'],
          ['Frontend Port', '3000'],
          ['Active AI Provider', activeProvider],
          ['Active Model', config.defaultModel || model || '—'],
          ['Circuit Breaker', cbState],
          ['Last Error', metrics.lastError || 'None'],
          ['Last Error At', metrics.lastErrorAt ? new Date(metrics.lastErrorAt).toLocaleString() : 'N/A'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            <span className={`text-sm font-mono font-medium text-gray-900 dark:text-gray-100 ${label === 'Circuit Breaker' && value !== 'closed' ? 'text-amber-600 dark:text-amber-400' : ''}`}>{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Metrics auto-refresh every 15s</p>
    </Section>
  );

  /* ─────────────────────────────────────────────
     JOB PULSE — Email Integration for Job Site Monitoring
  ───────────────────────────────────────────── */
  const renderJobPulse = () => (
    <div className="space-y-6">
      <Section icon={Activity} title="Job Pulse Email Login"
        badge={emStatus?.enabled ? (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Connected</span>
        ) : (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Not Connected</span>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your email to Job Pulse for automatic job site monitoring. 
            Job Pulse scans your inbox for permit updates, inspection notices, schedule changes, 
            and other job-related communications, then sends SMS alerts for urgent items.
          </p>

          <SettingsRow label="Enable Job Pulse Email Monitoring" description="Automatically scan emails for job site updates">
            <Toggle enabled={emEnabled} onChange={setEmEnabled} />
          </SettingsRow>

          {emEnabled && (
            <>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40 mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Use an <strong>App Password</strong> if your email has 2FA/MFA enabled. 
                    For Outlook, generate one at account.microsoft.com/security.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={emUser} 
                      onChange={e => setEmUser(e.target.value)} 
                      className="input pl-10 text-sm" 
                      placeholder="you@company.com" 
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Password / App Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password" 
                      value={emPass} 
                      onChange={e => setEmPass(e.target.value)} 
                      className="input pl-10 text-sm" 
                      placeholder="Enter password (leave blank to keep current)" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Server (IMAP)</label>
                  <select 
                    value={emHost} 
                    onChange={e => {
                      const host = e.target.value;
                      setEmHost(host);
                      // Auto-set port based on host
                      if (host === 'outlook.office365.com') setEmPort('993');
                      else if (host === 'imap.gmail.com') setEmPort('993');
                      else if (host === 'imap.mail.yahoo.com') setEmPort('993');
                      else if (host === 'imap.office365.com') setEmPort('993');
                    }} 
                    className="input text-sm"
                  >
                    <option value="outlook.office365.com">Microsoft 365 / Outlook</option>
                    <option value="imap.gmail.com">Gmail (Google)</option>
                    <option value="imap.mail.yahoo.com">Yahoo Mail</option>
                    <option value="">Custom Server...</option>
                  </select>
                </div>
                <div>
                  <label className="label">IMAP Port</label>
                  <input 
                    type="number" 
                    value={emPort} 
                    onChange={e => setEmPort(e.target.value)} 
                    className="input text-sm font-mono" 
                    placeholder="993" 
                  />
                </div>
              </div>

              {!emHost && (
                <div>
                  <label className="label">Custom IMAP Server</label>
                  <input 
                    type="text" 
                    value={emHost} 
                    onChange={e => setEmHost(e.target.value)} 
                    className="input text-sm font-mono" 
                    placeholder="mail.yourcompany.com" 
                  />
                </div>
              )}

              <div>
                <label className="label">Alert Keywords</label>
                <textarea 
                  value={emKeywords} 
                  onChange={e => setEmKeywords(e.target.value)} 
                  className="input text-sm font-mono" 
                  rows={3}
                  placeholder="permit, inspection, plumbing, rough-in, schedule change, urgent, failed, approved..." 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated keywords. Job Pulse sends SMS alerts when emails match these terms.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={handleTestEmailMonitor} disabled={emTesting} className="btn-secondary text-sm whitespace-nowrap">
                  {emTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test Connection
                </button>
                <button onClick={handleCheckNow} disabled={emChecking} className="btn-secondary text-sm whitespace-nowrap">
                  {emChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Check Now
                </button>
                <button onClick={handleSaveEmailMonitor} disabled={emSaving} className="btn-primary text-sm whitespace-nowrap">
                  {emSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Job Pulse Email
                </button>
              </div>

              {/* Connection Status */}
              {emStatus && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${emStatus.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {emStatus.enabled ? 'Job Pulse Monitoring Active' : 'Job Pulse Monitoring Disabled'}
                    </span>
                  </div>
                  {emStatus.lastCheckTime && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last check: {new Date(emStatus.lastCheckTime).toLocaleString()}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 text-xs">Total Alerts</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{emStatus.totalAlerts || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 text-xs">SMS Sent</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{emStatus.totalSmsSent || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 text-xs">Keywords</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{emStatus.keywords?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Alerts */}
              {emAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Job Alerts</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {emAlerts.slice(0, 5).map((a, i) => (
                      <div key={a.id || i} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{a.fromName || a.fromAddress}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{a.processedAt ? new Date(a.processedAt).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 truncate">{a.subject}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(a.matchedKeywords || '').split(', ').filter(Boolean).map(kw => (
                            <span key={kw} className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-mono">{kw}</span>
                          ))}
                        </div>
                        {a.smsSent ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 inline-block">✓ SMS sent</span>
                        ) : (
                          <span className="text-xs text-gray-500 mt-1 inline-block">No SMS</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      <Section icon={Bell} title="SMS Alert Settings">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure SMS notifications for Job Pulse alerts. Requires Twilio credentials in API Keys section.
          </p>
          <SettingsRow label="Send SMS for Job Alerts" description="Get text messages when important job emails arrive">
            <Toggle enabled={notifySmsEnabled} onChange={setNotifySmsEnabled} />
          </SettingsRow>
          <div>
            <label className="label">Admin Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="tel" 
                value={notifyAdminPhone} 
                onChange={e => setNotifyAdminPhone(e.target.value)} 
                className="input pl-10 text-sm" 
                placeholder="+1 (817) 555-0100" 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Phone number to receive SMS alerts from Job Pulse</p>
          </div>
        </div>
      </Section>
    </div>
  );

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  const TAB_CONTENT = {
    ai: renderAI,
    business: renderBusiness,
    estimating: renderEstimating,
    discovery: renderDiscovery,
    jobpulse: renderJobPulse,
    notifications: renderNotifications,
    apikeys: renderAPIKeys,
    performance: renderPerformance,
    appearance: renderAppearance,
    data: renderData,
    system: renderSystem,
  };

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
            {(TAB_CONTENT[activeTab] || renderAI)()}
          </div>
        </div>
      </div>

    </div>
  );
}
