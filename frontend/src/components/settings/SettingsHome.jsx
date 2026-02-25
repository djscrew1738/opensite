import { useMemo } from 'react';
import {
  Settings, Cpu, Building2, Calculator, Search, Bell, Key,
  Gauge, Palette, Database, Activity, CheckCircle2, AlertCircle,
  Clock, Zap, ChevronRight, BarChart3, Shield, Server, Sparkles,
  TrendingUp, AlertTriangle, Info, RefreshCw, ExternalLink
} from 'lucide-react';

/* ================================================================
   SETTINGS HOME v2 — Dark Forge Edition
   Configuration command center using #0A0B0D / #111318 / #181C24
   ================================================================ */

/* -- COMPONENTS -- */

const QuickAction = ({ icon: Icon, label, onClick, color = 'text-[#3B82F6]', description, badge = null }) => {
  if (!Icon) return null;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#1F2430] bg-[#111318] transition-all duration-200 min-w-[90px] hover:border-[#3B82F6]/40 hover:bg-[#181C24] active:scale-95"
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${color}`} />
        {badge && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-[#94A3B8]">{label}</span>
      {description && <span className="text-[10px] text-[#475569]">{description}</span>}
    </button>
  );
};

const StatusCard = ({ title, status, message, icon: Icon, color, onAction, actionLabel }) => {
  if (!Icon) return null;
  const colors = {
    success: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5',  iconColor: 'text-emerald-400', text: 'text-emerald-300' },
    warning: { border: 'border-amber-500/20',   bg: 'bg-amber-500/5',    iconColor: 'text-amber-400',   text: 'text-amber-300' },
    error:   { border: 'border-red-500/20',      bg: 'bg-red-500/5',      iconColor: 'text-red-400',     text: 'text-red-300' },
    info:    { border: 'border-blue-500/20',      bg: 'bg-blue-500/5',     iconColor: 'text-blue-400',    text: 'text-blue-300' },
  }[status || 'info'];

  return (
    <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${colors.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${colors.text} text-sm`}>{title}</h4>
          <p className="text-xs text-[#94A3B8] mt-1">{message}</p>
          {onAction && actionLabel && (
            <button onClick={onAction} className="mt-2 text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1">
              {actionLabel} <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext, icon: Icon, color = 'text-[#3B82F6]', onClick }) => {
  if (!Icon) return null;
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border border-[#1F2430] bg-[#111318] hover:border-[#3B82F6]/40 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-[#181C24]">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#F1F5F9]">{value}</div>
      <div className="text-xs text-[#94A3B8] font-medium">{label}</div>
      {subtext && <div className="text-xs text-[#475569] mt-1">{subtext}</div>}
    </div>
  );
};

