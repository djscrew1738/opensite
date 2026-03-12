import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';

/**
 * PolishedCard — Enhanced card component with micro-interactions
 */

// Main card with hover lift effect
export function PolishedCard({ 
  children, 
  className = '',
  onClick,
  hoverable = false,
  selected = false,
  disabled = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        card overflow-hidden transition-all duration-300 ease-out
        ${hoverable || onClick ? 'cursor-pointer' : ''}
        ${hoverable && isHovered ? 'transform -translate-y-1 shadow-elevation-3' : ''}
        ${selected ? 'ring-2 ring-accent-500 ring-offset-2 dark:ring-offset-surface-900' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Stats card with trend indicator
export function StatCard({ 
  label, 
  value, 
  subtext,
  trend,
  trendUp,
  icon: Icon,
  color = 'blue',
  delay = 0,
  className = '' 
}) {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-600',
    green: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600',
    red: 'from-red-500/10 to-red-600/5 text-red-600',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-600',
    copper: 'from-accent-500/10 to-accent-600/5 text-accent-600',
  };

  return (
    <div 
      className={`
        card p-5 relative overflow-hidden
        transition-all duration-300 ease-out
        hover:shadow-elevation-2 hover:-translate-y-0.5
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2`} />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100 mt-1 font-mono tabular-nums">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
        
        {(subtext || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-3">
            {trend !== undefined && (
              <span className={`
                inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
                ${trendUp 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }
              `}>
                {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
            {subtext && (
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Action card with arrow
export function ActionCard({ 
  title, 
  description, 
  icon: Icon,
  onClick,
  variant = 'default',
  loading = false,
  className = '' 
}) {
  const variants = {
    default: 'hover:border-accent-300 dark:hover:border-accent-700',
    primary: 'bg-gradient-to-br from-accent-500/5 to-accent-600/5 border-accent-200 dark:border-accent-800',
    success: 'bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-gradient-to-br from-amber-500/5 to-amber-600/5 border-amber-200 dark:border-amber-800',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileTap={loading ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      className={`
        w-full text-left card p-5 group relative overflow-hidden
        transition-all duration-300 ease-out
        hover:shadow-elevation-2 hover:-translate-y-0.5
        ${variants[variant]}
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-surface-600 dark:text-surface-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">
              {title}
            </h3>
            {loading ? (
              <Loader2 className="w-5 h-5 text-surface-400 animate-spin" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-surface-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
            )}
          </div>
          {description && (
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// List item card
export function ListItemCard({
  title,
  subtitle,
  meta,
  icon: Icon,
  iconColor = 'blue',
  onClick,
  selected = false,
  actions,
  className = ''
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    gray: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400',
  };

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center gap-4 p-4 rounded-xl
        border border-surface-200 dark:border-surface-700
        bg-white dark:bg-surface-800
        transition-all duration-200 ease-out
        ${onClick ? 'cursor-pointer hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-elevation-1' : ''}
        ${selected ? 'ring-2 ring-accent-500 ring-offset-2 dark:ring-offset-surface-900 border-transparent' : ''}
        ${className}
      `}
    >
      {Icon && (
        <div className={`w-10 h-10 rounded-lg ${colorClasses[iconColor]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-surface-900 dark:text-surface-100 truncate">
          {title}
        </h4>
        {subtitle && (
          <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
      
      {meta && (
        <div className="text-right flex-shrink-0">
          {meta}
        </div>
      )}
      
      {actions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PolishedCard;
