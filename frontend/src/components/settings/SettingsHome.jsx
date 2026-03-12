/**
 * SettingsHome Component
 * Configuration command center using Dark Forge design system
 */

import { useMemo, memo } from 'react';
import {
  Settings, Cpu, Building2, Calculator, Search, Bell, Key,
  Activity, Clock, Zap, Shield, Server, Sparkles,
  TrendingUp, Info, RefreshCw, ExternalLink, Palette
} from 'lucide-react';
import { colors } from '../../styles/tokens';
import { 
  QuickAction, StatusCard, StatCard, ConfigCategory, HealthItem, ProgressBar
} from './primitives';

/**
 * SettingsHome - Settings dashboard and overview
 */
const SettingsHome = memo(function SettingsHome({
  settings = {},
  metrics = {},
  activeProvider = 'openclaw',
  connected = false,
  availableModels = [],
  onTabChange,
  onRefreshMetrics,
  isLoading = false
}) {
  const configStatus = useMemo(() => {
    const hasAI = activeProvider === 'ollama' ? connected :
      activeProvider === 'groq' ? settings.groq_api_key_configured :
      activeProvider === 'anthropic' ? settings.anthropic_api_key_configured :
      activeProvider === 'openai' ? settings.openai_api_key_configured :
      settings.openclaw_token_configured;

    const hasBusiness = !!settings.company_name;
    const hasAPIKeys = !!(settings.serper_api_key_configured || settings.google_places_api_key_configured);
    const hasNotifications = settings.notify_enabled === 'true';

    const categories = [hasAI, hasBusiness, hasAPIKeys, hasNotifications];
    const configured = categories.filter(Boolean).length;
    const total = categories.length;

    return { configured, total, percentage: Math.round((configured / total) * 100) };
  }, [settings, activeProvider, connected]);

  const successRate = metrics.totalRequests > 0
    ? ((metrics.successCount / metrics.totalRequests) * 100).toFixed(1) : '0.0';

  const uptimeFormatted = metrics.uptimeMs
    ? `${Math.floor(metrics.uptimeMs / 3600000)}h ${Math.floor((metrics.uptimeMs % 3600000) / 60000)}m` : '--';

  const alerts = useMemo(() => {
    const list = [];

    if (!connected && activeProvider === 'ollama') {
      list.push({
        status: 'warning',
        title: 'Ollama Not Connected',
        message: 'Local AI is unavailable. Check your Ollama server or switch to a cloud provider.',
        actionLabel: 'Go to AI Settings',
        onAction: () => onTabChange('ai'),
      });
    }

    if (!settings.company_name) {
      list.push({
        status: 'info',
        title: 'Business Profile Incomplete',
        message: 'Add your company details for personalized AI responses and estimates.',
        actionLabel: 'Configure Business',
        onAction: () => onTabChange('business'),
      });
    }

    if (!settings.serper_api_key_configured && !settings.google_places_api_key_configured) {
      list.push({
        status: 'info',
        title: 'Discovery API Keys Missing',
        message: 'Add Serper.dev or Google Places API key to enable lead discovery.',
        actionLabel: 'Add API Keys',
        onAction: () => onTabChange('apikeys'),
      });
    }

    if (configStatus.percentage === 100) {
      list.push({
        status: 'success',
        title: 'All Systems Configured',
        message: 'Your OpenSite instance is fully configured and ready to use.',
      });
    }

    return list;
  }, [settings, connected, activeProvider, configStatus.percentage, onTabChange]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 rounded-xl bg-surface-elevated border border-border-default" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-surface-elevated border border-border-default" />
        <div className="h-60 rounded-xl bg-surface-elevated border border-border-default" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 page-transition-wrapper">
      {/* Setup Progress */}
      <div className="card p-6 border-border-default bg-surface-card shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
          <TrendingUp className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <ProgressBar 
            percentage={configStatus.percentage} 
            label="OpenSite Optimization Progress" 
            color={configStatus.percentage === 100 ? colors.success.DEFAULT : colors.accent.blue} 
          />
          <p className="text-xs text-text-muted mt-3 font-medium flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            {configStatus.percentage === 100 
              ? 'Your system is fully optimized for maximum performance' 
              : `Complete the remaining ${configStatus.total - configStatus.configured} categories to unlock full AI capabilities`}
          </p>
        </div>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <StatusCard key={i} {...alert} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-1">
          Quick Access
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <QuickAction
            icon={Cpu}
            label="AI Provider"
            onClick={() => onTabChange('ai')}
            color={colors.accent.blue}
            description={activeProvider}
          />
          <QuickAction
            icon={Building2}
            label="Business"
            onClick={() => onTabChange('business')}
            color={colors.success.DEFAULT}
            description={settings.company_name || 'Not set'}
          />
          <QuickAction
            icon={Key}
            label="API Keys"
            onClick={() => onTabChange('apikeys')}
            color={colors.accent.purple}
            description={`${configStatus.configured}/${configStatus.total} configured`}
          />
          <QuickAction
            icon={Palette}
            label="Appearance"
            onClick={() => onTabChange('appearance')}
            color={colors.accent.pink}
            description="Theme & layout"
          />
          <QuickAction
            icon={RefreshCw}
            label="Refresh"
            onClick={onRefreshMetrics}
            color={colors.warning.DEFAULT}
            description="Update metrics"
          />
        </div>
      </section>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Setup Progress"
          value={`${configStatus.percentage}%`}
          subtext={`${configStatus.configured} of ${configStatus.total} categories`}
          icon={Settings}
          color={colors.accent.blue}
          onClick={() => onTabChange('ai')}
        />
        <StatCard
          label="AI Requests"
          value={metrics.totalRequests?.toLocaleString() || '0'}
          subtext={`${successRate}% success rate`}
          icon={Zap}
          color={colors.accent.amber}
          onClick={() => onTabChange('system')}
        />
        <StatCard
          label="Uptime"
          value={uptimeFormatted}
          subtext="Since last restart"
          icon={Clock}
          color={colors.success.DEFAULT}
          onClick={() => onTabChange('system')}
        />
        <StatCard
          label="Circuit Breaker"
          value={metrics.circuitBreaker || 'Closed'}
          subtext={!metrics.circuitBreaker || metrics.circuitBreaker === 'closed' ? 'Healthy' : 'Tripped'}
          icon={Shield}
          color={!metrics.circuitBreaker || metrics.circuitBreaker === 'closed' ? colors.success.DEFAULT : colors.danger.DEFAULT}
          onClick={() => onTabChange('performance')}
        />
      </div>

      {/* Configuration Categories */}
      <section>
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-sm font-bold flex items-center gap-2 text-text-primary tracking-tight">
            <Settings className="w-4 h-4 text-accent-blue" />
            Configuration Categories
          </h3>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {configStatus.configured}/{configStatus.total} complete
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <ConfigCategory
            icon={Cpu}
            title="AI & Models"
            description={`Active: ${activeProvider} — ${availableModels.length} models available`}
            status={
              activeProvider === 'ollama' 
                ? (connected ? 'configured' : 'empty') 
                : (settings[`${activeProvider}_api_key_configured`] ? 'configured' : 'empty')
            }
            onClick={() => onTabChange('ai')}
          />
          <ConfigCategory
            icon={Building2}
            title="Business Profile"
            description={settings.company_name || 'Add company details for personalized AI responses'}
            status={settings.company_name ? 'configured' : 'empty'}
            onClick={() => onTabChange('business')}
          />
          <ConfigCategory
            icon={Calculator}
            title="Estimating"
            description={`Labor: $${settings.estimate_labor_rate || 85}/hr — Markup: ${settings.estimate_markup || 30}%`}
            status={settings.estimate_labor_rate ? 'configured' : 'partial'}
            onClick={() => onTabChange('estimating')}
          />
          <ConfigCategory
            icon={Search}
            title="Lead Discovery"
            description={`Radius: ${settings.discovery_radius || 25}mi — Auto-score: ${settings.discovery_auto_score === 'true' ? 'On' : 'Off'}`}
            status={settings.serper_api_key_configured || settings.google_places_api_key_configured ? 'configured' : 'partial'}
            onClick={() => onTabChange('discovery')}
          />
          <ConfigCategory
            icon={Bell}
            title="Notifications"
            description={`Email: ${settings.notify_email_enabled === 'true' ? 'On' : 'Off'} — SMS: ${settings.notify_sms_enabled === 'true' ? 'On' : 'Off'}`}
            status={settings.notify_enabled === 'true' ? 'configured' : 'empty'}
            onClick={() => onTabChange('notifications')}
          />
          <ConfigCategory
            icon={Key}
            title="API Keys"
            description={`Serper: ${settings.serper_api_key_configured ? 'Active' : 'Missing'} — Twilio: ${settings.twilio_account_sid_configured ? 'Active' : 'Missing'}`}
            status={settings.serper_api_key_configured && settings.twilio_account_sid_configured ? 'configured' : settings.serper_api_key_configured ? 'partial' : 'empty'}
            onClick={() => onTabChange('apikeys')}
          />
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="card p-6 border-border-default bg-surface-card shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-text-primary tracking-tight">
              <Activity className="w-4 h-4 text-success-DEFAULT" />
              System Health
            </h3>
            <button
              onClick={onRefreshMetrics}
              className="text-xs font-bold uppercase tracking-widest text-accent-blue hover:text-accent-light transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="space-y-1">
            <HealthItem
              label="AI Provider"
              value={activeProvider}
              status={connected || activeProvider !== 'ollama' ? 'good' : 'error'}
              icon={Cpu}
            />
            <HealthItem
              label="Success Rate"
              value={`${successRate}%`}
              status={parseFloat(successRate) > 90 ? 'good' : parseFloat(successRate) > 70 ? 'warning' : 'error'}
              icon={TrendingUp}
            />
            <HealthItem
              label="Avg Response"
              value={metrics.avgResponseMs ? `${metrics.avgResponseMs}ms` : '--'}
              status={metrics.avgResponseMs < 1000 ? 'good' : metrics.avgResponseMs < 3000 ? 'warning' : 'error'}
              icon={Clock}
            />
            <HealthItem
              label="Cache Hit Rate"
              value={`${metrics.cacheHitRate?.toFixed(1) || '0'}%`}
              status={(metrics.cacheHitRate || 0) > 40 ? 'good' : 'warning'}
              icon={Server}
            />
          </div>
        </div>

        {/* Quick Settings */}
        <div className="card p-6 border-border-default bg-surface-card shadow-sm">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-text-primary tracking-tight">
            <Sparkles className="w-4 h-4 text-accent-amber" />
            Quick Settings
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Dark Mode', value: localStorage.getItem('theme') === 'dark', icon: Palette, tab: 'appearance' },
              { label: 'Email Notifications', value: settings.notify_email_enabled === 'true', icon: Bell, tab: 'notifications' },
              { label: 'Auto-Score Leads', value: settings.discovery_auto_score === 'true', icon: Search, tab: 'discovery' },
              { label: 'Background Jobs', value: settings.perf_bg_jobs !== 'false', icon: Server, tab: 'performance' },
            ].map((setting) => (
              <button
                key={setting.label}
                onClick={() => onTabChange(setting.tab)}
                className="w-full flex items-center justify-between p-4 rounded-xl transition-all text-left bg-surface-elevated border border-transparent hover:border-border-strong group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface-card group-hover:bg-surface-elevated transition-colors">
                    <setting.icon className="w-4 h-4 text-text-muted group-hover:text-accent-blue transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                    {setting.label}
                  </span>
                </div>
                <div className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                  setting.value 
                    ? 'bg-success-muted text-success-light border border-success-border' 
                    : 'bg-surface-card text-text-muted border border-border-muted'
                }`}>
                  {setting.value ? 'Active' : 'Inactive'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources */}
      <section className="p-8 rounded-2xl bg-gradient-to-br from-surface-card to-surface-elevated border border-border-default shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Info className="w-32 h-32" />
        </div>
        
        <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-text-primary tracking-tight relative z-10">
          <Info className="w-4 h-4 text-accent-blue" />
          Resources & Support
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {[
            { label: 'Documentation', href: '#', icon: ExternalLink },
            { label: 'API Reference', href: '#', icon: ExternalLink },
            { label: 'Release Notes', href: '#', icon: ExternalLink },
            { label: 'Get Support', href: '#', icon: ExternalLink },
          ].map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className="p-4 rounded-xl text-center transition-all bg-surface-elevated border border-border-muted hover:border-accent-blue/40 hover:shadow-md group active:scale-95"
            >
              <resource.icon className="w-5 h-5 mx-auto mb-3 text-text-muted group-hover:text-accent-blue transition-colors" />
              <p className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors tracking-tight">
                {resource.label}
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
});

SettingsHome.displayName = 'SettingsHome';

export default SettingsHome;
