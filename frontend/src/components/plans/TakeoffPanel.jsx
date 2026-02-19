import { useState } from 'react';
import { ChevronDown, ChevronRight, Ruler, ExternalLink } from 'lucide-react';
import TakeoffList from '../takeoff/TakeoffList';

export default function TakeoffPanel({ expanded, onToggle }) {
  const [selectedTakeoff, setSelectedTakeoff] = useState(null);

  const handleSelectTakeoff = (takeoff) => {
    setSelectedTakeoff(takeoff);
    // Navigate to the full editor in the takeoff page
    window.location.hash = '#takeoff-editor';
  };

  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Ruler className="w-4.5 h-4.5 text-surface-500 dark:text-surface-400" />
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider">
            Material Takeoff
          </h3>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-surface-400" />
          : <ChevronRight className="w-4 h-4 text-surface-400" />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1">
          <TakeoffList
            onSelectTakeoff={handleSelectTakeoff}
            selectedId={selectedTakeoff?.id}
          />
          {selectedTakeoff && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <a
                href="#takeoff"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#003594] dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Editor
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
