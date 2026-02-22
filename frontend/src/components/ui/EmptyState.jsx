import {
  Inbox, Search, FileX, FolderOpen, Users, Building2,
  ClipboardList, ImageOff, MapPin, AlertCircle, Plus,
  LayoutGrid, Bell, Radar, CalendarCheck, Layers,
  ShieldCheck, SearchSlash, Crane,
} from 'lucide-react';
import { colors } from '../../styles/tokens';

/**
 * Empty State Component
 * Uses design tokens for consistent theming
 * 
 * Accessibility:
 * - role="status" for empty state announcements
 * - Proper heading hierarchy
 */
export const EmptyState = ({
  title,
  description,
  icon: IconProp,
  iconName,
  primaryAction,
  compact = false,
  className = '',
}) => {
  const iconMap = {
    inbox: Inbox, search: Search, file: FileX, folder: FolderOpen,
    users: Users, building: Building2, clipboard: ClipboardList,
    image: ImageOff, location: MapPin, alert: AlertCircle,
    grid: LayoutGrid, bell: Bell, radar: Radar,
    calendarCheck: CalendarCheck, layers: Layers,
    shieldCheck: ShieldCheck, searchSlash: SearchSlash, crane: Crane,
  };

  const Icon = IconProp || iconMap[iconName] || Inbox;

  if (compact) {
    return (
      <div 
        className={`flex flex-col items-center justify-center text-center py-8 ${className}`}
        role="status"
        aria-label={`${title}. ${description || ''}`}
      >
        <div
          className="flex items-center justify-center mb-3"
          style={{ 
            width: '48px', 
            height: '48px',
            borderRadius: '12px',
            background: colors.surface.card,
          }}
        >
          <Icon 
            className="w-6 h-6" 
            style={{ color: colors.text.muted }} 
            strokeWidth={1.5} 
            aria-hidden="true"
          />
        </div>
        <h3 
          className="font-semibold"
          style={{ color: colors.text.primary, fontSize: '15px' }}
        >
          {title}
        </h3>
        {description && (
          <p 
            className="mt-1 max-w-xs text-sm"
            style={{ color: colors.text.muted }}
          >
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
      role="status"
      aria-label={`${title}. ${description || ''}`}
    >
      <div 
        className="flex items-center justify-center mb-5"
        style={{ 
          width: '64px', 
          height: '64px',
          borderRadius: '16px',
          background: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <Icon 
          className="w-8 h-8" 
          style={{ color: colors.text.muted }} 
          strokeWidth={1.5} 
          aria-hidden="true"
        />
      </div>

      <h3
        className="font-semibold mb-2"
        style={{ color: colors.text.primary, fontSize: '17px', lineHeight: 1.4 }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="max-w-sm mb-6"
          style={{ color: colors.text.secondary, fontSize: '15px', lineHeight: 1.5 }}
        >
          {description}
        </p>
      )}

      {primaryAction && (
        <button
          type="button"
          className="btn-primary flex items-center gap-2"
          onClick={primaryAction.onClick}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>
      )}
    </div>
  );
};

// ── Spec-defined empty states ──────────────────

export const NoActiveJobsEmpty = ({ onCreate }) => (
  <EmptyState
    icon={Crane}
    title="No active jobs"
    description="Add a job to start tracking phases and schedule"
    primaryAction={{ label: 'Add Job', onClick: onCreate, icon: <Plus className="w-4 h-4" /> }}
  />
);

export const NoLeadsTodayEmpty = ({ onConfigure }) => (
  <EmptyState
    icon={Radar}
    title="Lead Radar is scanning"
    description="New permits and mentions will appear here automatically"
    primaryAction={{ label: 'Configure Keywords', onClick: onConfigure }}
  />
);

export const NoInspectionsEmpty = ({ onViewJobs }) => (
  <EmptyState
    icon={CalendarCheck}
    title="No inspections scheduled"
    description="Schedule an inspection from any job detail page"
    primaryAction={{ label: 'View Jobs', onClick: onViewJobs }}
  />
);

export const NoCanvasDocumentsEmpty = ({ onUpload }) => (
  <EmptyState
    icon={Layers}
    title="Canvas is empty"
    description="Drop blueprints, permits, and documents to start mapping connections"
    primaryAction={{ label: 'Upload Document', onClick: onUpload, icon: <Plus className="w-4 h-4" /> }}
  />
);

export const NoAlertsEmpty = ({ onViewRules }) => (
  <EmptyState
    icon={ShieldCheck}
    title="All clear"
    description="You have no unread alerts. Keyword rules are active and watching."
    primaryAction={{ label: 'View Rules', onClick: onViewRules }}
  />
);

export const NoSearchResultsEmpty = ({ onClear }) => (
  <EmptyState
    icon={SearchSlash}
    title="No results for that search"
    description="Try a job address, builder name, or permit number"
    primaryAction={{ label: 'Clear Search', onClick: onClear }}
  />
);

// ── Legacy compat aliases ──────────────────────

export const NoJobsEmptyState = NoActiveJobsEmpty;
export const NoLeadsEmptyState = ({ onSearch }) => (
  <EmptyState
    iconName="search"
    title="No leads found"
    description="Search for builders, permits, or properties to find new leads in your area."
    primaryAction={{ label: 'Search Leads', onClick: onSearch, icon: <Search className="w-4 h-4" /> }}
  />
);
export const NoDocumentsEmptyState = ({ onUpload }) => (
  <EmptyState
    iconName="folder"
    title="No documents"
    description="Upload blueprints, contracts, and other documents to keep everything organized."
    primaryAction={{ label: 'Upload Document', onClick: onUpload, icon: <Plus className="w-4 h-4" /> }}
  />
);
export const NoSearchResultsEmptyState = NoSearchResultsEmpty;
export const NoCanvasNodesEmptyState = NoCanvasDocumentsEmpty;
export const NoNotificationsEmptyState = () => (
  <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" compact />
);
export const ErrorEmptyState = ({ onRetry, message }) => (
  <EmptyState
    iconName="alert"
    title="Something went wrong"
    description={message || "We couldn't load the data. Please try again."}
    primaryAction={{ label: 'Try Again', onClick: onRetry }}
  />
);
export const NoPermitsEmptyState = ({ onSearch }) => (
  <EmptyState iconName="building" title="No permits found" description="Search a different city or adjust your filters." primaryAction={{ label: 'Search Again', onClick: onSearch }} />
);
export const NoBlueprintsEmptyState = ({ onUpload }) => (
  <EmptyState iconName="image" title="No blueprints uploaded" description="Upload PDF blueprints to get AI-powered material takeoffs." primaryAction={{ label: 'Upload Blueprint', onClick: onUpload }} />
);
export const NoHistoryEmptyState = () => (
  <EmptyState iconName="inbox" title="No history yet" description="Your recent activity will appear here." />
);
export const NoProposalsEmptyState = ({ onCreate }) => (
  <EmptyState iconName="clipboard" title="No proposals yet" description="Create proposals from your estimates." primaryAction={{ label: 'Create Proposal', onClick: onCreate }} />
);

export default EmptyState;
