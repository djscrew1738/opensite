import { useState } from 'react';
import { 
  Eye, EyeOff, ChevronDown, ChevronUp, Layers, 
  Settings, Zap, CheckCircle2, AlertTriangle, Ruler,
  ArrowRightLeft, FileText, Loader2
} from 'lucide-react';

export default function LayerPanel({ 
  project, 
  layers, 
  analyses, 
  onLayerUpdate, 
  onUpdateScale, 
  onConvertToTakeoff,
  currentZoom 
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAnalyses, setShowAnalyses] = useState(true);
  const [isUpdatingScale, setIsUpdatingScale] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const [scaleInput, setScaleInput] = useState(project?.scale || 1.0);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="p-2 rounded-xl bg-black/60 backdrop-blur-sm text-white hover:bg-black/70 transition-colors shadow-lg"
        title="Show layers"
      >
        <Layers className="w-4 h-4" />
      </button>
    );
  }

  const handleScaleSave = async () => {
    setIsUpdatingScale(true);
    try {
      await onUpdateScale(parseFloat(scaleInput));
    } finally {
      setIsUpdatingScale(false);
    }
  };

  const handleConvert = async (analysisId) => {
    setConvertingId(analysisId);
    try {
      const takeoff = await onConvertToTakeoff(analysisId);
      if (takeoff) {
        alert(`Takeoff generated: ${takeoff.name}`);
      }
    } catch (err) {
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="w-64 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Blueprint Tools</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 scrollbar-hide">
        {/* Scale Section */}
        <div className="px-3 py-3 border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold text-white/50 uppercase">Project Scale</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={scaleInput}
              onChange={(e) => setScaleInput(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50"
              placeholder="px/ft"
            />
            <button
              onClick={handleScaleSave}
              disabled={isUpdatingScale || parseFloat(scaleInput) === project?.scale}
              className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-[10px] font-bold text-white transition-all"
            >
              {isUpdatingScale ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Set'}
            </button>
          </div>
          <p className="text-[9px] text-white/30 mt-1.5 leading-tight">
            Calibration required for accurate linear foot calculations.
          </p>
        </div>

        {/* Analyses Section */}
        {analyses && analyses.length > 0 && (
          <div className="border-b border-white/10">
            <button
              onClick={() => setShowAnalyses(!showAnalyses)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white/2 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary-400" />
                <span className="text-[10px] font-bold text-white/70 uppercase">AI Analyses</span>
              </div>
              {showAnalyses ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
            </button>

            {showAnalyses && (
              <div className="py-1 px-1 space-y-1">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="group p-2 rounded-lg bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {analysis.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : analysis.status === 'failed' ? (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        ) : (
                          <Loader2 className="w-3 h-3 text-primary-400 animate-spin" />
                        )}
                        <span className="text-[11px] font-semibold text-white/80 truncate capitalize">
                          {analysis.passType} Pass
                        </span>
                      </div>
                      <span className="text-[9px] text-white/30 font-mono">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {analysis.status === 'completed' && (
                      <button
                        onClick={() => handleConvert(analysis.id)}
                        disabled={convertingId === analysis.id}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md
                                 bg-primary-600/20 hover:bg-primary-600/40 border border-primary-500/30
                                 text-primary-300 text-[10px] font-bold transition-all"
                      >
                        {convertingId === analysis.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="w-3 h-3" />
                        )}
                        Generate Takeoff
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Layer list */}
        <div className="py-2">
          <div className="px-3 mb-1">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Active Layers</span>
          </div>
          {layers.map((layer) => {
            const inZoomRange = currentZoom >= (layer.minZoom || 0) && currentZoom <= (layer.maxZoom || 20);
            const annotationCount = layer.data?.length || 0;

            return (
              <div
                key={layer.id}
                className={`flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors
                  ${!inZoomRange ? 'opacity-40' : ''}`}
              >
                <button
                  onClick={() => onLayerUpdate?.(layer.id, { visible: !layer.visible })}
                  className="text-white/60 hover:text-white/90 transition-colors flex-shrink-0"
                >
                  {layer.visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>

                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: layer.style?.color || '#607D8B' }}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate leading-none">{layer.name}</p>
                </div>

                {annotationCount > 0 && (
                  <span className="text-[9px] font-mono text-white/30 tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
                    {annotationCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {layers.length === 0 && (!analyses || analyses.length === 0) && (
        <div className="px-3 py-6 text-center">
          <p className="text-xs text-white/40 italic">No data layers</p>
          <p className="text-[10px] text-white/20 mt-1">Run AI analysis to detect systems</p>
        </div>
      )}
      
      {/* Footer footer */}
      <div className="px-3 py-2 border-t border-white/5 bg-black/40 flex justify-between items-center">
        <span className="text-[9px] text-white/20">v2.1 Analysis Engine</span>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-500/60 uppercase">System Ready</span>
        </div>
      </div>
    </div>
  );
}
