import { useState } from 'react';
import { ChevronDown, Briefcase, Flame, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFieldMode } from '../../hooks/useFieldMode';

/**
 * FieldModeCard Component
 * A card component optimized for field mode with:
 * - Critical data visible at a glance (job phase, lead status, next action)
 * - Secondary info collapsed behind expandable sections
 * - Large touch targets for gloved hands
 * - High contrast colors for outdoor visibility
 */

// Status configuration for field mode colors
const STATUS_CONFIG = {
  hot: {
    icon: Flame,
    color: '#ff4444',
    bgColor: 'rgba(255, 68, 68, 0.15)',
    label: 'Hot Lead',
  },
  warm: {
    icon: AlertTriangle,
    color: '#ffaa00',
    bgColor: 'rgba(255, 170, 0, 0.15)',
    label: 'Warm',
  },
  active: {
    icon: Briefcase,
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.15)',
    label: 'Active',
  },
  pending: {
    icon: Clock,
    color: '#ffaa00',
    bgColor: 'rgba(255, 170, 0, 0.15)',
    label: 'Pending',
  },
  completed: {
    icon: CheckCircle,
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.15)',
    label: 'Done',
  },
};

// Phase configuration
const PHASE_CONFIG = {
  underground: { color: '#818cf8', label: 'UG' },
  roughin: { color: '#60a5fa', label: 'RI' },
  topout: { color: '#22d3ee', label: 'TO' },
  trim: { color: '#00ff88', label: 'TR' },
  final: { color: '#ffaa00', label: 'FI' },
};

export function FieldModeCard({
  title,
  subtitle,
  status = 'active',
  phase,
  nextAction,
  priority,
  children, // Secondary content (collapsed by default)
  onClick,
  className = '',
  defaultExpanded = false,
  criticalInfo = [], // Array of { label, value, type } for critical data
}) {
  const { isFieldMode } = useFieldMode();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  // Normal mode - render as standard card
  if (!isFieldMode) {
    return (
      <div 
        className={`
          card p-4 cursor-pointer transition-all hover:border-border-strong
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{title}</h3>
            {subtitle && (
              <p className="text-sm text-text-muted mt-1">{subtitle}</p>
            )}
          </div>
          <span className={`badge-${status === 'hot' ? 'hot' : status === 'warm' ? 'warm' : 'cool'}`}>
            {statusConfig.label}
          </span>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    );
  }

  // Field mode - high contrast, optimized for outdoor
  return (
    <div 
      className={`
        field-card relative overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Critical Info Header - Always Visible */}
      <div className="flex items-start gap-4">
        {/* Status Icon - Large for visibility */}
        <div 
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ 
            background: statusConfig.bgColor,
            border: `2px solid ${statusConfig.color}`,
          }}
        >
          <StatusIcon 
            className="w-7 h-7" 
            style={{ color: statusConfig.color }}
            strokeWidth={2.5}
          />
        </div>

        {/* Title and Phase */}
        <div className="flex-1 min-w-0">
          <h3 className="field-h3 truncate text-white">{title}</h3>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Phase Badge */}
            {phase && PHASE_CONFIG[phase] && (
              <span 
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold"
                style={{ 
                  background: `${PHASE_CONFIG[phase].color}20`,
                  color: PHASE_CONFIG[phase].color,
                  border: `2px solid ${PHASE_CONFIG[phase].color}`,
                }}
              >
                {PHASE_CONFIG[phase].label}
              </span>
            )}
            
            {/* Status Badge */}
            <span 
              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold"
              style={{ 
                background: statusConfig.bgColor,
                color: statusConfig.color,
                border: `2px solid ${statusConfig.color}`,
              }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Expand Button - Large touch target */}
        {children && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ 
              background: 'var(--field-surface-elevated)',
              border: '2px solid var(--field-border-default)',
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Show less' : 'Show more'}
          >
            <ChevronDown 
              className="w-6 h-6 transition-transform duration-200"
              style={{ 
                color: 'var(--field-text-secondary)',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
        )}
      </div>

      {/* Next Action - Critical Info */}
      {nextAction && (
        <div 
          className="mt-4 p-4 rounded-xl"
          style={{ 
            background: 'rgba(0, 212, 255, 0.1)',
            border: '2px solid rgba(0, 212, 255, 0.3)',
          }}
        >
          <span 
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: '#00d4ff' }}
          >
            Next Action
          </span>
          <p className="text-lg font-semibold text-white mt-1">{nextAction}</p>
        </div>
      )}

      {/* Priority Indicator */}
      {priority && (
        <div className="mt-3 flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ 
              background: priority === 'high' ? '#ff4444' : priority === 'medium' ? '#ffaa00' : '#00ff88',
              boxShadow: `0 0 10px ${priority === 'high' ? '#ff4444' : priority === 'medium' ? '#ffaa00' : '#00ff88'}`,
            }}
          />
          <span 
            className="text-sm font-bold uppercase"
            style={{ 
              color: priority === 'high' ? '#ff4444' : priority === 'medium' ? '#ffaa00' : '#00ff88',
            }}
          >
            {priority} Priority
          </span>
        </div>
      )}

      {/* Critical Data Grid */}
      {criticalInfo.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {criticalInfo.map((info, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg"
              style={{ background: 'var(--field-surface-elevated)' }}
            >
              <span 
                className="text-xs font-bold uppercase tracking-wider block"
                style={{ color: 'var(--field-text-muted)' }}
              >
                {info.label}
              </span>
              <span 
                className="text-lg font-bold block mt-1"
                style={{ 
                  color: info.type === 'hot' ? '#ff4444' : 
                         info.type === 'warning' ? '#ffaa00' : 
                         info.type === 'success' ? '#00ff88' : 
                         '#ffffff',
                }}
              >
                {info.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Secondary Content */}
      {children && (
        <div 
          className="overflow-hidden transition-all duration-300"
          style={{ 
            maxHeight: isExpanded ? '500px' : '0',
            opacity: isExpanded ? 1 : 0,
            marginTop: isExpanded ? '16px' : '0',
          }}
        >
          <div 
            className="pt-4 border-t-2"
            style={{ borderColor: 'var(--field-border-default)' }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * FieldModeList - A list container optimized for field mode
 */
export function FieldModeList({ children, className = '' }) {
  const { isFieldMode } = useFieldMode();

  if (!isFieldMode) {
    return <div className={`space-y-3 ${className}`}>{children}</div>;
  }

  return (
    <div 
      className={`space-y-4 ${className}`}
      style={{ padding: '8px 0' }}
    >
      {children}
    </div>
  );
}

/**
 * FieldModeSection - An expandable section for field mode
 */
export function FieldModeSection({
  title,
  children,
  defaultExpanded = false,
  className = '',
}) {
  const { isFieldMode } = useFieldMode();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!isFieldMode) {
    return (
      <div className={`space-y-3 ${className}`}>
        {title && <h3 className="font-semibold text-text-primary">{title}</h3>}
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`field-expandable ${className}`}
      data-expanded={isExpanded}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="field-expandable-header w-full"
        aria-expanded={isExpanded}
      >
        <span className="field-h3">{title}</span>
        <ChevronDown className="field-expandable-icon" />
      </button>
      
      {isExpanded && (
        <div className="field-expandable-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default FieldModeCard;
