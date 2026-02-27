import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import StickyHeader from './StickyHeader';
import PageHeaderBar, { PageHeaderBarSkeleton } from './PageHeaderBar';
import CommandPalette from './CommandPalette';
import OfflineBanner from '../shared/OfflineBanner';
import { ErrorBoundary, SectionErrorBoundary } from '../ui/ErrorBoundary';
import { NotificationCenter, NotificationBellCompact } from '../notifications';
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

// Keyboard shortcuts hook — uses refs to avoid re-attaching listeners on every render
function useKeyboardShortcuts({ onCommandPalette, onNotifications, onAI, onSearch }) {
  const handlersRef = useRef({ onCommandPalette, onNotifications, onAI, onSearch });

  // Keep ref in sync without re-running the effect
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
  }, []); // stable — attaches once
}

export default function Layout() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [pageTitle, setPageTitle] = useState(null);
  const [pageActions, setPageActions] = useState(null);
  const location = useLocation();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  // Poll for files still being processed (used by QuickAddFAB pulse indicator)
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

  // Use the notifications hook
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    hasUrgent,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  } = useNotifications(MOCK_JOBS, MOCK_LEADS);

  // Detect viewport size
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

  // Close mobile sidebar on route change
  useEffect(() => {
    const timer = setTimeout(() => setShowMobileSidebar(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCommandPalette: () => setShowCommandPalette(true),
    onNotifications: () => setShowNotifications(true),
    onAI: () => setShowAI(prev => !prev),
    onSearch: () => setShowSearch(true),
  });

  // Handle mobile sidebar as drawer
  const handleMobileMenuClick = useCallback(() => {
    setShowMobileSidebar(true);
  }, []);
  
  // Reset page header state on route change
  useEffect(() => {
    setPageTitle(null);
    setPageActions(null);
  }, [location.pathname]);

  // Handle notification action
  const handleNotificationAction = useCallback((notification) => {
    // Close notification center
    setShowNotifications(false);
    
    // Navigate based on entity type
    if (notification.entityType === 'job') {
      // Navigate to job detail
      console.log('Navigate to job:', notification.entityId);
    } else if (notification.entityType === 'lead') {
      // Navigate to lead detail
      console.log('Navigate to lead:', notification.entityId);
    }
  }, []);

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
      // Create lead via API
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
      console.error('Failed to create lead:', err);
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

  return (
    <ErrorBoundary componentName="App">
      <div className="flex h-screen h-[100dvh] overflow-hidden bg-forge">
        {/* Offline detection banner */}
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

        {/* Mobile Sidebar Drawer */}
        {isMobile && showMobileSidebar && (
          <MobileSidebarDrawer 
            isOpen={showMobileSidebar}
            onClose={() => setShowMobileSidebar(false)}
            onCommandPaletteOpen={() => setShowCommandPalette(true)}
            onNotificationsOpen={() => setShowNotifications(true)}
            notificationCount={unreadCount}
            hasUrgent={hasUrgent}
          />
        )}

        {/* Main Content */}
        <PageHeaderContext.Provider 
          value={{ 
            setTitle: setPageTitle, 
            setActions: setPageActions,
            reset: () => { setPageTitle(null); setPageActions(null); }
          }}
        >
          <main
            className="flex-1 overflow-y-auto relative flex flex-col"
          >
            {/* Subtle radial depth gradient */}
            <div
              className="pointer-events-none fixed inset-0 z-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.02) 0%, transparent 50%)',
              }}
            />

            {/* Grain texture overlay */}
            <div className="bg-grain pointer-events-none fixed inset-0 z-[1] opacity-60" />

            {/* Content wrapper */}
            <div className="min-h-full relative z-[2] flex flex-col">
              {/* Consistent Page Header Bar - Desktop */}
              {!isMobile && (
                <PageHeaderBar
                  title={pageTitle}
                  actions={pageActions}
                  showBreadcrumb={true}
                  onSearchClick={() => setShowSearch(true)}
                />
              )}
              
              {/* Sticky Header - Mobile/Tablet (legacy, can be phased out) */}
              {(isMobile || isTablet) && (
                <StickyHeader
                  onMenuClick={handleMobileMenuClick}
                  onCommandPaletteOpen={() => setShowCommandPalette(true)}
                  onNotificationsOpen={() => setShowNotifications(true)}
                  notificationCount={unreadCount}
                  hasUrgent={hasUrgent}
                  showBreadcrumbs={!isMobile}
                />
              )}

              {/* Page Content */}
              <div className="flex-1 relative">
                {/* Edge swipe detector for opening mobile sidebar */}
                {isMobile && (
                  <EdgeSwipeDetector onSwipeRight={() => setShowMobileSidebar(true)} />
                )}
                <SectionErrorBoundary>
                  <div className="page-transition-wrapper">
                    <Outlet />
                  </div>
                </SectionErrorBoundary>
              </div>
            </div>
          </main>
        </PageHeaderContext.Provider>

        {/* Command Palette - Global */}
        <CommandPalette 
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
        />

        {/* Notification Center - Global */}
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

        {/* AI Sidebar - Global */}
        <AISidebar
          isOpen={showAI}
          onClose={() => setShowAI(false)}
        />

        {/* AI Floating Button */}
        {!isMobile && (
          <AIFloatingButton
            onClick={() => setShowAI(true)}
            isOpen={showAI}
          />
        )}

        {/* Quick Add FAB - Global */}
        <QuickAddFAB
          onUpload={handleFileUpload}
          onAddLead={handleAddLead}
          onAddNote={handleAddNote}
          hasUnprocessedBlueprints={processingFiles.length > 0}
        />

        {/* Upload FAB - Global */}
        <UploadFAB />

        {/* Global Search Overlay */}
        <GlobalSearch
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
        />
      </div>
    </ErrorBoundary>
  );
}

// Mobile sidebar drawer overlay
function MobileSidebarDrawer({ isOpen, onClose, onCommandPaletteOpen, onNotificationsOpen, notificationCount, hasUrgent }) {
  // Swipe to close
  const swipeHandlers = useSwipe({
    onSwipeLeft: onClose,
    threshold: 50,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      />
      
      {/* Sidebar - with swipe to close */}
      <div 
        {...swipeHandlers}
        className="absolute left-0 top-0 bottom-0 w-[280px] touch-pan-y"
        style={{
          animation: 'slideIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * EdgeSwipeDetector - Invisible edge area that detects right swipes to open sidebar
 * Only active when touching within 20px of left edge
 */
function EdgeSwipeDetector({ onSwipeRight }) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const EDGE_WIDTH = 20; // px from left edge

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    // Only activate if touching within edge width
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

    // Trigger if swiped right more than 50px and mostly horizontal
    if (deltaX > 50 && deltaY < deltaX * 0.5) {
      onSwipeRight?.();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [onSwipeRight]);

  const handleTouchMove = useCallback((e) => {
    // Prevent default if we started on the edge
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
      className="fixed left-0 top-0 bottom-0 z-30"
      style={{ width: `${EDGE_WIDTH}px`, touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      aria-hidden="true"
    />
  );
}
