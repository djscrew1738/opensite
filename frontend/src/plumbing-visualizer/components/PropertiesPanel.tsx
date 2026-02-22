import { useState } from 'react';
import { 
  Minus, 
  Circle, 
  BoxSelect, 
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy
} from 'lucide-react';
import { useVisualizerStore } from '../store';
import { PIPE_COLORS, PIPE_LABELS, CONSTRUCTION_PHASES, type PipeType, type FixtureType } from '../types';

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
  accentGreen: '#10B981',
  accentAmber: '#F59E0B',
  accentRed: '#EF4444',
};

const PIPE_DIAMETERS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

const FIXTURE_TYPES: { type: FixtureType; label: string; icon: string }[] = [
  { type: 'toilet', label: 'Toilet', icon: '🚽' },
  { type: 'sink', label: 'Sink', icon: '🚰' },
  { type: 'shower', label: 'Shower', icon: '🚿' },
  { type: 'tub', label: 'Bathtub', icon: '🛁' },
  { type: 'hoseBib', label: 'Hose Bib', icon: '💧' },
  { type: 'waterHeater', label: 'Water Heater', icon: '🔥' },
  { type: 'washer', label: 'Washer', icon: '👕' },
  { type: 'dishwasher', label: 'Dishwasher', icon: '🍽️' },
  { type: 'cleanout', label: 'Cleanout', icon: '🧹' },
  { type: 'floorDrain', label: 'Floor Drain', icon: '🔘' },
  { type: 'shutoffValve', label: 'Shutoff Valve', icon: '⭕' },
];

