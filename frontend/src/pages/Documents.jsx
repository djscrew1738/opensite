import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useToast } from '../hooks/useToast';
import { Files, ScanEye, BookOpenText } from 'lucide-react';
import { visionApi } from '../api/vision';
import { docvaultApi } from '../api/docvault';
import VisionCanvas from '../components/vision/VisionCanvas';
import { UploadModal, UploadDropzone } from '../components/upload';
import DocSidebar from '../components/documents/DocSidebar';
import DocViewer from '../components/documents/DocViewer';
import { TabSystem, Tab } from '../components/tabs';
import { ConfirmDialog } from '../components/shared';
import TabErrorBoundary from '../components/documents/TabErrorBoundary.jsx';
import DocumentsLibrary from '../components/documents/DocumentsLibrary';
import VisionAnalysis from '../components/documents/VisionAnalysis';
import { VIEW_MODES } from '../components/documents/docHelpers';

// Text Intelligence Component
function TextIntelligence() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Fetch text documents list
  const { data: textDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['docvault-documents'],
    queryFn: () => docvaultApi.getAll(),
    refetchInterval: (query) => {
      // Poll while any document is processing
      const docs = query.state.data || [];
      return docs.some(d => d.status === 'processing') ? 3000 : false;
    },
  });

  // Fetch selected document details
  const { data: selectedDoc } = useQuery({
    queryKey: ['docvault-document', selectedDocId],
    queryFn: () => docvaultApi.getOne(selectedDocId),
    enabled: !!selectedDocId,
  });

  // Fetch chat history when document selected
  useEffect(() => {
    if (!selectedDocId) {
      setChatHistory([]);
      return;
    }
    docvaultApi.getChatHistory(selectedDocId)
      .then(messages => setChatHistory(messages || []))
      .catch(() => setChatHistory([]));
  }, [selectedDocId]);

  // Upload handler — accepts FileList from UploadDropzone
  const handleUpload = async (files) => {
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        await docvaultApi.upload(file);
      }
      queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
      success('Document uploaded');
    } catch {
      showError('Upload failed');
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    try {
      await docvaultApi.delete(id);
      if (selectedDocId === id) setSelectedDocId(null);
      queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
      success('Document deleted');
    } catch {
      showError('Failed to delete document');
    }
  };

  // Summarize handler
  const handleSummarize = async () => {
    if (!selectedDocId) return;
    setIsAiLoading(true);
    try {
      await docvaultApi.summarize(selectedDocId);
      queryClient.invalidateQueries({ queryKey: ['docvault-document', selectedDocId] });
      success('Summary generated');
    } catch {
      showError('Failed to generate summary');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Extract entities handler
  const handleExtract = async () => {
    if (!selectedDocId) return;
    setIsAiLoading(true);
    try {
      await docvaultApi.extract(selectedDocId);
      queryClient.invalidateQueries({ queryKey: ['docvault-document', selectedDocId] });
      success('Entities extracted');
    } catch {
      showError('Failed to extract entities');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Chat handler
  const handleChat = async (message) => {
    if (!selectedDocId || !message.trim()) return;
    // Optimistic: add user message immediately
    const userMsg = { role: 'user', content: message, created_at: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    setIsAiLoading(true);
    try {
      const result = await docvaultApi.chat(selectedDocId, message);
      const assistantMsg = { role: 'assistant', content: result.answer, created_at: new Date().toISOString() };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', created_at: new Date().toISOString() };
      setChatHistory(prev => [...prev, errorMsg]);
      showError('Chat request failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear chat handler
  const handleClearChat = async () => {
    if (!selectedDocId) return;
    try {
      await docvaultApi.clearChat(selectedDocId);
      setChatHistory([]);
    } catch {
      showError('Failed to clear chat history');
    }
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left panel: Upload + Document list */}
      <div
        className="w-72 lg:w-80 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: '#1F2430', backgroundColor: '#0A0B0D' }}
      >
        <div className="p-3">
          <UploadDropzone compact onFiles={handleUpload} />
        </div>
        <DocSidebar
          documents={textDocs}
          selectedId={selectedDocId}
          onSelect={setSelectedDocId}
          onDelete={handleDelete}
          isLoading={docsLoading}
        />
      </div>

      {/* Right panel: Document viewer */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ backgroundColor: '#0A0B0D' }}>
        {selectedDocId && selectedDoc ? (
          <DocViewer
            document={selectedDoc}
            onBack={() => setSelectedDocId(null)}
            onSummarize={handleSummarize}
            onExtract={handleExtract}
            onChat={handleChat}
            onClearChat={handleClearChat}
            chatHistory={chatHistory}
            isAiLoading={isAiLoading}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}
              >
                <BookOpenText className="w-7 h-7" style={{ color: '#64748B' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                Select a document to analyze
              </p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                Upload text files and use AI to summarize, extract entities, and chat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Documents Page
export default function Documents() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('library');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [documents, setDocuments] = useState([]);
  const pageSize = viewMode === VIEW_MODES.LIST ? 50 : 24;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setHasMore(true);
      setDocuments([]);
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch paged projects
  const { data: pageData = [], isLoading, isFetching } = useQuery({
    queryKey: ['vision-projects', { page, pageSize, debouncedQuery, sortBy }],
    queryFn: () => visionApi.getProjects({
      limit: pageSize,
      offset: page * pageSize,
      q: debouncedQuery || undefined,
      sort: sortBy,
    }),
    placeholderData: keepPreviousData,
  });

  // Merge pages
  useEffect(() => {
    if (!pageData) return;
    setDocuments(prev => page === 0 ? pageData : [...prev, ...pageData]);
    setHasMore((pageData?.length || 0) === pageSize);
  }, [pageData, page, pageSize]);

  const handleLoadMore = () => {
    if (hasMore && !isFetching) setPage(p => p + 1);
  };

  const handleDelete = (id, e) => {
    e?.stopPropagation();
    const project = documents.find(p => p.id === id);
    setDocumentToDelete(project || { id });
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      await visionApi.deleteProject(documentToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
      setDocumentToDelete(null);
      success('Document deleted');
    } catch {
      showError('Failed to delete document');
    }
  };

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
              isFetchingMore={isFetching && documents.length > 0}
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
              onDelete={handleDelete}
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
          onCancel={() => setDocumentToDelete(null)}
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
