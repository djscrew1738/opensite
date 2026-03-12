import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <div className={`h-full flex flex-col page-transition-wrapper ${isMobile ? 'pb-16' : ''}`}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#1F2430] bg-[#0A0B0D]/80 backdrop-blur-sm sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">Documents</h1>
          <p className="text-sm mt-0.5 text-[#94A3B8] hidden sm:block">
            Manage files and AI-powered blueprint analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#64748B]">
            {documents.length} <span className="hidden sm:inline">document{documents.length !== 1 ? 's' : ''}</span>
          </span>
        </div>
      </motion.div>

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
          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'library' && (
                <motion.div
                  key="library"
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
                    />
                  </TabErrorBoundary>
                </motion.div>
              )}
              {activeTab === 'vision' && (
                <motion.div
                  key="vision"
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
                </motion.div>
              )}
              {activeTab === 'text-intel' && (
                <motion.div
                  key="text-intel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TabErrorBoundary>
                    <TextIntelligence isMobile />
                  </TabErrorBoundary>
                </motion.div>
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