export function PropertiesPanel() {
  const { 
    project, 
    selectedObject, 
    updatePipe, 
    removePipe,
    updateFixture,
    removeFixture,
    activeTool,
    drawingState,
    setDrawingState,
    fixtureToPlace,
    setFixtureToPlace,
  } = useVisualizerStore();

  const [isPipeExpanded, setIsPipeExpanded] = useState(true);
  const [isFixtureExpanded, setIsFixtureExpanded] = useState(true);

  if (!project) {
    return (
      <div 
        className="w-72 border-l p-4"
        style={{ backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault }}
      >
        <p className="text-center" style={{ color: colors.textMuted }}>
          Create a project to start designing
        </p>
      </div>
    );
  }

  // Get selected object data
  const selectedPipe = selectedObject.type === 'pipe' 
    ? project.pipes.find(p => p.id === selectedObject.id)
    : null;
  
  const selectedFixture = selectedObject.type === 'fixture'
    ? project.fixtures.find(f => f.id === selectedObject.id)
    : null;

  return (
    <div 
      className="w-72 border-l flex flex-col overflow-y-auto"
      style={{ backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.borderDefault }}>
        <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Properties</h2>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          {selectedObject.type 
            ? `Editing ${selectedObject.type}`
            : 'Select an object to edit'
          }
        </p>
      </div>

      {/* Selected Object Properties */}
      {selectedPipe && (
        <div className="p-4 border-b space-y-4" style={{ borderColor: colors.borderDefault }}>
          <div className="flex items-center gap-2" style={{ color: colors.accentBlue }}>
            <Minus className="w-5 h-5" />
            <span className="font-medium">Pipe Segment</span>
          </div>

          {/* Pipe Type */}
          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>Pipe Type</label>
            <div className="grid grid-cols-1 gap-1">
              {(Object.keys(PIPE_COLORS) as PipeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => updatePipe(selectedPipe.id, { type })}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: selectedPipe.type === type ? colors.surfaceElevated : 'transparent',
                    color: selectedPipe.type === type ? colors.textPrimary : colors.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPipe.type !== type) {
                      e.currentTarget.style.backgroundColor = colors.surfaceCard;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPipe.type !== type) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIPE_COLORS[type] }}
                  />
                  {PIPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Diameter */}
          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>
              Diameter: {selectedPipe.diameter}"
            </label>
            <div className="grid grid-cols-4 gap-1">
              {PIPE_DIAMETERS.map((dia) => (
                <button
                  key={dia}
                  onClick={() => updatePipe(selectedPipe.id, { diameter: dia })}
                  className="px-2 py-1 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: selectedPipe.diameter === dia ? colors.accentBlue : colors.surfaceElevated,
                    color: selectedPipe.diameter === dia ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {dia}"
                </button>
              ))}
            </div>
          </div>

          {/* Phase */}
          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>Construction Phase</label>
            <select
              value={selectedPipe.phase}
              onChange={(e) => updatePipe(selectedPipe.id, { phase: parseInt(e.target.value) as 1|2|3|4|5 })}
              className="w-full rounded px-3 py-2 text-sm focus:outline-none"
              style={{ 
                backgroundColor: colors.surfaceElevated, 
                border: `1px solid ${colors.borderDefault}`,
                color: colors.textPrimary 
              }}
            >
              {CONSTRUCTION_PHASES.map(({ phase, name }) => (
                <option key={phase} value={phase} style={{ backgroundColor: colors.surfaceElevated }}>
                  Phase {phase}: {name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => removePipe(selectedPipe.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: colors.accentRed 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {selectedFixture && (
        <div className="p-4 border-b space-y-4" style={{ borderColor: colors.borderDefault }}>
          <div className="flex items-center gap-2" style={{ color: colors.accentAmber }}>
            <Circle className="w-5 h-5" />
            <span className="font-medium">Fixture</span>
          </div>

          {/* Fixture Type */}
          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>Fixture Type</label>
            <select
              value={selectedFixture.type}
              onChange={(e) => updateFixture(selectedFixture.id, { type: e.target.value as FixtureType })}
              className="w-full rounded px-3 py-2 text-sm focus:outline-none"
              style={{ 
                backgroundColor: colors.surfaceElevated, 
                border: `1px solid ${colors.borderDefault}`,
                color: colors.textPrimary 
              }}
            >
              {FIXTURE_TYPES.map(({ type, label }) => (
                <option key={type} value={type} style={{ backgroundColor: colors.surfaceElevated }}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>Label</label>
            <input
              type="text"
              value={selectedFixture.label}
              onChange={(e) => updateFixture(selectedFixture.id, { label: e.target.value })}
              className="w-full rounded px-3 py-2 text-sm focus:outline-none"
              style={{ 
                backgroundColor: colors.surfaceElevated, 
                border: `1px solid ${colors.borderDefault}`,
                color: colors.textPrimary 
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => removeFixture(selectedFixture.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: colors.accentRed 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Drawing Tools Section */}
      {activeTool === 'drawPipe' && !selectedObject.type && (
        <div className="p-4 border-b space-y-4" style={{ borderColor: colors.borderDefault }}>
          <div className="flex items-center gap-2" style={{ color: colors.accentBlue }}>
            <Minus className="w-5 h-5" />
            <span className="font-medium">Draw Pipe</span>
          </div>

          <div className="text-sm" style={{ color: colors.textSecondary }}>
            Click on a floor to place pipe nodes. Connect multiple nodes to create a pipe route.
          </div>

          {/* Default Pipe Settings */}
          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>Default Type</label>
            <div className="grid grid-cols-1 gap-1">
              {(Object.keys(PIPE_COLORS) as PipeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDrawingState({ pipeType: type })}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: drawingState.pipeType === type ? colors.surfaceElevated : 'transparent',
                    color: drawingState.pipeType === type ? colors.textPrimary : colors.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    if (drawingState.pipeType !== type) {
                      e.currentTarget.style.backgroundColor = colors.surfaceCard;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (drawingState.pipeType !== type) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIPE_COLORS[type] }}
                  />
                  {PIPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>
              Default Diameter: {drawingState.pipeDiameter}"
            </label>
            <div className="grid grid-cols-4 gap-1">
              {PIPE_DIAMETERS.map((dia) => (
                <button
                  key={dia}
                  onClick={() => setDrawingState({ pipeDiameter: dia })}
                  className="px-2 py-1 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: drawingState.pipeDiameter === dia ? colors.accentBlue : colors.surfaceElevated,
                    color: drawingState.pipeDiameter === dia ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {dia}"
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs block mb-2" style={{ color: colors.textSecondary }}>Default Phase</label>
            <select
              value={drawingState.pipePhase}
              onChange={(e) => setDrawingState({ pipePhase: parseInt(e.target.value) as 1|2|3|4|5 })}
              className="w-full rounded px-3 py-2 text-sm focus:outline-none"
              style={{ 
                backgroundColor: colors.surfaceElevated, 
                border: `1px solid ${colors.borderDefault}`,
                color: colors.textPrimary 
              }}
            >
              {CONSTRUCTION_PHASES.map(({ phase, name }) => (
                <option key={phase} value={phase} style={{ backgroundColor: colors.surfaceElevated }}>
                  Phase {phase}: {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Fixture Placement Section */}
      {activeTool === 'placeFixture' && !selectedObject.type && (
        <div className="p-4 border-b space-y-4" style={{ borderColor: colors.borderDefault }}>
          <div className="flex items-center gap-2" style={{ color: colors.accentAmber }}>
            <Circle className="w-5 h-5" />
            <span className="font-medium">Place Fixture</span>
          </div>

          <div className="text-sm" style={{ color: colors.textSecondary }}>
            Select a fixture type and click on a floor to place it.
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FIXTURE_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => setFixtureToPlace(type)}
                className="flex flex-col items-center gap-2 p-3 rounded transition-colors"
                style={{
                  backgroundColor: fixtureToPlace === type ? 'rgba(245, 158, 11, 0.1)' : colors.surfaceElevated,
                  border: fixtureToPlace === type ? `1px solid rgba(245, 158, 11, 0.3)` : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (fixtureToPlace !== type) {
                    e.currentTarget.style.backgroundColor = colors.surfaceCard;
                  }
                }}
                onMouseLeave={(e) => {
                  if (fixtureToPlace !== type) {
                    e.currentTarget.style.backgroundColor = colors.surfaceElevated;
                  }
                }}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs" style={{ color: colors.textPrimary }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Project Stats */}
      <div className="p-4 mt-auto">
        <h3 className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>Project Stats</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Floors</span>
            <span style={{ color: colors.textPrimary }}>{project.floors.length}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Pipes</span>
            <span style={{ color: colors.textPrimary }}>{project.pipes.length}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Fixtures</span>
            <span style={{ color: colors.textPrimary }}>{project.fixtures.length}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Chases</span>
            <span style={{ color: colors.textPrimary }}>{project.chases.length}</span>
          </div>
        </div>

        <button 
          className="w-full mt-4 px-4 py-2 rounded text-sm transition-colors"
          style={{ backgroundColor: colors.surfaceElevated, color: colors.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceCard}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.surfaceElevated}
        >
          Generate Material List
        </button>
      </div>
    </div>
  );
}

export default PropertiesPanel;
