import {
  ZoomIn, ZoomOut, Maximize2, RotateCw, Fullscreen,
  Layers, Sparkles, Loader2
} from 'lucide-react';

export default function VisionToolbar({
  zoom, maxZoom, onZoomIn, onZoomOut, onFit, onRotate, onFullscreen,
  onToggleLayers, showLayers, onAnalyze, analyzing, hasLayers
}) {
  const tools = [
    { icon: ZoomIn, onClick: onZoomIn, label: 'Zoom in', key: '+' },
    { icon: ZoomOut, onClick: onZoomOut, label: 'Zoom out', key: '-' },
    { icon: Maximize2, onClick: onFit, label: 'Fit to screen', key: '0' },
    { icon: RotateCw, onClick: onRotate, label: 'Rotate 90\u00B0', key: 'R' },
    null, // separator
    { icon: Layers, onClick: onToggleLayers, label: 'Toggle layers', active: showLayers },
    null,
    { icon: Fullscreen, onClick: onFullscreen, label: 'Fullscreen', key: 'F' },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-200 dark:border-gray-700
                    bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10">
      {tools.map((tool, i) => {
        if (!tool) {
          return <div key={i} className="w-px h-6 bg-surface-200 dark:bg-gray-700 mx-1" />;
        }
        return (
          <button
            key={i}
            onClick={tool.onClick}
            title={tool.label}
            className={`
              p-2 rounded-lg transition-colors text-surface-500 dark:text-surface-400
              hover:bg-surface-100 dark:hover:bg-gray-800 hover:text-surface-700 dark:hover:text-surface-200
              ${tool.active ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''}
            `}
          >
            <tool.icon className="w-4 h-4" />
          </button>
        );
      })}

      <div className="flex-1" />

      {/* AI Analysis button */}
      <button
        onClick={onAnalyze}
        disabled={analyzing}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
          transition-all
          ${analyzing
            ? 'bg-surface-100 dark:bg-gray-800 text-surface-400 cursor-wait'
            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
          }
        `}
      >
        {analyzing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        {analyzing ? 'Analyzing...' : 'AI Analyze'}
      </button>
    </div>
  );
}
