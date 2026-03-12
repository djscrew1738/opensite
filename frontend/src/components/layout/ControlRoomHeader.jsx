/**
 * ControlRoomHeader Component
 * Main application header with live stats and field mode toggle
 * 
 * @module components/layout/ControlRoomHeader
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { 
  Briefcase, CheckCircle2, AlertTriangle, Clock,
  DollarSign, TrendingUp, Activity, Zap, Menu,
  Bell, Search, Command, Sun
} from 'lucide-react';
import { useFieldMode } from '../../hooks/useFieldMode';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Badge } from '../ui/Badge';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

// Field mode colors - high visibility for outdoor use
const FIELD_MODE_COLORS = {
  active: '#00ff88',    // Bright green for active
  indicator: '#ff4444', // Red indicator dot
};

// Stat color configurations
const STAT_COLORS = {
  brand: { text: colors.accent.DEFAULT, bg: colors.accent.muted },
  success: { text: colors.success.DEFAULT, bg: colors.success.muted },
  warning: { text: colors.warning.DEFAULT, bg: colors.warning.muted },
  danger: { text: colors.danger.DEFAULT, bg: colors.danger.muted },
  info: { text: colors.info.DEFAULT, bg: colors.info.muted },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Stat Counter with animation
 * @param {{value: number | string, label: string, icon: any, color: string, trend?: number}} props
 */
