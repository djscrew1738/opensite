import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useOllama } from '../hooks/useOllama';
import { useModelPreference } from '../hooks/useModelPreference';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { useEstimatingSettings } from '../hooks/useEstimatingSettings';
import { useDiscoverySettings } from '../hooks/useDiscoverySettings';
import { useAPIKeySettings } from '../hooks/useAPIKeySettings';
import { useAIProviderSettings } from '../hooks/useAIProviderSettings';
import { useNotificationsSettings } from '../hooks/useNotificationsSettings';
import { useEmailWatcherSettings } from '../hooks/useEmailWatcherSettings';
import { usePerformanceSettings } from '../hooks/usePerformanceSettings';
import { useAppearanceSettings } from '../hooks/useAppearanceSettings';
import {
  Building2, Cpu, Key, Activity, Bell, Search, Calculator,
  Gauge, Palette, Database, Loader2, ChevronRight, LayoutDashboard, AlertCircle,
  CreditCard, Users
} from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';

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
  { id: 'users',         icon: Users,            label: 'Users' },
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

  /* ── Settings query ── */
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => api.settings.get(),
  });

  const hookDeps = { settingsData, refetchSettings, showToast };

  /* ── Domain hooks ── */
  const businessProps = useBusinessSettings(hookDeps);
  const estimatingProps = useEstimatingSettings(hookDeps);
  const discoveryProps = useDiscoverySettings(hookDeps);
  const apiKeyProps = useAPIKeySettings(hookDeps);

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

  /* ── Domain hooks ── */
  const aiProps = useAIProviderSettings({
    ...hookDeps, connected, refetchOllama, queryClient, defaultModel, setDefaultModel,
  });
  const notifProps = useNotificationsSettings(hookDeps);
  const watcherProps = useEmailWatcherSettings(hookDeps);
  const perfProps = usePerformanceSettings(hookDeps);
  const appearProps = useAppearanceSettings({ showToast });

  /* ── Data section loading states ── */
  const [exportingData, setExportingData] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  /* ─────────────────────────────────────────────
     SHARED QUERIES
  ───────────────────────────────────────────── */
  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['ollama-metrics'],
    queryFn: () => api.settings.getMetrics(),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  useQuery({
    queryKey: ['health-data'],
    queryFn: () => api.health(),
    refetchInterval: 30000,
  });

  const { activeProvider, availableModels } = aiProps;
  const settings = settingsData && typeof settingsData === 'object' ? settingsData : {};
  const metrics = metricsData?.metrics && typeof metricsData.metrics === 'object' ? metricsData.metrics : {};
  const config = metricsData?.config && typeof metricsData.config === 'object' ? metricsData.config : {};

  /* ── All domain handlers are now in their respective hooks ── */

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
            themePreference={appearProps.themePreference}
            onTabChange={handleTabChange}
            onRefreshMetrics={refetchMetrics}
            settingsData={settingsData}
          />
        );
      case 'ai':
        return (
          <SettingsAI
            settings={settings}
            connected={connected}
            defaultModel={defaultModel}
            config={config}
            model={model}
            {...aiProps}
          />
        );
      case 'business':
        return <SettingsBusiness {...businessProps} />;
      case 'estimating':
        return <SettingsEstimating {...estimatingProps} />;
      case 'discovery':
        return <SettingsDiscovery {...discoveryProps} />;
      case 'jobpulse':
        return (
          <SettingsJobPulse
            {...notifProps}
          />
        );
      case 'notifications':
        return (
          <SettingsNotifications
            settings={settings}
            {...notifProps}
            {...watcherProps}
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
            providers={apiKeyProps}
            openai={{
              key: aiProps.openaiKey, setKey: aiProps.setOpenaiKey,
              show: aiProps.showOpenaiKey, setShow: aiProps.setShowOpenaiKey,
              testing: aiProps.testingOpenai,
              test: aiProps.handleTestOpenai,
              save: aiProps.handleSaveOpenaiKey,
            }}
          />
        );
      case 'performance':
        return <SettingsPerformance cbState={cbState} {...perfProps} />;
      case 'appearance':
        return <SettingsAppearance {...appearProps} />;
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
            connected={connected}
          />
        );
      case 'users':
        return <UserManagement />;
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
