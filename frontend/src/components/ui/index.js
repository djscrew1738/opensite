// UI Component Library
// ====================
// Centralized, standardized UI components for the entire application.

export { Button, IconButton, ButtonGroup } from './Button';
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export { 
  AccessibleCard, 
  AccessibleCardHeader, 
  AccessibleCardContent, 
  AccessibleCardFooter 
} from './AccessibleCard';
export { Badge, StatusBadge, PhaseBadge } from './Badge';
export { Input, TextArea, Select } from './Input';
export { Modal, ConfirmModal, Drawer } from './Modal';
export { Panel, StatPanel, SidebarPanel } from './Panel';
export {
  Skeleton,
  CardSkeleton,
  StatCardSkeleton,
  TableSkeleton,
  ListItemSkeleton,
  JobCardSkeleton,
  DetailPanelSkeleton,
  DashboardSkeleton,
  CanvasSkeleton,
  AlertFeedSkeleton,
  MetricsStripSkeleton,
} from './Skeleton';
export {
  EmptyState,
  NoActiveJobsEmpty,
  NoLeadsTodayEmpty,
  NoInspectionsEmpty,
  NoCanvasDocumentsEmpty,
  NoAlertsEmpty,
  NoSearchResultsEmpty,
  // Legacy compat
  NoJobsEmptyState,
  NoLeadsEmptyState,
  NoDocumentsEmptyState,
  NoSearchResultsEmptyState,
  NoCanvasNodesEmptyState,
  NoProposalsEmptyState,
  NoNotificationsEmptyState,
  ErrorEmptyState,
  NoPermitsEmptyState,
  NoBlueprintsEmptyState,
  NoHistoryEmptyState,
} from './EmptyState';

// New comprehensive empty states (also available from empty-states module)
export {
  // Jobs & Projects
  NoJobsEmpty,
  NoEstimatesEmpty,
  NoBlueprintsEmpty as NoBlueprintsEmptyNew,
  NoProjectSelectedEmpty,
  
  // Leads
  NoLeadsEmpty as NoLeadsEmptyNew,
  NoPermitsEmpty as NoPermitsEmptyNew,
  NoBuildersEmpty,
  NoSearchResultsEmpty as NoSearchResultsEmptyNew,
  ColdLeadsEmpty,
  NoDiscoveryResultsEmpty,
  
  // Documents
  NoDocumentsEmpty as NoDocumentsEmptyNew,
  NoAnalysisEmpty,
  UploadPromptEmpty,
  NoMatchingDocumentsEmpty,
  
  // Dashboard
  NoActivityEmpty,
  NoInsightsEmpty,
  DashboardWelcomeEmpty,
  
  // History
  NoHistoryEmpty as NoHistoryEmptyNew,
  
  // AI
  NoAIInsightsEmpty,
  NoChatHistoryEmpty,
  AIAnalysisPendingEmpty,
  
  // Canvas
  NoCanvasItemsEmpty,
  NoVisionProjectsEmpty,
  NoConnectionsEmpty,
  
  // Generic
  ErrorEmpty,
  ComingSoonEmpty,
  NoDataEmpty,
  LoadingEmpty,
} from '../empty-states';
export { ErrorBoundary, SectionErrorBoundary, useAsyncError } from './ErrorBoundary';
export {
  BottomSheet,
  JobDetailSheet,
  PhaseUpdateSheet,
  FilterSheet,
  AlertDetailSheet,
  QuickAddSheet,
} from './BottomSheet';

// Re-export tokens for convenience
export {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  animation,
  zIndex,
  breakpoints,
  component,
  PHASES,
  PHASE_MAP,
  BUILDERS,
  getBuilder,
} from '../../styles/tokens';
