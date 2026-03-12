import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import StickyHeader from './StickyHeader';
import PageHeaderBar, { PageHeaderBarSkeleton } from './PageHeaderBar';
import CommandPalette from './CommandPalette';
import OfflineBanner from '../shared/OfflineBanner';
import { ErrorBoundary, SectionErrorBoundary } from '../ui/ErrorBoundary';
import { NotificationCenter } from '../notifications';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';
import { AISidebar, AIFloatingButton } from '../ai';
import { GlobalSearch } from '../search';
import { UploadFAB } from '../upload';
import { PageHeaderContext } from '../../hooks/usePageHeader';
import { useSwipe } from '../../hooks/useSwipe';
import { QuickAddFAB } from '../shared/QuickAddFAB';
import { api } from '../../api/client';
import { uploadApi } from '../../api/upload';

const QUICK_NOTES_KEY = 'ctlplumbing_quicknotes';

// Import mock data for notifications
const MOCK_JOBS = [
  { id: 'CTL-1041', address: '2914 Ridgewood Dr', city: 'Aubrey', zip: '76227', builder: 'DR Horton', phase: 'underground', daysInPhase: 4, status: 'healthy' },
  { id: 'CTL-1042', address: '5103 Copper Canyon Trl', city: 'Fort Worth', zip: '76244', builder: 'Horizon Homes', phase: 'roughin', daysInPhase: 7, status: 'due-today' },
  { id: 'CTL-1043', address: '810 Bluebonnet Blvd', city: 'Celina', zip: '75009', builder: 'DR Horton', phase: 'topout', daysInPhase: 12, status: 'overdue' },
  { id: 'CTL-1044', address: '3321 Harvest Bend Ln', city: 'Prosper', zip: '75078', builder: 'DR Horton', phase: 'trim', daysInPhase: 3, status: 'healthy' },
  { id: 'CTL-1045', address: '1204 Prairie Wind Dr', city: 'Sanger', zip: '76266', builder: 'Horizon Homes', phase: 'final', daysInPhase: 2, status: 'due-today' },
  { id: 'CTL-1046', address: '7750 Stampede Dr', city: 'Haslet', zip: '76052', builder: 'DR Horton', phase: 'underground', daysInPhase: 1, status: 'healthy' },
  { id: 'CTL-1047', address: '4460 Ridgepoint Ct', city: 'Denton', zip: '76210', builder: 'Horizon Homes', phase: 'roughin', daysInPhase: 9, status: 'overdue' },
  { id: 'CTL-1048', address: '990 Twin Creeks Pkwy', city: 'Allen', zip: '75013', builder: 'DR Horton', phase: 'topout', daysInPhase: 5, status: 'healthy' },
  { id: 'CTL-1049', address: '6622 Elm Fork Dr', city: 'Frisco', zip: '75033', builder: 'Horizon Homes', phase: 'trim', daysInPhase: 6, status: 'healthy' },
  { id: 'CTL-1050', address: '1180 Cattlemen Dr', city: 'Pilot Point', zip: '76258', builder: 'DR Horton', phase: 'underground', daysInPhase: 11, status: 'overdue' },
];

const MOCK_LEADS = [
  { id: 'lead-1', name: 'DR Horton - Celina', company: 'DR Horton', aiScore: 85, status: 'new', lastContactDate: null, isNewPermit: true, permitDate: new Date().toISOString(), address: '123 Main St' },
  { id: 'lead-2', name: 'Horizon Homes', company: 'Horizon Homes', aiScore: 45, status: 'contacted', lastContactDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), address: '456 Oak Ave' },
  { id: 'lead-3', name: 'Lennar Construction', company: 'Lennar', aiScore: 92, status: 'estimate_pending', lastContactDate: null, isNewPermit: false },
  { id: 'lead-4', name: 'Perry Homes', company: 'Perry', aiScore: 67, status: 'archived', archivedDate: new Date().toISOString(), address: '789 Pine Ln' },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Radial gradient background overlay
 */
const RadialGradient = memo(function RadialGradient() {
  return (
    <div 
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.02) 0%, transparent 50%)',
      }}
    />
  );
});

/**
 * Grain texture overlay
 */
