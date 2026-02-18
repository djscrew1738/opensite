import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ScanEye, Plus, Trash2, FileImage, Calendar, Maximize,
  ChevronRight, Loader2, AlertCircle
} from 'lucide-react';
import { visionApi } from '../api/vision';
import VisionViewer from '../components/vision/VisionViewer';
import VisionUpload from '../components/vision/VisionUpload';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDimensions(w, h) {
  if (!w || !h) return '';
  return `${w.toLocaleString()} x ${h.toLocaleString()}`;
}

export default function Vision() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeJobId, setAnalyzeJobId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['vision-projects'],
    queryFn: () => visionApi.getProjects(),
  });

  // Fetch selected project details
  const { data: projectDetail, refetch: refetchProject } = useQuery({
    queryKey: ['vision-project', selectedId],
    queryFn: () => visionApi.getProject(selectedId),
    enabled: !!selectedId,
  });

  // Auto-select first project
  useEffect(() => {
    if (!selectedId && projects.length > 0 && !showUpload) {
      setSelectedId(projects[0].id);
    }
  }, [projects, selectedId, showUpload]);

  const handleProjectCreated = useCallback((projectId) => {
    setShowUpload(false);
    setSelectedId(projectId);
    queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
  }, [queryClient]);

  const handleDelete = useCallback(async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tiles?')) return;
    await visionApi.deleteProject(id);
    if (selectedId === id) setSelectedId(null);
    queryClient.invalidateQueries({ queryKey: ['vision-projects'] });
  }, [selectedId, queryClient]);

  // AI Analysis
  const handleAnalyze = useCallback(async (model) => {
    if (!selectedId || analyzing) return;
    setAnalyzing(true);

    try {
      const result = await visionApi.analyze(selectedId, model || selectedModel);
      setAnalyzeJobId(result.jobId);

      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const status = await visionApi.getJobStatus(result.jobId);
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(poll);
            setAnalyzing(false);
            setAnalyzeJobId(null);
            refetchProject();
          }
        } catch (err) { /* keep polling */ }
      }, 2000);
    } catch (err) {
      setAnalyzing(false);
    }
  }, [selectedId, analyzing, selectedModel, refetchProject]);

  // Layer updates
  const handleLayerUpdate = useCallback(async (layerId, updates) => {
    if (!selectedId) return;
    await visionApi.updateLayer(selectedId, layerId, updates);
    refetchProject();
  }, [selectedId, refetchProject]);

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0 overflow-hidden">
      {/* Sidebar — Project List */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-surface-200 dark:border-gray-700
                      bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-4 py-4 border-b border-surface-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanEye className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-display font-bold text-surface-900 dark:text-surface-100">
                Vision
              </h2>
            </div>
            <button
              onClick={() => { setShowUpload(true); setSelectedId(null); }}
              className="p-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              title="Upload blueprint"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
            Deep-zoom blueprint viewer
          </p>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-surface-400 animate-spin" />
            </div>
          )}

          {!isLoading && projects.length === 0 && !showUpload && (
            <div className="text-center py-12 px-4">
              <FileImage className="w-10 h-10 text-surface-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">No blueprints yet</p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Upload a blueprint to get started</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                           bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          )}

          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedId(p.id); setShowUpload(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${selectedId === p.id && !showUpload
                  ? 'bg-primary-50 dark:bg-primary-900/10 border-r-2 border-primary-500'
                  : 'hover:bg-surface-50 dark:hover:bg-gray-800/50'
                }`}
            >
              {/* Thumbnail */}
              <div className="w-11 h-11 rounded-lg bg-surface-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                <img
                  src={visionApi.getThumbnailUrl(p.id)}
                  alt=""
                  className="w-full h-full object-cover"
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
                className="p-1 rounded text-surface-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-surface-950 min-w-0">
        {showUpload ? (
          <VisionUpload onProjectCreated={handleProjectCreated} />
        ) : selectedId && projectDetail ? (
          <VisionViewer
            project={projectDetail}
            layers={projectDetail.layers || []}
            onLayerUpdate={handleLayerUpdate}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <ScanEye className="w-12 h-12 text-surface-600 mx-auto" />
              <p className="text-sm text-surface-500">Select a project or upload a blueprint</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
