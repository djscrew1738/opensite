/**
 * LayerPanel Component
 * Blueprint layer management panel
 * 
 * Features:
 * - Layer visibility toggle
 * - AI analysis results display
 * - Project scale calibration
 * - Analysis to takeoff conversion
 * 
 * @module components/vision/LayerPanel
 */

import { useState, memo, useCallback } from 'react';
import { 
  Eye, EyeOff, ChevronDown, ChevronUp, Layers, 
  Settings, Zap, CheckCircle2, AlertTriangle, Ruler,
  ArrowRightLeft, FileText, Loader2
} from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';

// Default layer color (functional, for layer styling)
const DEFAULT_LAYER_COLOR = '#607D8B';

/**
 * LayerPanel - Blueprint layer management
 * @param {{
 *   project: any;
 *   layers: any[];
 *   analyses: any[];
 *   onLayerUpdate: (id: string, updates: any) => void;
 *   onUpdateScale: (scale: number) => Promise<void>;
 *   onConvertToTakeoff: (analysisId: string) => Promise<any>;
 *   currentZoom: number;
 * }} props
 */
const LayerPanel = memo(function LayerPanel({ 
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

  const handleScaleSave = useCallback(async () => {
    setIsUpdatingScale(true);
    try {
      await onUpdateScale(parseFloat(scaleInput));
    } finally {
      setIsUpdatingScale(false);
    }
  }, [onUpdateScale, scaleInput]);

  const handleConvert = useCallback(async (analysisId) => {
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
  }, [onConvertToTakeoff]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="p-2 rounded-xl transition-colors shadow-lg"
        title="Show layers"
        style={{ 
          backgroundColor: `${colors.surface.card}99`,
          backdropFilter: 'blur(4px)',
          color: colors.text.primary,
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.surface.card}CC`}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.surface.card}99`}
      >
        <Layers style={{ width: '16px', height: '16px' }} />
      </button>
    );
  }

  return (
    <div 
      className="w-64 rounded-xl backdrop-blur-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      style={{ 
        backgroundColor: `${colors.surface.card}BF`, // 75% opacity
        border: `1px solid ${colors.border.default}`,
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2.5"
        style={{ 
          backgroundColor: `${colors.surface.elevated}40`,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Layers style={{ width: '14px', height: '14px', color: colors.accent.DEFAULT }} />
          <span 
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: colors.text.secondary }}
          >
            Blueprint Tools
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="transition-colors"
          style={{ color: colors.text.muted }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.text.secondary}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
        >
          <ChevronDown style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 scrollbar-hide">
        {/* Scale Section */}
        <div 
          className="px-3 py-3"
          style={{ 
            backgroundColor: `${colors.surface.primary}20`,
            borderBottom: `1px solid ${colors.border.muted}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Ruler style={{ width: '12px', height: '12px', color: colors.warning.DEFAULT }} />
            <span 
              className="text-xs font-bold uppercase"
              style={{ color: colors.text.muted }}
            >
              Project Scale
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={scaleInput}
              onChange={(e) => setScaleInput(e.target.value)}
              className="flex-1 rounded-lg px-2 py-1 text-xs"
              placeholder="px/ft"
              style={{ 
                backgroundColor: `${colors.surface.primary}66`,
                border: `1px solid ${colors.border.default}`,
                color: colors.text.primary,
              }}
            />
            <button
              onClick={handleScaleSave}
              disabled={isUpdatingScale || parseFloat(scaleInput) === project?.scale}
              className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
              style={{ 
                backgroundColor: colors.warning.DEFAULT,
                color: colors.text.inverse,
                opacity: (isUpdatingScale || parseFloat(scaleInput) === project?.scale) ? 0.3 : 1,
              }}
              onMouseEnter={(e) => {
                if (!(isUpdatingScale || parseFloat(scaleInput) === project?.scale)) {
                  e.currentTarget.style.backgroundColor = colors.warning.dark;
                }
              }}
              onMouseLeave={(e) => {
                if (!(isUpdatingScale || parseFloat(scaleInput) === project?.scale)) {
                  e.currentTarget.style.backgroundColor = colors.warning.DEFAULT;
                }
              }}
            >
              {isUpdatingScale ? (
                <Loader2 style={{ width: '12px', height: '12px' }} className="animate-spin" />
              ) : 'Set'}
            </button>
          </div>
          <p 
            className="text-[9px] mt-1.5 leading-tight"
            style={{ color: colors.text.muted }}
          >
            Calibration required for accurate linear foot calculations.
          </p>
        </div>

        {/* Analyses Section */}
        {analyses && analyses.length > 0 && (
          <div style={{ borderBottom: `1px solid ${colors.border.default}` }}>
            <button
              onClick={() => setShowAnalyses(!showAnalyses)}
              className="w-full flex items-center justify-between px-3 py-2 transition-colors"
              style={{ backgroundColor: `${colors.surface.primary}10` }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.surface.primary}20`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.surface.primary}10`}
            >
              <div className="flex items-center gap-2">
                <Zap style={{ width: '12px', height: '12px', color: colors.accent.DEFAULT }} />
                <span 
                  className="text-xs font-bold uppercase"
                  style={{ color: colors.text.secondary }}
                >
                  AI Analyses
                </span>
              </div>
              {showAnalyses ? (
                <ChevronUp style={{ width: '12px', height: '12px', color: colors.text.muted }} />
              ) : (
                <ChevronDown style={{ width: '12px', height: '12px', color: colors.text.muted }} />
              )}
            </button>

            {showAnalyses && (
              <div className="py-1 px-1 space-y-1">
                {analyses.map((analysis) => (
                  <div 
                    key={analysis.id} 
                    className="group p-2 rounded-lg border transition-all"
                    style={{ 
                      backgroundColor: `${colors.surface.primary}10`,
                      borderColor: colors.border.muted,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {analysis.status === 'completed' ? (
                          <CheckCircle2 style={{ width: '12px', height: '12px', color: colors.success.DEFAULT }} />
                        ) : analysis.status === 'failed' ? (
                          <AlertTriangle style={{ width: '12px', height: '12px', color: colors.danger.DEFAULT }} />
                        ) : (
                          <Loader2 style={{ width: '12px', height: '12px', color: colors.accent.DEFAULT }} className="animate-spin" />
                        )}
                        <span 
                          className="text-[11px] font-semibold truncate capitalize"
                          style={{ color: colors.text.primary }}
                        >
                          {analysis.passType} Pass
                        </span>
                      </div>
                      <span 
                        className="text-[9px] font-mono"
                        style={{ color: colors.text.muted }}
                      >
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {analysis.status === 'completed' && (
                      <button
                        onClick={() => handleConvert(analysis.id)}
                        disabled={convertingId === analysis.id}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all"
                        style={{ 
                          backgroundColor: colors.accent.muted,
                          border: `1px solid ${colors.accent.glow}`,
                          color: colors.accent.light,
                        }}
                        onMouseEnter={(e) => {
                          if (convertingId !== analysis.id) {
                            e.currentTarget.style.backgroundColor = `${colors.accent.DEFAULT}40`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (convertingId !== analysis.id) {
                            e.currentTarget.style.backgroundColor = colors.accent.muted;
                          }
                        }}
                      >
                        {convertingId === analysis.id ? (
                          <Loader2 style={{ width: '12px', height: '12px' }} className="animate-spin" />
                        ) : (
                          <ArrowRightLeft style={{ width: '12px', height: '12px' }} />
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
            <span 
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.text.muted }}
            >
              Active Layers
            </span>
          </div>
          {layers.map((layer) => {
            const inZoomRange = currentZoom >= (layer.minZoom || 0) && currentZoom <= (layer.maxZoom || 20);
            const annotationCount = layer.data?.length || 0;

            return (
              <div
                key={layer.id}
                className={`flex items-center gap-2 px-3 py-1.5 transition-colors
                  ${!inZoomRange ? 'opacity-40' : ''}`}
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.surface.primary}20`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <button
                  onClick={() => onLayerUpdate?.(layer.id, { visible: !layer.visible })}
                  className="transition-colors flex-shrink-0"
                  style={{ color: colors.text.muted }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.text.secondary}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
                >
                  {layer.visible ? (
                    <Eye style={{ width: '14px', height: '14px' }} />
                  ) : (
                    <EyeOff style={{ width: '14px', height: '14px' }} />
                  )}
                </button>

                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: layer.style?.color || DEFAULT_LAYER_COLOR }}
                />

                <div className="flex-1 min-w-0">
                  <p 
                    className="text-xs font-medium truncate leading-none"
                    style={{ color: colors.text.secondary }}
                  >
                    {layer.name}
                  </p>
                </div>

                {annotationCount > 0 && (
                  <span 
                    className="text-[9px] font-mono tabular-nums px-1.5 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `${colors.surface.primary}40`,
                      color: colors.text.muted,
                    }}
                  >
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
          <p 
            className="text-xs italic"
            style={{ color: colors.text.muted }}
          >
            No data layers
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: colors.text.disabled }}
          >
            Run AI analysis to detect systems
          </p>
        </div>
      )}
      
      {/* Footer */}
      <div 
        className="px-3 py-2 flex justify-between items-center"
        style={{ 
          borderTop: `1px solid ${colors.border.muted}`,
          backgroundColor: `${colors.surface.primary}40`,
        }}
      >
        <span 
          className="text-[9px]"
          style={{ color: colors.text.disabled }}
        >
          v2.1 Analysis Engine
        </span>
        <div className="flex gap-1.5 items-center">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: colors.success.DEFAULT }}
          />
          <span 
            className="text-[9px] font-bold uppercase"
            style={{ color: `${colors.success.DEFAULT}99` }}
          >
            System Ready
          </span>
        </div>
      </div>
    </div>
  );
});

LayerPanel.displayName = 'LayerPanel';

export default LayerPanel;
