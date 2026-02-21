import { useState, useMemo } from 'react';
import { 
  Calculator, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Sparkles, Zap, Download, History, Plus, ChevronRight, BarChart3,
  Wallet, Home, Building2, ArrowRight, RotateCcw, Save, Brain,
  Droplets, UtensilsCrossed, Bath, Flame
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { FIXTURE_PRICE, QUALIFYING_FIXTURES, PHASE_CONFIG } from './constants';

/* ================================================================
   PLANS HOME v2 - Enhanced Estimate Command Center
   - Smart alerts & validation warnings
   - Quick action dock
   - Visual stats dashboard
   - Recent estimates
   - Quick-start templates
   - AI insights
   ================================================================ */

const FIXTURE_ICONS = {
  lavatories: Droplets,
  kitchenFaucets: UtensilsCrossed,
  toilets: Bath,
  waterHeaters: Flame,
};

/* -- COMPONENTS -- */

const QuickAction = ({ icon: Icon, label, onClick, color = 'text-accent-600', badge = null, disabled = false, description }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 transition-all duration-200 min-w-[90px] ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-300 hover:shadow-md active:scale-95'
    }`}
  >
    <div className="relative">
      <Icon className={`w-6 h-6 ${color}`} />
      {badge && (
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
          {badge}
        </span>
      )}
    </div>
    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{label}</span>
    {description && <span className="text-[10px] text-surface-400">{description}</span>}
  </button>
);

const AlertCard = ({ type, title, message, action, onAction, count }) => {
  const styles = {
    urgent: { border: 'border-red-300', bg: 'bg-red-50/80', icon: AlertCircle, iconColor: 'text-red-500' },
    warning: { border: 'border-amber-300', bg: 'bg-amber-50/80', icon: Clock, iconColor: 'text-amber-500' },
    success: { border: 'border-emerald-300', bg: 'bg-emerald-50/80', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    info: { border: 'border-blue-300', bg: 'bg-blue-50/80', icon: Sparkles, iconColor: 'text-blue-500' },
  }[type];
  const Icon = styles.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles.border} ${styles.bg} dark:bg-opacity-10`}>
      <Icon className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{title}</h4>
          {count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white dark:bg-surface-800 text-xs font-bold text-surface-600">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{message}</p>
        {action && (
          <button
            onClick={onAction}
            className="mt-2 text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1"
          >
            {action} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext, icon: Icon, color = 'text-accent-600', trend = null, onClick }) => (
  <div 
    onClick={onClick}
    className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 transition-all cursor-pointer group"
  >
    <div className="flex items-start justify-between mb-2">
      <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      {trend && (
        <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</div>
    <div className="text-xs text-surface-500 dark:text-surface-400 font-medium">{label}</div>
    {subtext && <div className="text-xs text-surface-400 mt-1">{subtext}</div>}
  </div>
);

const RecentEstimateRow = ({ estimate, onClick }) => {
  const total = estimate.total || 0;
  const fixtureCount = estimate.fixtureCount || 0;
  const date = new Date(estimate.createdAt || Date.now());
  const isToday = new Date().toDateString() === date.toDateString();
  
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Icon */}
      <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
        <Calculator className="w-6 h-6 text-primary-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
            {estimate.projectName || 'Untitled Estimate'}
          </h4>
          {estimate.hasAnalysis && (
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-2xs font-medium">
              AI
            </span>
          )}
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {fixtureCount} fixture{fixtureCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Value & Date */}
      <div className="text-right">
        <p className="text-lg font-bold text-surface-900">{formatCurrency(total)}</p>
        <p className="text-xs text-surface-400">
          {isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-accent-500 transition-colors" />
    </div>
  );
};

const TemplateCard = ({ title, description, fixtures, onClick, color }) => {
  const Icon = fixtures[0]?.icon || Calculator;
  
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 hover:shadow-md transition-all text-left group"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3`} style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h4 className="font-semibold text-surface-900 dark:text-surface-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">{description}</p>
      <div className="flex items-center gap-1 text-xs text-accent-600 font-medium">
        Use Template <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
};

const ActivityItem = ({ icon: Icon, text, time, type = 'neutral' }) => {
  const colors = {
    neutral: 'text-surface-400',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-100 dark:border-surface-700 last:border-0">
      <div className={`p-2 rounded-lg bg-surface-50 dark:bg-surface-800 ${colors[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-700 dark:text-surface-300 truncate">{text}</p>
      </div>
      <span className="text-xs text-surface-400 whitespace-nowrap">{time}</span>
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function PlansHome({ 
  fixtures = {},
  projectInfo = {},
  estimate = null,
  onNewEstimate,
  onLoadEstimate,
  onContinueEditing,
  onQuickAddFixture,
  isLoading = false
}) {
  // Mock recent estimates (would come from API)
  const recentEstimates = [
    { id: 1, projectName: 'Horizon Homes - Building A', total: 89550, fixtureCount: 90, createdAt: new Date().toISOString(), hasAnalysis: true },
    { id: 2, projectName: 'Summit Plaza Renovation', total: 44775, fixtureCount: 45, createdAt: new Date(Date.now() - 86400000).toISOString(), hasAnalysis: false },
    { id: 3, projectName: 'Downtown Office Complex', total: 199000, fixtureCount: 200, createdAt: new Date(Date.now() - 172800000).toISOString(), hasAnalysis: true },
  ];

  // Compute stats
  const totalFixtures = QUALIFYING_FIXTURES.reduce((sum, f) => sum + (fixtures[f.key] || 0), 0);
  const totalValue = totalFixtures * FIXTURE_PRICE;
  const hasProjectName = !!projectInfo.projectName;
  const hasFixtures = totalFixtures > 0;

  // Generate alerts
  const alerts = useMemo(() => {
    const list = [];
    
    if (hasFixtures && !hasProjectName) {
      list.push({
        type: 'warning',
        title: 'Project Name Missing',
        message: 'Add a project name to help organize your estimates',
        action: 'Add Name',
        onAction: onContinueEditing,
      });
    }
    
    if (!hasFixtures) {
      list.push({
        type: 'info',
        title: 'Start New Estimate',
        message: 'Add fixtures or use a template to get started',
        action: 'Create Estimate',
        onAction: onNewEstimate,
      });
    }

    if (hasFixtures && totalFixtures >= 10) {
      list.push({
        type: 'success',
        title: 'Ready for AI Analysis',
        message: 'Get detailed insights and recommendations with AI',
        action: 'Analyze Now',
        onAction: onContinueEditing,
      });
    }

    return list;
  }, [hasFixtures, hasProjectName, totalFixtures, onNewEstimate, onContinueEditing]);

  // Quick templates
  const templates = [
    {
      title: 'Single Family Home',
      description: '3 bed, 2 bath typical residential',
      fixtures: QUALIFYING_FIXTURES.slice(0, 4),
      color: '#3b82f6',
      defaults: { lavatories: 3, kitchenFaucets: 2, toilets: 3, showerBases: 2, tubs: 1, waterHeaters: 1 },
    },
    {
      title: 'Small Apartment',
      description: '1 bed, 1 bath unit',
      fixtures: QUALIFYING_FIXTURES.slice(0, 3),
      color: '#10b981',
      defaults: { lavatories: 1, kitchenFaucets: 1, toilets: 1, showerBases: 1, waterHeaters: 1 },
    },
    {
      title: 'Commercial Office',
      description: 'Multi-floor office building',
      fixtures: QUALIFYING_FIXTURES.slice(0, 5),
      color: '#8b5cf6',
      defaults: { lavatories: 8, kitchenFaucets: 2, toilets: 8, waterSoftenerPreplumb: 1, waterHeaters: 2 },
    },
  ];

  // Recent activity
  const recentActivity = [
    { icon: CheckCircle2, text: 'Estimate saved: Horizon Homes', time: '10m ago', type: 'success' },
    { icon: Sparkles, text: 'AI analysis completed', time: '25m ago', type: 'info' },
    { icon: Download, text: 'CSV export downloaded', time: '1h ago', type: 'neutral' },
    { icon: Calculator, text: 'New estimate created', time: '2h ago', type: 'neutral' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-200 rounded-xl" />)}
        </div>
        <div className="h-40 bg-surface-200 rounded-xl" />
        <div className="h-60 bg-surface-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <AlertCard key={i} {...alert} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction 
            icon={Plus} 
            label="New Estimate" 
            onClick={onNewEstimate}
            color="text-emerald-600"
            description="Start fresh"
          />
          <QuickAction 
            icon={Calculator} 
            label="Continue" 
            onClick={onContinueEditing}
            color="text-primary-600"
            description="Current work"
            disabled={!hasFixtures}
          />
          <QuickAction 
            icon={Brain} 
            label="AI Analyze" 
            onClick={onContinueEditing}
            color="text-violet-600"
            description="Get insights"
            disabled={!hasFixtures}
          />
          <QuickAction 
            icon={Download} 
            label="Export" 
            onClick={() => {}}
            color="text-blue-600"
            description="CSV/Excel"
            disabled={!hasFixtures}
          />
          <QuickAction 
            icon={History} 
            label="History" 
            onClick={() => {}}
            color="text-amber-600"
            description="Past estimates"
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Current Fixtures"
          value={totalFixtures}
          subtext={hasFixtures ? 'In current estimate' : 'None added'}
          icon={Calculator}
          color="text-primary-600"
          onClick={onContinueEditing}
        />
        <StatCard
          label="Estimate Value"
          value={formatCurrency(totalValue)}
          subtext={`@ ${formatCurrency(FIXTURE_PRICE)}/fixture`}
          icon={Wallet}
          color="text-emerald-600"
          onClick={onContinueEditing}
        />
        <StatCard
          label="Recent Estimates"
          value={recentEstimates.length}
          subtext="This week"
          icon={FileText}
          color="text-blue-600"
        />
        <StatCard
          label="Avg. Estimate"
          value={formatCurrency(111108)}
          subtext="YTD average"
          icon={TrendingUp}
          color="text-violet-600"
          trend={12}
        />
      </div>

      {/* Quick Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Start Templates
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.title}
              {...template}
              onClick={() => onQuickAddFixture?.(template.defaults)}
            />
          ))}
        </div>
      </div>

      {/* Recent Estimates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <History className="w-4 h-4 text-surface-400" />
            Recent Estimates
          </h3>
          <button 
            onClick={() => {}}
            className="text-xs text-accent-600 hover:text-accent-700 font-medium"
          >
            View All →
          </button>
        </div>

        <div className="space-y-3">
          {recentEstimates.map((estimate) => (
            <RecentEstimateRow
              key={estimate.id}
              estimate={estimate}
              onClick={() => onLoadEstimate?.(estimate)}
            />
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Phase Breakdown Preview */}
        <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-surface-400" />
            Phase Distribution
          </h3>
          <div className="space-y-4">
            {PHASE_CONFIG.map((phase) => {
              const amount = Math.round(totalValue * phase.pct / 100);
              return (
                <div key={phase.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-surface-700 dark:text-surface-300 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
                      {phase.label}
                    </span>
                    <span className="text-sm font-bold text-surface-900">
                      {hasFixtures ? formatCurrency(amount) : '--'}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: hasFixtures ? `${phase.pct}%` : '0%', backgroundColor: phase.color }}
                    />
                  </div>
                  <p className="text-xs text-surface-400 mt-1">{phase.pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-surface-400" />
            Recent Activity
          </h3>
          <div className="space-y-1">
            {recentActivity.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))}
          </div>
        </div>
      </div>

      {/* AI Capabilities */}
      <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/10 dark:to-blue-900/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-violet-500 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">AI-Powered Analysis</h3>
            <p className="text-xs text-surface-500">Smart insights for better estimates</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Building2, label: 'Cost Optimization', desc: 'Find savings' },
            { icon: TrendingUp, label: 'Price Trends', desc: 'Market analysis' },
            { icon: CheckCircle2, label: 'Validation', desc: 'Accuracy check' },
            { icon: FileText, label: 'Reports', desc: 'Detailed docs' },
          ].map((feature) => (
            <div key={feature.label} className="p-3 rounded-lg bg-white/80 dark:bg-surface-800/80 text-center">
              <feature.icon className="w-5 h-5 text-violet-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-surface-800">{feature.label}</p>
              <p className="text-[10px] text-surface-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
