// Page layout
export { PageHeader, TabNavigation } from './PageHeader';

// Tab System (unified - recommended for new code)
export { TabSystem, Tab } from '../tabs';
export { SmoothPage, PageSection, StaggerItem, usePageTransition } from './SmoothPage';

// Loading states
export { 
  PageLoader, 
  CardSkeleton, 
  ListSkeleton, 
  TableSkeleton, 
  StatsSkeleton,
  StatCardSkeleton,
  LeadCardSkeleton,
  JobCardSkeleton,
  DashboardSkeleton,
  ShimmerBlock,
  InlineLoader,
  ContentPlaceholder,
  AIThinking 
} from './LoadingStates';

// Empty states
export { 
  EmptyState, 
  NoResultsState, 
  NoDataState, 
  EmptyInboxState,
  ComingSoonState,
  EmptyLeadsState,
  EmptyProjectsState,
  EmptyEstimatesState,
  EmptyBlueprintsState,
  EmptyMaterialsState,
  EmptyAnalyticsState,
  EmptyMessagesState,
  EmptyTableState,
  LoadingState,
} from './EmptyStates';

// Error states
export { 
  ErrorState, 
  NetworkErrorState, 
  ServerErrorState, 
  InlineError,
  WarningBanner,
  NotFoundState
} from './ErrorStates';

// Cards
export { 
  PolishedCard, 
  StatCard, 
  ActionCard, 
  ListItemCard 
} from './PolishedCard';

// Toast notifications
export { Toast, ToastContainer } from './Toast';

// Data Table
export { DataTable } from './DataTable';

// Success Animations & Micro-interactions
export { 
  SuccessAnimation, 
  SuccessToast, 
  UploadSuccess 
} from './SuccessAnimation';

// Loading Skeletons (Enhanced versions)
export {
  TextSkeleton,
  FormSkeleton,
  PageSkeleton,
  ImageSkeleton
} from './LoadingSkeleton';

// Optimized Images
export {
  OptimizedImage,
  LazyImage,
  Avatar,
  BackgroundImage
} from './OptimizedImage';

// Quick Add FAB
export { QuickAddFAB } from './QuickAddFAB';

// Field Mode components
export { FieldModeToggle } from './FieldModeToggle';
export { 
  FieldModeCard, 
  FieldModeList, 
  FieldModeSection 
} from './FieldModeCard';

// Legacy exports
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as LegacyStatCard } from './StatCard';
export { default as ThemeToggle } from './ThemeToggle';
