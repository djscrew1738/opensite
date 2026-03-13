import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Files, ScanEye, BookOpenText } from 'lucide-react';

import { useDocumentsLibrary } from '../hooks/useDocumentsLibrary';
import VisionCanvas from '../components/vision/VisionCanvas';
import { UploadModal } from '../components/upload';
import { TabSystem, Tab, MobileTabBar } from '../components/tabs';
import { ConfirmDialog } from '../components/shared';
import TabErrorBoundary from '../components/documents/TabErrorBoundary.jsx';
import DocumentsLibrary from '../components/documents/DocumentsLibrary';
import VisionAnalysis from '../components/documents/VisionAnalysis';
import TextIntelligence from '../components/documents/tabs/TextIntelligence';
import { useBreakpoint } from '../hooks/useBreakpoint';

const TABS = [
  { id: 'library', label: 'Library', shortLabel: 'Library', icon: Files },
  { id: 'vision', label: 'AI Analysis', shortLabel: 'Analysis', icon: ScanEye },
  { id: 'text-intel', label: 'Text Intelligence', shortLabel: 'Text', icon: BookOpenText },
];

const DOCUMENTS_WORKSPACE_META = {
  library: {
    title: 'Upload once, then analyze anywhere',
    description: 'Keep blueprints, contracts, and supporting files in one place before moving into AI analysis.',
  },
  vision: {
    title: 'Run AI analysis on uploaded files',
    description: 'Open stored blueprints and drawings here when you need a deeper visual read of the document set.',
  },
  'text-intel': {
    title: 'Extract and review text from your library',
    description: 'Use uploaded documents as the source of truth for OCR, compliance review, and text-based follow-up work.',
  },
};

/**
 * Documents Page
 * Manages blueprint documents with AI-powered analysis
 */
export default function Documents() {
  const queryClient = useQueryClient();
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState('library');
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const {
    documents,
    documentToDelete,
    hasMore,
    isLoading,
    isFetchingMore,
    handleLoadMore,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    selectedItems,
    setSelectedItems,
    handleDeleteRequest,
    confirmDelete,
    handleBulkDelete,
    clearDelete,
  } = useDocumentsLibrary();

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setShowCanvas(true);
  };

  // Tab definitions for mobile
  const tabDefinitions = useMemo(() => TABS, []);
  const mobileBottomInsetClass = 'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]';
  const isLibraryEmpty = activeTab === 'library' && documents.length === 0;
  const workspaceMeta = DOCUMENTS_WORKSPACE_META[activeTab] || DOCUMENTS_WORKSPACE_META.library;

  return (
    <div className="h-full flex flex-col">
      <div
        aria-label="Documents workspace status"
        className="flex flex-col gap-4 px-4 sm:px-6 py-4 border-b border-[#1F2430] bg-[rgba(10,11,13,0.94)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">
              {TABS.find((tab) => tab.id === activeTab)?.label || 'Documents'}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#F8FAFC]">
              {workspaceMeta.title}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-[#94A3B8]">
              {workspaceMeta.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <span className="text-sm text-[#64748B]">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.22)] transition-colors hover:bg-[#2563EB]"
              >
                Upload document
              </button>
              {isLibraryEmpty && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vision')}
                    className="rounded-lg border border-[#1F2430] bg-[#111318] px-4 py-2 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-[#334155] hover:text-white"
                  >
                    AI Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('text-intel')}
                    className="rounded-lg border border-[#1F2430] bg-[#111318] px-4 py-2 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-[#334155] hover:text-white"
                  >
                    Text Intelligence
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Tabs */}
      {!isMobile && (
        <TabSystem
          defaultTab="library"
          variant="default"
          className="border-b border-[#1F2430]"
          onChange={setActiveTab}
        >
          <Tab id="library" label="Library" icon={Files}>
            <TabErrorBoundary onRetry={() => queryClient.invalidateQueries({ queryKey: ['vision-projects'] })}>
              <DocumentsLibrary
                projects={documents}
                isLoading={isLoading && documents.length === 0}
                isFetchingMore={isFetchingMore}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                viewMode={viewMode}
                setViewMode={setViewMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onSelectProject={handleSelectProject}
                onDelete={handleDeleteRequest}
                onBulkDelete={handleBulkDelete}
                onOpenUpload={() => setShowUploadModal(true)}
              />
            </TabErrorBoundary>
          </Tab>
          <Tab id="vision" label="AI Analysis" icon={ScanEye}>
            <TabErrorBoundary onRetry={() => queryClient.invalidateQueries({ queryKey: ['vision-projects'] })}>
              <VisionAnalysis
                projects={documents}
                onSelectProject={handleSelectProject}
              />
            </TabErrorBoundary>
          </Tab>
          <Tab id="text-intel" label="Text Intelligence" icon={BookOpenText}>
            <TabErrorBoundary>
              <TextIntelligence />
            </TabErrorBoundary>
          </Tab>
        </TabSystem>
      )}

      {/* Mobile Content with Bottom Bar */}
      {isMobile && (
        <>
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'library' && (
                <Motion.div
                  key="library"
                  className="h-full"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TabErrorBoundary onRetry={() => queryClient.invalidateQueries({ queryKey: ['vision-projects'] })}>
                    <DocumentsLibrary
                      projects={documents}
                      isLoading={isLoading && documents.length === 0}
                      isFetchingMore={isFetchingMore}
                      hasMore={hasMore}
                      onLoadMore={handleLoadMore}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      selectedItems={selectedItems}
                      setSelectedItems={setSelectedItems}
                      onSelectProject={handleSelectProject}
                      onDelete={handleDeleteRequest}
                      onBulkDelete={handleBulkDelete}
                      onOpenUpload={() => setShowUploadModal(true)}
                      isMobile
                      mobileBottomInsetClass={mobileBottomInsetClass}
                    />
                  </TabErrorBoundary>
                </Motion.div>
              )}
              {activeTab === 'vision' && (
                <Motion.div
                  key="vision"
                  className={`h-full overflow-y-auto ${mobileBottomInsetClass}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TabErrorBoundary onRetry={() => queryClient.invalidateQueries({ queryKey: ['vision-projects'] })}>
                    <VisionAnalysis
                      projects={documents}
                      onSelectProject={handleSelectProject}
                      isMobile
                    />
                  </TabErrorBoundary>
                </Motion.div>
              )}
              {activeTab === 'text-intel' && (
                <Motion.div
                  key="text-intel"
                  className="h-full"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TabErrorBoundary>
                    <TextIntelligence isMobile />
                  </TabErrorBoundary>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileTabBar
            tabs={tabDefinitions}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="default"
            showLabels={true}
            showCenterAction
          />
        </>
      )}

      {/* Canvas Modal for viewing documents */}
      {showCanvas && selectedProject && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowCanvas(false)}
          />
          <div
            className="absolute inset-2 sm:inset-4 rounded-2xl overflow-hidden"
            style={{ background: '#0A0B0D' }}
          >
            <VisionCanvas
              projectId={selectedProject.id}
              onClose={() => setShowCanvas(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {documentToDelete && (
        <ConfirmDialog
          title="Delete Document?"
          message={`Are you sure you want to delete "${documentToDelete.name || 'this document'}"? All associated vision analysis data will be lost.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={clearDelete}
          variant="danger"
        />
      )}

      {/* Universal Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
}
