import { useState, useMemo } from 'react';
import { 
  Flame, Snowflake, Sun, Target, TrendingUp, Users, 
  Building2, MapPin, Calendar, Filter, Plus, Download,
  Mail, Phone, CheckCircle2, AlertCircle, Clock, Zap,
  Search, ChevronRight, BarChart3, Sparkles, Flag
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

/* ================================================================
   LEAD PULSE HOME v2 - Enhanced Lead Command Center
   - Smart alerts & priority indicators
   - Quick action dock
   - Visual stats dashboard
   - Priority lead cards
   - Activity timeline
   ================================================================ */

const TIER_STYLES = {
  hot: { 
    color: '#EF4444', 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    text: 'text-red-700',
    icon: Flame,
    label: 'Hot'
  },
  warm: { 
    color: '#F97316', 
    bg: 'bg-orange-50', 
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: Sun,
    label: 'Warm'
  },
  cold: { 
    color: '#64748B', 
    bg: 'bg-slate-50', 
    border: 'border-slate-200',
    text: 'text-slate-600',
    icon: Snowflake,
    label: 'Cold'
  },
};

const STATUS_STYLES = {
  new: { color: '#3B82F6', bg: 'bg-blue-50', label: 'New', icon: '●' },
  contacted: { color: '#F59E0B', bg: 'bg-amber-50', label: 'Contacted', icon: '✉' },
  responded: { color: '#10B981', bg: 'bg-emerald-50', label: 'Responded', icon: '↩' },
  quoted: { color: '#8B5CF6', bg: 'bg-violet-50', label: 'Quoted', icon: '📝' },
  won: { color: '#059669', bg: 'bg-green-50', label: 'Won', icon: '✓' },
  lost: { color: '#6B7280', bg: 'bg-gray-50', label: 'Lost', icon: '✕' },
};

/* -- COMPONENTS -- */

const QuickAction = ({ icon: Icon, label, onClick, color = 'text-accent-600', badge = null, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 transition-all duration-200 min-w-[80px] ${
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

const PriorityLeadRow = ({ lead, type, onClick }) => {
  const isManual = type === 'manual';
  const tier = TIER_STYLES[lead.status || lead.icpTier] || TIER_STYLES.cold;
  const TierIcon = tier.icon || snowflake;
  const status = STATUS_STYLES[lead.contactStatus || 'new'] || STATUS_STYLES.new;

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-accent-300 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Score/Tier */}
      <div className="shrink-0 text-center">
        <div className={`w-12 h-12 rounded-xl ${tier.bg} flex items-center justify-center border-2 ${tier.border}`}>
          <TierIcon className={`w-5 h-5 ${tier.text}`} />
        </div>
        <span className="text-xs font-bold text-surface-500 mt-1 block">
          {lead.score || lead.icpScore || '--'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100 truncate">
            {isManual ? lead.name : lead.contractorName || lead.businessName}
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-2xs font-medium ${status.bg} text-surface-600`}>
            {status.icon} {status.label}
          </span>
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
          {isManual ? lead.company : lead.address}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
          {lead.value > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Target className="w-3 h-3" /> {formatCurrency(lead.value)}
            </span>
          )}
          {lead.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-accent-500 transition-colors" />
    </div>
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

export default function LeadPulseHome({ 
  manualLeads = [], 
  permits = [],
  onAddLead, 
  onViewLead, 
  onViewPermit,
  onTabChange,
  onOpenSearch,
  isLoading = false
}) {
  const [filter, setFilter] = useState('all');

  // Compute statistics
  const stats = useMemo(() => {
    const manual = Array.isArray(manualLeads) ? manualLeads : [];
    const safePermits = Array.isArray(permits) ? permits : [];
    
    const hot = [...manual.filter(l => l && l.status === 'hot'), ...safePermits.filter(p => p && p.leadTier === 'hot')];
    const warm = [...manual.filter(l => l && l.status === 'warm'), ...safePermits.filter(p => p && p.leadTier === 'warm')];
    const totalValue = manual.reduce((s, l) => s + (l?.value || 0), 0) + 
                      safePermits.reduce((s, p) => s + (p?.estimatedCost || 0), 0);
    const contacted = manual.filter(l => l && l.contactStatus === 'contacted').length;
    const newLeads = manual.filter(l => l && (!l.contactStatus || l.contactStatus === 'new')).length;

    return { hot: hot.length, warm: warm.length, total: manual.length + safePermits.length, totalValue, contacted, newLeads };
  }, [manualLeads, permits]);

  // Generate smart alerts
  const alerts = useMemo(() => {
    const list = [];
    const manual = Array.isArray(manualLeads) ? manualLeads : [];
    const safePermits = Array.isArray(permits) ? permits : [];
    
    const hotNoContact = manual.filter(l => l && l.status === 'hot' && (!l.contactStatus || l.contactStatus === 'new'));
    const unassignedPermits = safePermits.filter(p => p && p.leadTier === 'hot' && (p.status === 'new' || p.leadStatus === 'new'));
    
    if (hotNoContact.length > 0) {
      list.push({
        type: 'urgent',
        title: 'Hot Leads Need Contact',
        message: `${hotNoContact.length} hot lead${hotNoContact.length > 1 ? 's' : ''} haven't been contacted yet`,
        action: 'View Hot Leads',
        count: hotNoContact.length,
        onAction: () => onTabChange('manual'),
      });
    }
    
    if (unassignedPermits.length > 0) {
      list.push({
        type: 'info',
        title: 'New Permit Leads',
        message: `${unassignedPermits.length} new permit${unassignedPermits.length > 1 ? 's' : ''} to review`,
        action: 'View Permits',
        count: unassignedPermits.length,
        onAction: () => onTabChange('permits'),
      });
    }

    if (stats.warm > stats.hot * 2) {
      list.push({
        type: 'success',
        title: 'Nurture Opportunity',
        message: `${stats.warm} warm leads ready for follow-up`,
        action: 'View Warm',
        count: stats.warm,
        onAction: () => onTabChange('manual'),
      });
    }

    return list;
  }, [manualLeads, permits, stats, onTabChange]);

  // Get priority leads (hot first, then warm, sorted by score)
  const priorityLeads = useMemo(() => {
    const manual = Array.isArray(manualLeads) ? manualLeads : [];
    const safePermits = Array.isArray(permits) ? permits : [];
    
    const all = [
      ...manual.filter(l => l && typeof l === 'object').map(l => ({ ...l, type: 'manual' })),
      ...safePermits.filter(p => p && typeof p === 'object').map(p => ({ ...p, type: 'permit', status: p.leadTier, score: p.leadScore }))
    ];
    return all
      .filter(l => (l.status === 'hot' || l.icpTier === 'hot') && (l.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  }, [manualLeads, permits]);

  // Recent activity (mock data - would come from API)
  const recentActivity = [
    { icon: Flame, text: 'New hot lead: Horizon Homes project', time: '2m ago', type: 'warning' },
    { icon: Mail, text: 'Email sent to Summit Builders', time: '15m ago', type: 'neutral' },
    { icon: CheckCircle2, text: 'Lead converted: Redbrick Dev', time: '1h ago', type: 'success' },
    { icon: Building2, text: 'New permits imported from Dallas', time: '2h ago', type: 'info' },
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
            label="Add Lead" 
            onClick={onAddLead}
            color="text-emerald-600"
          />
          <QuickAction 
            icon={Search} 
            label="Search" 
            onClick={onOpenSearch}
            color="text-blue-600"
          />
          <QuickAction 
            icon={Building2} 
            label="Permits" 
            onClick={() => onTabChange('permits')}
            color="text-violet-600"
            badge={permits.filter(p => p.leadStatus === 'new').length || null}
          />
          <QuickAction 
            icon={MapPin} 
            label="Cities" 
            onClick={() => onTabChange('cities')}
            color="text-amber-600"
          />
          <QuickAction 
            icon={Download} 
            label="Export" 
            onClick={() => {}}
            color="text-surface-600"
            disabled
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Hot Leads"
          value={stats.hot}
          subtext="Need attention"
          icon={Flame}
          color="text-red-600"
          onClick={() => onTabChange('manual')}
        />
        <StatCard
          label="Warm Leads"
          value={stats.warm}
          subtext="Nurture ready"
          icon={Sun}
          color="text-orange-600"
          onClick={() => onTabChange('manual')}
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(stats.totalValue)}
          subtext="Total estimated"
          icon={TrendingUp}
          color="text-emerald-600"
        />
        <StatCard
          label="New This Week"
          value={stats.newLeads}
          subtext="Not yet contacted"
          icon={Sparkles}
          color="text-blue-600"
        />
      </div>

      {/* Priority Leads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Priority Leads
          </h3>
          <button 
            onClick={() => onTabChange('manual')}
            className="text-xs text-accent-600 hover:text-accent-700 font-medium"
          >
            View All →
          </button>
        </div>

        <div className="space-y-3">
          {priorityLeads.length > 0 ? (
            priorityLeads.map((lead, i) => (
              <PriorityLeadRow
                key={lead.id}
                lead={lead}
                type={lead.type}
                onClick={() => lead.type === 'manual' ? onViewLead(lead) : onViewPermit(lead)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-300">
              <Target className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 dark:text-surface-400 text-sm">No priority leads yet</p>
              <p className="text-surface-400 text-xs mt-1">Add leads or run discovery to find hot prospects</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-surface-400" />
            Lead Distribution
          </h3>
          <div className="space-y-4">
            {['hot', 'warm', 'cold'].map((tier) => {
              const count = manualLeads.filter(l => l.status === tier).length;
              const total = manualLeads.length || 1;
              const pct = Math.round((count / total) * 100);
              const style = TIER_STYLES[tier];
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-surface-700 dark:text-surface-300 flex items-center gap-2">
                      <style.icon className="w-4 h-4" style={{ color: style.color }} />
                      {style.label}
                    </span>
                    <span className="text-sm font-bold text-surface-900">{count}</span>
                  </div>
                  <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: style.color }}
                    />
                  </div>
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

      {/* Permit Pipeline Preview */}
      {permits.length > 0 && (
        <div className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-surface-400" />
              Permit Pipeline
            </h3>
            <button 
              onClick={() => onTabChange('permits')}
              className="text-xs text-accent-600 hover:text-accent-700 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Hot', count: permits.filter(p => p.leadTier === 'hot').length, color: 'bg-red-500' },
              { label: 'Warm', count: permits.filter(p => p.leadTier === 'warm').length, color: 'bg-orange-500' },
              { label: 'Cold', count: permits.filter(p => p.leadTier === 'cold').length, color: 'bg-slate-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-lg bg-surface-50 dark:bg-surface-900">
                <div className={`w-3 h-3 rounded-full ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-surface-900">{stat.count}</div>
                <div className="text-xs text-surface-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