const GrainOverlay = memo(function GrainOverlay() {
  return <div className="bg-grain pointer-events-none fixed inset-0 z-[1] opacity-60" />;
});

/**
 * Mobile sidebar drawer with animations
 */
const MobileSidebarDrawer = memo(function MobileSidebarDrawer({ 
  isOpen, 
  onClose, 
  onCommandPaletteOpen, 
  onNotificationsOpen, 
  notificationCount, 
  hasUrgent 
}) {
  const swipeHandlers = useSwipe({
    onSwipeLeft: onClose,
    threshold: 50,
  });

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        {...swipeHandlers}
        className="absolute left-0 top-0 bottom-0 w-[280px] touch-pan-y animate-slide-in-left"
      >
        <Sidebar 
          onCommandPaletteOpen={() => {
            onClose();
            setTimeout(onCommandPaletteOpen, 100);
          }}
          onNotificationsOpen={() => {
            onClose();
            setTimeout(onNotificationsOpen, 100);
          }}
          onItemClick={onClose}
          notificationCount={notificationCount}
          hasUrgent={hasUrgent}
        />
      </div>
    </div>
  );
});

MobileSidebarDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCommandPaletteOpen: PropTypes.func.isRequired,
  onNotificationsOpen: PropTypes.func.isRequired,
  notificationCount: PropTypes.number.isRequired,
  hasUrgent: PropTypes.bool.isRequired,
};

/**
 * Edge swipe detector for opening mobile sidebar
 */
const EdgeSwipeDetector = memo(function EdgeSwipeDetector({ onSwipeRight }) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const EDGE_WIDTH = 20;

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    if (touch.clientX <= EDGE_WIDTH) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    if (deltaX > 50 && deltaY < deltaX * 0.5) {
      onSwipeRight?.();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [onSwipeRight]);

  const handleTouchMove = useCallback((e) => {
    if (touchStartX.current !== null) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      if (deltaX > 10) {
        e.preventDefault();
      }
    }
  }, []);

  return (
    <div
      className="fixed left-0 top-0 bottom-0 z-30 w-5 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      aria-hidden="true"
    />
  );
});

EdgeSwipeDetector.propTypes = {
  onSwipeRight: PropTypes.func.isRequired,
};

// ═══════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════

