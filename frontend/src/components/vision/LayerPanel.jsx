import { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronRight, Layers } from 'lucide-react';

export default function LayerPanel({ layers, onLayerUpdate, currentZoom }) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="p-2 rounded-xl bg-black/60 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
        title="Show layers"
      >
        <Layers className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-56 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Layers</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Layer list */}
      <div className="max-h-72 overflow-y-auto py-1">
        {layers.map((layer) => {
          const inZoomRange = currentZoom >= (layer.minZoom || 0) && currentZoom <= (layer.maxZoom || 20);
          const annotationCount = layer.data?.length || 0;

          return (
            <div
              key={layer.id}
              className={`flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors
                ${!inZoomRange ? 'opacity-40' : ''}`}
            >
              {/* Visibility toggle */}
              <button
                onClick={() => onLayerUpdate?.(layer.id, { visible: !layer.visible })}
                className="text-white/60 hover:text-white/90 transition-colors"
              >
                {layer.visible ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Color indicator */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: layer.style?.color || '#607D8B' }}
              />

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{layer.name}</p>
              </div>

              {/* Count badge */}
              {annotationCount > 0 && (
                <span className="text-[10px] font-mono text-white/40 tabular-nums">
                  {annotationCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {layers.length === 0 && (
        <div className="px-3 py-4 text-center">
          <p className="text-xs text-white/40">No layers yet</p>
          <p className="text-[10px] text-white/25 mt-1">Run AI analysis to detect systems</p>
        </div>
      )}
    </div>
  );
}
