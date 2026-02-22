import { useMemo } from 'react';
import { 
  Ruler, Package, FileText, TrendingUp, Clock, CheckCircle2,
  AlertCircle, Sparkles, Zap, Plus, ChevronRight, BarChart3,
  Calculator, Image, Layers, DollarSign, ArrowRight,
  Search, Filter, MoreHorizontal, Download
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

/* ================================================================
   TAKEOFF HOME v2 - Enhanced Material Takeoff Command Center
   - Quick start templates
   - Recent takeoffs
   - Material stats
   - Quick actions
   - Progress tracking
   ================================================================ */

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

const TakeoffRow = ({ takeoff, onClick, isActive }) => {
  const statusColors = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
    active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' }
  }[takeoff.status] || statusColors.draft;

  const progress = takeoff.progress || 0;

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${
        isActive 
          ? 'border-accent-300 bg-accent-50/50 dark:bg-accent-900/10' 
          : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 hover:shadow-md'
      }`}
    >
      {/* Icon */}
      <div className="shrink-0 w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
        <Ruler className="w-6 h-6 text-surface-500 group-hover:text-accent-500 transition-colors" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
            {takeoff.name}
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-medium ${statusColors.bg} ${statusColors.text}`}>
            {statusColors.label}
          </span>
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {takeoff.itemCount || 0} items · {takeoff.measurementCount || 0} measurements
        </p>
        
        {/* Progress bar */}
        <div className="mt-2">
          <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Value & Date */}
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-surface-900">
          {takeoff.totalCost > 0 ? formatCurrency(takeoff.totalCost) : '--'}
        </p>
        <p className="text-xs text-surface-400">
          {new Date(takeoff.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-accent-500 transition-colors" />
    </div>
  );
};