const ConfigCategory = ({ icon: Icon, title, description, status, onClick }) => {
  if (!Icon) return null;
  const statusColors = {
    configured: { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Configured' },
    partial:    { dot: 'bg-amber-500',   text: 'text-amber-400',   label: 'Partial' },
    empty:      { dot: 'bg-[#475569]',   text: 'text-[#475569]',   label: 'Not Configured' },
  }[status || 'empty'];

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#1F2430] bg-[#111318] hover:border-[#3B82F6]/40 hover:bg-[#181C24] transition-all text-left group"
    >
      <div className="w-12 h-12 rounded-xl bg-[#181C24] flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-[#64748B] group-hover:text-[#3B82F6] transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-[#F1F5F9]">{title}</h4>
          <span className={`flex items-center gap-1.5 text-xs ${statusColors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
            {statusColors.label}
          </span>
        </div>
        <p className="text-sm text-[#64748B] truncate">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#2D3548] group-hover:text-[#3B82F6] transition-colors" />
    </button>
  );
};

const HealthItem = ({ label, value, status, icon: Icon }) => {
  if (!Icon) return null;
  const colors = {
    good:    'text-emerald-400 bg-emerald-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    error:   'text-red-400 bg-red-500/10',
  }[status || 'good'];

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1F2430] last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${colors}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-[#94A3B8]">{label}</span>
      </div>
      <span className="text-sm font-semibold text-[#F1F5F9]">{value}</span>
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function SettingsHome({
  settings = {},
  metrics = {},
  config = {},
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
      settings.openclaw_token_configured;

    const hasBusiness = settings.company_name;
    const hasAPIKeys = settings.serper_api_key_configured || settings.google_places_api_key_configured;
    const hasNotifications = settings.notify_enabled === 'true';

    const total = 4;
    const configured = [hasAI, hasBusiness, hasAPIKeys, hasNotifications].filter(Boolean).length;

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
        type: 'warning',
        title: 'Ollama Not Connected',
        message: 'Local AI is unavailable. Check your Ollama server or switch to a cloud provider.',
        actionLabel: 'Go to AI Settings',
        onAction: () => onTabChange('ai'),
      });
    }

    if (!settings.company_name) {
      list.push({
        type: 'info',
        title: 'Business Profile Incomplete',
        message: 'Add your company details for personalized AI responses and estimates.',
        actionLabel: 'Configure Business',
        onAction: () => onTabChange('business'),
      });
    }

    if (!settings.serper_api_key_configured && !settings.google_places_api_key_configured) {
      list.push({
        type: 'info',
        title: 'Discovery API Keys Missing',
        message: 'Add Serper.dev or Google Places API key to enable lead discovery.',
        actionLabel: 'Add API Keys',
        onAction: () => onTabChange('apikeys'),
      });
    }

    if (configStatus.percentage === 100) {
      list.push({
        type: 'success',
        title: 'All Systems Configured',
        message: 'Your OpenSite instance is fully configured and ready to use.',
      });
    }

    return list;
  }, [settings, connected, activeProvider, configStatus.percentage, onTabChange]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#181C24] rounded-xl" />)}
        </div>
        <div className="h-40 bg-[#181C24] rounded-xl" />
        <div className="h-60 bg-[#181C24] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <StatusCard key={i} {...alert} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction
            icon={Cpu}
            label="AI Provider"
            onClick={() => onTabChange('ai')}
            color="text-blue-400"
            description={activeProvider}
          />
          <QuickAction
            icon={Building2}
            label="Business"
            onClick={() => onTabChange('business')}
            color="text-emerald-400"
            description={settings.company_name || 'Not set'}
          />
          <QuickAction
            icon={Key}
            label="API Keys"
            onClick={() => onTabChange('apikeys')}
            color="text-violet-400"
            description={`${configStatus.configured}/${configStatus.total} configured`}
          />
          <QuickAction
            icon={Palette}
            label="Appearance"
            onClick={() => onTabChange('appearance')}
            color="text-pink-400"
            description="Theme & layout"
          />
          <QuickAction
            icon={RefreshCw}
            label="Refresh"
            onClick={onRefreshMetrics}
            color="text-amber-400"
            description="Update metrics"
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Setup Progress"
          value={`${configStatus.percentage}%`}
          subtext={`${configStatus.configured} of ${configStatus.total} categories`}
          icon={Settings}
          color="text-[#3B82F6]"
          onClick={() => onTabChange('ai')}
        />
        <StatCard
          label="AI Requests"
          value={metrics.totalRequests?.toLocaleString() || '0'}
          subtext={`${successRate}% success rate`}
          icon={Zap}
          color="text-blue-400"
          onClick={() => onTabChange('system')}
        />
        <StatCard
          label="Uptime"
          value={uptimeFormatted}
          subtext="Since last restart"
          icon={Clock}
          color="text-emerald-400"
          onClick={() => onTabChange('system')}
        />
        <StatCard
          label="Circuit Breaker"
          value={metrics.circuitBreaker || 'Closed'}
          subtext={!metrics.circuitBreaker || metrics.circuitBreaker === 'closed' ? 'Healthy' : 'Tripped'}
          icon={Shield}
          color={!metrics.circuitBreaker || metrics.circuitBreaker === 'closed' ? 'text-emerald-400' : 'text-red-400'}
          onClick={() => onTabChange('performance')}
        />
      </div>

      {/* Configuration Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#64748B]" />
            Configuration Categories
          </h3>
          <div className="text-xs text-[#64748B]">
            {configStatus.configured}/{configStatus.total} complete
          </div>
        </div>

        <div className="space-y-3">
          <ConfigCategory
            icon={Cpu}
            title="AI & Models"
            description={`Active: ${activeProvider} — ${availableModels.length} models available`}
            status={activeProvider === 'ollama' ? (connected ? 'configured' : 'empty') : settings[`${activeProvider}_api_key_configured`] ? 'configured' : 'empty'}
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
            description={`Serper: ${settings.serper_api_key_configured ? 'Active' : 'Missing'} — Twilio: ${settings.twilio_account_sid_configured ? 'Active' : 'Missing'} — SendGrid: ${settings.sendgrid_api_key_configured ? 'Active' : 'Missing'}`}
            status={settings.serper_api_key_configured && settings.twilio_account_sid_configured ? 'configured' : settings.serper_api_key_configured ? 'partial' : 'empty'}
            onClick={() => onTabChange('apikeys')}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="p-5 rounded-xl border border-[#1F2430] bg-[#111318]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#64748B]" />
              System Health
            </h3>
            <button
              onClick={onRefreshMetrics}
              className="text-xs text-[#3B82F6] hover:text-[#60A5FA] font-medium flex items-center gap-1"
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
              status={metrics.avgResponseMs < 500 ? 'good' : metrics.avgResponseMs < 2000 ? 'warning' : 'error'}
              icon={Clock}
            />
            <HealthItem
              label="Cache Hit Rate"
              value={`${metrics.cacheHitRate?.toFixed(1) || '0'}%`}
              status={(metrics.cacheHitRate || 0) > 50 ? 'good' : 'warning'}
              icon={Server}
            />
          </div>
        </div>

        {/* Quick Settings */}
        <div className="p-5 rounded-xl border border-[#1F2430] bg-[#111318]">
          <h3 className="text-sm font-bold text-[#F1F5F9] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#64748B]" />
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
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#181C24] hover:bg-[#1F2430] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <setting.icon className="w-4 h-4 text-[#64748B]" />
                  <span className="text-sm text-[#94A3B8]">{setting.label}</span>
                </div>
                <span className={`text-xs font-medium ${setting.value ? 'text-emerald-400' : 'text-[#475569]'}`}>
                  {setting.value ? 'On' : 'Off'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="p-5 rounded-xl border border-[#1F2430] bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
        <h3 className="text-sm font-bold text-[#F1F5F9] mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          Resources & Support
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Documentation', href: '#', icon: ExternalLink },
            { label: 'API Reference', href: '#', icon: ExternalLink },
            { label: 'Release Notes', href: '#', icon: ExternalLink },
            { label: 'Get Support', href: '#', icon: ExternalLink },
          ].map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className="p-3 rounded-lg bg-[#111318] text-center hover:bg-[#181C24] transition-colors border border-[#1F2430]"
            >
              <resource.icon className="w-4 h-4 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-[#94A3B8]">{resource.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
