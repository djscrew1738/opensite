import { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Scan, RefreshCw, Loader2, User, Building, MapPin, Calendar, DollarSign, Tag } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const CATEGORY_CONFIG = {
  person: { 
    bg: 'bg-accent-500/10',  
    text: 'text-accent-500', 
    border: 'border-accent-500/30',
    icon: User,
    label: 'People',
  },
  organization: { 
    bg: 'bg-violet-500/10',  
    text: 'text-violet-500', 
    border: 'border-violet-500/30',
    icon: Building,
    label: 'Organizations',
  },
  location: { 
    bg: 'bg-emerald-500/10',  
    text: 'text-emerald-500', 
    border: 'border-emerald-500/30',
    icon: MapPin,
    label: 'Locations',
  },
  date: { 
    bg: 'bg-warning-500/10',  
    text: 'text-warning-500', 
    border: 'border-warning-500/30',
    icon: Calendar,
    label: 'Dates',
  },
  amount: { 
    bg: 'bg-danger-500/10',   
    text: 'text-danger-500', 
    border: 'border-danger-500/30',
    icon: DollarSign,
    label: 'Amounts',
  },
  other: { 
    bg: 'bg-surface-400/10', 
    text: 'text-surface-400', 
    border: 'border-surface-400/30',
    icon: Tag,
    label: 'Other',
  },
};

const CATEGORY_ORDER = ['person', 'organization', 'location', 'date', 'amount', 'other'];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Skeleton loading state for entity extraction
 */
