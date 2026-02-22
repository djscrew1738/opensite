import { 
  Search, FileX, Inbox, FolderOpen, 
  AlertCircle, Plus, ArrowRight, 
  FileText, Users, Building2, 
  ClipboardList, BarChart3, Settings,
  Upload, Sparkles, Mail
} from 'lucide-react';

/**
 * EmptyStates — Comprehensive empty state components
 * Follows industrial control room aesthetic
 */

// Base empty state layout
function EmptyStateBase({ 
  icon: Icon,
  iconSize = 'lg',
  iconBg = 'subtle',
  title, 
  subtitle,
  action,
  secondaryAction,
  className = '' 
}) {
  const sizeClasses = {
    sm: { wrapper: 'w-12 h-12', icon: 'w-6 h-6' },
    md: { wrapper: 'w-16 h-16', icon: 'w-8 h-8' },
    lg: { wrapper: 'w-20 h-20', icon: 'w-10 h-10' },
  };

  const bgClasses = {
    subtle: 'bg-surface-100 dark:bg-surface-800',
    primary: 'bg-primary-50 dark:bg-primary-900/20',
    success: 'bg-emerald-50 dark:bg-emerald-900/20',
    warning: 'bg-amber-50 dark:bg-amber-900/20',
    accent: 'bg-accent-50 dark:bg-accent-900/20',
  };

  const iconColorClasses = {
    subtle: 'text-surface-400 dark:text-surface-500',
    primary: 'text-primary-600 dark:text-primary-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    accent: 'text-accent-600 dark:text-accent-400',
  };

  const size = sizeClasses[iconSize];
  const bg = bgClasses[iconBg];
  const iconColor = iconColorClasses[iconBg];

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {/* Icon */}
      <div className={`${size.wrapper} rounded-2xl ${bg} flex items-center justify-center mb-5`}>
        <Icon className={`${size.icon} ${iconColor}`} strokeWidth={1.5} />
      </div>
      
      {/* Title - H3 style */}
      <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
        {title}
      </h3>
      
      {/* Subtitle - Body style */}
      {subtitle && (
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-2 max-w-xs mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
      
      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          {action && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {action}
            </div>
          )}
          {secondaryAction && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
              {secondaryAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA VIEW EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════════

export function EmptyState({ 
  icon: Icon = FolderOpen, 
  title = 'Nothing here yet', 
  subtitle,
  action,
  secondaryAction,
  className = '' 
}) {
  return (
    <EmptyStateBase
      icon={Icon}
      title={title}
      subtitle={subtitle}
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

// No search results
export function NoResultsState({ 
  searchTerm, 
  onClear,
  className = '' 
}) {
  return (
    <EmptyStateBase
      icon={Search}
      iconBg="warning"
      title="No results found"
      subtitle={searchTerm ? `We couldn't find anything matching "${searchTerm}"` : 'Try adjusting your filters'}
      action={onClear && (
        <button onClick={onClear} className="btn-secondary">
          Clear filters
        </button>
      )}
      className={className}
    />
  );
}

// No data (first-time user)
export function NoDataState({ 
  title = 'Get started',
  subtitle = 'Create your first item to get started',
  actionLabel = 'Create',
  onAction,
  icon: Icon = Plus,
  className = '' 
}) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mx-auto mb-5">
          <Icon className="w-8 h-8 text-accent-600 dark:text-accent-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          {title}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-2 max-w-xs mx-auto">
          {subtitle}
        </p>
        {onAction && (
          <button 
            onClick={onAction} 
            className="btn-primary mt-5 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// Empty inbox/notifications
export function EmptyInboxState({ 
  title = 'All caught up!',
  subtitle = 'No new items to review',
  className = '' 
}) {
  return (
    <EmptyStateBase
      icon={Inbox}
      iconBg="success"
      title={title}
      subtitle={subtitle}
      className={className}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE-SPECIFIC EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════════

// Leads empty state
export function EmptyLeadsState({ onAdd, className = '' }) {
  return (
    <EmptyStateBase
      icon={Users}
      iconBg="primary"
      title="No leads yet"
      subtitle="Start building your pipeline by adding your first lead"
      action={onAdd && (
        <button onClick={onAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      )}
      className={className}
    />
  );
}

// Projects empty state
export function EmptyProjectsState({ onCreate, className = '' }) {
  return (
    <EmptyStateBase
      icon={Building2}
      iconBg="accent"
      title="No projects"
      subtitle="Create a project to start tracking estimates and materials"
      action={onCreate && (
        <button onClick={onCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      )}
      className={className}
    />
  );
}

// Estimates empty state
export function EmptyEstimatesState({ onCreate, className = '' }) {
  return (
    <EmptyStateBase
      icon={ClipboardList}
      iconBg="primary"
      title="No estimates"
      subtitle="Generate your first estimate from a blueprint or manual entry"
      action={onCreate && (
        <button onClick={onCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Estimate
        </button>
      )}
      className={className}
    />
  );
}

// Blueprint empty state
export function EmptyBlueprintsState({ onUpload, className = '' }) {
  return (
    <EmptyStateBase
      icon={Upload}
      iconBg="accent"
      title="No blueprints"
      subtitle="Upload a blueprint to extract fixtures and generate takeoffs"
      action={onUpload && (
        <button onClick={onUpload} className="btn-primary inline-flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Blueprint
        </button>
      )}
      className={className}
    />
  );
}

// Materials empty state
export function EmptyMaterialsState({ onAdd, className = '' }) {
  return (
    <EmptyStateBase
      icon={FileText}
      iconBg="warning"
      title="No materials"
      subtitle="Add materials to your catalog for faster estimates"
      action={onAdd && (
        <button onClick={onAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Material
        </button>
      )}
      className={className}
    />
  );
}

// Reports/Analytics empty state
export function EmptyAnalyticsState({ className = '' }) {
  return (
    <EmptyStateBase
      icon={BarChart3}
      iconBg="subtle"
      title="No data available"
      subtitle="Analytics will appear once you have projects and estimates"
      className={className}
    />
  );
}

// Email/Messages empty state
export function EmptyMessagesState({ className = '' }) {
  return (
    <EmptyStateBase
      icon={Mail}
      iconBg="subtle"
      title="No messages"
      subtitle="Your inbox is empty"
      className={className}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════════

// Error state
export function ErrorState({ 
  title = 'Something went wrong',
  subtitle = 'Please try again or contact support',
  onRetry,
  className = '' 
}) {
  return (
    <EmptyStateBase
      icon={AlertCircle}
      iconBg="error"
      title={title}
      subtitle={subtitle}
      action={onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
      )}
      className={className}
    />
  );
}

// Coming soon
export function ComingSoonState({ 
  feature = 'This feature',
  className = '' 
}) {
  return (
    <div className={`card p-10 text-center ${className}`}>
      <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
        <Settings className="w-10 h-10 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
        Coming Soon
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 mt-2 max-w-sm mx-auto">
        {feature} is currently under development. Stay tuned for updates!
      </p>
    </div>
  );
}

// Loading state
export function LoadingState({ 
  message = 'Loading...',
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        <div className="w-6 h-6 border-2 border-surface-300 dark:border-surface-600 border-t-primary-500 rounded-full animate-spin" />
      </div>
      <p className="text-sm text-surface-500 dark:text-surface-400">{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE/LIST SPECIFIC EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════════

export function EmptyTableState({
  title = 'No data available',
  subtitle = 'Get started by adding your first item',
  onAdd,
  addLabel = 'Add Item',
  icon: Icon = FileText,
  className = ''
}) {
  return (
    <div className={`py-12 px-6 text-center border-t border-surface-200 dark:border-surface-700 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-surface-400 dark:text-surface-500" />
      </div>
      <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
        {title}
      </h4>
      {subtitle && (
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
          {subtitle}
        </p>
      )}
      {onAdd && (
        <button 
          onClick={onAdd}
          className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
