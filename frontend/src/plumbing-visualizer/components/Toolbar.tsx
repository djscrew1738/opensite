import { 
  MousePointer2, 
  PenTool, 
  Circle, 
  Ruler, 
  Eraser, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  FolderOpen,
  Download,
  Settings2
} from 'lucide-react';
import { useVisualizerStore } from '../store';
import type { Tool, ViewPreset } from '../types';

const TOOLS: { id: Tool; icon: React.ElementType; label: string; shortcut?: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'drawPipe', icon: PenTool, label: 'Draw Pipe', shortcut: 'P' },
  { id: 'placeFixture', icon: Circle, label: 'Place Fixture', shortcut: 'F' },
  { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
];

const VIEW_PRESETS: { id: ViewPreset; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'isometric', label: 'ISO' },
];

export function Toolbar() {
  const { 
    activeTool, 
    setActiveTool, 
    viewPreset, 
    setViewPreset,
    project,
    createProject,
    exportProject,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useVisualizerStore();

  const handleNewProject = () => {
    const name = prompt('Enter project name:');
    if (name) {
      createProject(name);
    }
  };

  const handleExport = () => {
    if (!project) return;
    const data = exportProject();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_plumbing.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="flex items-center gap-2 p-2 border-b"
      style={{ backgroundColor: '#111318', borderColor: '#1F2430' }}
    >
      {/* File Operations */}
      <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#1F2430' }}>
        <button
          onClick={handleNewProject}
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181C24'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="New Project"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181C24'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Open Project"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <button
          onClick={handleExport}
          disabled={!project}
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8', opacity: !project ? 0.4 : 1 }}
          onMouseEnter={(e) => !project || (e.currentTarget.style.backgroundColor = '#181C24')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Export Project"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#1F2430' }}>
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8', opacity: !canUndo() ? 0.3 : 1 }}
          onMouseEnter={(e) => !canUndo() || (e.currentTarget.style.backgroundColor = '#181C24')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8', opacity: !canRedo() ? 0.3 : 1 }}
          onMouseEnter={(e) => !canRedo() || (e.currentTarget.style.backgroundColor = '#181C24')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#1F2430' }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex items-center gap-2 px-3 py-2 rounded font-medium text-sm transition-all duration-200"
              style={{
                backgroundColor: isActive ? '#3B82F6' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#181C24';
                  e.currentTarget.style.color = '#F1F5F9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* View Presets */}
      <div className="flex items-center gap-1 pr-2 border-r" style={{ borderColor: '#1F2430' }}>
        {VIEW_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setViewPreset(preset.id)}
            className="px-3 py-2 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: viewPreset === preset.id ? '#181C24' : 'transparent',
              color: viewPreset === preset.id ? '#F1F5F9' : '#64748B',
            }}
            onMouseEnter={(e) => {
              if (viewPreset !== preset.id) {
                e.currentTarget.style.backgroundColor = '#181C24';
                e.currentTarget.style.color = '#94A3B8';
              }
            }}
            onMouseLeave={(e) => {
              if (viewPreset !== preset.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#64748B';
              }
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181C24'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181C24'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Fit to View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181C24'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded transition-colors ml-2"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181C24'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
