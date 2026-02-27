import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Files, ScanEye, BookOpenText } from 'lucide-react';
import { visionApi } from '../api/vision';
import { useDocumentsLibrary } from '../hooks/useDocumentsLibrary';
import VisionCanvas from '../components/vision/VisionCanvas';
import { UploadModal } from '../components/upload';
import { TabSystem, Tab } from '../components/tabs';
import { ConfirmDialog } from '../components/shared';
import TabErrorBoundary from '../components/documents/TabErrorBoundary.jsx';
import DocumentsLibrary from '../components/documents/DocumentsLibrary';
import VisionAnalysis from '../components/documents/VisionAnalysis';
import TextIntelligence from '../components/documents/tabs/TextIntelligence';

/**
 * Documents Page
 * Manages blueprint documents with AI-powered analysis
 */
export default function Documents() {
  const queryClient = useQueryClient();
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

  return (
    <div className="h-full flex flex-col page-transition-wrapper">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #1F2430' }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Documents</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
            Manage files and AI-powered blueprint analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#64748B' }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Canvas Modal for viewing documents */}
      {showCanvas && selectedProject && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowCanvas(false)}
          />
          <div
            className="absolute inset-4 rounded-2xl overflow-hidden"
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
