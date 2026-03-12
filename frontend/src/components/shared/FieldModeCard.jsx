/**
 * FieldModeCard Component
 * A card component optimized for field mode with:
 * - Critical data visible at a glance (job phase, lead status, next action)
 * - Secondary info collapsed behind expandable sections
 * - Large touch targets for gloved hands
 * - High contrast colors for outdoor visibility
 * 
 * @module components/shared/FieldModeCard
 */

import { useState, memo } from 'react';
import { ChevronDown, Briefcase, Flame, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFieldMode } from '../../hooks/useFieldMode';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** Field mode accent colors - high visibility for outdoor use */
const FIELD_COLORS = {
  red: '#ff4444',
  orange: '#ffaa00',
  cyan: '#00d4ff',
  green: '#00ff88',
  purple: '#818cf8',
  blue: '#60a5fa',
};

/** Status configuration for field mode */
const STATUS_CONFIG = {
  hot: {
    icon: Flame,
    color: FIELD_COLORS.red,
    bgColor: `${FIELD_COLORS.red}26`,
    label: 'Hot Lead',
  },
  warm: {
    icon: AlertTriangle,
    color: FIELD_COLORS.orange,
    bgColor: `${FIELD_COLORS.orange}26`,
    label: 'Warm',
  },
  active: {
    icon: Briefcase,
    color: FIELD_COLORS.cyan,
    bgColor: `${FIELD_COLORS.cyan}26`,
    label: 'Active',
  },
  pending: {
    icon: Clock,
    color: FIELD_COLORS.orange,
    bgColor: `${FIELD_COLORS.orange}26`,
    label: 'Pending',
  },
  completed: {
    icon: CheckCircle,
    color: FIELD_COLORS.green,
    bgColor: `${FIELD_COLORS.green}26`,
    label: 'Done',
  },
};

/** Phase configuration */
const PHASE_CONFIG = {
  underground: { color: FIELD_COLORS.purple, label: 'UG' },
  roughin: { color: FIELD_COLORS.blue, label: 'RI' },
  topout: { color: FIELD_COLORS.cyan, label: 'TO' },
  trim: { color: FIELD_COLORS.green, label: 'TR' },
  final: { color: FIELD_COLORS.orange, label: 'FI' },
};

/** Priority colors */
const PRIORITY_COLORS = {
  high: FIELD_COLORS.red,
  medium: FIELD_COLORS.orange,
  low: FIELD_COLORS.green,
};

