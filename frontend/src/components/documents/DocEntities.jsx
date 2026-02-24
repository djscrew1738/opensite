import { useState } from 'react';
import { Scan, RefreshCw, Loader2, User, Building, MapPin, Calendar, DollarSign, Tag } from 'lucide-react';

const CATEGORY_COLORS = {
  person:       { bg: 'rgba(59, 130, 246, 0.1)',  text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)' },
  organization: { bg: 'rgba(139, 92, 246, 0.1)',  text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.3)' },
  location:     { bg: 'rgba(16, 185, 129, 0.1)',  text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
  date:         { bg: 'rgba(245, 158, 11, 0.1)',  text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  amount:       { bg: 'rgba(239, 68, 68, 0.1)',   text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
  other:        { bg: 'rgba(148, 163, 184, 0.1)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' },
};

const CATEGORY_ICONS = {
  person:       User,
  organization: Building,
  location:     MapPin,
  date:         Calendar,
  amount:       DollarSign,
  other:        Tag,
};

const CATEGORY_LABELS = {
  person:       'People',
  organization: 'Organizations',
  location:     'Locations',
  date:         'Dates',
  amount:       'Amounts',
  other:        'Other',
};

/**
 * DocEntities -- Displays extracted entities grouped by category.
 *
 * States:
 *   - No entities, not loading: "Extract Entities" button
 *   - Loading: Skeleton pulse
 *   - Entities array: Grouped pills with hover context
 *   - Raw extraction fallback: Preformatted text card
 */
export default function DocEntities({ document, onExtract, isLoading }) {
  const entities = document?.entities;

  // -- Loading state --
  if (isLoading) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}>
        <div className="flex items-center gap-3 mb-4">
          <Loader2
            size={18}
            className="animate-spin"
            style={{ color: '#3B82F6' }}
          />
          <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>
            Extracting entities...
          </span>
        </div>

        {/* Skeleton pills */}
        <div className="space-y-4">
          {[1, 2, 3].map((group) => (
            <div key={group}>
              <div
                className="h-4 w-24 rounded-md animate-pulse mb-3"
                style={{ backgroundColor: '#1F2430' }}
              />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 + group }, (_, i) => (
                  <div
                    key={i}
                    className="h-7 rounded-full animate-pulse"
                    style={{
                      backgroundColor: '#1F2430',
                      width: `${60 + Math.random() * 60}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -- No entities yet --
  if (!entities) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
          >
            <Scan size={22} style={{ color: '#3B82F6' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#F1F5F9' }}>
              No entities extracted
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Extract people, places, dates, and more from this document
            </p>
          </div>
          <button
            onClick={onExtract}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#3B82F6',
              color: '#F1F5F9',
            }}
          >
            <Scan size={16} />
            Extract Entities
          </button>
        </div>
      </div>
    );
  }

  // -- Raw extraction fallback --
  if (entities.raw_extraction) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scan size={16} style={{ color: '#3B82F6' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
              Extracted Entities
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}
            >
              raw
            </span>
          </div>
          <button
            onClick={onExtract}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(241, 245, 249, 0.05)',
              color: '#94A3B8',
              border: '1px solid #1F2430',
            }}
          >
            <RefreshCw size={14} />
            Re-extract
          </button>
        </div>

        <div
          className="rounded-lg p-4 overflow-x-auto"
          style={{ backgroundColor: '#181C24', border: '1px solid #1F2430' }}
        >
          <pre
            className="text-xs leading-relaxed"
            style={{
              color: '#F1F5F9',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {entities.raw_extraction}
          </pre>
        </div>
      </div>
    );
  }

  // -- Entities exist: group by type --
  const grouped = {};
  const entityList = Array.isArray(entities) ? entities : [];

  entityList.forEach((entity) => {
    const type = entity.type?.toLowerCase() || 'other';
    const key = CATEGORY_COLORS[type] ? type : 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entity);
  });

  // Sort categories: person, organization, location, date, amount, other
  const categoryOrder = ['person', 'organization', 'location', 'date', 'amount', 'other'];
  const sortedCategories = categoryOrder.filter((cat) => grouped[cat]?.length > 0);

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2430' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scan size={16} style={{ color: '#3B82F6' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            Extracted Entities
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}
          >
            {entityList.length}
          </span>
        </div>
        <button
          onClick={onExtract}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'rgba(241, 245, 249, 0.05)',
            color: '#94A3B8',
            border: '1px solid #1F2430',
          }}
        >
          <RefreshCw size={14} />
          Re-extract
        </button>
      </div>

      {/* Grouped entity sections */}
      <div className="space-y-5">
        {sortedCategories.map((category) => {
          const items = grouped[category];
          const colors = CATEGORY_COLORS[category];
          const Icon = CATEGORY_ICONS[category] || Tag;
          const label = CATEGORY_LABELS[category] || category;

          return (
            <div key={category}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-2.5">
                <Icon size={14} style={{ color: colors.text }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
                  {label}
                </span>
                <span className="text-xs" style={{ color: '#64748B' }}>
                  ({items.length})
                </span>
              </div>

              {/* Entity pills */}
              <div className="flex flex-wrap gap-2">
                {items.map((entity, idx) => (
                  <EntityPill key={`${category}-${idx}`} entity={entity} colors={colors} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty case: entities is an empty array */}
      {sortedCategories.length === 0 && entityList.length === 0 && (
        <div className="flex flex-col items-center py-6 gap-2">
          <p className="text-sm" style={{ color: '#64748B' }}>
            No entities were found in this document.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * EntityPill -- Individual entity displayed as an interactive pill.
 * Hover/click to reveal context.
 */
function EntityPill({ entity, colors }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
        title={entity.context || undefined}
      >
        {entity.name}
      </button>

      {/* Expanded context */}
      {expanded && entity.context && (
        <div
          className="absolute z-10 left-0 top-full mt-1.5 rounded-lg p-3 text-xs leading-relaxed max-w-xs shadow-lg"
          style={{
            backgroundColor: '#181C24',
            border: `1px solid ${colors.border}`,
            color: '#F1F5F9',
          }}
        >
          <p className="font-medium mb-1" style={{ color: colors.text }}>
            {entity.name}
          </p>
          <p style={{ color: '#94A3B8' }}>
            {entity.context}
          </p>
        </div>
      )}
    </div>
  );
}