const TemplateCard = ({ title, description, icon: Icon, onClick, color, items }) => (
  <button
    onClick={onClick}
    className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 hover:shadow-md transition-all text-left group"
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3`} style={{ backgroundColor: `${color}15` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <h4 className="font-semibold text-surface-900 dark:text-surface-100 text-sm mb-1">{title}</h4>
    <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">{description}</p>
    <div className="flex items-center gap-2 text-xs text-surface-400">
      <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-700">
        {items} items
      </span>
    </div>
  </button>
);

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

export default function TakeoffHome({ 
  takeoffs = [],
  materials = [],
  onNewTakeoff,
  onSelectTakeoff,
  onViewMaterials,
  onViewReports,
  onQuickTemplate,
  isLoading = false
}) {
  // Compute statistics
  const stats = useMemo(() => {
    const total = takeoffs.length;
    const active = takeoffs.filter(t => t.status === 'active').length;
    const completed = takeoffs.filter(t => t.status === 'completed').length;
    const totalValue = takeoffs.reduce((sum, t) => sum + (t.totalCost || 0), 0);
    const materialCount = materials.length;

    return { total, active, completed, totalValue, materialCount };
  }, [takeoffs, materials]);

  // Recent takeoffs (last 5)
  const recentTakeoffs = useMemo(() => {
    return takeoffs
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }, [takeoffs]);

  // Generate alerts
  const alerts = useMemo(() => {
    const list = [];
    const draftCount = takeoffs.filter(t => t.status === 'draft').length;
    const noMaterials = takeoffs.filter(t => t.itemCount === 0).length;

    if (draftCount > 0) {
      list.push({
        type: 'info',
        title: 'Draft Takeoffs',
        message: `${draftCount} takeoff${draftCount > 1 ? 's' : ''} in draft — complete measurements to finalize`,
        action: 'View Drafts',
        count: draftCount,
      });
    }

    if (noMaterials > 0) {
      list.push({
        type: 'warning',
        title: 'Missing Materials',
        message: `${noMaterials} takeoff${noMaterials > 1 ? 's' : ''} need materials assigned`,
        action: 'Assign Materials',
        count: noMaterials,
      });
    }

    if (stats.materialCount === 0) {
      list.push({
        type: 'info',
        title: 'No Materials',
        message: 'Add materials to your catalog to start assigning to takeoffs',
        action: 'Add Materials',
        onAction: onViewMaterials,
      });
    }

    if (list.length === 0 && stats.total > 0) {
      list.push({
        type: 'success',
        title: 'All Caught Up',
        message: 'Your takeoffs are up to date and ready to go',
      });
    }

    return list;
  }, [takeoffs, stats, onViewMaterials]);

  // Quick templates
  const templates = [
    {
      title: 'Residential Rough-In',
      description: 'Standard 3 bed, 2 bath layout',
      icon: Ruler,
      color: '#3b82f6',
      items: 12,
      defaults: { name: 'Residential Rough-In', items: ['Water heater', 'Lavatories', 'Toilets', 'Tubs', 'Kitchen sink'] },
    },
    {
      title: 'Commercial Unit',
      description: 'Multi-family or office space',
      icon: Layers,
      color: '#10b981',
      items: 18,
      defaults: { name: 'Commercial Unit', items: ['Water heater', 'Restrooms', 'Break room', 'Mop sinks'] },
    },
    {
      title: 'Custom Build',
      description: 'High-end custom home',
      icon: Sparkles,
      color: '#8b5cf6',
      items: 25,
      defaults: { name: 'Custom Build', items: ['Tankless WH', 'Master bath', 'Guest baths', 'Kitchen', 'Bar', 'Outdoor'] },
    },
  ];

  // Recent activity
  const recentActivity = [
    { icon: Ruler, text: 'New measurement added to Westridge Dr', time: '5m ago', type: 'info' },
    { icon: Package, text: 'Material assigned: 3/4" Copper Pipe', time: '15m ago', type: 'success' },
    { icon: CheckCircle2, text: 'Takeoff completed: Summit Plaza', time: '1h ago', type: 'success' },
    { icon: FileText, text: 'Report exported: CSV format', time: '2h ago', type: 'neutral' },
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
            label="New Takeoff" 
            onClick={onNewTakeoff}
            color="text-emerald-600"
            description="Start fresh"
          />
          <QuickAction 
            icon={Ruler} 
            label="Continue" 
            onClick={() => recentTakeoffs[0] && onSelectTakeoff(recentTakeoffs[0])}
            color="text-primary-600"
            description="Recent work"
            disabled={recentTakeoffs.length === 0}
          />
          <QuickAction 
            icon={Package} 
            label="Materials" 
            onClick={onViewMaterials}
            color="text-violet-600"
            description="Catalog"
            badge={stats.materialCount > 0 ? stats.materialCount : null}
          />
          <QuickAction 
            icon={FileText} 
            label="Reports" 
            onClick={onViewReports}
            color="text-blue-600"
            description="Export"
            disabled={stats.total === 0}
          />
          <QuickAction 
            icon={Image} 
            label="Blueprints" 
            onClick={() => {}}
            color="text-amber-600"
            description="Upload"
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Takeoffs"
          value={stats.total}
          subtext={`${stats.active} active`}
          icon={FileText}
          color="text-primary-600"
          onClick={onNewTakeoff}
        />
        <StatCard
          label="Total Value"
          value={formatCurrency(stats.totalValue)}
          subtext="All projects"
          icon={DollarSign}
          color="text-emerald-600"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          subtext={`${Math.round((stats.completed / (stats.total || 1)) * 100)}% done`}
          icon={CheckCircle2}
          color="text-blue-600"
        />
        <StatCard
          label="Materials"
          value={stats.materialCount}
          subtext="In catalog"
          icon={Package}
          color="text-violet-600"
          onClick={onViewMaterials}
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
              onClick={() => onQuickTemplate?.(template.defaults)}
            />
          ))}
        </div>
      </div>

      {/* Recent Takeoffs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-surface-400" />
            Recent Takeoffs
          </h3>
          {takeoffs.length > 5 && (
            <button 
              onClick={onNewTakeoff}
              className="text-xs text-accent-600 hover:text-accent-700 font-medium"
            >
              View All →
            </button>
          )}
        </div>

        <div className="space-y-3">
          {recentTakeoffs.length > 0 ? (
            recentTakeoffs.map((takeoff) => (
              <TakeoffRow
                key={takeoff.id}
                takeoff={takeoff}
                onClick={() => onSelectTakeoff(takeoff)}
                isActive={false}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-300">
              <Ruler className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 dark:text-surface-400 text-sm">No takeoffs yet</p>
              <p className="text-surface-400 text-xs mt-1 mb-4">Create your first material takeoff</p>
              <button 
                onClick={onNewTakeoff}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Takeoff
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Measurement Types */}
        <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-surface-400" />
            Measurement Types
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Linear Feet', desc: 'Pipes, conduits', color: '#2563eb', icon: Ruler },
              { label: 'Area (sq ft)', desc: 'Slabs, floors', color: '#16a34a', icon: Layers },
              { label: 'Count', desc: 'Fixtures, fittings', color: '#dc2626', icon: Calculator },
              { label: 'Annotations', desc: 'Notes, flags', color: '#64748b', icon: FileText },
            ].map((type) => (
              <div key={type.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${type.color}15` }}>
                  <type.icon className="w-4 h-4" style={{ color: type.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-800">{type.label}</p>
                  <p className="text-xs text-surface-500">{type.desc}</p>
                </div>
              </div>
            ))}
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

      {/* Tips & Help */}
      <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Tips for Accurate Takeoffs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: 'Set Scale First', desc: 'Calibrate your blueprint before measuring' },
            { title: 'Use Layers', desc: 'Organize by phase or system' },
            { title: 'Review Counts', desc: 'Double-check fixture quantities' },
          ].map((tip) => (
            <div key={tip.title} className="p-3 rounded-lg bg-white/80 dark:bg-surface-800/80">
              <p className="text-xs font-semibold text-surface-800">{tip.title}</p>
              <p className="text-xs text-surface-500 mt-1">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
