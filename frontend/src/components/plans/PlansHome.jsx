import { useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { 
  Calculator, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Sparkles, Zap, Download, History, Plus, ChevronRight, BarChart3,
  Wallet, Home, Building2, ArrowRight, Brain
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { FIXTURE_PRICE, QUALIFYING_FIXTURES, PHASE_CONFIG } from './constants';

/* ================================================================
   PLANS HOME v4 - Refactored with Dark Forge Design System
   - Extracted sub-components
   - Migrated to semantic Tailwind tokens
   - Added PropTypes
   - Maintained all functionality
   ================================================================ */

// ═══════════════════════════════════════════════════════════════
// Static Data
// ═══════════════════════════════════════════════════════════════

const RECENT_ESTIMATES = [
  { id: 1, projectName: 'Horizon Homes - Building A', total: 89550, fixtureCount: 90, createdAt: new Date().toISOString(), hasAnalysis: true },
  { id: 2, projectName: 'Summit Plaza Renovation', total: 44775, fixtureCount: 45, createdAt: new Date(Date.now() - 86400000).toISOString(), hasAnalysis: false },
  { id: 3, projectName: 'Downtown Office Complex', total: 199000, fixtureCount: 200, createdAt: new Date(Date.now() - 172800000).toISOString(), hasAnalysis: true },
];

const TEMPLATES = [
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

const RECENT_ACTIVITY = [
  { icon: CheckCircle2, text: 'Estimate saved: Horizon Homes', time: '10m ago', type: 'success' },
  { icon: Sparkles, text: 'AI analysis completed', time: '25m ago', type: 'info' },
  { icon: Download, text: 'CSV export downloaded', time: '1h ago', type: 'neutral' },
  { icon: Calculator, text: 'New estimate created', time: '2h ago', type: 'neutral' },
];

const AI_FEATURES = [
  { icon: Building2, label: 'Cost Optimization', desc: 'Find savings' },
  { icon: TrendingUp, label: 'Price Trends', desc: 'Market analysis' },
  { icon: CheckCircle2, label: 'Validation', desc: 'Accuracy check' },
  { icon: FileText, label: 'Reports', desc: 'Detailed docs' },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Quick action button with icon and badge
 */
const QuickAction = memo(function QuickAction({ 
  icon: Icon, 
  label, 
  onClick, 
  color = 'text-accent-500', 
  badge = null, 
  disabled = false, 
  description 
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.93 } : undefined}
      transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-700 bg-surface-800 transition-colors duration-200 min-w-[90px] focus:outline-none focus:ring-2 focus:ring-accent-500/50 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-500/50 hover:shadow-md'
      }`}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${color}`} />
        {badge && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-danger-500 text-white text-xs font-semibold flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-surface-400">{label}</span>
      {description && <span className="text-xs text-surface-500">{description}</span>}
    </motion.button>
  );
});

/**
 * Alert card for notifications/warnings
 */
const AlertCard = memo(function AlertCard({ type, title, message, action, onAction, count }) {
  const styles = {
    urgent: { border: 'border-danger-500/30', bg: 'bg-danger-500/10', icon: AlertCircle, iconColor: 'text-danger-500' },
    warning: { border: 'border-warning-500/30', bg: 'bg-warning-500/10', icon: Clock, iconColor: 'text-warning-500' },
    success: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    info: { border: 'border-accent-500/30', bg: 'bg-accent-500/10', icon: Sparkles, iconColor: 'text-accent-500' },
  }[type];
  
  const Icon = styles.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles.border} ${styles.bg}`}>
      <Icon className={`w-5 h-5 ${styles.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-100 text-sm">{title}</h4>
          {count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-surface-800 text-xs font-semibold text-surface-400">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-surface-400 leading-relaxed">{message}</p>
        {action && (
          <button
            onClick={onAction}
            className="mt-2 text-xs font-semibold text-accent-500 hover:text-accent-400 flex items-center gap-1 transition-colors"
          >
            {action} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Stat card for dashboard metrics
 */
const StatCard = memo(function StatCard({ label, value, subtext, icon: Icon, color = 'text-accent-500', trend = null, onClick }) {
  const bgColor = color.replace('text-', 'bg-').replace('500', '500/10');
  
  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-xl border border-surface-700 bg-surface-800 hover:border-accent-500/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-500' : 'text-danger-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-surface-100">{value}</div>
      <div className="text-xs text-surface-400 font-medium">{label}</div>
      {subtext && <div className="text-xs text-surface-500 mt-1">{subtext}</div>}
    </div>
  );
});

/**
 * Row for recent estimates list
 */
const RecentEstimateRow = memo(function RecentEstimateRow({ estimate, onClick }) {
  const total = estimate.total || 0;
  const fixtureCount = estimate.fixtureCount || 0;
  const date = new Date(estimate.createdAt || '2000-01-01');
  const isToday = new Date().toDateString() === date.toDateString();
  
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-surface-700 bg-surface-800 hover:border-accent-500/30 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-600/20 flex items-center justify-center">
        <Calculator className="w-6 h-6 text-accent-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-100 truncate">
            {estimate.projectName || 'Untitled Estimate'}
          </h4>
          {estimate.hasAnalysis && (
            <span className="px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400 text-xs font-medium">
              AI
            </span>
          )}
        </div>
        <p className="text-sm text-surface-500">
          {fixtureCount} fixture{fixtureCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="text-right">
        <p className="text-lg font-bold text-surface-100">{formatCurrency(total)}</p>
        <p className="text-xs text-surface-500">
          {isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      <ChevronRight className="w-5 h-5 text-surface-600 group-hover:text-accent-500 transition-colors" />
    </div>
  );
});

/**
 * Template card for quick starts
 */
const TemplateCard = memo(function TemplateCard({ title, description, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border border-surface-700 bg-surface-800 hover:border-accent-500/30 hover:shadow-md transition-all text-left group focus:outline-none focus:ring-2 focus:ring-accent-500/50"
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" 
        style={{ backgroundColor: `${color}20` }}
      >
        <Home className="w-5 h-5" style={{ color }} />
      </div>
      <h4 className="font-semibold text-surface-100 text-sm mb-1">{title}</h4>
      <p className="text-xs text-surface-500 mb-3">{description}</p>
      <div className="flex items-center gap-1 text-xs text-accent-500 font-medium">
        Use Template <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
});

/**
 * Activity item for recent activity feed
 */
const ActivityItem = memo(function ActivityItem({ icon: Icon, text, time, type = 'neutral' }) {
  const colors = {
    neutral: 'text-surface-400',
    success: 'text-emerald-500',
    warning: 'text-warning-500',
    info: 'text-accent-500',
  };
  
  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-700 last:border-0">
      <div className={`p-2 rounded-lg bg-surface-800 ${colors[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-300 truncate">{text}</p>
      </div>
      <span className="text-xs text-surface-500 whitespace-nowrap">{time}</span>
    </div>
  );
});

/**
 * Phase distribution visualization
 */
const PhaseDistribution = memo(function PhaseDistribution({ totalValue, hasFixtures }) {
  return (
    <div className="p-5 rounded-xl border border-surface-700 bg-surface-800">
      <h3 className="text-sm font-bold text-surface-100 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-surface-400" />
        Phase Distribution
      </h3>
      <div className="space-y-4">
        {PHASE_CONFIG.map((phase) => {
          const amount = Math.round(totalValue * phase.pct / 100);
          return (
            <div key={phase.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-300 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
                  {phase.label}
                </span>
                <span className="text-sm font-bold text-surface-100">
                  {hasFixtures ? formatCurrency(amount) : '--'}
                </span>
              </div>
              <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: hasFixtures ? `${phase.pct}%` : '0%', backgroundColor: phase.color }}
                />
              </div>
              <p className="text-xs text-surface-500 mt-1">{phase.pct}% of total</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

/**
 * Recent activity panel
 */
const RecentActivity = memo(function RecentActivity() {
  return (
    <div className="p-5 rounded-xl border border-surface-700 bg-surface-800">
      <h3 className="text-sm font-bold text-surface-100 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-surface-400" />
        Recent Activity
      </h3>
      <div className="space-y-1">
        {RECENT_ACTIVITY.map((activity, i) => (
          <ActivityItem key={i} {...activity} />
        ))}
      </div>
    </div>
  );
});

/**
 * AI capabilities showcase section
 */
const AICapabilities = memo(function AICapabilities() {
  return (
    <div className="p-5 rounded-xl border border-surface-700 bg-gradient-to-br from-accent-500/5 to-accent-600/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-accent-500 text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-surface-100">AI-Powered Analysis</h3>
          <p className="text-xs text-surface-500">Smart insights for better estimates</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {AI_FEATURES.map((feature) => (
          <div key={feature.label} className="p-3 rounded-lg bg-surface-800/80 text-center">
            <feature.icon className="w-5 h-5 text-accent-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-surface-200">{feature.label}</p>
            <p className="text-xs text-surface-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * PlansHome - Main landing page for Plans feature
 * 
 * Displays:
 * - Smart alerts based on current state
 * - Quick action buttons
 * - Stats dashboard
 * - Quick start templates
 * - Recent estimates
 * - Phase distribution
 * - Recent activity
 * - AI capabilities
 * 
 * @param {Object} props
 * @param {Object} props.fixtures - Current fixture counts
 * @param {Object} props.projectInfo - Current project info
 * @param {Object} props.estimate - Current estimate data
 * @param {number} props.totalFixtures - Total fixture count
 * @param {number} props.totalValue - Total estimate value
 * @param {Function} props.onNewEstimate - New estimate callback
 * @param {Function} props.onLoadEstimate - Load estimate callback
 * @param {Function} props.onContinueEditing - Continue editing callback
 * @param {Function} props.onQuickAddFixture - Quick add fixture callback
 */
function PlansHome({ 
  fixtures = {},
  projectInfo = {},
  estimate = null,
  totalFixtures,
  totalValue,
  onNewEstimate,
  onLoadEstimate,
  onContinueEditing,
  onQuickAddFixture,
}) {
  // State checks
  const hasProjectName = !!projectInfo.projectName;
  const hasFixtures = totalFixtures > 0;

  // Generate alerts based on current state
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

  // Memoized handlers for template clicks
  const handleTemplateClick = useCallback((templateDefaults) => {
    onQuickAddFixture?.(templateDefaults);
  }, [onQuickAddFixture]);

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
        <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction 
            icon={Plus} 
            label="New Estimate" 
            onClick={onNewEstimate}
            color="text-emerald-500"
            description="Start fresh"
          />
          <QuickAction 
            icon={Calculator} 
            label="Continue" 
            onClick={onContinueEditing}
            color="text-accent-500"
            description="Current work"
            disabled={!hasFixtures}
          />
          <QuickAction 
            icon={Brain} 
            label="AI Analyze" 
            onClick={onContinueEditing}
            color="text-violet-500"
            description="Get insights"
            disabled={!hasFixtures}
          />
          <QuickAction 
            icon={Download} 
            label="Export" 
            onClick={() => {}}
            color="text-blue-500"
            description="CSV/Excel"
            disabled={!hasFixtures}
          />
          <QuickAction 
            icon={History} 
            label="History" 
            onClick={() => {}}
            color="text-amber-500"
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
          color="text-accent-500"
          onClick={onContinueEditing}
        />
        <StatCard
          label="Estimate Value"
          value={formatCurrency(totalValue)}
          subtext={`@ ${formatCurrency(FIXTURE_PRICE)}/fixture`}
          icon={Wallet}
          color="text-emerald-500"
          onClick={onContinueEditing}
        />
        <StatCard
          label="Recent Estimates"
          value={RECENT_ESTIMATES.length}
          subtext="This week"
          icon={FileText}
          color="text-blue-500"
        />
        <StatCard
          label="Avg. Estimate"
          value={formatCurrency(111108)}
          subtext="YTD average"
          icon={TrendingUp}
          color="text-violet-500"
          trend={12}
        />
      </div>

      {/* Quick Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-surface-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning-500" />
            Quick Start Templates
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.title}
              title={template.title}
              description={template.description}
              color={template.color}
              onClick={() => handleTemplateClick(template.defaults)}
            />
          ))}
        </div>
      </div>

      {/* Recent Estimates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-surface-100 flex items-center gap-2">
            <History className="w-4 h-4 text-surface-400" />
            Recent Estimates
          </h3>
          <button 
            onClick={() => {}}
            className="text-xs text-accent-500 hover:text-accent-400 font-medium transition-colors"
          >
            View All →
          </button>
        </div>

        <div className="space-y-3">
          {RECENT_ESTIMATES.map((estimate) => (
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
        <PhaseDistribution totalValue={totalValue} hasFixtures={hasFixtures} />
        <RecentActivity />
      </div>

      {/* AI Capabilities */}
      <AICapabilities />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

PlansHome.propTypes = {
  fixtures: PropTypes.objectOf(PropTypes.number),
  projectInfo: PropTypes.shape({
    projectName: PropTypes.string,
  }),
  estimate: PropTypes.object,
  totalFixtures: PropTypes.number.isRequired,
  totalValue: PropTypes.number.isRequired,
  onNewEstimate: PropTypes.func.isRequired,
  onLoadEstimate: PropTypes.func.isRequired,
  onContinueEditing: PropTypes.func.isRequired,
  onQuickAddFixture: PropTypes.func.isRequired,
};

PlansHome.defaultProps = {
  fixtures: {},
  projectInfo: {},
  estimate: null,
};

QuickAction.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  description: PropTypes.string,
};

AlertCard.propTypes = {
  type: PropTypes.oneOf(['urgent', 'warning', 'success', 'info']).isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  action: PropTypes.string,
  onAction: PropTypes.func,
  count: PropTypes.number,
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtext: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  trend: PropTypes.number,
  onClick: PropTypes.func,
};

RecentEstimateRow.propTypes = {
  estimate: PropTypes.shape({
    id: PropTypes.number.isRequired,
    projectName: PropTypes.string,
    total: PropTypes.number,
    fixtureCount: PropTypes.number,
    createdAt: PropTypes.string,
    hasAnalysis: PropTypes.bool,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

TemplateCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

ActivityItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['neutral', 'success', 'warning', 'info']),
};

PhaseDistribution.propTypes = {
  totalValue: PropTypes.number.isRequired,
  hasFixtures: PropTypes.bool.isRequired,
};

export default memo(PlansHome);
