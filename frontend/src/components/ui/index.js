/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UI COMPONENT LIBRARY v2.0 — UI/UX Overhaul
 * Centralized, standardized UI components for the entire application
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  Button, 
  IconButton, 
  ButtonGroup, 
  FAB,
} from './Button';

export { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter,
  CardMedia,
  CardBadge,
  StatCard,
} from './Card';

export { 
  EmptyState,
  EmptySearch,
  EmptyJobs,
  EmptyUploads,
  EmptyLeads,
  ErrorState,
  SuccessState,
  LoadingState,
} from './EmptyState';

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonList,
  SkeletonTable,
  SkeletonGrid,
  SkeletonAvatarGroup,
  PulseLoader,
  ShimmerCard,
} from './Skeleton';

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

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
  Skeleton as SkeletonLegacy,
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
  EmptyState as EmptyStateLegacy,
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

export { ErrorBoundary, SectionErrorBoundary, useAsyncError } from './ErrorBoundary';
export {
  BottomSheet,
  JobDetailSheet,
  PhaseUpdateSheet,
  FilterSheet,
  AlertDetailSheet,
  QuickAddSheet,
} from './BottomSheet';

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATES (from empty-states module)
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM (New v2.0)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Tokens
  tokens,
  colors,
  typography,
  spacing,
  space,
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
  a11y,
  
  // Animations
  easings,
  durations,
  pageTransitions,
  staggerContainer,
  staggerItem,
  cardAnimations,
  buttonAnimations,
  modalAnimations,
  loadingAnimations,
  feedbackAnimations,
  listAnimations,
  scrollReveal,
  hoverEffects,
  
  // Hooks
  useReducedMotion,
  useHover,
  usePress,
  useInteraction,
  useCountUp,
  useInView,
  useDebouncedValue,
  useThrottledCallback,
  useLongPress,
  useRipple,
  useFocusTrap,
  useScrollPosition,
  useWindowSize,
  useKeyPress,
  useKeyCombo,
  useOnlineStatus,
  useMediaQuery,
  useIsTouchDevice,
  useSmoothScroll,
  useLoadingState,
  useAnimationSequence,
  useTooltipPosition,
  
  // Utilities
  getColor,
  getShadow,
  getDuration,
  getEasing,
  cx,
  createVariants,
  buttonVariants,
  cardVariants,
  badgeVariants,
  DESIGN_SYSTEM,
} from '../../design-system';

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY TOKENS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  colors as colorsLegacy,
  spacing as spacingLegacy,
  typography as typographyLegacy,
  radius as radiusLegacy,
  shadows as shadowsLegacy,
  animation as animationLegacy,
  zIndex as zIndexLegacy,
  breakpoints as breakpointsLegacy,
  component as componentLegacy,
  PHASES as PHASESLegacy,
  PHASE_MAP as PHASE_MAPLegacy,
  BUILDERS as BUILDERSLegacy,
  getBuilder as getBuilderLegacy,
} from '../../styles/tokens';
