import { useRef, useState } from 'react';
import { 
  Upload, 
  Eye, 
  EyeOff, 
  Trash2, 
  Move,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import { useVisualizerStore } from '../store';
import type { Floor } from '../types';

const colors = {
  surfacePrimary: '#0A0B0D',
  surfaceCard: '#111318',
  surfaceElevated: '#181C24',
  borderDefault: '#1F2430',
  borderStrong: '#2D3548',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  accentBlue: '#3B82F6',
  accentRed: '#EF4444',
};

function FloorItem({ floor }: { floor: Floor }) {
  const { 
    updateFloor, 
    removeFloor, 
    toggleFloorVisibility, 
    setFloorOpacity,
    project 
  } = useVisualizerStore();
  
  const [isExpanded, setIsExpanded] = useState(false);

  const handleHeightChange = (delta: number) => {
    updateFloor(floor.id, { heightOffset: floor.heightOffset + delta });
  };

  return (
    <div 
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.borderDefault }}
    >
      {/* Floor Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => toggleFloorVisibility(floor.id)}
          className="p-1 rounded transition-colors"
          style={{ color: colors.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceCard}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {floor.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        
        <span className="flex-1 font-medium" style={{ color: colors.textPrimary }}>
          {floor.name}
        </span>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded transition-colors"
          style={{ color: colors.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceCard}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Floor Details */}
      {isExpanded && (
        <div 
          className="px-3 pb-3 space-y-3 pt-3 border-t"
          style={{ borderColor: colors.borderDefault }}
        >
          {/* Opacity Control */}
          <div>
            <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>
              Opacity: {Math.round(floor.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={floor.opacity * 100}
              onChange={(e) => setFloorOpacity(floor.id, parseInt(e.target.value) / 100)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ backgroundColor: colors.borderDefault }}
            />
          </div>

          {/* Height Control */}
          <div>
            <label className="text-xs block mb-1" style={{ color: colors.textSecondary }}>
              Height: {floor.heightOffset} ft
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleHeightChange(-1)}
                className="px-2 py-1 rounded transition-colors"
                style={{ backgroundColor: colors.borderDefault, color: colors.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.borderStrong}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.borderDefault}
              >
                -1ft
              </button>
              <button
                onClick={() => handleHeightChange(1)}
                className="px-2 py-1 rounded transition-colors"
                style={{ backgroundColor: colors.borderDefault, color: colors.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.borderStrong}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.borderDefault}
              >
                +1ft
              </button>
            </div>
          </div>

          {/* Blueprint Preview */}
          {floor.blueprintUrl && (
            <div 
              className="relative aspect-video rounded overflow-hidden"
              style={{ backgroundColor: colors.surfacePrimary }}
            >
              <img
                src={floor.blueprintUrl}
                alt={floor.name}
                className="w-full h-full object-contain opacity-50"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={() => removeFloor(floor.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded transition-colors"
              style={{ color: colors.accentRed }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FloorPanel() {
  const { project, addFloor } = useVisualizerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, level: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const name = level === 0 ? 'Basement/Slab' : level === 1 ? 'First Floor' : 'Second Floor';
        addFloor(level, name, url, img);
        setPendingLevel(null);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const floors = project?.floors || [];
  const hasBasement = floors.some(f => f.level === 0);
  const hasFirstFloor = floors.some(f => f.level === 1);
  const hasSecondFloor = floors.some(f => f.level === 2);

  return (
    <div 
      className="w-72 border-r flex flex-col"
      style={{ backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.borderDefault }}>
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <ImageIcon className="w-5 h-5" style={{ color: colors.accentBlue }} />
          Floor Plans
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Upload and manage blueprint layers
        </p>
      </div>

      {/* Floor List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {floors.length === 0 ? (
          <div className="text-center py-8" style={{ color: colors.textMuted }}>
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No floors added yet</p>
            <p className="text-sm mt-1">Upload blueprints to get started</p>
          </div>
        ) : (
          floors
            .sort((a, b) => b.level - a.level)
            .map((floor) => <FloorItem key={floor.id} floor={floor} />)
        )}
      </div>

      {/* Add Floor Buttons */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: colors.borderDefault }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => pendingLevel !== null && handleFileSelect(e, pendingLevel)}
        />

        {!hasSecondFloor && (
          <button
            onClick={() => {
              setPendingLevel(2);
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.surfaceElevated, 
              borderColor: colors.borderStrong,
              color: colors.textSecondary 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceCard;
              e.currentTarget.style.borderColor = colors.borderStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceElevated;
              e.currentTarget.style.borderColor = colors.borderStrong;
            }}
          >
            <Upload className="w-4 h-4" />
            Add Second Floor
          </button>
        )}

        {!hasFirstFloor && (
          <button
            onClick={() => {
              setPendingLevel(1);
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.surfaceElevated, 
              borderColor: colors.borderStrong,
              color: colors.textSecondary 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceCard;
              e.currentTarget.style.borderColor = colors.borderStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceElevated;
              e.currentTarget.style.borderColor = colors.borderStrong;
            }}
          >
            <Upload className="w-4 h-4" />
            Add First Floor
          </button>
        )}

        {!hasBasement && (
          <button
            onClick={() => {
              setPendingLevel(0);
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.surfaceElevated, 
              borderColor: colors.borderStrong,
              color: colors.textSecondary 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceCard;
              e.currentTarget.style.borderColor = colors.borderStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceElevated;
              e.currentTarget.style.borderColor = colors.borderStrong;
            }}
          >
            <Upload className="w-4 h-4" />
            Add Basement/Slab
          </button>
        )}
      </div>

      {/* Scale Settings */}
      {floors.length > 0 && (
        <div className="p-4 border-t" style={{ borderColor: colors.borderDefault }}>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: colors.textSecondary }}>Scale</span>
            <span className="text-sm" style={{ color: colors.textPrimary }}>
              {project?.scale.pixelsPerFoot.toFixed(1)} px/ft
            </span>
          </div>
          <button 
            className="w-full mt-2 px-3 py-2 rounded text-sm transition-colors"
            style={{ backgroundColor: colors.surfaceElevated, color: colors.textSecondary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceCard}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.surfaceElevated}
          >
            Calibrate Scale
          </button>
        </div>
      )}
    </div>
  );
}

export default FloorPanel;
