import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Search, X, Download, BarChart3, Sparkles, FileSpreadsheet, FileJson } from 'lucide-react';
import { colors, shadows, radius } from '../../styles/tokens';
import DiscoverySearchForm from './DiscoverySearchForm';
import DiscoveryProgress from './DiscoveryProgress';
import DiscoveryLeadCard from './DiscoveryLeadCard';
import DiscoveryLeadDetail from './DiscoveryLeadDetail';
import DiscoveryRunHistory from './DiscoveryRunHistory';

// ═══════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Lead
 * @property {string} id - Lead identifier
 * @property {string} businessName - Business name
 * @property {number} icpScore - ICP score (0-100)
 * @property {string} icpTier - Tier classification (hot/warm/cold)
 * @property {string} [enrichmentStatus] - Enrichment status
 * @property {string} [contactStatus] - Contact status
 */

/**
 * @typedef {Object} DiscoveryRun
 * @property {string} id - Run identifier
 * @property {string} keyword - Search keyword
 * @property {string} city - Search city
 * @property {string} status - Run status
 * @property {string} createdAt - Creation timestamp
 */

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage discovery data fetching and mutations
 * @param {string | null} activeRunId - Currently active run ID
 * @returns {Object} Discovery data and mutations
 */
function useDiscoveryData(activeRunId) {
  const queryClient = useQueryClient();

  // Fetch all runs
  const { data: runsData } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: () => api.discovery.getRuns(),
    refetchInterval: activeRunId ? 3000 : false,
  });

  const runs = runsData?.runs || [];

  // Fetch active run status
  const { data: activeRun } = useQuery({
    queryKey: ['discovery-run', activeRunId],
    queryFn: () => api.discovery.getRun(activeRunId),
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && (data.status === 'running' || data.status === 'pending') ? 2000 : false;
    },
  });

  // Fetch leads for active run
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['discovery-leads', activeRunId],
    queryFn: () => api.discovery.getRunLeads(activeRunId),
    enabled: !!activeRunId && activeRun?.status === 'completed',
  });

  const leads = leadsData?.leads || [];

  // Start run mutation
  const startMutation = useMutation({
    mutationFn: ({ keyword, city, ...options }) => api.discovery.startRun(keyword, city, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.discovery.updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-leads', activeRunId] });
    },
  });

  // Delete run mutation
  const deleteMutation = useMutation({
    mutationFn: (runId) => api.discovery.deleteRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
    },
  });

  return {
    runs,
    activeRun,
    leads,
    leadsLoading,
    startMutation,
    statusMutation,
    deleteMutation,
  };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Stat card for dashboard
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon element
 * @param {number | string} props.value - Stat value
 * @param {string} props.label - Stat label
 * @param {string} props.iconBg - Icon background style
 * @param {string} props.textColor - Text color style
 */
