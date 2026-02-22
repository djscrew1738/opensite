import React, { useState, useEffect } from 'react';
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

// Stat Counter with animation
const StatCounter = ({ value, label, icon: Icon, color = 'brand', trend }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (value === undefined || value === null) return;
    
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
  
  const colorClasses = {
    brand: 'text-brand-400 bg-brand-500/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
    info: 'text-info bg-info/10',
  };
  
  return (
    <Motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-800/50 border border-border hover:border-border-medium transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-text-primary font-mono tabular-nums">
            {displayValue.toLocaleString()}
          </span>
          {trend !== undefined && (
            <span className={`text-xs ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{label}</p>
      </div>
    </Motion.div>
  );
};

// Alert Badge
const AlertBadge = ({ count, type = 'warning' }) => {
  if (!count || count === 0) return null;
  
  return (
    <Motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
        type === 'critical' 
          ? 'bg-danger text-white' 
          : 'bg-warning text-black'
      }`}
    >
      {count > 99 ? '99+' : count}
    </Motion.div>
  );
};

// Global Search Trigger
const GlobalSearch = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 border border-border hover:border-border-medium text-text-muted hover:text-text-primary transition-colors"
  >
    <Search className="w-4 h-4" />
    <span className="text-sm hidden lg:block">Search...</span>
    <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-surface-700 rounded border border-border">
      <Command className="w-3 h-3" />K
    </kbd>
  </button>
);

export const ControlRoomHeader = ({ 
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  hasUnreadNotifications = false,
  notificationCount = 0,
}) => {
  const { isFieldMode, toggleFieldMode } = useFieldMode();
  // Fetch live stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.dashboard.getStats();
        return response.data;
      } catch (err) {
        // Return mock data if API fails
        return {
          activeJobs: 12,
          phasesCompleted: 34,
          inspectionsPending: 5,
          overdueJobs: 2,
          estimatedReceivables: 145000,
          receivablesTrend: 12,
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
  });
  
  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };
  
  return (
    <header className="sticky top-0 z-40 bg-surface-bg/95 backdrop-blur-xl border-b border-border">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-700 text-text-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-dark-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-text-primary leading-none">OpenSite</h1>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">Command Center</p>
              </div>
            </div>
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
            <div className="w-px h-8 bg-border mx-1" />
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-danger/10 border border-danger/20"
              >
                <AlertTriangle className="w-4 h-4 text-danger" />
                <div>
                  <span className="text-lg font-bold text-danger font-mono">{stats.overdueJobs}</span>
                  <p className="text-[10px] text-danger/70 uppercase tracking-wider">Overdue</p>
                </div>
              </Motion.div>
            )}
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Field Mode Toggle */}
            <button
              onClick={toggleFieldMode}
              className={`
                relative flex items-center gap-2 px-3 py-2 rounded-lg font-semibold
                transition-all duration-200 active:scale-95
                ${isFieldMode 
                  ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)]' 
                  : 'bg-surface-800 border border-border hover:border-border-medium text-text-secondary hover:text-text-primary'
                }
              `}
              style={{ minHeight: 40 }}
              aria-pressed={isFieldMode}
              aria-label={isFieldMode ? 'Disable Field Mode' : 'Enable Field Mode'}
              title={isFieldMode ? 'Field Mode On - Outdoor optimized' : 'Enable Field Mode for outdoor use'}
            >
              <Sun 
                className={`w-4 h-4 ${isFieldMode ? 'animate-pulse' : ''}`}
                strokeWidth={isFieldMode ? 2.5 : 2}
              />
              <span className="hidden xl:inline text-sm">
                {isFieldMode ? 'Field On' : 'Field Mode'}
              </span>
              {isFieldMode && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ff4444] rounded-full animate-pulse" />
              )}
            </button>

            <GlobalSearch onClick={onSearchClick} />
            
            <button
              onClick={onNotificationsClick}
              className="relative p-2 rounded-lg hover:bg-surface-700 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Bell className="w-5 h-5" />
              <AlertBadge count={notificationCount} type={notificationCount > 5 ? 'critical' : 'warning'} />
            </button>
            
            {/* User Avatar (placeholder) */}
            <div className="w-9 h-9 rounded-xl bg-surface-600 border border-border flex items-center justify-center ml-2">
              <span className="text-sm font-semibold text-text-secondary">CTL</span>
            </div>
          </div>
        </div>
        
        {/* Mobile Stats Scroll */}
        <div className="xl:hidden mt-3 pt-3 border-t border-border overflow-x-auto scrollbar-hide">
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
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-danger/10 border border-danger/20 flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <span className="text-sm font-bold text-danger">{stats.overdueJobs} Overdue</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ControlRoomHeader;
