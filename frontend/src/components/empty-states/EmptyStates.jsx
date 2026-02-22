import {
  // Core icons
  Inbox, Search, FileX, FolderOpen, Users, Building2,
  ClipboardList, ImageOff, MapPin, AlertCircle, Plus,
  LayoutGrid, Bell, Radar, CalendarCheck, Layers,
  ShieldCheck, SearchSlash, HardHat,
  
  // Jobs & Projects
  FileText, Calculator, Wrench, Ruler, TrendingUp,
  Package, Boxes, 
  
  // Leads
  Target, Compass, Building, MapPinned, Phone,
  UserPlus, Filter,
  
  // Documents
  Files, FileImage, FileUp, ScanEye, Eye,
  Upload, Download, Image,
  
  // AI & Chat
  Sparkles, MessageSquare, BrainCircuit, Bot,
  Lightbulb, Zap,
  
  // Time & Activity
  History, Clock, RotateCcw, Calendar,
  
  // Canvas & Vision
  Network, Share2, Pin, Focus,
  
  // Status
  CheckCircle2, XCircle, AlertTriangle, Info,
  Construction, Rocket,
} from 'lucide-react';
import { colors } from '../../styles/tokens';

/**
 * Base Empty State Component
 */
export const EmptyState = ({
  title,
  description,
  icon: IconProp,
  iconName,
  primaryAction,
  secondaryAction,
  className = '',
  variant = 'default', // default, card, inline
}) => {
  const iconMap = {
    inbox: Inbox, search: Search, file: FileX, folder: FolderOpen,
    users: Users, building: Building2, clipboard: ClipboardList,
    image: ImageOff, location: MapPin, alert: AlertCircle,
    grid: LayoutGrid, bell: Bell, radar: Radar,
    calendarCheck: CalendarCheck, layers: Layers,
    shieldCheck: ShieldCheck, searchSlash: SearchSlash,
    hardhat: HardHat, files: Files, upload: Upload,
    sparkles: Sparkles, target: Target, compass: Compass,
    clock: Clock, history: History, brain: BrainCircuit,
    network: Network, eye: Eye, scan: ScanEye,
    check: CheckCircle2, info: Info, warning: AlertTriangle,
    construction: Construction, rocket: Rocket,
  };

  const Icon = IconProp || iconMap[iconName] || Inbox;

  const variants = {
    default: {
      container: 'py-16 px-6',
      iconWrapper: 'w-16 h-16 rounded-2xl mb-5',
      iconSize: 'w-8 h-8',
      title: 'text-lg mb-2',
      description: 'max-w-sm mb-6',
    },
    card: {
      container: 'py-12 px-6 rounded-xl',
      iconWrapper: 'w-14 h-14 rounded-xl mb-4',
      iconSize: 'w-7 h-7',
      title: 'text-base mb-2',
      description: 'max-w-xs mb-5 text-sm',
    },
    inline: {
      container: 'py-8 px-4',
      iconWrapper: 'w-12 h-12 rounded-xl mb-3',
      iconSize: 'w-6 h-6',
      title: 'text-sm mb-1',
      description: 'max-w-xs mb-4 text-xs',
    },
  };

  const v = variants[variant] || variants.default;

  return (
    <div 
      className={`flex flex-col items-center justify-center text-center ${v.container} ${className}`}
      role="status"
      aria-label={`${title}. ${description || ''}`}
    >
      <div 
        className={`flex items-center justify-center ${v.iconWrapper}`}
        style={{ 
          background: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <Icon 
          className={v.iconSize}
          style={{ color: colors.text.muted }} 
          strokeWidth={1.5} 
          aria-hidden="true"
        />
      </div>

      <h3
        className={`font-semibold ${v.title}`}
        style={{ color: colors.text.primary, lineHeight: 1.4 }}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`${v.description}`}
          style={{ color: colors.text.secondary, lineHeight: 1.5 }}
        >
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
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
          {secondaryAction && (
            <button
              type="button"
              className="btn-secondary flex items-center gap-2"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// JOBS & PROJECTS
// ═══════════════════════════════════════════════════════════

export const NoJobsEmpty = ({ onCreate }) => (
  <EmptyState
    icon={Crane}
    title="No active jobs"
    description="Add a job to start tracking phases, estimates, and progress"
    primaryAction={{ label: 'Create Job', onClick: onCreate, icon: <Plus className="w-4 h-4" /> }}
  />
);

export const NoEstimatesEmpty = ({ onCreate }) => (
  <EmptyState
    icon={Calculator}
    title="No estimates yet"
    description="Create your first estimate to start pricing jobs accurately"
    primaryAction={{ label: 'New Estimate', onClick: onCreate, icon: <Plus className="w-4 h-4" /> }}
  />
);

export const NoBlueprintsEmpty = ({ onUpload }) => (
  <EmptyState
    icon={FileImage}
    title="No blueprints uploaded"
    description="Upload PDF plans to get AI-powered fixture counts and estimates"
    primaryAction={{ label: 'Upload Blueprint', onClick: onUpload, icon: <Upload className="w-4 h-4" /> }}
  />
);

export const NoProjectSelectedEmpty = () => (
  <EmptyState
    icon={FolderOpen}
    title="Select a project"
    description="Choose a project from the list to view details and estimates"
    variant="inline"
  />
);

// ═══════════════════════════════════════════════════════════
// LEADS & PERMITS
// ═══════════════════════════════════════════════════════════

export const NoLeadsEmpty = ({ onAdd }) => (
  <EmptyState
    icon={Target}
    title="No leads yet"
    description="Start building your pipeline by adding leads or searching permits"
    primaryAction={{ label: 'Add Lead', onClick: onAdd, icon: <Plus className="w-4 h-4" /> }}
    secondaryAction={{ label: 'Search Permits', onClick: () => {}, icon: <Search className="w-4 h-4" /> }}
  />
);

export const NoPermitsEmpty = ({ onSearch, hasFilters }) => (
  <EmptyState
    icon={Building}
    title={hasFilters ? 'No permits match your filters' : 'No permits found'}
    description={hasFilters 
      ? 'Try adjusting your search criteria or clear filters'
      : 'New permits are automatically ingested daily from city data sources'
    }
    primaryAction={hasFilters 
      ? { label: 'Clear Filters', onClick: onSearch, icon: <Filter className="w-4 h-4" /> }
      : undefined
    }
  />
);

export const NoBuildersEmpty = ({ onSearch }) => (
  <EmptyState
    icon={Building2}
    title="No builders found"
    description="Search for builders in your area to track their projects"
    primaryAction={{ label: 'Search Builders', onClick: onSearch, icon: <Search className="w-4 h-4" /> }}
  />
);

export const NoSearchResultsEmpty = ({ onClear, query }) => (
  <EmptyState
    icon={SearchSlash}
    title="No results found"
    description={`We couldn't find anything matching "${query}". Try different keywords.`}
    primaryAction={{ label: 'Clear Search', onClick: onClear, icon: <XCircle className="w-4 h-4" /> }}
  />
);

export const ColdLeadsEmpty = () => (
  <EmptyState
    icon={Clock}
    title="No cold leads"
    description="All your leads are being actively worked. Great job!"
    variant="inline"
  />
);

export const NoDiscoveryResultsEmpty = ({ onConfigure }) => (
  <EmptyState
    icon={Compass}
    title="Discovery is scanning"
    description="New opportunities will appear here as our system finds them"
    primaryAction={{ label: 'Configure Keywords', onClick: onConfigure, icon: <Sparkles className="w-4 h-4" /> }}
  />
);

// ═══════════════════════════════════════════════════════════
// DOCUMENTS & FILES
// ═══════════════════════════════════════════════════════════

export const NoDocumentsEmpty = ({ onUpload }) => (
  <EmptyState
    icon={Files}
    title="No documents yet"
    description="Upload blueprints, contracts, and other files to keep everything organized"
    primaryAction={{ label: 'Upload Document', onClick: onUpload, icon: <Upload className="w-4 h-4" /> }}
  />
);

export const NoAnalysisEmpty = ({ onUpload }) => (
  <EmptyState
    icon={ScanEye}
    title="No documents to analyze"
    description="Upload blueprints in the Library tab to use AI-powered analysis"
    primaryAction={{ label: 'Go to Library', onClick: onUpload, icon: <FolderOpen className="w-4 h-4" /> }}
  />
);

export const UploadPromptEmpty = ({ onUpload }) => (
  <EmptyState
    icon={FileUp}
    title="Drop files here"
    description="Drag and drop PDFs, images, or DWG files to upload"
    primaryAction={{ label: 'Select Files', onClick: onUpload, icon: <Plus className="w-4 h-4" /> }}
    variant="card"
  />
);

export const NoMatchingDocumentsEmpty = ({ onClear }) => (
  <EmptyState
    icon={SearchSlash}
    title="No matching documents"
    description="Try adjusting your search terms or filters"
    primaryAction={{ label: 'Clear Search', onClick: onClear, icon: <XCircle className="w-4 h-4" /> }}
    variant="inline"
  />
);

// ═══════════════════════════════════════════════════════════
// DASHBOARD & OVERVIEW
// ═══════════════════════════════════════════════════════════

export const NoActivityEmpty = ({ onViewJobs }) => (
  <EmptyState
    icon={CalendarCheck}
    title="No recent activity"
    description="Your recent actions and updates will appear here"
    primaryAction={{ label: 'View Jobs', onClick: onViewJobs, icon: <HardHat className="w-4 h-4" /> }}
    variant="inline"
  />
);

export const NoInsightsEmpty = ({ onViewLeads }) => (
  <EmptyState
    icon={Lightbulb}
    title="No insights yet"
    description="AI-powered insights will appear as you add more jobs and leads"
    primaryAction={{ label: 'View Leads', onClick: onViewLeads, icon: <Target className="w-4 h-4" /> }}
    variant="inline"
  />
);

export const DashboardWelcomeEmpty = ({ onCreateJob }) => (
  <EmptyState
    icon={Rocket}
    title="Welcome to Job Pulse"
    description="Get started by creating your first job or adding leads to track"
    primaryAction={{ label: 'Create First Job', onClick: onCreateJob, icon: <Plus className="w-4 h-4" /> }}
  />
);

// ═══════════════════════════════════════════════════════════
// HISTORY & ACTIVITY
// ═══════════════════════════════════════════════════════════

export const NoHistoryEmpty = () => (
  <EmptyState
    icon={History}
    title="No history yet"
    description="Your recent activity and changes will appear here"
  />
);

export const NoNotificationsEmpty = () => (
  <EmptyState
    icon={Bell}
    title="All caught up!"
    description="You have no unread notifications. We'll alert you when something needs attention."
    variant="inline"
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

// ═══════════════════════════════════════════════════════════
// AI & CHAT
// ═══════════════════════════════════════════════════════════

export const NoAIInsightsEmpty = ({ onAskQuestion }) => (
  <EmptyState
    icon={BrainCircuit}
    title="Ask the AI Assistant"
    description="Get insights on leads, pricing, materials, and code compliance"
    primaryAction={{ label: 'Start Chat', onClick: onAskQuestion, icon: <MessageSquare className="w-4 h-4" /> }}
  />
);

export const NoChatHistoryEmpty = ({ onStartChat }) => (
  <EmptyState
    icon={Bot}
    title="No chat history"
    description="Start a conversation with the AI Assistant"
    primaryAction={{ label: 'New Chat', onClick: onStartChat, icon: <Plus className="w-4 h-4" /> }}
  />
);

export const AIAnalysisPendingEmpty = () => (
  <EmptyState
    icon={Zap}
    title="Analysis in progress"
    description="AI is processing your blueprint. Results will appear shortly."
    variant="inline"
  />
);

// ═══════════════════════════════════════════════════════════
// CANVAS & VISION
// ═══════════════════════════════════════════════════════════

export const NoCanvasItemsEmpty = ({ onUpload }) => (
  <EmptyState
    icon={Layers}
    title="Canvas is empty"
    description="Drop blueprints, permits, and documents to start mapping connections"
    primaryAction={{ label: 'Upload Document', onClick: onUpload, icon: <Plus className="w-4 h-4" /> }}
  />
);

export const NoVisionProjectsEmpty = ({ onUpload }) => (
  <EmptyState
    icon={Eye}
    title="No vision projects"
    description="Upload blueprints to analyze them with AI-powered vision"
    primaryAction={{ label: 'Upload Blueprint', onClick: onUpload, icon: <Upload className="w-4 h-4" /> }}
  />
);

export const NoConnectionsEmpty = ({ onAddConnection }) => (
  <EmptyState
    icon={Network}
    title="No connections yet"
    description="Link documents, leads, and jobs to visualize relationships"
    primaryAction={{ label: 'Add Connection', onClick: onAddConnection, icon: <Plus className="w-4 h-4" /> }}
    variant="inline"
  />
);

// ═══════════════════════════════════════════════════════════
// GENERIC & STATUS
// ═══════════════════════════════════════════════════════════

export const ErrorEmpty = ({ onRetry, message }) => (
  <EmptyState
    icon={AlertCircle}
    title="Something went wrong"
    description={message || "We couldn't load the data. Please try again."}
    primaryAction={{ label: 'Try Again', onClick: onRetry, icon: <RotateCcw className="w-4 h-4" /> }}
  />
);

export const ComingSoonEmpty = ({ feature }) => (
  <EmptyState
    icon={Construction}
    title="Coming Soon"
    description={`${feature || 'This feature'} is under development. Check back soon!`}
  />
);

export const NoDataEmpty = ({ onRefresh }) => (
  <EmptyState
    icon={Inbox}
    title="No data available"
    description="There's nothing to show here at the moment"
    primaryAction={onRefresh ? { label: 'Refresh', onClick: onRefresh, icon: <RotateCcw className="w-4 h-4" /> } : undefined}
  />
);

export const LoadingEmpty = () => (
  <EmptyState
    icon={Clock}
    title="Loading..."
    description="Please wait while we fetch the data"
    variant="inline"
  />
);

export default EmptyState;