const StatCard = memo(function StatCard({ icon, value, label, iconBg, textColor }) {
  return (
    <div 
      className="p-4"
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.card,
        boxShadow: shadows.card
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <div>
          <p 
            className="text-2xl font-bold"
            style={{ color: textColor }}
          >
            {value}
          </p>
          <p style={{ color: colors.text.muted, fontSize: '0.75rem' }}>{label}</p>
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  iconBg: PropTypes.string.isRequired,
  textColor: PropTypes.string.isRequired,
};

/**
 * Stats dashboard showing lead counts
 * @param {Object} props
 * @param {number} props.total - Total leads count
 * @param {number} props.hot - Hot leads count
 * @param {number} props.warm - Warm leads count
 * @param {number} props.enriched - Enriched leads count
 */
const StatsDashboard = memo(function StatsDashboard({ 
  total, 
  hot, 
  warm, 
  enriched 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<BarChart3 className="w-5 h-5" style={{ color: colors.text.secondary }} aria-hidden="true" />}
        value={total}
        label="Total Leads"
        iconBg={colors.surface.elevated}
        textColor={colors.text.primary}
      />
      <StatCard
        icon={<span style={{ fontSize: '1.125rem' }} aria-hidden="true">🔥</span>}
        value={hot}
        label="Hot Leads"
        iconBg={colors.danger.muted}
        textColor={colors.danger.DEFAULT}
      />
      <StatCard
        icon={<span style={{ fontSize: '1.125rem' }} aria-hidden="true">☀️</span>}
        value={warm}
        label="Warm Leads"
        iconBg={colors.warning.muted}
        textColor={colors.warning.DEFAULT}
      />
      <StatCard
        icon={<Sparkles className="w-5 h-5" style={{ color: colors.success.DEFAULT }} aria-hidden="true" />}
        value={enriched}
        label="Enriched"
        iconBg={colors.success.muted}
        textColor={colors.success.DEFAULT}
      />
    </div>
  );
});

StatsDashboard.displayName = 'StatsDashboard';

StatsDashboard.propTypes = {
  total: PropTypes.number.isRequired,
  hot: PropTypes.number.isRequired,
  warm: PropTypes.number.isRequired,
  enriched: PropTypes.number.isRequired,
};

/**
 * Tier filter button
 * @param {Object} props
 * @param {string} props.tier - Tier name
 * @param {number} props.count - Lead count
 * @param {boolean} props.isActive - Whether filter is active
 * @param {() => void} props.onClick - Click handler
 * @param {string} props.emoji - Emoji icon
 * @param {Object} props.activeStyle - Active state style object
 * @param {Object} props.inactiveStyle - Inactive state style object
 */
const TierFilterButton = memo(function TierFilterButton({ 
  tier, 
  count, 
  isActive, 
  onClick,
  emoji,
  activeStyle,
  inactiveStyle
}) {
  const style = isActive ? activeStyle : inactiveStyle;

  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
      style={{
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor || 'transparent',
        boxShadow: isActive ? shadows.card : 'none',
      }}
      aria-pressed={isActive}
      aria-label={`Filter by ${tier} leads`}
    >
      <span aria-hidden="true">{emoji}</span> {tier} ({count})
    </button>
  );
});

TierFilterButton.displayName = 'TierFilterButton';

TierFilterButton.propTypes = {
  tier: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  emoji: PropTypes.string.isRequired,
  activeStyle: PropTypes.object.isRequired,
  inactiveStyle: PropTypes.object.isRequired,
};

/**
 * Export dropdown menu
 * @param {Object} props
 * @param {boolean} props.showMenu - Whether menu is visible
 * @param {() => void} props.onToggle - Toggle handler
 * @param {(format: string) => void} props.onExport - Export handler
 * @param {boolean} props.exporting - Whether export is in progress
 * @param {boolean} props.disabled - Whether export is disabled
 */
