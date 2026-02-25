import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Files, Plus, Trash2, FileImage, LayoutGrid,
  ChevronRight, Loader2, AlertCircle, Upload,
  FolderOpen, Image, FileText, MoreVertical,
  Download, Eye, EyeOff, Grid3X3, List,
  Search, Filter, SortAsc, Calendar, Clock,
  CheckCircle2, X, Maximize2, Copy, Move,
  Star, Tag, Pin, Share2, Archive, ScanEye,
  BrainCircuit, BookOpenText
} from 'lucide-react';
import { visionApi } from '../api/vision';
import { docvaultApi } from '../api/docvault';
import VisionCanvas from '../components/vision/VisionCanvas';
import BlueprintSelector from '../components/vision/BlueprintSelector';
import DocUpload from '../components/documents/DocUpload';
import DocSidebar from '../components/documents/DocSidebar';
import DocViewer from '../components/documents/DocViewer';
import { TabSystem, Tab } from '../components/tabs';
import { NoDocumentsEmpty, NoAnalysisEmpty } from '../components/empty-states';
import { ConfirmDialog } from '../components/shared';
import { useToast } from '../hooks/useToast';
import TabErrorBoundary from '../components/documents/TabErrorBoundary.jsx';

// Document types configuration
const FILE_TYPES = {
  pdf: { icon: FileText, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'PDF' },
  png: { icon: Image, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', label: 'PNG' },
  jpg: { icon: Image, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', label: 'JPG' },
  jpeg: { icon: Image, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', label: 'JPEG' },
  tiff: { icon: Image, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'TIFF' },
  tif: { icon: Image, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'TIF' },
  webp: { icon: Image, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'WebP' },
  dwg: { icon: FileText, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'DWG' },
};

// View modes
const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Documents Library Component
function DocumentsLibrary({ 
  projects, 
  isLoading, 
  isFetchingMore,
  hasMore,
  onLoadMore,
  viewMode, 
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedItems,
  setSelectedItems,
  onSelectProject,
  onDelete,
  onUpload,
  uploadingFiles = []
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const listParentRef = useRef(null);
  const sortedProjects = useMemo(() => [...projects].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
    return 0;
  }), [projects, sortBy]);
  const rowVirtualizer = useVirtualizer({
    count: sortedProjects.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    onUpload?.(files);
  }, [onUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div 
      className="h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div 
        className="flex flex-wrap items-center justify-between gap-3 p-4"
        style={{ borderBottom: '1px solid #1F2430' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{ 
                background: '#0F1117',
                border: '1px solid #2D3548',
                color: '#F1F5F9'
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{ 
              background: '#0F1117',
              border: '1px solid #2D3548',
              color: '#94A3B8'
            }}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #2D3548' }}>
            <button
              onClick={() => setViewMode(VIEW_MODES.GRID)}
              className="p-2 transition-colors"
              style={{ 
                background: viewMode === VIEW_MODES.GRID ? '#181C24' : '#0F1117',
                color: viewMode === VIEW_MODES.GRID ? '#F1F5F9' : '#64748B'
              }}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              className="p-2 transition-colors"
              style={{ 
                background: viewMode === VIEW_MODES.LIST ? '#181C24' : '#0F1117',
                color: viewMode === VIEW_MODES.LIST ? '#F1F5F9' : '#64748B'
              }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ 
              background: '#3B82F6',
              color: '#FFFFFF',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.dwg"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Drop zone overlay */}
      {isDragging && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center m-4 rounded-xl"
          style={{ 
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px dashed #3B82F6'
          }}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-2" style={{ color: '#3B82F6' }} />
            <p className="font-medium" style={{ color: '#F1F5F9' }}>Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Documents grid/list */}
      <div className="p-4">
        {uploadingFiles.length > 0 && (
          <div className="space-y-2 mb-4">
            {uploadingFiles.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#111318', border: '1px solid #1F2430' }}>
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#F1F5F9' }}>{u.name}</p>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#0F1117' }}>
                    <div className="h-full" style={{ width: `${u.progress || 5}%`, background: '#3B82F6' }} />
                  </div>
                </div>
                <span className="text-xs" style={{ color: '#94A3B8' }}>{u.progress ? `${u.progress}%` : 'Uploading'}</span>
              </div>
            ))}
          </div>
        )}

        {isLoading && projects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : sortedProjects.length === 0 ? (
          <NoDocumentsEmpty onUpload={() => fileInputRef.current?.click()} />
        ) : viewMode === VIEW_MODES.GRID ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedProjects.map((project) => (
              <DocumentCard 
                key={project.id} 
                project={project}
                isSelected={selectedItems.has(project.id)}
                onSelect={() => toggleSelection(project.id)}
                onClick={() => onSelectProject(project)}
                onDelete={(e) => onDelete(project.id, e)}
              />
            ))}
          </div>
        ) : (
          <div
            ref={listParentRef}
            style={{ height: 'calc(100vh - 260px)', overflow: 'auto', position: 'relative' }}
          >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const project = sortedProjects[virtualRow.index];
                return (
                  <div
                    key={project.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <DocumentListItem 
                      project={project}
                      isSelected={selectedItems.has(project.id)}
                      onSelect={() => toggleSelection(project.id)}
                      onClick={() => onSelectProject(project)}
                      onDelete={(e) => onDelete(project.id, e)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Load more */}
        {hasMore && sortedProjects.length > 0 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onLoadMore}
              disabled={isFetchingMore}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#111318', border: '1px solid #1F2430', color: '#F1F5F9' }}
            >
              {isFetchingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Document Card Component
function DocumentCard({ project, isSelected, onSelect, onClick, onDelete }) {
  const fileType = FILE_TYPES[project.fileType?.toLowerCase()] || FILE_TYPES.pdf;
  const Icon = fileType.icon;

  return (
    <div
      onClick={onClick}
      className="group relative p-4 rounded-xl cursor-pointer transition-all"
      style={{
        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#111318',
        border: `1px solid ${isSelected ? '#3B82F6' : '#1F2430'}`,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#2D3548';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#1F2430';
      }}
    >
      {/* Selection checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center transition-colors"
        style={{
          background: isSelected ? '#3B82F6' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${isSelected ? '#3B82F6' : '#2D3548'}`,
        }}
      >
        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      {/* File icon */}
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto"
        style={{ background: fileType.bg }}
      >
        <Icon className="w-6 h-6" style={{ color: fileType.color }} />
      </div>

      {/* File name */}
      <p 
        className="font-medium text-sm truncate text-center"
        style={{ color: '#F1F5F9' }}
      >
        {project.name || 'Untitled'}
      </p>

      {/* Meta info */}
      <p className="text-xs text-center mt-1" style={{ color: '#64748B' }}>
        {formatFileSize(project.size)} · {formatDate(project.createdAt)}
      </p>

      {/* Actions */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#EF4444' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Document List Item Component
function DocumentListItem({ project, isSelected, onSelect, onClick, onDelete }) {
  const fileType = FILE_TYPES[project.fileType?.toLowerCase()] || FILE_TYPES.pdf;
  const Icon = fileType.icon;

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        border: `1px solid ${isSelected ? '#3B82F6' : 'transparent'}`,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = '#111318';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Selection */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors"
        style={{
          background: isSelected ? '#3B82F6' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${isSelected ? '#3B82F6' : '#2D3548'}`,
        }}
      >
        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      {/* Icon */}
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: fileType.bg }}
      >
        <Icon className="w-5 h-5" style={{ color: fileType.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" style={{ color: '#F1F5F9' }}>
          {project.name || 'Untitled'}
        </p>
        <p className="text-xs" style={{ color: '#64748B' }}>
          {fileType.label} · {formatFileSize(project.size)}
        </p>
      </div>

      {/* Date */}
      <p className="text-sm hidden sm:block" style={{ color: '#64748B' }}>
        {formatDate(project.createdAt)}
      </p>

      {/* Actions */}
      <button
        onClick={onDelete}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#EF4444' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Vision Analysis Component
function VisionAnalysis({ projects, onSelectProject }) {
  const [selectedId, setSelectedId] = useState(null);

  const selectedProject = projects.find(p => p.id === selectedId);

  if (selectedId && selectedProject) {
    return (
      <div className="h-full flex flex-col">
        <div 
          className="flex items-center gap-3 p-4"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to documents
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <VisionCanvas projectId={selectedId} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div 
        className="flex items-center justify-between mb-6 p-4 rounded-xl"
        style={{ 
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59, 130, 246, 0.1)' }}
          >
            <BrainCircuit className="w-5 h-5" style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#F1F5F9' }}>AI Vision Analysis</h3>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Analyze blueprints with AI-powered detection</p>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <NoAnalysisEmpty onUpload={() => {}} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: '#111318',
                border: '1px solid #1F2430',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2D3548';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1F2430';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="aspect-video rounded-lg mb-3 overflow-hidden" style={{ background: '#0A0B0D' }}>
                {project.thumbnailUrl ? (
                  <img 
                    src={project.thumbnailUrl} 
                    alt={project.name}
                    className="w-full h-full object-cover opacity-70"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8" style={{ color: '#2D3548' }} />
                  </div>
                )}
              </div>
              <p className="font-medium text-sm truncate" style={{ color: '#F1F5F9' }}>
                {project.name || 'Untitled'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                Click to analyze
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Text Intelligence Component
function TextIntelligence() {
  const queryClient = useQueryClient();
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
  const { data: selectedDoc, isLoading: docDetailLoading } = useQuery({
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

  // Upload handler
  const handleUpload = async (file) => {
    await docvaultApi.upload(file);
    queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
  };

  // Delete handler
  const handleDelete = async (id) => {
    await docvaultApi.delete(id);
    if (selectedDocId === id) setSelectedDocId(null);
    queryClient.invalidateQueries({ queryKey: ['docvault-documents'] });
  };

  // Summarize handler
  const handleSummarize = async () => {
    if (!selectedDocId) return;
    setIsAiLoading(true);
    try {
      await docvaultApi.summarize(selectedDocId);
      queryClient.invalidateQueries({ queryKey: ['docvault-document', selectedDocId] });
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
    } catch (err) {
      const errorMsg = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', created_at: new Date().toISOString() };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear chat handler
  const handleClearChat = async () => {
    if (!selectedDocId) return;
    await docvaultApi.clearChat(selectedDocId);
    setChatHistory([]);
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left panel: Upload + Document list */}
      <div
        className="w-72 lg:w-80 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: '#1F2430', backgroundColor: '#0A0B0D' }}
      >
        <div className="p-3">
          <DocUpload onUpload={handleUpload} />
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
  const [activeTab, setActiveTab] = useState('library');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const pageSize = viewMode === VIEW_MODES.LIST ? 50 : 24;
  const { success: toastSuccess, error: toastError } = useToast();

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
    await visionApi.deleteProject(documentToDelete.id);
    queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
    setDocumentToDelete(null);
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setShowCanvas(true);
  };

  // Upload handling
  const uploadMutation = useMutation({
    mutationFn: ({ file, tempId }) =>
      visionApi.upload(file, file.name, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const progress = Math.round((evt.loaded / evt.total) * 100);
          setUploadingFiles(prev => prev.map(f => f.id === tempId ? { ...f, progress } : f));
        }
      }),
    onSuccess: (_, variables) => {
      setUploadingFiles(prev => prev.filter(f => f.id !== variables.tempId));
      toastSuccess('Uploaded ' + (variables.file?.name || 'file'));
      queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
      setPage(0);
      setDocuments([]);
      setHasMore(true);
    },
    onError: (err, variables) => {
      setUploadingFiles(prev => prev.filter(f => f.id !== variables.tempId));
      toastError(err.message || 'Upload failed');
    }
  });

  const validateFile = (file) => {
    const allowed = new Set(['pdf','png','jpg','jpeg','tiff','tif','dwg','webp']);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowed.has(ext)) return 'Unsupported file type';
    const MAX = 100 * 1024 * 1024;
    if (file.size > MAX) return 'File exceeds 100MB limit';
    return null;
  };

  const handleUpload = (files) => {
    Array.from(files || []).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        toastError(`${file.name}: ${validationError}`);
        return;
      }
      const tempId = `${file.name}-${Date.now()}`;
      setUploadingFiles(prev => [...prev, { id: tempId, name: file.name, progress: 0 }]);
      uploadMutation.mutate({ file, tempId });
    });
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
              onUpload={handleUpload}
              uploadingFiles={uploadingFiles}
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
    </div>
  );
}
