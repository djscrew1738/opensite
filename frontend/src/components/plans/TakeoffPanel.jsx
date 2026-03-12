import { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight, Ruler, ExternalLink, Package } from 'lucide-react';
import TakeoffList from '../takeoff/TakeoffList';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Panel header with expand/collapse toggle
 */
const PanelHeader = memo(function PanelHeader({ expanded, onToggle, itemCount }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-750 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500/50"
      aria-expanded={expanded}
      aria-controls="takeoff-panel-content"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-surface-700">
          <Ruler className="w-5 h-5 text-surface-400" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
            Material Takeoff
          </h3>
          {itemCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-accent-500/10 text-accent-400 rounded-full">
              {itemCount} items
            </span>
          )}
        </div>
      </div>
      
      {expanded ? (
        <ChevronDown className="w-4 h-4 text-surface-400" aria-hidden="true" />
      ) : (
        <ChevronRight className="w-4 h-4 text-surface-400" aria-hidden="true" />
      )}
    </button>
  );
});

/**
 * Empty state when no takeoffs exist
 */
const EmptyTakeoffState = memo(function EmptyTakeoffState() {
  return (
    <div className="py-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-700 mb-4">
        <Package className="w-6 h-6 text-surface-400" />
      </div>
      <h4 className="text-sm font-medium text-surface-300 mb-1">
        No Takeoffs Yet
      </h4>
      <p className="text-xs text-surface-500 max-w-xs mx-auto">
        Material takeoffs will appear here when you create them from blueprints.
      </p>
    </div>
  );
});

/**
 * Link to full takeoff editor
 */
const FullEditorLink = memo(function FullEditorLink() {
  return (
    <div className="mt-4 pt-4 border-t border-surface-700">
      <a
        href="#takeoff"
        className="inline-flex items-center gap-2 text-sm font-medium text-accent-500 hover:text-accent-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/50 rounded"
      >
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
        Open Full Editor
      </a>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * TakeoffPanel - Collapsible material takeoff section
 * 
 * Features:
 * - Collapsible panel
 * - Takeoff list integration
 * - Link to full editor
 * - Empty state
 * 
 * @param {Object} props
 * @param {boolean} props.expanded - Whether panel is expanded
 * @param {Function} props.onToggle - Toggle callback
 * @param {number} props.itemCount - Number of takeoff items (optional)
 * @param {Function} props.onSelectTakeoff - Callback when takeoff is selected
 */
function TakeoffPanel({ expanded, onToggle, itemCount = 0, onSelectTakeoff }) {
  const [selectedTakeoff, setSelectedTakeoff] = useState(null);

  const handleSelectTakeoff = useCallback((takeoff) => {
    setSelectedTakeoff(takeoff);
    onSelectTakeoff?.(takeoff);
    // Navigate to the full editor
    window.location.hash = '#takeoff-editor';
  }, [onSelectTakeoff]);

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
      <PanelHeader 
        expanded={expanded} 
        onToggle={onToggle}
        itemCount={itemCount}
      />

      {expanded && (
        <div id="takeoff-panel-content" className="px-5 pb-5 pt-1">
          {itemCount === 0 ? (
            <EmptyTakeoffState />
          ) : (
            <>
              <TakeoffList
                onSelectTakeoff={handleSelectTakeoff}
                selectedId={selectedTakeoff?.id}
              />
              <FullEditorLink />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

TakeoffPanel.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  itemCount: PropTypes.number,
  onSelectTakeoff: PropTypes.func,
};

TakeoffPanel.defaultProps = {
  itemCount: 0,
  onSelectTakeoff: null,
};

PanelHeader.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  itemCount: PropTypes.number.isRequired,
};

export default memo(TakeoffPanel);
