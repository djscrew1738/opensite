import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ZoomIn, ZoomOut, Maximize2, RotateCw, Fullscreen,
  Layers, Sparkles, Loader2, ChevronDown, Cpu, Network,
  Ruler, Scan, LayoutGrid, GitBranch
} from 'lucide-react';
import { visionApi } from '../../api/vision';

export default function VisionToolbar({
  zoom, maxZoom, onZoomIn, onZoomOut, onFit, onRotate, onFullscreen,
  onToggleLayers, showLayers, onAnalyze, analyzing, hasLayers,
  selectedModel, onModelChange, onCalibrate, calibrating,
  onToggleFixturePanel, showFixturePanel, fixturesCount,
  onToggleWallPipePanel, showWallPipePanel, wallsCount, pipesCount
}) {
  const [showModelMenu, setShowModelMenu] = useState(false);
  const menuRef = useRef(null);

  // Fetch available models
  const { data: modelsData, isLoading: modelsLoading, error: modelsError } = useQuery({
    queryKey: ['vision-models'],
    queryFn: () => visionApi.getModels(),
    staleTime: 60000,
    retry: 2,
  });

  const models = modelsData?.models || [];
  const hasKeys = modelsData?.hasKeys ?? false;

  // Auto-select first model if none selected
  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      onModelChange?.(models[0].id);
    }
  }, [models, selectedModel, onModelChange]);

  // Close menu on outside click
  useEffect(() => {
    if (!showModelMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowModelMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelMenu]);

  const currentModel = models.find(m => m.id === selectedModel);

  const tools = [
    { icon: ZoomIn, onClick: onZoomIn, label: 'Zoom in', key: '+' },
    { icon: ZoomOut, onClick: onZoomOut, label: 'Zoom out', key: '-' },
    { icon: Maximize2, onClick: onFit, label: 'Fit to screen', key: '0' },
    { icon: RotateCw, onClick: onRotate, label: 'Rotate 90\u00B0', key: 'R' },
    null, // separator
    { icon: Ruler, onClick: onCalibrate, label: 'Calibrate scale', active: calibrating },
    { icon: Layers, onClick: onToggleLayers, label: 'Toggle layers', active: showLayers },
    { icon: Scan, onClick: onToggleFixturePanel, label: 'Toggle fixture panel', active: showFixturePanel },
    { icon: LayoutGrid, onClick: onToggleWallPipePanel, label: 'Toggle wall & pipe panel', active: showWallPipePanel },
    null,
    { icon: Fullscreen, onClick: onFullscreen, label: 'Fullscreen', key: 'F' },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-200 dark:border-surface-700
                    bg-white/90 dark:bg-surface-900/90 backdrop-blur-sm z-10">
      {tools.map((tool, i) => {
        if (!tool) {
          return <div key={i} className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />;
        }
        return (
          <button
            key={i}
            onClick={tool.onClick}
            title={tool.label}
            className={`
              p-2 rounded-lg transition-colors text-surface-500 dark:text-surface-400
              hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200
              ${tool.active ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''}
            `}
          >
            <tool.icon className="w-4 h-4" />
          </button>
        );
      })}

      <div className="flex-1" />

      {/* Model selector */}
      {modelsLoading && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-surface-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Loading models...</span>
        </div>
      )}
      {modelsError && (
        <div className="px-2.5 py-1.5 text-xs text-red-500 dark:text-red-400">
          Models unavailable
        </div>
      )}
      {!modelsLoading && models.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                       border border-surface-200 dark:border-surface-700
                       text-surface-600 dark:text-surface-300
                       hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="max-w-[100px] truncate">{currentModel?.name || 'Model'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showModelMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-surface-200 dark:border-surface-700
                            bg-white dark:bg-surface-900 shadow-xl z-50 py-1 overflow-hidden">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange?.(m.id); setShowModelMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${selectedModel === m.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      selectedModel === m.id
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-surface-800 dark:text-surface-200'
                    }`}>
                      {m.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs uppercase font-medium text-surface-400 dark:text-surface-500">
                        {m.provider}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        m.speed === 'fast'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {m.speed}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        m.quality === 'excellent'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {m.quality}
                      </span>
                    </div>
                  </div>
                  {selectedModel === m.id && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trace Runs button */}
      <button
        onClick={() => onAnalyze(selectedModel, 'trace')}
        disabled={analyzing || !hasKeys}
        title="Trace pipe runs and walls (requires local vision model)"
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
          transition-all ml-1.5
          ${analyzing
            ? 'bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-wait'
            : !hasKeys
              ? 'bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed'
              : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm'
          }
        `}
      >
        {analyzing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Network className="w-3.5 h-3.5" />
        )}
        {analyzing ? 'Tracing...' : 'Trace Runs'}
      </button>

      {/* AI Analysis button */}
      <button
        onClick={() => onAnalyze(selectedModel, currentModel?.type || 'global')}
        disabled={analyzing || !hasKeys}
        title={!hasKeys ? 'Add an API key in Settings first' : ''}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
          transition-all ml-1.5
          ${analyzing
            ? 'bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-wait'
            : !hasKeys
              ? 'bg-surface-100 dark:bg-surface-800 text-surface-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
          }
        `}
      >
        {analyzing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {analyzing ? 'Analyzing...' : currentModel?.type === 'deep' ? 'Deep Scan' : 'AI Analyze'}
      </button>
    </div>
  );
}