const ExportMenu = memo(function ExportMenu({ 
  showMenu, 
  onToggle, 
  onExport, 
  exporting, 
  disabled 
}) {
  const exportOptions = useMemo(() => [
    { format: 'csv', label: 'Export as CSV', icon: <FileSpreadsheet className="w-4 h-4" style={{ color: colors.success.DEFAULT }} aria-hidden="true" /> },
    { format: 'json', label: 'Export as JSON', icon: <FileJson className="w-4 h-4" style={{ color: colors.accent.DEFAULT }} aria-hidden="true" /> },
    { format: 'crm', label: 'CRM Format', icon: <Download className="w-4 h-4" style={{ color: colors.accent.purple }} aria-hidden="true" /> },
  ], []);

  const handleExport = useCallback((format) => {
    onExport(format);
  }, [onExport]);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={disabled || exporting}
        className="flex items-center gap-2 px-4 py-2 font-medium transition-all border"
        style={{ 
          backgroundColor: colors.surface.card,
          color: colors.text.primary,
          borderColor: colors.border.default,
          borderRadius: radius.btn,
          opacity: disabled || exporting ? 0.5 : 1,
          cursor: disabled || exporting ? 'not-allowed' : 'pointer'
        }}
        aria-expanded={showMenu}
        aria-haspopup="listbox"
        aria-label="Export options"
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        {exporting ? 'Exporting...' : 'Export'}
      </button>
      
      {showMenu && (
        <div 
          className="absolute right-0 top-full mt-2 w-48 py-2 z-20"
          style={{ 
            backgroundColor: colors.surface.card,
            borderRadius: radius.card,
            boxShadow: shadows.cardHover,
            border: `1px solid ${colors.border.default}`
          }}
          role="listbox"
          aria-label="Export options"
        >
          {exportOptions.map(({ format, label, icon }) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: colors.text.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface.elevated;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              role="option"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

ExportMenu.displayName = 'ExportMenu';

ExportMenu.propTypes = {
  showMenu: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  exporting: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
};

/**
 * Filters and actions bar
 * @param {Object} props
 * @param {string} props.tierFilter - Current tier filter
 * @param {(tier: string) => void} props.onTierChange - Tier change handler
 * @param {number} props.hotCount - Hot leads count
 * @param {number} props.warmCount - Warm leads count
 * @param {number} props.coldCount - Cold leads count
 * @param {boolean} props.showExportMenu - Whether export menu is visible
 * @param {() => void} props.onToggleExport - Export toggle handler
 * @param {(format: string) => void} props.onExport - Export handler
 * @param {boolean} props.exporting - Whether exporting
 * @param {boolean} props.hasLeads - Whether there are leads to export
 */
const FiltersBar = memo(function FiltersBar({ 
  tierFilter, 
  onTierChange, 
  hotCount, 
  warmCount, 
  coldCount,
  showExportMenu,
  onToggleExport,
  onExport,
  exporting,
  hasLeads
}) {
  const tierFilters = useMemo(() => [
    { 
      tier: 'hot', 
      count: hotCount, 
      emoji: '🔥', 
      activeStyle: { 
        backgroundColor: colors.danger.muted, 
        color: colors.danger.DEFAULT, 
        borderColor: colors.danger.border 
      },
      inactiveStyle: { 
        backgroundColor: colors.surface.elevated, 
        color: colors.text.secondary,
        borderColor: colors.border.default
      }
    },
    { 
      tier: 'warm', 
      count: warmCount, 
      emoji: '☀️', 
      activeStyle: { 
        backgroundColor: colors.warning.muted, 
        color: colors.warning.DEFAULT, 
        borderColor: colors.warning.border 
      },
      inactiveStyle: { 
        backgroundColor: colors.surface.elevated, 
        color: colors.text.secondary,
        borderColor: colors.border.default
      }
    },
    { 
      tier: 'cold', 
      count: coldCount, 
      emoji: '❄️', 
      activeStyle: { 
        backgroundColor: colors.surface.elevated, 
        color: colors.text.secondary, 
        borderColor: colors.border.strong 
      },
      inactiveStyle: { 
        backgroundColor: colors.surface.elevated, 
        color: colors.text.secondary,
        borderColor: colors.border.default
      }
    },
  ], [hotCount, warmCount, coldCount]);

  const handleClearFilter = useCallback(() => {
    onTierChange('');
  }, [onTierChange]);

  return (
    <div 
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.card,
        boxShadow: shadows.card
      }}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tier Filters */}
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-semibold"
              style={{ color: colors.text.secondary }}
            >
              Filter:
            </span>
            
            {tierFilters.map(({ tier, count, emoji, activeStyle, inactiveStyle }) => (
              <TierFilterButton
                key={tier}
                tier={tier}
                count={count}
                isActive={tierFilter === tier}
                onClick={() => onTierChange(tierFilter === tier ? '' : tier)}
                emoji={emoji}
                activeStyle={activeStyle}
                inactiveStyle={inactiveStyle}
              />
            ))}
            
            {tierFilter && (
              <button
                onClick={handleClearFilter}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: colors.text.muted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surface.elevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Clear filter"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Export Button */}
          <ExportMenu
            showMenu={showExportMenu}
            onToggle={onToggleExport}
            onExport={onExport}
            exporting={exporting}
            disabled={!hasLeads}
          />
        </div>
      </div>
    </div>
  );
});

FiltersBar.displayName = 'FiltersBar';

FiltersBar.propTypes = {
  tierFilter: PropTypes.string.isRequired,
  onTierChange: PropTypes.func.isRequired,
  hotCount: PropTypes.number.isRequired,
  warmCount: PropTypes.number.isRequired,
  coldCount: PropTypes.number.isRequired,
  showExportMenu: PropTypes.bool.isRequired,
  onToggleExport: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  exporting: PropTypes.bool.isRequired,
  hasLeads: PropTypes.bool.isRequired,
};

/**
 * Lead cards skeleton loading state
 */
const LeadsSkeleton = memo(function LeadsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div 
          key={i} 
          className="p-4 space-y-3 animate-pulse"
          style={{ 
            backgroundColor: colors.surface.card,
            borderRadius: radius.card
          }}
        >
          <div 
            className="h-6 rounded w-3/4"
            style={{ backgroundColor: colors.surface.elevated }}
          />
          <div 
            className="h-4 rounded w-1/2"
            style={{ backgroundColor: colors.surface.elevated }}
          />
          <div 
            className="h-4 rounded w-2/3"
            style={{ backgroundColor: colors.surface.elevated }}
          />
          <div 
            className="h-10 rounded"
            style={{ backgroundColor: colors.surface.elevated }}
          />
        </div>
      ))}
    </div>
  );
});

