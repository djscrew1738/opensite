// Theme and UI
export { useTheme, ThemeProvider } from './useTheme';
export { useFieldMode, FieldModeProvider } from './useFieldMode';
export { useToast, ToastProvider } from './useToast';

// Authentication
export { 
  useAuth, 
  AuthProvider, 
  useHasRole, 
  useUserDisplayName,
} from './useAuth';

// URL and Form State
export { useUrlState } from './useUrlState';
export { useFormValidation } from './useFormValidation';

// Data and state management
export { useAIStatus } from './useAIStatus';
export { usePageContext, useEntityContext } from './usePageContext';
export { useBulkSelect } from './useBulkSelect';
export { useFormPersistence } from './useFormPersistence';
export { useLeadScoring } from './useLeadScoring';
export { useModelPreference } from './useModelPreference';
export { usePersistentMemory, MAX_SYSTEM_PROMPT } from './usePersistentMemory';
export { useOllama } from './useOllama';
export { useSorting } from './useSorting';
export { useStreamingResponse } from './useStreamingResponse';
export { useUniversalUpload } from './useUniversalUpload';

// Dashboard
export { useDashboardData } from './useDashboardData';

// Documents
export { useDocumentsLibrary } from './useDocumentsLibrary';
export { 
  useDocuments, 
  useRelativeTime, 
  formatRelativeTime, 
  truncateFilename, 
  formatWordCount,
  formatFileSize 
} from './useDocuments';

// Settings
export { useSettingsAI } from './useSettingsAI';
export { useSettingsNotifications } from './useSettingsNotifications';
export { useSettingsAppearance } from './useSettingsAppearance';
export { useSettingsPerformance } from './useSettingsPerformance';
export { useSettingsData } from './useSettingsData';

// Upload hooks
export { useDragDrop, useFileInput, useFileSelection } from './upload/useDragDrop';
export { useJobPolling, useVisionUpload } from './upload/useJobPolling';

// Blueprint & Vision
export { useFixtureDetection } from './useFixtureDetection';
export { useBlueprintAnalysis } from './useBlueprintAnalysis';
export { 
  useJobStatus, 
  useMultipleJobStatus, 
  useJobsList 
} from './useJobStatus';

// Performance & Optimization
export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useDebouncedFetch,
} from './useDebounce';
export {
  useMemoizedCallback,
  useEventCallback,
  useMemoizedValue,
  useMemoizedSelector,
} from './useMemoizedCallback';
export {
  useVirtualizedList,
  useVirtualizedGrid,
  useDynamicVirtualizedList,
  useInfiniteVirtualizedList,
} from './useVirtualizedList';
export {
  useVirtualList,
  useWindowVirtualList,
} from './useVirtualList';
export {
  useServiceWorker,
  registerServiceWorker,
  unregisterServiceWorker,
  skipWaiting,
  clearCaches,
  isOffline,
  listenForConnectivityChanges,
} from '../utils/serviceWorker';
export {
  useHydration,
  useIsClient,
  useHydrationSafe,
  useHydrationState,
  useHydrationDelay,
  useInteractive,
  withHydrationSafe,
  HydrationSafe,
} from './useHydration';

// UI utilities
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useScrollReset } from './useScrollReset';
export { usePageHeader, PageHeaderContext } from './usePageHeader';
export { useFocusTrap } from './useFocusTrap';
export { useScrollLock, useBodyScrollLock } from './useScrollLock';
export { useSwipe, useSwipeable } from './useSwipe';

// Responsive
export {
  useBreakpoint,
  useResponsiveValue,
  useIsTouchDevice,
  useOrientation,
  usePrefersReducedMotion,
  useMediaQuery,
  BREAKPOINTS,
} from './useBreakpoint';

// Knowledge Vault & Semantic Search
export {
  useSemanticSearch,
  useDebouncedSemanticSearch,
  useKnowledgeBase,
} from './useSemanticSearch';
