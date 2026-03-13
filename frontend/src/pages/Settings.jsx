import { Suspense } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { SettingsProvider, useSettings } from '../components/settings/SettingsContext';
import TabErrorBoundary from '../components/settings/TabErrorBoundary';
import TabFallback from '../components/settings/TabFallback';
import { lazyWithError } from '../components/settings/lazyWithError';
import { getSettingsPriorityStatus } from '../components/settings/SettingsHome';

/* ─────────────────────────────────────────────
   LAZY TAB COMPONENTS
───────────────────────────────────────────── */
const SettingsOverview = lazyWithError(() => import('../components/settings/sections/OverviewSection'), 'SettingsOverview');
const SettingsAI = lazyWithError(() => import('../components/settings/sections/AISection'), 'SettingsAI');
const SettingsBusiness = lazyWithError(() => import('../components/settings/sections/BusinessSection'), 'SettingsBusiness');
const SettingsEstimating = lazyWithError(() => import('../components/settings/sections/EstimatingSection'), 'SettingsEstimating');
const SettingsDiscovery = lazyWithError(() => import('../components/settings/sections/DiscoverySection'), 'SettingsDiscovery');
const SettingsJobPulse = lazyWithError(() => import('../components/settings/sections/JobPulseSection'), 'SettingsJobPulse');
const SettingsNotifications = lazyWithError(() => import('../components/settings/sections/NotificationsSection'), 'SettingsNotifications');
const SettingsAPIKeys = lazyWithError(() => import('../components/settings/sections/APIKeysSection'), 'SettingsAPIKeys');
const SettingsPerformance = lazyWithError(() => import('../components/settings/sections/PerformanceSection'), 'SettingsPerformance');
const SettingsAppearance = lazyWithError(() => import('../components/settings/sections/AppearanceSection'), 'SettingsAppearance');
const SettingsData = lazyWithError(() => import('../components/settings/sections/DataSection'), 'SettingsData');
const SettingsSystem = lazyWithError(() => import('../components/settings/sections/SystemSection'), 'SettingsSystem');
const SettingsQuickBooks = lazyWithError(() => import('../components/settings/sections/QuickBooksSection'), 'SettingsQuickBooks');
const UserManagement = lazyWithError(() => import('../components/admin/UserManagement'), 'UserManagement');

/* ─────────────────────────────────────────────
   INNER COMPONENT (Uses Context)
───────────────────────────────────────────── */
function SettingsContent() {
  const { 
    activeTab, 
    handleTabChange, 
    tabDirection, 
    NAV_ITEMS, 
    settings,
    activeProvider,
    isLoadingSettings
  } = useSettings();
  const priorityStatus = getSettingsPriorityStatus({ settings, activeProvider });
  const priorityTone = priorityStatus.status === 'warning'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
    : priorityStatus.status === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      : 'border-blue-500/30 bg-blue-500/10 text-blue-100';

  // Render active tab
  const renderActiveTab = () => {
    // In the refactored architecture, sub-components consume context themselves
    // via useSettings() and useSettingsActions()
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
    return <Component />;
  };

  return (
    <div className="p-4 md:p-8 page-transition-wrapper max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <p className="text-sm font-medium text-blue-200/60 leading-relaxed max-w-2xl">
          Review setup health and resolve the highest-priority configuration issues below.
        </p>
        <div
          data-settings-priority-status
          className={`w-full md:max-w-md rounded-2xl border px-4 py-3 shadow-sm ${priorityTone}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-70">
            {isLoadingSettings ? 'Checking configuration' : 'Next recommended fix'}
          </p>
          <p className="mt-2 text-sm font-semibold">
            {priorityStatus.title}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {priorityStatus.message}
          </p>
          {priorityStatus.actionLabel && (
            <button
              type="button"
              onClick={() => handleTabChange(priorityStatus.tab)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-blue-100"
            >
              {priorityStatus.actionLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop sidebar nav */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="card p-2 sticky top-6 border-border-default bg-surface-card/50 backdrop-blur-sm shadow-sm">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all mb-1 text-left group ${
                  activeTab === id
                    ? 'bg-accent-blue/10 text-accent-blue shadow-sm border border-accent-blue/20'
                    : 'text-text-muted hover:bg-surface-elevated hover:text-text-primary border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  activeTab === id ? 'text-accent-blue' : 'text-text-muted opacity-60'
                }`} />
                <span className="flex-1 truncate">{label}</span>
                {activeTab === id && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-accent-blue animate-in fade-in slide-in-from-left-2" />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Mobile tab scrollbar */}
          <div className="flex md:hidden overflow-x-auto gap-2 mb-6 pb-2 -mx-4 px-4 scrollbar-hide">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                  activeTab === id
                    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-sm'
                    : 'bg-surface-card text-text-muted border-border-default active:bg-surface-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab panel with animations */}
          <div
            key={activeTab}
            className={`
              min-h-[500px]
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

          {/* System Attribution */}
          <div className="flex justify-between items-center pt-8 mt-12 border-t border-border-default opacity-40">
            <span className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">
              OpenSite v2.4.0 — Production Build
            </span>
            <span className="text-xs font-bold text-text-muted tracking-wide">
              Created by Cory Nichols
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT (Wrapped in Provider)
───────────────────────────────────────────── */
export default function Settings() {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
}