LeadsSkeleton.displayName = 'LeadsSkeleton';

/**
 * Lead cards grid
 * @param {Object} props
 * @param {Lead[]} props.leads - List of leads to display
 * @param {(lead: Lead) => void} props.onViewDetail - View detail handler
 * @param {(id: string, status: string) => void} props.onStatusUpdate - Status update handler
 */
const LeadsGrid = memo(function LeadsGrid({ leads, onViewDetail, onStatusUpdate }) {
  if (leads.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => (
        <DiscoveryLeadCard
          key={lead.id}
          lead={lead}
          onViewDetail={onViewDetail}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </div>
  );
});

LeadsGrid.displayName = 'LeadsGrid';

LeadsGrid.propTypes = {
  leads: PropTypes.arrayOf(PropTypes.object).isRequired,
  onViewDetail: PropTypes.func.isRequired,
  onStatusUpdate: PropTypes.func.isRequired,
};

/**
 * Empty state for no leads
 * @param {Object} props
 * @param {boolean} props.hasFilter - Whether a filter is applied
 */
const EmptyLeadsState = memo(function EmptyLeadsState({ hasFilter }) {
  return (
    <div 
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.card,
        boxShadow: shadows.card
      }}
    >
      <div className="text-center py-16">
        <Search 
          className="w-16 h-16 mx-auto mb-4" 
          style={{ color: colors.border.strong }}
          aria-hidden="true"
        />
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: colors.text.primary }}
        >
          {hasFilter ? 'No leads match this filter' : 'No leads found'}
        </h3>
        <p style={{ color: colors.text.muted, fontSize: '0.875rem' }}>
          {hasFilter 
            ? 'Try adjusting your filter criteria' 
            : 'This run completed but no leads were found. Try a different search.'}
        </p>
      </div>
    </div>
  );
});

EmptyLeadsState.displayName = 'EmptyLeadsState';

EmptyLeadsState.propTypes = {
  hasFilter: PropTypes.bool.isRequired,
};

/**
 * Initial empty state (no runs yet)
 */