const EntitiesSkeleton = memo(function EntitiesSkeleton() {
  return (
    <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 size={18} className="animate-spin text-accent-500" />
        <span className="text-sm font-medium text-surface-400">
          Extracting entities...
        </span>
      </div>

      {/* Skeleton pills */}
      <div className="space-y-4">
        {[1, 2, 3].map((group) => (
          <div key={group}>
            <div className="h-4 w-24 rounded-md animate-pulse bg-surface-800 mb-3" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 + group }, (_, i) => (
                <div
                  key={i}
                  className="h-7 rounded-full animate-pulse bg-surface-800"
                  style={{ width: `${60 + Math.random() * 60}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Empty state when no entities extracted yet
 */
const EmptyEntitiesState = memo(function EmptyEntitiesState({ 
  onExtract, 
  isDocumentReady 
}) {
  return (
    <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-500/10">
          <Scan size={22} className="text-accent-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1 text-surface-100">
            No entities extracted
          </p>
          <p className="text-xs text-surface-500">
            Extract people, places, dates, and more from this document
          </p>
        </div>
        <button
          onClick={onExtract}
          disabled={!isDocumentReady}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
            transition-colors bg-accent-500 text-surface-100 hover:bg-accent-600
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Scan size={16} />
          {isDocumentReady ? 'Extract Entities' : 'Processing…'}
        </button>
      </div>
    </div>
  );
});

EmptyEntitiesState.propTypes = {
  onExtract: PropTypes.func.isRequired,
  isDocumentReady: PropTypes.bool.isRequired,
};

/**
 * Display raw extraction fallback
 */
const RawExtractionView = memo(function RawExtractionView({ rawText, onExtract }) {
  return (
    <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scan size={16} className="text-accent-500" />
          <h3 className="text-sm font-semibold text-surface-100">
            Extracted Entities
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-warning-500/10 text-warning-500">
            raw
          </span>
        </div>
        <button
          onClick={onExtract}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
            transition-colors bg-surface-800/50 text-surface-400 border border-surface-700
            hover:bg-surface-800 hover:text-surface-300
          "
        >
          <RefreshCw size={14} />
          Re-extract
        </button>
      </div>

      <div className="rounded-lg p-4 overflow-x-auto bg-surface-800 border border-surface-700">
        <pre className="text-xs leading-relaxed text-surface-100 whitespace-pre-wrap break-words font-mono">
          {rawText}
        </pre>
      </div>
    </div>
  );
});

RawExtractionView.propTypes = {
  rawText: PropTypes.string.isRequired,
  onExtract: PropTypes.func.isRequired,
};

/**
 * Individual entity pill with expandable context
 */
const EntityPill = memo(function EntityPill({ entity, config }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = config.icon;

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
          transition-all cursor-pointer border
          ${config.bg} ${config.text} ${config.border}
          hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface-900 focus:ring-accent-500
        `}
        title={entity.context || entity.name}
        aria-expanded={expanded}
        tabIndex={0}
      >
        <Icon size={12} />
        {entity.name}
      </button>

      {/* Expanded context tooltip */}
      {expanded && entity.context && (
        <div
          className={`
            absolute z-10 left-0 top-full mt-1.5 rounded-lg p-3 text-xs leading-relaxed 
            max-w-xs shadow-lg bg-surface-800 border ${config.border} text-surface-100
          `}
          role="tooltip"
        >
          <p className={`font-medium mb-1 ${config.text}`}>
            {entity.name}
          </p>
          <p className="text-surface-400">
            {entity.context}
          </p>
        </div>
      )}
    </div>
  );
});

EntityPill.propTypes = {
  entity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    context: PropTypes.string,
  }).isRequired,
  config: PropTypes.shape({
    bg: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * Category section with entity pills
 */
const CategorySection = memo(function CategorySection({ 
  category, 
  items, 
  config 
}) {
  const Icon = config.icon;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={14} className={config.text} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${config.text}`}>
          {config.label}
        </span>
        <span className="text-xs text-surface-500">
          ({items.length})
        </span>
      </div>

      {/* Entity pills */}
      <div className="flex flex-wrap gap-2">
        {items.map((entity, idx) => (
          <EntityPill 
            key={`${category}-${idx}`} 
            entity={entity} 
            config={config} 
          />
        ))}
      </div>
    </div>
  );
});

CategorySection.propTypes = {
  category: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  config: PropTypes.shape({
    bg: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * Grouped entities view
 */
const GroupedEntitiesView = memo(function GroupedEntitiesView({ 
  entities, 
  onExtract 
}) {
  const { grouped, sortedCategories, entityCount } = useMemo(() => {
    const grouped = {};
    
    entities.forEach((entity) => {
      const type = entity.type?.toLowerCase() || 'other';
      const key = CATEGORY_CONFIG[type] ? type : 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entity);
    });

    const sortedCategories = CATEGORY_ORDER.filter((cat) => grouped[cat]?.length > 0);
    
    return { grouped, sortedCategories, entityCount: entities.length };
  }, [entities]);

  return (
    <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scan size={16} className="text-accent-500" />
          <h3 className="text-sm font-semibold text-surface-100">
            Extracted Entities
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-accent-500/10 text-accent-500">
            {entityCount}
          </span>
        </div>
        <button
          onClick={onExtract}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
            transition-colors bg-surface-800/50 text-surface-400 border border-surface-700
            hover:bg-surface-800 hover:text-surface-300
          "
        >
          <RefreshCw size={14} />
          Re-extract
        </button>
      </div>

      {/* Grouped entity sections */}
      <div className="space-y-5">
        {sortedCategories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            items={grouped[category]}
            config={CATEGORY_CONFIG[category]}
          />
        ))}
      </div>

      {/* Empty case: entities is an empty array */}
      {sortedCategories.length === 0 && entities.length === 0 && (
        <div className="flex flex-col items-center py-6 gap-2">
          <p className="text-sm text-surface-500">
            No entities were found in this document.
          </p>
        </div>
      )}
    </div>
  );
});

GroupedEntitiesView.propTypes = {
  entities: PropTypes.arrayOf(PropTypes.object).isRequired,
  onExtract: PropTypes.func.isRequired,
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DocEntities -- Displays extracted entities grouped by category.
 *
 * States:
 *   - No entities, not loading: "Extract Entities" button
 *   - Loading: Skeleton pulse
 *   - Entities array: Grouped pills with hover context
 *   - Raw extraction fallback: Preformatted text card
 */
function DocEntities({ document, onExtract, isLoading, isDocumentReady = true }) {
  const entities = document?.entities;

  // Loading state
  if (isLoading) {
    return <EntitiesSkeleton />;
  }

  // No entities yet
  if (!entities) {
    return (
      <EmptyEntitiesState 
        onExtract={onExtract} 
        isDocumentReady={isDocumentReady} 
      />
    );
  }

  // Raw extraction fallback
  if (entities.raw_extraction) {
    return (
      <RawExtractionView 
        rawText={entities.raw_extraction} 
        onExtract={onExtract} 
      />
    );
  }

  // Entities exist: group by type
  const entityList = Array.isArray(entities) ? entities : [];

  if (entityList.length === 0) {
    return (
      <div className="rounded-xl p-5 bg-surface-900 border border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scan size={16} className="text-accent-500" />
            <h3 className="text-sm font-semibold text-surface-100">
              Extracted Entities
            </h3>
          </div>
          <button
            onClick={onExtract}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
              transition-colors bg-surface-800/50 text-surface-400 border border-surface-700
              hover:bg-surface-800 hover:text-surface-300
            "
          >
            <RefreshCw size={14} />
            Re-extract
          </button>
        </div>
        <div className="flex flex-col items-center py-6 gap-2">
          <p className="text-sm text-surface-500">
            No entities were found in this document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GroupedEntitiesView 
      entities={entityList} 
      onExtract={onExtract} 
    />
  );
}

DocEntities.propTypes = {
  document: PropTypes.shape({
    entities: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.shape({
        raw_extraction: PropTypes.string,
      }),
    ]),
  }),
  onExtract: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  isDocumentReady: PropTypes.bool,
};

DocEntities.defaultProps = {
  document: null,
  isLoading: false,
  isDocumentReady: true,
};

export default DocEntities;
