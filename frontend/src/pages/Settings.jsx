import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ensureArray } from '../utils/safeArray';
import { useOllama } from '../hooks/useOllama';
import { useModelPreference } from '../hooks/useModelPreference';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { useEstimatingSettings } from '../hooks/useEstimatingSettings';
import { useDiscoverySettings } from '../hooks/useDiscoverySettings';
import { useAPIKeySettings } from '../hooks/useAPIKeySettings';
import { useSettingsAI } from '../hooks/useSettingsAI';
import { useSettingsNotifications } from '../hooks/useSettingsNotifications';
import { useSettingsAppearance } from '../hooks/useSettingsAppearance';
import { useSettingsPerformance } from '../hooks/useSettingsPerformance';
import { useSettingsData } from '../hooks/useSettingsData';
import { ChevronRight } from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import StatusPill from '../components/settings/StatusPill';
import TabErrorBoundary from '../components/settings/TabErrorBoundary';
import TabFallback from '../components/settings/TabFallback';
import { lazyWithError } from '../components/settings/lazyWithError';
import { NAV_ITEMS, getTabOrder } from '../components/settings/navigation';

/* ─────────────────────────────────────────────
   LAZY TAB COMPONENTS
───────────────────────────────────────────── */
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
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Settings() {
  const queryClient = useQueryClient();
  const { connected, model, available, refetch: refetchOllama } = useOllama();
  const { defaultModel, setDefaultModel } = useModelPreference();
  useTheme(); // Initialize theme context
  const { success: showToastSuccess, error: showToastError, warning: showToastWarning } = useToast();
  
  const showToast = useCallback((message, type = 'success') => {
    if (type === 'success') showToastSuccess(message);
    else if (type === 'error') showToastError(message);
    else showToastWarning(message);
  }, [showToastSuccess, showToastError, showToastWarning]);

  // Settings query
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => api.settings.get(),
  });

  // Domain hooks
  const hookDeps = { settingsData, refetchSettings, showToast };
  const businessProps = useBusinessSettings(hookDeps);
  const estimatingProps = useEstimatingSettings(hookDeps);
  const discoveryProps = useDiscoverySettings(hookDeps);
  const apiKeyProps = useAPIKeySettings(hookDeps);

  // Settings state hooks
  const ai = useSettingsAI();
  const notifications = useSettingsNotifications();
  const appearance = useSettingsAppearance();
  const performance = useSettingsPerformance();
  const data = useSettingsData();

  // Tab navigation
  const [activeTab, setActiveTab] = useState('overview');
  const [tabDirection, setTabDirection] = useState(null);
  const prevTab = useRef('overview');
  const tabOrder = useRef(getTabOrder()).current;

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const direction = tabOrder[newTab] > tabOrder[prevTab.current] ? 'left' : 'right';
    setTabDirection(direction);
    prevTab.current = newTab;
    setActiveTab(newTab);
  };

  useEffect(() => {
    const timer = setTimeout(() => setTabDirection(null), 350);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Queries
  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['ollama-models', ai.activeProvider],
    queryFn: () => api.ai.getModels(),
    enabled: connected || ['groq', 'openclaw', 'anthropic', 'openai'].includes(ai.activeProvider),
    retry: false
  });

  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['ollama-metrics'],
    queryFn: () => api.settings.getMetrics(),
    refetchInterval: 15000,
  });

  // Health data query - fetched for cache freshness even if not directly used
  useQuery({
    queryKey: ['health-data'],
    queryFn: () => api.health(),
    refetchInterval: 30000,
  });

  // Derived data
  const availableModels = ensureArray(modelsData?.models);
  const settings = settingsData && typeof settingsData === 'object' ? settingsData : {};
  const metrics = metricsData?.metrics && typeof metricsData.metrics === 'object' ? metricsData.metrics : {};
  const config = metricsData?.config && typeof metricsData.config === 'object' ? metricsData.config : {};

  // Sync settings to state
  useEffect(() => {
    if (!settingsData) return;
    ai.syncFromSettings(settingsData);
    notifications.syncFromSettings(settingsData);
    performance.syncFromSettings(settingsData);

    // Email Monitor
    api.emailMonitor.getSettings().then(emData => {
      if (emData) {
        notifications.setEmEnabled(emData.enabled || false);
        notifications.setEmHost(emData.host || 'outlook.office365.com');
        notifications.setEmPort(String(emData.port || 993));
        notifications.setEmUser(emData.user || '');
        notifications.setEmKeywords(emData.keywords || '');
      }
    }).catch(() => {});
    api.emailMonitor.getStatus().then(st => notifications.setEmStatus(st)).catch(() => {});
    api.emailMonitor.getAlerts({ limit: 10 }).then(d => {
      notifications.setEmAlerts(ensureArray(d?.alerts));
    }).catch(() => notifications.setEmAlerts([]));
  }, [settingsData, ai, notifications, performance]);

  // AI Handlers
  const handleSwitchProvider = async (provider) => {
    ai.setSwitchingProvider(true);
    try {
      await api.settings.update({ ai_provider: provider });
      ai.setActiveProvider(provider);
      refetchSettings();
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      refetchOllama();
      const labels = { openclaw: 'OpenClaw Gateway', groq: 'Groq Cloud', anthropic: 'Anthropic Claude', openai: 'OpenAI', ollama: 'Ollama Local' };
      showToast(`Switched to ${labels[provider] || provider}`);
    } catch (err) {
      showToast(`Failed to switch: ${err.message}`, 'error');
    } finally {
      ai.setSwitchingProvider(false);
    }
  };

  const handleSaveAIConfig = async () => {
    ai.setSavingAI(true);
    try {
      const base = ai.activeProvider === 'openclaw'
        ? { openclaw_url: ai.openclawUrl, openclaw_temperature: String(ai.openclawTemperature) }
        : ai.activeProvider === 'groq'
        ? { groq_temperature: String(ai.groqTemperature) }
        : ai.activeProvider === 'openai'
        ? { openai_temperature: String(ai.openaiTemperature) }
        : ai.activeProvider === 'anthropic'
        ? { anthropic_temperature: String(ai.anthropicTemperature) }
        : { ollama_url: ai.ollamaUrl, ollama_temperature: String(ai.temperature) };
      
      await api.settings.update({
        ...base,
        ai_max_tokens: String(ai.maxTokens),
        ai_top_p: String(ai.topP),
        ai_streaming: String(ai.streamingEnabled),
        ai_system_prompt: ai.systemPrompt,
      });
      refetchSettings();
      refetchOllama();
      showToast('AI configuration saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      ai.setSavingAI(false);
    }
  };

  const createTestHandler = (apiCall, setLoading) => async () => {
    setLoading(true);
    try {
      const result = await apiCall();
      if (result.connected || result.valid) {
        showToast(result.modelCount 
          ? `Connected (${result.modelCount} models available)` 
          : 'Connection successful');
      } else {
        showToast(result.error || 'Connection failed', 'error');
      }
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOllama = createTestHandler(
    () => api.settings.testOllama(ai.ollamaUrl),
    ai.setTestingOllama
  );
  const handleTestGroq = createTestHandler(
    () => api.settings.testGroq(ai.groqKey || undefined),
    ai.setTestingGroq
  );
  const handleTestOpenai = createTestHandler(
    () => api.settings.testOpenai(ai.openaiKey || undefined),
    ai.setTestingOpenai
  );
  const handleTestAnthropic = createTestHandler(
    () => api.settings.testAnthropic(ai.anthropicKey || undefined),
    ai.setTestingAnthropic
  );
  const handleTestOpenClaw = createTestHandler(
    () => api.settings.testOpenClaw(ai.openclawUrl, ai.openclawToken || undefined),
    ai.setTestingOpenClaw
  );

  const createSaveKeyHandler = (keyName, value, setValue) => async () => {
    try {
      await api.settings.update({ [keyName]: value });
      setValue('');
      refetchSettings();
      showToast(`${keyName.split('_')[0].toUpperCase()} API key saved`);
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleSaveGroqKey = createSaveKeyHandler('groq_api_key', ai.groqKey, ai.setGroqKey);
  const handleSaveOpenaiKey = createSaveKeyHandler('openai_api_key', ai.openaiKey, ai.setOpenaiKey);
  const handleSaveAnthropicKey = createSaveKeyHandler('anthropic_api_key', ai.anthropicKey, ai.setAnthropicKey);
  const handleSaveOpenclawToken = createSaveKeyHandler('openclaw_token', ai.openclawToken, ai.setOpenclawToken);

  const handleSetDefaultModel = async (modelName) => {
    try {
      setDefaultModel(modelName);
      const modelKey = ai.activeProvider === 'groq' ? 'groq_model'
        : ai.activeProvider === 'anthropic' ? 'anthropic_model'
        : ai.activeProvider === 'openai' ? 'openai_model'
        : ai.activeProvider === 'openclaw' ? 'openclaw_model'
        : 'ollama_model';
      await api.settings.update({ [modelKey]: modelName });
      refetchSettings();
      showToast(`Default model set to ${modelName}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handlePullModel = async () => {
    if (!ai.pullModelName.trim()) return;
    ai.setPullingModel(true);
    try {
      const response = await fetch('/api/ai/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ai.pullModelName.trim() }),
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
      ai.setPullModelName('');
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model pulled successfully: ${lastStatus}`);
    } catch (err) {
      showToast(`Failed to pull model: ${err.message}`, 'error');
    } finally {
      ai.setPullingModel(false);
    }
  };

  const handleDeleteModel = async (modelName) => {
    ai.setDeletingModel(modelName);
    try {
      await api.ai.deleteModel(modelName);
      ai.setDeleteConfirm(null);
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model ${modelName} deleted`);
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`, 'error');
    } finally {
      ai.setDeletingModel(null);
    }
  };

  // Notification Handlers
  const handleSaveNotifications = async () => {
    notifications.setSavingNotifications(true);
    try {
      await api.settings.update({
        notify_enabled: String(notifications.notifyEnabled),
        notify_email_enabled: String(notifications.notifyEmailEnabled),
        notify_email_address: notifications.notifyEmailAddr,
        notify_sms_enabled: String(notifications.notifySmsEnabled),
        notify_admin_phone: notifications.notifyAdminPhone,
        notify_on_new_lead: String(notifications.notifyOnNewLead),
        notify_on_high_score: String(notifications.notifyOnHighScore),
        notify_on_permit: String(notifications.notifyOnPermit),
        notify_digest_enabled: String(notifications.notifyDigestEnabled),
        notify_digest_day: notifications.notifyDigestDay,
        notify_digest_time: notifications.notifyDigestTime,
      });
      refetchSettings();
      showToast('Notification settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      notifications.setSavingNotifications(false);
    }
  };

  const handleSaveEmailMonitor = async () => {
    notifications.setEmSaving(true);
    try {
      await api.emailMonitor.saveSettings({
        enabled: notifications.emEnabled,
        host: notifications.emHost,
        port: parseInt(notifications.emPort),
        user: notifications.emUser,
        ...(notifications.emPass ? { pass: notifications.emPass } : {}),
        keywords: notifications.emKeywords,
      });
      notifications.setEmPass('');
      showToast('Email monitor settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      notifications.setEmSaving(false);
    }
  };

  const handleTestEmailMonitor = async () => {
    if (!notifications.emUser) { 
      showToast('Enter email address first', 'error'); 
      return; 
    }
    notifications.setEmTesting(true);
    try {
      const result = await api.emailMonitor.testConnection({
        host: notifications.emHost,
        port: parseInt(notifications.emPort),
        user: notifications.emUser,
        pass: notifications.emPass || undefined,
      });
      showToast(`Connected! ${result.messages} messages in inbox, ${result.unseen} unseen`);
    } catch (err) {
      showToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      notifications.setEmTesting(false);
    }
  };

  const handleCheckNow = async () => {
    notifications.setEmChecking(true);
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
      notifications.setEmAlerts(ensureArray(alerts?.alerts));
      const st = await api.emailMonitor.getStatus();
      notifications.setEmStatus(st);
    } catch (err) {
      showToast(`Check failed: ${err.message}`, 'error');
    } finally {
      notifications.setEmChecking(false);
    }
  };

  // OAuth Handlers
  const handleSaveMicrosoft = async () => {
    try {
      const u = {};
      if (notifications.msClientId) u.microsoft_client_id = notifications.msClientId;
      if (notifications.msClientSecret) u.microsoft_client_secret = notifications.msClientSecret;
      await api.settings.update(u);
      notifications.setMsClientId('');
      notifications.setMsClientSecret('');
      refetchSettings();
      showToast('Microsoft OAuth credentials saved');
    } catch (err) { 
      showToast(`Failed: ${err.message}`, 'error'); 
    }
  };

  const handleTestMicrosoft = async () => {
    notifications.setTestingMicrosoft(true);
    try { 
      const r = await api.settings.testMicrosoft(notifications.msClientId || undefined, notifications.msClientSecret || undefined); 
      if (r.valid) showToast('Microsoft OAuth credentials valid'); 
      else showToast(r.error || 'Invalid credentials', 'error'); 
    } catch (err) { 
      showToast(`Test failed: ${err.message}`, 'error'); 
    } finally { 
      notifications.setTestingMicrosoft(false); 
    }
  };

  const handleSaveGoogle = async () => {
    try {
      const u = {};
      if (notifications.googleClientId) u.google_client_id = notifications.googleClientId;
      if (notifications.googleClientSecret) u.google_client_secret = notifications.googleClientSecret;
      await api.settings.update(u);
      notifications.setGoogleClientId('');
      notifications.setGoogleClientSecret('');
      refetchSettings();
      showToast('Google OAuth credentials saved');
    } catch (err) { 
      showToast(`Failed: ${err.message}`, 'error'); 
    }
  };

  const handleTestGoogle = async () => {
    notifications.setTestingGoogle(true);
    try { 
      const r = await api.settings.testGoogle(notifications.googleClientId || undefined, notifications.googleClientSecret || undefined); 
      if (r.valid) showToast(r.message || 'Google OAuth credentials valid'); 
      else showToast(r.error || 'Invalid credentials', 'error'); 
    } catch (err) { 
      showToast(`Test failed: ${err.message}`, 'error'); 
    } finally { 
      notifications.setTestingGoogle(false); 
    }
  };

  const handleConnectMicrosoft = async () => {
    notifications.setConnectingMicrosoft(true);
    try {
      const r = await api.emailAlerts.addAccount('outlook', 'Outlook Account');
      const { authUrl } = r || {};
      if (authUrl) window.location.href = authUrl;
      else showToast('Failed to get Microsoft auth URL', 'error');
    } catch (err) { 
      showToast(`Failed to start OAuth: ${err.message}`, 'error'); 
    } finally { 
      notifications.setConnectingMicrosoft(false); 
    }
  };

  const handleConnectGoogle = async () => {
    notifications.setConnectingGoogle(true);
    try {
      const r = await api.emailAlerts.addAccount('gmail', 'Gmail Account');
      const { authUrl } = r || {};
      if (authUrl) window.location.href = authUrl;
      else showToast('Failed to get Google auth URL', 'error');
    } catch (err) { 
      showToast(`Failed to start OAuth: ${err.message}`, 'error'); 
    } finally { 
      notifications.setConnectingGoogle(false); 
    }
  };

  const handleSaveEmailWatcher = async () => {
    try {
      await api.settings.update({
        email_watcher_poll_interval: String(notifications.ewPollInterval),
        email_watcher_mark_read: String(notifications.ewMarkAsRead),
      });
      refetchSettings();
      showToast('Email watcher settings saved');
    } catch (err) { 
      showToast(`Failed: ${err.message}`, 'error'); 
    }
  };

  // Performance Handlers
  const handleSavePerformance = async () => {
    performance.setSavingPerformance(true);
    try {
      await api.settings.update({
        perf_cache_ttl: String(performance.perfCacheTtl),
        perf_rate_limit_max: String(performance.perfRateLimit),
        perf_request_timeout: String(performance.perfTimeout),
        perf_cb_enabled: String(performance.perfCbEnabled),
        perf_cb_threshold: String(performance.perfCbThreshold),
        perf_low_memory: String(performance.perfLowMemory),
        perf_bg_jobs: String(performance.perfBgJobs),
      });
      refetchSettings();
      showToast('Performance settings saved — some changes require a server restart');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      performance.setSavingPerformance(false);
    }
  };

  // Render active tab
  const renderActiveTab = () => {
    const tabProps = {
      overview: { settings, metrics, config, activeProvider: ai.activeProvider, connected, availableModels, onTabChange: handleTabChange, onRefreshMetrics: refetchMetrics, settingsData },
      ai: { ...ai, model, available, defaultModel, settings, config, handleSwitchProvider, handleSaveAIConfig, handleTestOllama, handleTestGroq, handleSaveGroqKey, handleTestOpenai, handleSaveOpenaiKey, handleTestAnthropic, handleSaveAnthropicKey, handleTestOpenClaw, handleSaveOpenclawToken, handleSetDefaultModel, handlePullModel, handleDeleteModel },
      business: businessProps,
      estimating: estimatingProps,
      discovery: discoveryProps,
      jobpulse: { ...notifications, handleTestEmailMonitor, handleCheckNow, handleSaveEmailMonitor },
      notifications: { ...notifications, handleSaveNotifications, handleSaveEmailMonitor, handleTestEmailMonitor, handleCheckNow, handleSaveMicrosoft, handleTestMicrosoft, handleSaveGoogle, handleTestGoogle, handleConnectMicrosoft, handleConnectGoogle, handleSaveEmailWatcher },
      quickbooks: { settings, showToast, refetchSettings },
      apikeys: { settings, providers: apiKeyProps, openai: { key: ai.openaiKey, setKey: ai.setOpenaiKey, show: ai.showOpenaiKey, setShow: ai.setShowOpenaiKey, testing: ai.testingOpenai, test: handleTestOpenai, save: handleSaveOpenaiKey }},
      performance: { ...performance, cbState: metrics.circuitBreaker || 'closed', handleSavePerformance },
      appearance: { ...appearance, handleApplyTheme: appearance.handleApplyTheme, handleSaveAppearance: () => appearance.handleSaveAppearance(showToast) },
      data: { ...data, handleExportSettings: () => data.handleExportSettings(showToast), handleCreateBackup: () => data.handleCreateBackup(showToast), handleClearCache: () => data.handleClearCache(showToast), refetchMetrics, refetchOllama, showToast },
      system: { metrics, config, activeProvider: ai.activeProvider, defaultModel, successRate: metrics.totalRequests > 0 ? ((metrics.successCount / metrics.totalRequests) * 100).toFixed(1) : '0.0', uptimeFormatted: metrics.uptimeMs ? `${Math.floor(metrics.uptimeMs / 3600000)}h ${Math.floor((metrics.uptimeMs % 3600000) / 60000)}m` : '--', cbState: metrics.circuitBreaker || 'closed', refetchMetrics, refetchOllama, showToast },
      users: {},
    };

    const Components = {
      overview: SettingsOverview,
      ai: SettingsAI,
      business: SettingsBusiness,
      estimating: SettingsEstimating,
      discovery: SettingsDiscovery,
      jobpulse: SettingsJobPulse,
      notifications: SettingsNotifications,
      quickbooks: SettingsQuickBooks,
      apikeys: SettingsAPIKeys,
      performance: SettingsPerformance,
      appearance: SettingsAppearance,
      data: SettingsData,
      system: SettingsSystem,
      users: UserManagement,
    };

    const Component = Components[activeTab] || SettingsOverview;
    return <Component {...(tabProps[activeTab] || {})} />;
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
        {/* Desktop sidebar nav */}
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

        {/* Content */}
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

          {/* Subtle attribution */}
          <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-gray-800">
            <span className="text-[10px] text-gray-400/40 dark:text-gray-500/40 tracking-wide">
              Created by Cory Nichols
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