const InitialEmptyState = memo(function InitialEmptyState() {
  const features = useMemo(() => [
    { icon: '🔍', label: 'Smart Search' },
    { icon: '✉️', label: 'Email Extraction' },
    { icon: '🤖', label: 'AI Scoring' },
    { icon: '📧', label: 'Outreach Drafts' },
  ], []);

  return (
    <div 
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.card,
        boxShadow: shadows.card
      }}
    >
      <div className="text-center py-20">
        <div 
          className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ 
            background: `linear-gradient(135deg, ${colors.accent.muted}, ${colors.accent.glow})`
          }}
        >
          <Search 
            className="w-12 h-12" 
            style={{ color: colors.accent.DEFAULT }}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <h3 
          className="text-2xl font-bold mb-3"
          style={{ color: colors.text.primary }}
        >
          Discover New Leads
        </h3>
        <p 
          className="text-base max-w-md mx-auto mb-8"
          style={{ color: colors.text.secondary }}
        >
          Search Google Maps for businesses, enrich their data with AI, and get scored leads with personalized outreach suggestions.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {features.map(({ icon, label }) => (
            <span 
              key={label} 
              className="px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: colors.surface.elevated,
                color: colors.text.muted
              }}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

InitialEmptyState.displayName = 'InitialEmptyState';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DiscoveryTab - Main discovery page component
 * Manages search, progress tracking, and lead display
 */
export default function DiscoveryTab() {
  const [activeRunId, setActiveRunId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [tierFilter, setTierFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    runs,
    activeRun,
    leads,
    leadsLoading,
    startMutation,
    statusMutation,
    deleteMutation,
  } = useDiscoveryData(activeRunId);

  // Auto-select most recent run
  useEffect(() => {
    if (!activeRunId && runs.length > 0) {
      setActiveRunId(runs[0].id);
    }
  }, [runs, activeRunId]);

  // Update active run ID when mutation succeeds
  useEffect(() => {
    if (startMutation.data?.runId) {
      setActiveRunId(startMutation.data.runId);
    }
  }, [startMutation.data]);

  // Clear active run ID when deleted
  useEffect(() => {
    if (deleteMutation.variables && activeRunId === deleteMutation.variables) {
      setActiveRunId(null);
    }
  }, [deleteMutation.variables, activeRunId]);

  const handleStartRun = useCallback((keyword, city, options = {}) => {
    startMutation.mutate({ keyword, city, ...options });
  }, [startMutation]);

  const handleStatusUpdate = useCallback((id, status) => {
    statusMutation.mutate({ id, status });
  }, [statusMutation]);

  const handleDeleteRun = useCallback((id) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  // Export functionality
  const handleExport = useCallback(async (format) => {
    if (!activeRunId) return;
    setExporting(true);
    try {
      const response = await fetch(`/api/discovery/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: activeRunId, format, tier: tierFilter }),
      });
      const data = await response.json();
      if (data.success) {
        const downloadResponse = await fetch(`/api/discovery/exports/${data.data.filename}`);
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  }, [activeRunId, tierFilter]);

  // Derived state
  const isRunning = activeRun?.status === 'running' || activeRun?.status === 'pending';
  const isComplete = activeRun?.status === 'completed';

  // Lead counts by tier
  const { hotCount, warmCount, coldCount, enrichedCount } = useMemo(() => ({
    hotCount: leads.filter(l => l.icpTier === 'hot').length,
    warmCount: leads.filter(l => l.icpTier === 'warm').length,
    coldCount: leads.filter(l => l.icpTier === 'cold').length,
    enrichedCount: leads.filter(l => l.enrichmentStatus === 'enriched').length,
  }), [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    if (!tierFilter) return leads;
    return leads.filter(l => l.icpTier === tierFilter);
  }, [leads, tierFilter]);

  const handleToggleExport = useCallback(() => {
    setShowExportMenu(prev => !prev);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <DiscoverySearchForm
        onSubmit={handleStartRun}
        isRunning={isRunning || startMutation.isPending}
      />

      {/* Progress */}
      {activeRun && (isRunning || activeRun.status === 'failed') && (
        <DiscoveryProgress run={activeRun} />
      )}

      {/* Run History */}
      {runs.length > 0 && (
        <DiscoveryRunHistory
          runs={runs}
          activeRunId={activeRunId}
          onSelectRun={setActiveRunId}
          onDeleteRun={handleDeleteRun}
        />
      )}

      {/* Results Section */}
      {isComplete && (
        <>
          <StatsDashboard
            total={leads.length}
            hot={hotCount}
            warm={warmCount}
            enriched={enrichedCount}
          />

          <FiltersBar
            tierFilter={tierFilter}
            onTierChange={setTierFilter}
            hotCount={hotCount}
            warmCount={warmCount}
            coldCount={coldCount}
            showExportMenu={showExportMenu}
            onToggleExport={handleToggleExport}
            onExport={handleExport}
            exporting={exporting}
            hasLeads={leads.length > 0}
          />

          {/* Lead Cards */}
          {leadsLoading ? (
            <LeadsSkeleton />
          ) : filteredLeads.length > 0 ? (
            <LeadsGrid
              leads={filteredLeads}
              onViewDetail={setSelectedLead}
              onStatusUpdate={handleStatusUpdate}
            />
          ) : (
            <EmptyLeadsState hasFilter={!!tierFilter} />
          )}
        </>
      )}

      {/* Empty state */}
      {!activeRunId && runs.length === 0 && <InitialEmptyState />}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <DiscoveryLeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

DiscoveryTab.displayName = 'DiscoveryTab';