/** Info type colors for critical data */
const INFO_TYPE_COLORS = {
  hot: FIELD_COLORS.red,
  warning: FIELD_COLORS.orange,
  success: FIELD_COLORS.green,
  default: '#ffffff',
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Normal mode card (standard display)
 */
const NormalModeCard = memo(function NormalModeCard({
  title,
  subtitle,
  status,
  children,
  onClick,
  className,
}) {
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <div 
      className={`
        card p-5 cursor-pointer transition-all hover:border-border-strong
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
});

NormalModeCard.displayName = 'NormalModeCard';

/**
 * Status icon badge for field mode
 */
const StatusIconBadge = memo(function StatusIconBadge({ config }) {
  const Icon = config.icon;

  return (
    <div 
      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
      style={{ 
        background: config.bgColor,
        border: `2px solid ${config.color}`,
      }}
    >
      <Icon 
        className="w-7 h-7" 
        style={{ color: config.color }}
        strokeWidth={2.5}
      />
    </div>
  );
});

StatusIconBadge.displayName = 'StatusIconBadge';

/**
 * Phase badge
 */
const PhaseBadge = memo(function PhaseBadge({ phase }) {
  if (!phase || !PHASE_CONFIG[phase]) return null;

  const config = PHASE_CONFIG[phase];

  return (
    <span 
      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold"
      style={{ 
        background: `${config.color}33`,
        color: config.color,
        border: `2px solid ${config.color}`,
      }}
    >
      {config.label}
    </span>
  );
});

PhaseBadge.displayName = 'PhaseBadge';

/**
 * Status badge
 */
const StatusBadge = memo(function StatusBadge({ config }) {
  return (
    <span 
      className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold"
      style={{ 
        background: config.bgColor,
        color: config.color,
        border: `2px solid ${config.color}`,
      }}
    >
      {config.label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

/**
 * Next action highlight box
 */
const NextActionBox = memo(function NextActionBox({ action }) {
  if (!action) return null;

  return (
    <div 
      className="mt-4 p-4 rounded-xl"
      style={{ 
        background: `${FIELD_COLORS.cyan}1A`,
        border: `2px solid ${FIELD_COLORS.cyan}4D`,
      }}
    >
      <span 
        className="text-xs font-semibold uppercase tracking-wider block"
        style={{ color: FIELD_COLORS.cyan }}
      >
        Next Action
      </span>
      <p className="text-lg font-semibold text-white mt-1">{action}</p>
    </div>
  );
});

NextActionBox.displayName = 'NextActionBox';

/**
 * Priority indicator
 */
const PriorityIndicator = memo(function PriorityIndicator({ priority }) {
  if (!priority) return null;

  const color = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;

  return (
    <div className="mt-3 flex items-center gap-2">
      <span 
        className="w-3 h-3 rounded-full animate-pulse"
        style={{ 
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <span 
        className="text-sm font-bold uppercase"
        style={{ color }}
      >
        {priority} Priority
      </span>
    </div>
  );
});

PriorityIndicator.displayName = 'PriorityIndicator';

/**
 * Critical data grid
 */
const CriticalDataGrid = memo(function CriticalDataGrid({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {data.map((info, index) => {
        const valueColor = INFO_TYPE_COLORS[info.type] || INFO_TYPE_COLORS.default;

        return (
          <div 
            key={index}
            className="p-3 rounded-lg"
            style={{ background: 'var(--field-surface-elevated)' }}
          >
            <span 
              className="text-xs font-semibold uppercase tracking-wider block"
              style={{ color: 'var(--field-text-muted)' }}
            >
              {info.label}
            </span>
            <span 
              className="text-lg font-bold block mt-1"
              style={{ color: valueColor }}
            >
              {info.value}
            </span>
          </div>
        );
      })}
    </div>
  );
});

CriticalDataGrid.displayName = 'CriticalDataGrid';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * FieldModeCard - Card optimized for field/outdoor use
 * 
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   status?: 'hot' | 'warm' | 'active' | 'pending' | 'completed',
 *   phase?: string,
 *   nextAction?: string,
 *   priority?: 'high' | 'medium' | 'low',
 *   children?: React.ReactNode,
 *   onClick?: () => void,
 *   className?: string,
 *   defaultExpanded?: boolean,
 *   criticalInfo?: Array<{ label: string, value: string, type?: string }>
 * }} props
 */
const FieldModeCard = memo(function FieldModeCard({
  title,
  subtitle,
  status = 'active',
  phase,
  nextAction,
  priority,
  children,
  onClick,
  className = '',
  defaultExpanded = false,
  criticalInfo = [],
}) {
  const { isFieldMode } = useFieldMode();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  // Normal mode - render as standard card
  if (!isFieldMode) {
    return (
      <NormalModeCard
        title={title}
        subtitle={subtitle}
        status={status}
        onClick={onClick}
        className={className}
      >
        {children}
      </NormalModeCard>
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
        <StatusIconBadge config={statusConfig} />

        {/* Title and Phase */}
        <div className="flex-1 min-w-0">
          <h3 className="field-h3 truncate text-white">{title}</h3>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PhaseBadge phase={phase} />
            <StatusBadge config={statusConfig} />
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

      <NextActionBox action={nextAction} />
      <PriorityIndicator priority={priority} />
      <CriticalDataGrid data={criticalInfo} />

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
});

FieldModeCard.displayName = 'FieldModeCard';

// ═══════════════════════════════════════════════════════════════
// Additional Exports
// ═══════════════════════════════════════════════════════════════

/**
 * FieldModeList - A list container optimized for field mode
 * 
 * @param {{
 *   children: React.ReactNode,
 *   className?: string
 * }} props
 */
export const FieldModeList = memo(function FieldModeList({ children, className = '' }) {
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
});

FieldModeList.displayName = 'FieldModeList';

/**
 * FieldModeSection - An expandable section for field mode
 * 
 * @param {{
 *   title: string,
 *   children: React.ReactNode,
 *   defaultExpanded?: boolean,
 *   className?: string
 * }} props
 */
export const FieldModeSection = memo(function FieldModeSection({
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
});

FieldModeSection.displayName = 'FieldModeSection';

export default FieldModeCard;
