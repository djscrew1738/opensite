import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Files, Plus, Trash2, FileImage, LayoutGrid, 
  ChevronRight, Loader2, AlertCircle, Upload,
  FolderOpen, Image, FileText, MoreVertical,
  Download, Eye, EyeOff, Grid3X3, List,
  Search, Filter, SortAsc, Calendar, Clock,
  CheckCircle2, X, Maximize2, Copy, Move,
  Star, Tag, Pin, Share2, Archive, ScanEye,
  BrainCircuit
} from 'lucide-react';
import { visionApi } from '../api/vision';
import VisionCanvas from '../components/vision/VisionCanvas';
import BlueprintSelector from '../components/vision/BlueprintSelector';
import { TabSystem, Tab } from '../components/tabs';
import { NoDocumentsEmpty, NoAnalysisEmpty } from '../components/empty-states';
import { ConfirmDialog } from '../components/shared';

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
  viewMode, 
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedItems,
  setSelectedItems,
  onSelectProject,
  onDelete
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Filter and sort projects
  const filteredProjects = projects
    .filter(p => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (p.name || '').toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return 0;
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
    
    // Process each file
    for (const file of Array.from(files)) {
      try {
        // Use visionApi for upload as it handles projects + tiles
        await visionApi.upload(file, file.name);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    
    // Trigger refetch via props or parent
    onSelectProject(null); // Force refresh context
  }, [onSelectProject]);

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
        {filteredProjects.length === 0 ? (
          <NoDocumentsEmpty onUpload={() => fileInputRef.current?.click()} />
        ) : viewMode === VIEW_MODES.GRID ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProjects.map((project) => (
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
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <DocumentListItem 
                key={project.id} 
                project={project}
                isSelected={selectedItems.has(project.id)}
                onSelect={() => toggleSelection(project.id)}
                onClick={() => onSelectProject(project)}
                onDelete={(e) => onDelete(project.id, e)}
              />
            ))}
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

// Main Documents Page
export default function Documents() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('library');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['vision-projects'],
    queryFn: () => visionApi.getProjects(),
  });

  const handleDelete = (id, e) => {
    e?.stopPropagation();
    const project = projects.find(p => p.id === id);
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
            {projects.length} document{projects.length !== 1 ? 's' : ''}
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
          <DocumentsLibrary
            projects={projects}
            isLoading={isLoading}
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
          />
        </Tab>
        <Tab id="vision" label="AI Analysis" icon={ScanEye}>
          <VisionAnalysis 
            projects={projects}
            onSelectProject={handleSelectProject}
          />
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
