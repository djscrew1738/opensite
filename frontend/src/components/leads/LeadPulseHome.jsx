/**
 * LeadPulseHome Component
 * Lead command center dashboard with smart alerts and stats
 * 
 * @module components/leads/LeadPulseHome
 */

import { useState, useMemo, memo, useCallback } from 'react';
import { 
  Flame, Snowflake, Sun, Target, TrendingUp, Users, 
  Building2, MapPin, Calendar, Filter, Plus, Download,
  Mail, Phone, CheckCircle2, AlertCircle, Clock, Zap,
  Search, ChevronRight, BarChart3, Sparkles, Flag
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, { color: string; icon: any; label: string }>} */
const TIER_STYLES = {
  hot: { 
    color: colors.danger.DEFAULT, 
    icon: Flame,
    label: 'Hot'
  },
  warm: { 
    color: colors.warning.DEFAULT, 
    icon: Sun,
    label: 'Warm'
  },
  cold: { 
    color: colors.text.muted, 
    icon: Snowflake,
    label: 'Cold'
  },
};

/** @type {Record<string, { color: string; label: string; icon: string }>} */
const STATUS_STYLES = {
  new: { color: colors.info.DEFAULT, label: 'New', icon: '●' },
  contacted: { color: colors.warning.DEFAULT, label: 'Contacted', icon: '✉' },
  responded: { color: colors.success.DEFAULT, label: 'Responded', icon: '↩' },
  quoted: { color: colors.accent.purple, label: 'Quoted', icon: '📝' },
  won: { color: colors.success.dark, label: 'Won', icon: '✓' },
  lost: { color: colors.text.muted, label: 'Lost', icon: '✕' },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Quick action button
 * @param {{ icon: any; label: string; onClick: () => void; color?: string; badge?: number | null; disabled?: boolean }} props
 */
const QuickAction = memo(function QuickAction({ icon: Icon, label, onClick, color, badge = null, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 min-w-[80px]"
      style={{
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = colors.accent.DEFAULT;
          e.currentTarget.style.boxShadow = shadows.card;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = colors.border.default;
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div className="relative">
        <Icon style={{ color, width: '24px', height: '24px' }} />
        {badge && (
          <span 
            className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full text-xs font-semibold flex items-center justify-center px-1"
            style={{ backgroundColor: colors.danger.DEFAULT, color: colors.text.inverse }}
          >
            {badge}
          </span>
        )}
      </div>
      <span style={{ color: colors.text.secondary, fontSize: '12px', fontWeight: 500 }}>{label}</span>
    </button>
  );
});

QuickAction.displayName = 'QuickAction';

/**
 * Alert card for notifications
 * @param {{ type: 'urgent' | 'warning' | 'success' | 'info'; title: string; message: string; action?: string; onAction?: () => void; count?: number }} props
 */
const AlertCard = memo(function AlertCard({ type, title, message, action, onAction, count }) {
  const styles = {
    urgent: { border: colors.danger.border, bg: colors.danger.muted, icon: AlertCircle, iconColor: colors.danger.DEFAULT },
    warning: { border: colors.warning.border, bg: colors.warning.muted, icon: Clock, iconColor: colors.warning.DEFAULT },
    success: { border: colors.success.border, bg: colors.success.muted, icon: CheckCircle2, iconColor: colors.success.DEFAULT },
    info: { border: colors.info.border, bg: colors.info.muted, icon: Sparkles, iconColor: colors.info.DEFAULT },
  }[type];
  const Icon = styles.icon;

  return (
    <div 
      className="flex items-start gap-3 p-4 rounded-xl border"
      style={{ 
        borderColor: styles.border, 
        backgroundColor: styles.bg,
      }}
    >
      <Icon style={{ color: styles.iconColor, width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 style={{ color: colors.text.primary, fontSize: '14px', fontWeight: 600 }}>{title}</h4>
          {count > 0 && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: colors.surface.card, color: colors.text.secondary }}
            >
              {count}
            </span>
          )}
        </div>
        <p style={{ color: colors.text.secondary, fontSize: '12px', lineHeight: 1.5 }}>{message}</p>
        {action && (
          <button
            onClick={onAction}
            className="mt-2 text-xs font-semibold flex items-center gap-1"
            style={{ color: colors.accent.DEFAULT }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
          >
            {action} <ChevronRight style={{ width: '12px', height: '12px' }} />
          </button>
        )}
      </div>
    </div>
  );
});

AlertCard.displayName = 'AlertCard';

/**
 * Stat card for dashboard metrics
 * @param {{ label: string; value: string | number; subtext?: string; icon: any; color?: string; trend?: number | null; onClick?: () => void }} props
 */
const StatCard = memo(function StatCard({ label, value, subtext, icon: Icon, color, trend = null, onClick }) {
  const getColorValue = (colorStr) => {
    const map = {
      'text-red-600': colors.danger.DEFAULT,
      'text-orange-600': colors.warning.DEFAULT,
      'text-emerald-600': colors.success.DEFAULT,
      'text-blue-600': colors.info.DEFAULT,
    };
    return map[color] || colors.accent.DEFAULT;
  };

  const colorValue = getColorValue(color);
  const bgColor = colorValue + '1A'; // 10% opacity

  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-xl border transition-all cursor-pointer"
      style={{ 
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.accent.DEFAULT;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: bgColor }}
        >
          <Icon style={{ color: colorValue, width: '16px', height: '16px' }} />
        </div>
        {trend && (
          <span 
            className="text-xs font-semibold"
            style={{ color: trend > 0 ? colors.success.DEFAULT : colors.danger.DEFAULT }}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div style={{ color: colors.text.primary, fontSize: '24px', fontWeight: 700 }}>{value}</div>
      <div style={{ color: colors.text.secondary, fontSize: '12px', fontWeight: 500 }}>{label}</div>
      {subtext && <div style={{ color: colors.text.muted, fontSize: '12px', marginTop: '4px' }}>{subtext}</div>}
    </div>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Priority lead row
 * @param {{ lead: any; type: 'manual' | 'permit'; onClick: () => void }} props
 */
const PriorityLeadRow = memo(function PriorityLeadRow({ lead, type, onClick }) {
  const isManual = type === 'manual';
  const tier = TIER_STYLES[lead.status || lead.icpTier] || TIER_STYLES.cold;
  const TierIcon = tier.icon;
  const status = STATUS_STYLES[lead.contactStatus || 'new'] || STATUS_STYLES.new;

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer"
      style={{ 
        backgroundColor: colors.surface.card,
        borderColor: colors.border.default,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.accent.DEFAULT;
        e.currentTarget.style.boxShadow = shadows.card;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Score/Tier */}
      <div className="shrink-0 text-center">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
          style={{ 
            backgroundColor: tier.color + '10',
            borderColor: tier.color + '40',
          }}
        >
          <TierIcon style={{ color: tier.color, width: '20px', height: '20px' }} />
        </div>
        <span style={{ color: colors.text.muted, fontSize: '12px', fontWeight: 700, marginTop: '4px', display: 'block' }}>
          {lead.score || lead.icpScore || '--'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 style={{ color: colors.text.primary, fontWeight: 600 }} className="truncate">
            {isManual ? lead.name : lead.contractorName || lead.businessName}
          </h4>
          <span 
            className="px-2 py-0.5 rounded-full text-2xs font-medium"
            style={{ backgroundColor: status.color + '15', color: colors.text.secondary }}
          >
            {status.icon} {status.label}
          </span>
        </div>
        <p style={{ color: colors.text.secondary, fontSize: '14px' }} className="truncate">
          {isManual ? lead.company : lead.address}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: colors.text.muted }}>
          {lead.value > 0 && (
            <span className="flex items-center gap-1" style={{ color: colors.success.DEFAULT, fontWeight: 500 }}>
              <Target style={{ width: '12px', height: '12px' }} /> {formatCurrency(lead.value)}
            </span>
          )}
          {lead.email && (
            <span className="flex items-center gap-1">
              <Mail style={{ width: '12px', height: '12px' }} /> Email
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1">
              <Phone style={{ width: '12px', height: '12px' }} /> Phone
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight style={{ color: colors.border.strong, width: '20px', height: '20px' }} />
    </div>
  );
});

PriorityLeadRow.displayName = 'PriorityLeadRow';

/**
 * Activity item for timeline
 * @param {{ icon: any; text: string; time: string; type?: 'neutral' | 'success' | 'warning' | 'info' }} props
 */
const ActivityItem = memo(function ActivityItem({ icon: Icon, text, time, type = 'neutral' }) {
  const typeColors = {
    neutral: colors.text.muted,
    success: colors.success.DEFAULT,
    warning: colors.warning.DEFAULT,
    info: colors.info.DEFAULT,
  };
  
  return (
    <div 
      className="flex items-center gap-3 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${colors.border.default}` }}
    >
      <div 
        className="p-2 rounded-lg"
        style={{ backgroundColor: colors.surface.elevated, color: typeColors[type] }}
      >
        <Icon style={{ width: '16px', height: '16px' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: colors.text.secondary, fontSize: '14px' }} className="truncate">{text}</p>
      </div>
      <span style={{ color: colors.text.muted, fontSize: '12px', whiteSpace: 'nowrap' }}>{time}</span>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * LeadPulseHome - Lead dashboard and command center
 * @param {{ manualLeads?: any[]; permits?: any[]; onAddLead?: () => void; onViewLead?: (lead: any) => void; onViewPermit?: (permit: any) => void; onTabChange?: (tab: string) => void; onOpenSearch?: () => void; isLoading?: boolean }} props
 */
const LeadPulseHome = memo(function LeadPulseHome({ 
  manualLeads = [], 
  permits = [],
  onAddLead, 
  onViewLead, 
  onViewPermit,
  onTabChange,
  onOpenSearch,
  isLoading = false
}) {
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

  const handleTabChange = useCallback((tab) => onTabChange?.(tab), [onTabChange]);
  const handleAddLead = useCallback(() => onAddLead?.(), [onAddLead]);
  const handleOpenSearch = useCallback(() => onOpenSearch?.(), [onOpenSearch]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div 
              key={i} 
              className="h-24 rounded-xl" 
              style={{ backgroundColor: colors.surface.elevated }}
            />
          ))}
        </div>
        <div 
          className="h-40 rounded-xl" 
          style={{ backgroundColor: colors.surface.elevated }}
        />
        <div 
          className="h-60 rounded-xl" 
          style={{ backgroundColor: colors.surface.elevated }}
        />
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
        <h3 
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: colors.text.muted }}
        >
          Quick Actions
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <QuickAction 
            icon={Plus} 
            label="Add Lead" 
            onClick={handleAddLead}
            color={colors.success.DEFAULT}
          />
          <QuickAction 
            icon={Search} 
            label="Search" 
            onClick={handleOpenSearch}
            color={colors.info.DEFAULT}
          />
          <QuickAction 
            icon={Building2} 
            label="Permits" 
            onClick={() => handleTabChange('permits')}
            color={colors.accent.purple}
            badge={(Array.isArray(permits) ? permits : []).filter(p => p.leadStatus === 'new').length || null}
          />
          <QuickAction 
            icon={MapPin} 
            label="Cities" 
            onClick={() => handleTabChange('cities')}
            color={colors.warning.DEFAULT}
          />
          <QuickAction 
            icon={Download} 
            label="Export" 
            onClick={() => {}}
            color={colors.text.secondary}
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
          onClick={() => handleTabChange('manual')}
        />
        <StatCard
          label="Warm Leads"
          value={stats.warm}
          subtext="Nurture ready"
          icon={Sun}
          color="text-orange-600"
          onClick={() => handleTabChange('manual')}
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
          <h3 
            className="text-sm font-bold flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <Zap style={{ color: colors.warning.DEFAULT, width: '16px', height: '16px' }} />
            Priority Leads
          </h3>
          <button 
            onClick={() => handleTabChange('manual')}
            className="text-xs font-medium"
            style={{ color: colors.accent.DEFAULT }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.hover}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
          >
            View All →
          </button>
        </div>

        <div className="space-y-3">
          {priorityLeads.length > 0 ? (
            priorityLeads.map((lead) => (
              <PriorityLeadRow
                key={lead.id}
                lead={lead}
                type={lead.type}
                onClick={() => lead.type === 'manual' ? onViewLead?.(lead) : onViewPermit?.(lead)}
              />
            ))
          ) : (
            <div 
              className="text-center py-12 rounded-xl border border-dashed"
              style={{ backgroundColor: colors.surface.card, borderColor: colors.border.strong }}
            >
              <Target style={{ color: colors.border.strong, width: '48px', height: '48px' }} className="mx-auto mb-3" />
              <p style={{ color: colors.text.secondary, fontSize: '14px' }}>No priority leads yet</p>
              <p style={{ color: colors.text.muted, fontSize: '12px', marginTop: '4px' }}>Add leads or run discovery to find hot prospects</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <div 
          className="p-5 rounded-xl border"
          style={{ backgroundColor: colors.surface.card, borderColor: colors.border.default }}
        >
          <h3 
            className="text-sm font-bold mb-4 flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <BarChart3 style={{ color: colors.text.muted, width: '16px', height: '16px' }} />
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
                    <span 
                      className="text-sm flex items-center gap-2"
                      style={{ color: colors.text.secondary }}
                    >
                      <style.icon style={{ color: style.color, width: '16px', height: '16px' }} />
                      {style.label}
                    </span>
                    <span style={{ color: colors.text.primary, fontSize: '14px', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div 
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.surface.elevated }}
                  >
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
        <div 
          className="p-5 rounded-xl border"
          style={{ backgroundColor: colors.surface.card, borderColor: colors.border.default }}
        >
          <h3 
            className="text-sm font-bold mb-4 flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <Clock style={{ color: colors.text.muted, width: '16px', height: '16px' }} />
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
        <div 
          className="p-5 rounded-xl border"
          style={{ backgroundColor: colors.surface.card, borderColor: colors.border.default }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-sm font-bold flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <Building2 style={{ color: colors.text.muted, width: '16px', height: '16px' }} />
              Permit Pipeline
            </h3>
            <button 
              onClick={() => handleTabChange('permits')}
              className="text-xs font-medium"
              style={{ color: colors.accent.DEFAULT }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.hover}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Hot', count: permits.filter(p => p.leadTier === 'hot').length, color: colors.danger.DEFAULT },
              { label: 'Warm', count: permits.filter(p => p.leadTier === 'warm').length, color: colors.warning.DEFAULT },
              { label: 'Cold', count: permits.filter(p => p.leadTier === 'cold').length, color: colors.text.muted },
            ].map((stat) => (
              <div 
                key={stat.label} 
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: colors.surface.elevated }}
              >
                <div 
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: stat.color }}
                />
                <div style={{ color: colors.text.primary, fontSize: '24px', fontWeight: 700 }}>{stat.count}</div>
                <div style={{ color: colors.text.muted, fontSize: '12px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

LeadPulseHome.displayName = 'LeadPulseHome';

export default LeadPulseHome;
