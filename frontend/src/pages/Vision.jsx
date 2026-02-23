import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ScanEye, Plus, Trash2, FileImage, Calendar, Maximize,
  ChevronRight, Loader2, AlertCircle, LayoutDashboard,
  Eye, Upload, FolderOpen
} from 'lucide-react';
import { visionApi } from '../api/vision';
import VisionViewer from '../components/vision/VisionViewer';
import VisionUpload from '../components/vision/VisionUpload';
import VisionHome from '../components/vision/VisionHome';
import { PageHeader, EmptyState, ListItemCard, InlineLoader, ConfirmDialog } from '../components/shared';

function formatDimensions(w, h) {
  if (!w || !h) return '';
  return `${w.toLocaleString()} × ${h.toLocaleString()}`;
}

export default function Vision() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['vision-projects'],
    queryFn: () => visionApi.getProjects(),
  });

  const { data: projectDetail, refetch: refetchProject } = useQuery({
    queryKey: ['vision-project', selectedId],
    queryFn: () => visionApi.getProject(selectedId),
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (!selectedId && projects.length > 0 && !showUpload) {
      const timer = setTimeout(() => setSelectedId(projects[0].id), 0);
      return () => clearTimeout(timer);
    }
  }, [projects, selectedId, showUpload]);

  const handleProjectCreated = useCallback((projectId) => {
    setShowUpload(false);
    setShowHome(false);
    setSelectedId(projectId);
    queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
  }, [queryClient]);

  const handleDelete = useCallback((id, e) => {
    e.stopPropagation();
    const project = projects.find(p => p.id === id);
    setProjectToDelete(project || { id });
  }, [projects]);

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    await visionApi.deleteProject(projectToDelete.id);
    if (selectedId === projectToDelete.id) setSelectedId(null);
    queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
    setProjectToDelete(null);
  };

  const handleAnalyze = useCallback(async (model, type = 'global') => {
    if (!selectedId || analyzing) return;
    setAnalyzing(true);

    try {
      const result = await visionApi.analyze(selectedId, model || selectedModel, type);

      const poll = setInterval(async () => {
        try {
          const status = await visionApi.getJobStatus(result.jobId);
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(poll);
            setAnalyzing(false);
            refetchProject();
          }
        } catch { /* keep polling */ }
      }, 2000);
    } catch {
      setAnalyzing(false);
    }
  }, [selectedId, analyzing, selectedModel, refetchProject]);

  const handleLayerUpdate = useCallback(async (layerId, updates) => {
    if (!selectedId) return;
    await visionApi.updateLayer(selectedId, layerId, updates);
    refetchProject();
  }, [selectedId, refetchProject]);

  const handleUpdateScale = useCallback(async (scale) => {
    if (!selectedId) return;
    await visionApi.updateScale(selectedId, scale);
    refetchProject();
  }, [selectedId, refetchProject]);

  const handleConvertToTakeoff = useCallback(async (analysisId) => {
    if (!selectedId || !analysisId) return;
    try {
      const takeoff = await visionApi.convertToTakeoff(selectedId, analysisId);
      queryClient.invalidateQueries({ queryKey: ['takeoffs'] });
      return takeoff;
    } catch (err) {
      console.error('Conversion failed:', err);
      throw err;
    }
  }, [selectedId, queryClient]);

  const renderSidebar = () => (
    <div className="w-72 flex-shrink-0 flex flex-col border-r border-surface-200 dark:border-surface-700
                    bg-white dark:bg-surface-900">
      {/* Header */}
      <div className="px-4 py-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
              <ScanEye className="w-4 h-4 text-accent-600" />
            </div>
            <h2 className="text-base font-display font-bold text-surface-900 dark:text-surface-100">
              Vision
            </h2>
          </div>
          <button
            onClick={() => { setShowUpload(true); setSelectedId(null); setShowHome(false); }}
            className="p-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/25"
            title="Upload blueprint"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
          Deep-zoom blueprint viewer
        </p>
        
        {/* Navigation */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { setShowHome(true); setShowUpload(false); setSelectedId(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              showHome && !showUpload
                ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 ring-1 ring-accent-200 dark:ring-accent-800'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Home
          </button>
          <button
            onClick={() => { setShowUpload(true); setSelectedId(null); setShowHome(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              showUpload
                ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 ring-1 ring-accent-200 dark:ring-accent-800'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <InlineLoader size="md" />
            <p className="text-xs text-surface-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 && !showUpload ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={FolderOpen}
              title="No blueprints"
              subtitle="Upload a blueprint to get started with AI-powered analysis"
              action={
                <button 
                  onClick={() => setShowUpload(true)}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Upload Blueprint
                </button>
              }
            />
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {projects.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => { 
                  setSelectedId(p.id); 
                  setShowUpload(false); 
                  setShowHome(false);
                }}
                className={`
                  group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                  transition-all duration-200
                  ${selectedId === p.id && !showUpload
                    ? 'bg-accent-50 dark:bg-accent-900/10 ring-1 ring-accent-200 dark:ring-accent-800'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
                  }
                `}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="w-11 h-11 rounded-lg bg-surface-100 dark:bg-surface-800 overflow-hidden flex-shrink-0 ring-1 ring-surface-200 dark:ring-surface-700">
                  <img
                    src={visionApi.getThumbnailUrl(p.id)}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-surface-400 dark:text-surface-500 uppercase font-medium">
                      {p.fileType}
                    </span>
                    {p.width && p.height && (
                      <span className="text-[10px] text-surface-400 dark:text-surface-500 font-mono">
                        {formatDimensions(p.width, p.height)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  className="p-1.5 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0 overflow-hidden page-transition-wrapper">
      {renderSidebar()}

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-surface-50 dark:bg-surface-900 min-w-0 overflow-hidden">
        {showUpload ? (
          <VisionUpload onProjectCreated={handleProjectCreated} />
        ) : showHome ? (
          <div className="flex-1 overflow-y-auto p-6">
            <VisionHome
              projects={projects}
              onUpload={() => setShowUpload(true)}
              onViewProject={(project) => {
                setSelectedId(project.id);
                setShowHome(false);
                setShowUpload(false);
              }}
              isLoading={isLoading}
            />
          </div>
        ) : selectedId && projectDetail ? (
          <VisionViewer
            project={projectDetail}
            layers={projectDetail.layers || []}
            analyses={projectDetail.analyses || []}
            onLayerUpdate={handleLayerUpdate}
            onUpdateScale={handleUpdateScale}
            onConvertToTakeoff={handleConvertToTakeoff}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={ScanEye}
              title="Select a project"
              subtitle="Choose a project from the sidebar or upload a new blueprint"
              action={
                <button 
                  onClick={() => setShowUpload(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Blueprint
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {projectToDelete && (
        <ConfirmDialog
          title="Delete Project?"
          message={`Are you sure you want to delete "${projectToDelete.name || 'this project'}"? All uploaded blueprints and AI analysis results will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setProjectToDelete(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
