import { useState, useMemo } from 'react';
import { 
  X, Search, FileImage, LayoutGrid, List, ChevronRight,
  Check, Upload, FolderOpen
} from 'lucide-react';
import { visionApi } from '../../api/vision';

/**
 * BlueprintSelector - Modal for selecting blueprints to add to canvas
 * 
 * Features:
 * - List or grid view of available blueprints
 * - Search/filter
 * - Multi-select support
 * - Preview on hover
 */

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

export default function BlueprintSelector({ 
  projects = [], 
  isOpen, 
  onClose, 
  onSelect,
  onUploadNew,
  multiSelect = false,
}) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [hoveredProject, setHoveredProject] = useState(null);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(p => 
      (p.name || '').toLowerCase().includes(query) ||
      (p.fileType || '').toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Handle selection
  const handleSelect = (project) => {
    if (multiSelect) {
      setSelectedIds(prev => 
        prev.includes(project.id)
          ? prev.filter(id => id !== project.id)
          : [...prev, project.id]
      );
    } else {
      onSelect(project);
      onClose();
    }
  };

  // Handle confirm for multi-select
  const handleConfirm = () => {
    const selected = projects.filter(p => selectedIds.includes(p.id));
    onSelect(multiSelect ? selected : selected[0]);
    onClose();
    setSelectedIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[80vh] 
                      bg-white dark:bg-surface-800 rounded-2xl shadow-2xl
                      flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          <div>
            <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-200">
              Add Blueprints to Canvas
            </h2>
            <p className="text-sm text-surface-500">
              Select blueprints to add to your vision canvas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-surface-200 dark:border-surface-700">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search blueprints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg
                         bg-surface-100 dark:bg-surface-700
                         border-none outline-none
                         text-surface-700 dark:text-surface-300
                         placeholder:text-surface-400"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-100 dark:bg-surface-700">
            <button
              onClick={() => setViewMode(VIEW_MODES.GRID)}
              className={`p-1.5 rounded transition-colors
                         ${viewMode === VIEW_MODES.GRID 
                           ? 'bg-white dark:bg-surface-600 shadow-sm' 
                           : 'text-surface-400 hover:text-surface-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              className={`p-1.5 rounded transition-colors
                         ${viewMode === VIEW_MODES.LIST 
                           ? 'bg-white dark:bg-surface-600 shadow-sm' 
                           : 'text-surface-400 hover:text-surface-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload button */}
          <button
            onClick={onUploadNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-primary-600 text-white
                       hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="w-12 h-12 text-surface-300 mb-4" />
              <p className="text-surface-500 font-medium">No blueprints found</p>
              <p className="text-sm text-surface-400 mt-1">
                {searchQuery ? 'Try a different search term' : 'Upload your first blueprint'}
              </p>
            </div>
          ) : viewMode === VIEW_MODES.GRID ? (
            <GridView
              projects={filteredProjects}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onHover={setHoveredProject}
              multiSelect={multiSelect}
            />
          ) : (
            <ListView
              projects={filteredProjects}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onHover={setHoveredProject}
              multiSelect={multiSelect}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-surface-200 dark:border-surface-700">
          <div className="text-sm text-surface-500">
            {multiSelect && selectedIds.length > 0 ? (
              <span>{selectedIds.length} selected</span>
            ) : (
              <span>{filteredProjects.length} blueprints</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-surface-600 
                         hover:bg-surface-100 dark:hover:bg-surface-700
                         text-sm font-medium"
            >
              Cancel
            </button>
            {multiSelect && (
              <button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white
                           hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                           text-sm font-medium"
              >
                Add Selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview panel */}
      {hoveredProject && (
        <PreviewPanel 
          project={hoveredProject} 
          onClose={() => setHoveredProject(null)}
        />
      )}
    </div>
  );
}

/**
 * Grid view of projects
 */
function GridView({ projects, selectedIds, onSelect, onHover, multiSelect }) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {projects.map(project => {
          const isSelected = selectedIds.includes(project.id);

          return (
            <button
              key={project.id}
              onClick={() => onSelect(project)}
              onMouseEnter={() => onHover(project)}
              onMouseLeave={() => onHover(null)}
              className={`group relative aspect-[4/3] rounded-xl overflow-hidden
                         border-2 transition-all text-left
                         ${isSelected 
                           ? 'border-primary-500 ring-2 ring-primary-200' 
                           : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'}`}
            >
              {/* Thumbnail */}
              <img
                src={visionApi.getThumbnailUrl(project.id)}
                alt={project.name}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Selection indicator */}
              {multiSelect && (
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2
                               flex items-center justify-center transition-colors
                               ${isSelected 
                                 ? 'bg-primary-500 border-primary-500' 
                                 : 'border-white/50 bg-black/20'}`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              )}

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-medium text-sm truncate">
                  {project.name}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  {project.fileType?.toUpperCase()} • 
                  {project.width && project.height 
                    ? `${project.width}×${project.height}` 
                    : 'No dimensions'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * List view of projects
 */
function ListView({ projects, selectedIds, onSelect, onHover, multiSelect }) {
  return (
    <div className="h-full overflow-y-auto">
      {projects.map(project => {
        const isSelected = selectedIds.includes(project.id);

        return (
          <button
            key={project.id}
            onClick={() => onSelect(project)}
            onMouseEnter={() => onHover(project)}
            onMouseLeave={() => onHover(null)}
            className={`w-full flex items-center gap-4 p-4 border-b border-surface-100 
                       dark:border-surface-700 transition-colors text-left
                       ${isSelected 
                         ? 'bg-primary-50 dark:bg-primary-900/20' 
                         : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'}`}
          >
            {/* Checkbox for multi-select */}
            {multiSelect && (
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                             ${isSelected 
                               ? 'bg-primary-500 border-primary-500' 
                               : 'border-surface-300 dark:border-surface-600'}`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            )}

            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-surface-100 dark:bg-surface-700 overflow-hidden flex-shrink-0">
              <img
                src={visionApi.getThumbnailUrl(project.id)}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate
                            ${isSelected 
                              ? 'text-primary-700 dark:text-primary-300' 
                              : 'text-surface-800 dark:text-surface-200'}`}>
                {project.name}
              </p>
              <p className="text-sm text-surface-500 mt-0.5">
                {project.fileType?.toUpperCase()}
                {project.width && project.height && ` • ${project.width}×${project.height}`}
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-surface-300" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Preview panel for hovered project
 */
function PreviewPanel({ project, onClose }) {
  return (
    <div className="absolute right-4 top-4 bottom-4 w-80
                    bg-white dark:bg-surface-800 rounded-xl shadow-2xl
                    border border-surface-200 dark:border-surface-700
                    flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-surface-200 dark:border-surface-700">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Preview</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700"
        >
          <X className="w-4 h-4 text-surface-400" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 overflow-hidden bg-surface-900">
        <img
          src={visionApi.getThumbnailUrl(project.id)}
          alt={project.name}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Info */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-700 space-y-2">
        <h3 className="font-semibold text-surface-800 dark:text-surface-200">
          {project.name}
        </h3>
        <div className="text-sm text-surface-500 space-y-1">
          <p>Type: {project.fileType?.toUpperCase()}</p>
          {project.width && project.height && (
            <p>Dimensions: {project.width} × {project.height}</p>
          )}
          <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
