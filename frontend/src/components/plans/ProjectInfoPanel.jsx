import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';

export default function ProjectInfoPanel({ expanded, onToggle, projectInfo, onChange }) {
  const handleChange = (e) => {
    onChange({ ...projectInfo, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-4.5 h-4.5 text-surface-500 dark:text-surface-400" />
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider">
            Project Information
          </h3>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-surface-400" />
          : <ChevronRight className="w-4 h-4 text-surface-400" />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Sq Ft</label>
              <input
                type="number"
                name="sqft"
                value={projectInfo.sqft}
                onChange={handleChange}
                className="input w-full mt-1"
                placeholder="2,000"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Units</label>
              <input
                type="number"
                name="units"
                value={projectInfo.units}
                onChange={handleChange}
                className="input w-full mt-1"
                placeholder="4"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={projectInfo.bathrooms}
                onChange={handleChange}
                className="input w-full mt-1"
                placeholder="8"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Stories</label>
              <input
                type="number"
                name="stories"
                value={projectInfo.stories}
                onChange={handleChange}
                className="input w-full mt-1"
                placeholder="2"
                min="1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