const StatCounter = memo(function StatCounter({ value, label, icon: Icon, color = 'brand', trend }) {
  const [displayValue, setDisplayValue] = useState(0);
  const colorConfig = STAT_COLORS[color] || STAT_COLORS.brand;
  
  useEffect(() => {
    if (value === undefined || value === null) return;
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  const displayText = typeof value === 'string' ? value : displayValue.toLocaleString();
  const trendColor = trend >= 0 ? colors.success.DEFAULT : colors.danger.DEFAULT;
  
  return (
    <Motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl transition-colors"
      style={{
        backgroundColor: `${colors.surface.elevated}80`, // 50% opacity
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ 
          backgroundColor: colorConfig.bg,
          color: colorConfig.text,
        }}
      >
        <Icon style={{ width: '16px', height: '16px' }} />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span 
            className="text-xl font-bold font-mono tabular-nums"
            style={{ color: colors.text.primary }}
          >
            {displayText}
          </span>
          {trend !== undefined && (
            <span style={{ color: trendColor, fontSize: '12px' }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p 
          className="text-xs uppercase tracking-wider font-medium"
          style={{ color: colors.text.muted }}
        >
          {label}
        </p>
      </div>
    </Motion.div>
  );
});

StatCounter.displayName = 'StatCounter';

/**
 * Alert Badge for notifications
 * @param {{count: number, type?: 'warning' | 'critical'}} props
 */
const AlertBadge = memo(function AlertBadge({ count, type = 'warning' }) {
  if (!count || count === 0) return null;
  
  const isCritical = type === 'critical';
  const bgColor = isCritical ? colors.danger.DEFAULT : colors.warning.DEFAULT;
  const textColor = isCritical ? colors.text.inverse : colors.text.inverse;
  
  return (
    <Motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {count > 99 ? '99+' : count}
    </Motion.div>
  );
});

AlertBadge.displayName = 'AlertBadge';

/**
 * Global Search Trigger Button
 * @param {{onClick: () => void}} props
 */
const GlobalSearch = memo(function GlobalSearch({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
      style={{
        backgroundColor: colors.surface.elevated,
        border: `1px solid ${colors.border.default}`,
        color: colors.text.muted,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.border.strong;
        e.currentTarget.style.color = colors.text.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.default;
        e.currentTarget.style.color = colors.text.muted;
      }}
    >
      <Search style={{ width: '16px', height: '16px' }} />
      <span className="text-sm hidden lg:block">Search...</span>
      <kbd 
        className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded"
        style={{
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <Command style={{ width: '12px', height: '12px' }} />K
      </kbd>
    </button>
  );
});

GlobalSearch.displayName = 'GlobalSearch';

/**
 * Field Mode Toggle Button
 * @param {{isFieldMode: boolean, onToggle: () => void}} props
 */
const FieldModeToggle = memo(function FieldModeToggle({ isFieldMode, onToggle }) {
  return (
    <Motion.button
      onClick={onToggle}
      whileHover={isFieldMode ? {} : { borderColor: colors.border.strong, color: colors.text.primary }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg font-semibold"
      style={{
        minHeight: 40,
        backgroundColor: isFieldMode ? FIELD_MODE_COLORS.active : colors.surface.elevated,
        color: isFieldMode ? colors.text.inverse : colors.text.secondary,
        border: `1px solid ${isFieldMode ? FIELD_MODE_COLORS.active : colors.border.default}`,
        boxShadow: isFieldMode ? `0 0 20px ${FIELD_MODE_COLORS.active}66` : 'none',
      }}
      aria-pressed={isFieldMode}
      aria-label={isFieldMode ? 'Disable Field Mode' : 'Enable Field Mode'}
      title={isFieldMode ? 'Field Mode On - Outdoor optimized' : 'Enable Field Mode for outdoor use'}
    >
      <Sun 
        style={{ 
          width: '16px', 
          height: '16px',
          animation: isFieldMode ? 'pulse 2s infinite' : 'none',
        }}
        strokeWidth={isFieldMode ? 2.5 : 2}
      />
      <span className="hidden xl:inline text-sm">
        {isFieldMode ? 'Field On' : 'Field Mode'}
      </span>
      {isFieldMode && (
        <span 
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: FIELD_MODE_COLORS.indicator }}
        />
      )}
    </Motion.button>
  );
});

FieldModeToggle.displayName = 'FieldModeToggle';

/**
 * Logo and brand section
 */
const BrandLogo = memo(function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${colors.accent.DEFAULT}, ${colors.accent.hover})`,
          boxShadow: shadows.glowBlue,
        }}
      >
        <Zap style={{ width: '20px', height: '20px', color: colors.text.inverse }} />
      </div>
      <div className="hidden sm:block">
        <h1 
          className="text-lg font-bold leading-none"
          style={{ color: colors.text.primary }}
        >
          OpenSite
        </h1>
        <p 
          className="text-xs uppercase tracking-widest mt-0.5"
          style={{ color: colors.text.muted }}
        >
          Command Center
        </p>
      </div>
    </div>
  );
});

BrandLogo.displayName = 'BrandLogo';

/**
 * User avatar placeholder
 */
const UserAvatar = memo(function UserAvatar() {
  return (
    <div 
      className="w-9 h-9 rounded-xl flex items-center justify-center ml-2"
      style={{
        backgroundColor: colors.surface.elevated,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <span 
        className="text-sm font-semibold"
        style={{ color: colors.text.secondary }}
      >
        CTL
      </span>
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * ControlRoomHeader - Main application header with live stats
 * @param {{
 *   onMenuClick?: () => void;
 *   onSearchClick?: () => void;
 *   onNotificationsClick?: () => void;
 *   hasUnreadNotifications?: boolean;
 *   notificationCount?: number;
 * }} props
 */
export const ControlRoomHeader = memo(function ControlRoomHeader({ 
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  hasUnreadNotifications = false,
  notificationCount = 0,
}) {
  const { isFieldMode, toggleFieldMode } = useFieldMode();
  
  // Fetch live stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.dashboard.getStats();
        return response.data;
      } catch (err) {
        return {
          activeJobs: 0,
          phasesCompleted: 0,
          inspectionsPending: 0,
          overdueJobs: 0,
          estimatedReceivables: 0,
          receivablesTrend: 0,
        };
      }
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
  
  const formatCurrency = useCallback((val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  }, []);
  
  return (
    <header 
      className="sticky top-0 z-40 backdrop-blur-xl border-b"
      style={{
        backgroundColor: `${colors.surface.primary}F2`, // 95% opacity
        borderColor: colors.border.default,
      }}
    >
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface.elevated}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Menu style={{ width: '20px', height: '20px' }} />
            </button>
            
            <BrandLogo />
          </div>
          
          {/* Center: Live Stats */}
          <div className="hidden xl:flex items-center gap-2">
            <StatCounter
              value={stats?.activeJobs}
              label="Active Jobs"
              icon={Briefcase}
              color="brand"
            />
            <StatCounter
              value={stats?.phasesCompleted}
              label="Phases Done"
              icon={CheckCircle2}
              color="success"
            />
            <StatCounter
              value={stats?.inspectionsPending}
              label="Inspections"
              icon={Clock}
              color="warning"
            />
            <div 
              className="w-px h-8 mx-1"
              style={{ backgroundColor: colors.border.default }}
            />
            <StatCounter
              value={formatCurrency(stats?.estimatedReceivables)}
              label="Est. Receivables"
              icon={DollarSign}
              color="info"
              trend={stats?.receivablesTrend}
            />
            
            {stats?.overdueJobs > 0 && (
              <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: colors.danger.muted,
                  border: `1px solid ${colors.danger.border}`,
                }}
              >
                <AlertTriangle style={{ width: '16px', height: '16px', color: colors.danger.DEFAULT }} />
                <div>
                  <span 
                    className="text-lg font-bold font-mono"
                    style={{ color: colors.danger.DEFAULT }}
                  >
                    {stats.overdueJobs}
                  </span>
                  <p 
                    className="text-xs uppercase tracking-wider"
                    style={{ color: `${colors.danger.DEFAULT}B3` }}
                  >
                    Overdue
                  </p>
                </div>
              </Motion.div>
            )}
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <FieldModeToggle 
              isFieldMode={isFieldMode} 
              onToggle={toggleFieldMode} 
            />

            <GlobalSearch onClick={onSearchClick} />
            
            <button
              onClick={onNotificationsClick}
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface.elevated;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              <Bell style={{ width: '20px', height: '20px' }} />
              <AlertBadge 
                count={notificationCount} 
                type={notificationCount > 5 ? 'critical' : 'warning'} 
              />
            </button>
            
            <UserAvatar />
          </div>
        </div>
        
        {/* Mobile Stats Scroll */}
        <div 
          className="xl:hidden mt-3 pt-3 overflow-x-auto scrollbar-hide"
          style={{ borderTop: `1px solid ${colors.border.default}` }}
        >
          <div className="flex items-center gap-2 pb-1">
            <StatCounter
              value={stats?.activeJobs}
              label="Jobs"
              icon={Briefcase}
              color="brand"
            />
            <StatCounter
              value={stats?.inspectionsPending}
              label="Inspections"
              icon={Clock}
              color="warning"
            />
            <StatCounter
              value={formatCurrency(stats?.estimatedReceivables)}
              label="Receivables"
              icon={DollarSign}
              color="info"
            />
            {stats?.overdueJobs > 0 && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
                style={{
                  backgroundColor: colors.danger.muted,
                  border: `1px solid ${colors.danger.border}`,
                }}
              >
                <AlertTriangle style={{ width: '16px', height: '16px', color: colors.danger.DEFAULT }} />
                <span 
                  className="text-sm font-bold"
                  style={{ color: colors.danger.DEFAULT }}
                >
                  {stats.overdueJobs} Overdue
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

ControlRoomHeader.displayName = 'ControlRoomHeader';

export default ControlRoomHeader;
