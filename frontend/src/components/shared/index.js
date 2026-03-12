/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARED COMPONENTS INDEX — UI/UX Overhaul
 * Unified exports for all shared components
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

export { PageHeader, TabNavigation } from './PageHeader';
export { SmoothPage, PageSection, StaggerItem, usePageTransition } from './SmoothPage';

// ═══════════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════════

export { TabSystem, Tab } from '../tabs';

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATES (Legacy)
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATES (Legacy)
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR STATES
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  ErrorState, 
  NetworkErrorState, 
  ServerErrorState, 
  InlineError,
  WarningBanner,
  NotFoundState
} from './ErrorStates';

// ═══════════════════════════════════════════════════════════════════════════════
// CARDS (Legacy)
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  PolishedCard, 
  StatCard, 
  ActionCard, 
  ListItemCard 
} from './PolishedCard';

// ═══════════════════════════════════════════════════════════════════════════════
// NEW: ANIMATED CARDS (UI/UX Overhaul)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AnimatedCard,
  AnimatedStatCard,
  JobCardEnhanced,
} from './AnimatedCard';

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  Toast, 
  ToastContainer,
  ToastProvider,
  useToast,
  toast,
} from './Toast';

// ═══════════════════════════════════════════════════════════════════════════════
// DATA TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export { DataTable } from './DataTable';

// ═══════════════════════════════════════════════════════════════════════════════
// SUCCESS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  SuccessAnimation, 
  SuccessToast, 
  UploadSuccess 
} from './SuccessAnimation';

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETONS (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  TextSkeleton,
  FormSkeleton,
  PageSkeleton,
  ImageSkeleton
} from './LoadingSkeleton';

// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZED IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  OptimizedImage,
  LazyImage,
  Avatar,
  BackgroundImage
} from './OptimizedImage';

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ADD FAB
// ═══════════════════════════════════════════════════════════════════════════════

export { QuickAddFAB } from './QuickAddFAB';

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD MODE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export { FieldModeToggle } from './FieldModeToggle';
export { 
  FieldModeCard, 
  FieldModeList, 
  FieldModeSection 
} from './FieldModeCard';

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { default as ConfirmDialog } from './ConfirmDialog';
export { default as LegacyStatCard } from './StatCard';
export { default as ThemeToggle } from './ThemeToggle';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM RE-EXPORTS (for convenience)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Hooks
  useReducedMotion,
  useHover,
  usePress,
  useInteraction,
  useCountUp,
  useInView,
  useDebouncedValue,
  useThrottledCallback,
  useRipple,
  useScrollPosition,
  useOnlineStatus,
  
  // Animations
  easings,
  durations,
  pageTransitions,
  staggerContainer,
  staggerItem,
  cardAnimations,
  buttonAnimations,
  
  // Utilities
  cx,
  getColor,
  getShadow,
} from '../../design-system';