function useKeyboardShortcuts({ onCommandPalette, onNotifications, onAI, onSearch }) {
  const handlersRef = useRef({ onCommandPalette, onNotifications, onAI, onSearch });

  useEffect(() => {
    handlersRef.current = { onCommandPalette, onNotifications, onAI, onSearch };
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const h = handlersRef.current;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        h.onSearch();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        h.onNotifications();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        h.onAI();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function useViewportSize() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return { isMobile, isTablet };
}

function useProcessingFiles() {
  const { data: processingFiles = [] } = useQuery({
    queryKey: ['processing-files'],
    queryFn: () => uploadApi.getFiles({ limit: 10 }),
    select: (files) => (Array.isArray(files) ? files.filter(f => f.pipeline_status === 'processing') : []),
    refetchInterval: (query) => {
      const hasProcessing = (query.state.data?.length ?? 0) > 0;
      return hasProcessing ? 5000 : 30000;
    },
    staleTime: 5000,
  });

  return processingFiles;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function Layout() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [pageTitle, setPageTitle] = useState(null);
  const [pageActions, setPageActions] = useState(null);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const { isMobile, isTablet } = useViewportSize();
  const processingFiles = useProcessingFiles();

  const {
    notifications,
    groupedNotifications,
    unreadCount,
    hasUrgent,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  } = useNotifications([], []);

  // Reset page header state on route change
  useEffect(() => {
    setPageTitle(null);
    setPageActions(null);
  }, [location.pathname]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCommandPalette: () => setShowCommandPalette(true),
    onNotifications: () => setShowNotifications(true),
    onAI: () => setShowAI(prev => !prev),
    onSearch: () => setShowSearch(true),
  });

  // QuickAddFAB callbacks
  const handleFileUpload = useCallback(async (file) => {
    try {
      await uploadApi.upload([file], {});
      queryClient.invalidateQueries({ queryKey: ['universal-files'] });
      queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
      queryClient.invalidateQueries({ queryKey: ['processing-files'] });
      toastSuccess(`Uploaded: ${file.name}`);
    } catch {
      toastError('Upload failed — try again');
    }
  }, [queryClient, toastSuccess, toastError]);

  const handleAddLead = useCallback(async (formData) => {
    try {
      await api.leads.create({
        name: formData.builderName,
        company: formData.builderName,
        address: formData.address,
        permitNumber: formData.permitNumber,
        phase: formData.phase,
        notes: formData.notes,
        status: 'new',
      });
    } catch (err) {
      // Error is already handled by the API client
      throw err;
    }
  }, []);

  const handleAddNote = useCallback((note) => {
    if (!note?.trim()) return;
    const existing = JSON.parse(localStorage.getItem(QUICK_NOTES_KEY) || '[]');
    const newNote = { id: Date.now(), text: note.trim(), createdAt: new Date().toISOString() };
    localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify([newNote, ...existing].slice(0, 50)));
    toastSuccess('Note saved');
  }, [toastSuccess]);

  const handleNotificationAction = useCallback((notification) => {
    setShowNotifications(false);
    // Navigation is handled by the notification click handler
    if (notification.entityType === 'job' || notification.entityType === 'lead') {
      // Navigation logic handled by parent component
    }
  }, []);

  const pageHeaderContextValue = {
    setTitle: setPageTitle,
    setActions: setPageActions,
    reset: () => { setPageTitle(null); setPageActions(null); }
  };

  return (
    <ErrorBoundary componentName="App">
      <div className="flex h-screen h-[100dvh] overflow-hidden bg-forge">
        <OfflineBanner />

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar 
            onCommandPaletteOpen={() => setShowCommandPalette(true)}
            onNotificationsOpen={() => setShowNotifications(true)}
            notificationCount={unreadCount}
            hasUrgent={hasUrgent}
          />
        )}

        {/* Main Content */}
        <PageHeaderContext.Provider value={pageHeaderContextValue}>
          <main className="flex-1 overflow-y-auto relative flex flex-col">
            <RadialGradient />
            <GrainOverlay />

            {/* Content wrapper */}
            <div className="min-h-full relative z-[2] flex flex-col">
              {/* Desktop Page Header */}
              {!isMobile && (
                <PageHeaderBar
                  title={pageTitle}
                  actions={pageActions}
                  showBreadcrumb={true}
                  onSearchClick={() => setShowSearch(true)}
                />
              )}
              
              {/* Mobile/Tablet Sticky Header */}
              {(isMobile || isTablet) && (
                <StickyHeader
                  onMenuClick={() => {}}
                  onCommandPaletteOpen={() => setShowCommandPalette(true)}
                  onNotificationsOpen={() => setShowNotifications(true)}
                  notificationCount={unreadCount}
                  hasUrgent={hasUrgent}
                  showBreadcrumbs={!isMobile}
                />
              )}

              {/* Page Content */}
              <div className="flex-1 relative">
                <SectionErrorBoundary>
                  <div className="page-transition-wrapper">
                    <Outlet />
                  </div>
                </SectionErrorBoundary>
              </div>
            </div>
          </main>
        </PageHeaderContext.Provider>

        {/* Global Modals & Overlays */}
        <CommandPalette 
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
        />

        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={notifications}
          groupedNotifications={groupedNotifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onDismiss={dismiss}
          onClearAll={clearAll}
          onAction={handleNotificationAction}
        />

        <AISidebar isOpen={showAI} onClose={() => setShowAI(false)} />

        {!isMobile && (
          <AIFloatingButton onClick={() => setShowAI(true)} isOpen={showAI} />
        )}

        <QuickAddFAB
          onUpload={handleFileUpload}
          onAddLead={handleAddLead}
          onAddNote={handleAddNote}
          hasUnprocessedBlueprints={processingFiles.length > 0}
        />

        <UploadFAB />

        {isMobile && (
          <MobileNav
            alertCount={unreadCount}
            hasUrgent={hasUrgent}
            onCommandPaletteOpen={() => setShowCommandPalette(true)}
            onNotificationsOpen={() => setShowNotifications(true)}
            onAIOpen={() => setShowAI(true)}
            isAIOpen={showAI}
          />
        )}

        <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
      </div>
    </ErrorBoundary>
  );
}
