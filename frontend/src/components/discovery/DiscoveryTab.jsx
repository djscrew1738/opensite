import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Search, Filter, X, Download, BarChart3, Sparkles, FileSpreadsheet, FileJson } from 'lucide-react';
import DiscoverySearchForm from './DiscoverySearchForm';
import DiscoveryProgress from './DiscoveryProgress';
import DiscoveryLeadCard from './DiscoveryLeadCard';
import DiscoveryLeadDetail from './DiscoveryLeadDetail';
import DiscoveryRunHistory from './DiscoveryRunHistory';

export default function DiscoveryTab() {
  const [activeRunId, setActiveRunId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [tierFilter, setTierFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
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
    queryKey: ['discovery-leads', activeRunId, tierFilter],
    queryFn: () => api.discovery.getRunLeads(activeRunId, { tier: tierFilter || undefined }),
    enabled: !!activeRunId && activeRun?.status === 'completed',
  });

  const leads = leadsData?.leads || [];

  // Start run mutation
  const startMutation = useMutation({
    mutationFn: ({ keyword, city, ...options }) => api.discovery.startRun(keyword, city, options),
    onSuccess: (data) => {
      setActiveRunId(data.runId);
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.discovery.updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-leads', activeRunId] });
      if (selectedLead) {
        api.discovery.getLead(selectedLead.id).then(setSelectedLead).catch(() => {});
      }
    },
  });

  // Delete run mutation
  const deleteMutation = useMutation({
    mutationFn: (runId) => api.discovery.deleteRun(runId),
    onSuccess: (_, runId) => {
      if (activeRunId === runId) setActiveRunId(null);
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
    },
  });

  // Auto-select most recent run
  useEffect(() => {
    if (!activeRunId && runs.length > 0) {
      setActiveRunId(runs[0].id);
    }
  }, [runs, activeRunId]);

  const handleStartRun = useCallback((keyword, city, options = {}) => {
    startMutation.mutate({ keyword, city, ...options });
  }, [startMutation]);

  const handleStatusUpdate = useCallback((id, status) => {
    statusMutation.mutate({ id, status });
  }, [statusMutation]);

  // Export functionality
  const handleExport = async (format) => {
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
        // Trigger download
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
  };

  const isRunning = activeRun?.status === 'running' || activeRun?.status === 'pending';
  const isComplete = activeRun?.status === 'completed';

  const hotCount = leads.filter(l => l.icpTier === 'hot').length;
  const warmCount = leads.filter(l => l.icpTier === 'warm').length;
  const coldCount = leads.filter(l => l.icpTier === 'cold').length;
  const enrichedCount = leads.filter(l => l.enrichmentStatus === 'enriched').length;

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
          onDeleteRun={(id) => deleteMutation.mutate(id)}
        />
      )}

      {/* Results Section */}
      {isComplete && (
        <>
          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-surface-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{leads.length}</p>
                  <p className="text-xs text-surface-500">Total Leads</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{hotCount}</p>
                  <p className="text-xs text-surface-500">Hot Leads</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">☀️</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{warmCount}</p>
                  <p className="text-xs text-surface-500">Warm Leads</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{enrichedCount}</p>
                  <p className="text-xs text-surface-500">Enriched</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="card">
            <div className="card-body p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Tier Filters */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-surface-600">Filter:</span>
                  
                  <button
                    onClick={() => setTierFilter(tierFilter === 'hot' ? '' : 'hot')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tierFilter === 'hot'
                        ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
                        : 'bg-surface-100 text-surface-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    🔥 Hot ({hotCount})
                  </button>
                  
                  <button
                    onClick={() => setTierFilter(tierFilter === 'warm' ? '' : 'warm')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tierFilter === 'warm'
                        ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200'
                        : 'bg-surface-100 text-surface-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    ☀️ Warm ({warmCount})
                  </button>
                  
                  <button
                    onClick={() => setTierFilter(tierFilter === 'cold' ? '' : 'cold')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tierFilter === 'cold'
                        ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-200'
                        : 'bg-surface-100 text-surface-600 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    ❄️ Cold ({coldCount})
                  </button>
                  
                  {tierFilter && (
                    <button
                      onClick={() => setTierFilter('')}
                      className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Export Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={leads.length === 0 || exporting}
                    className="btn-secondary gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Exporting...' : 'Export'}
                  </button>
                  
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 z-20">
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
                      >
                        <FileJson className="w-4 h-4 text-blue-500" />
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExport('crm')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700"
                      >
                        <Download className="w-4 h-4 text-violet-500" />
                        CRM Format
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lead Cards Grid */}
          {leadsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-4 space-y-3 animate-pulse">
                  <div className="h-6 bg-surface-200 rounded w-3/4" />
                  <div className="h-4 bg-surface-200 rounded w-1/2" />
                  <div className="h-4 bg-surface-200 rounded w-2/3" />
                  <div className="h-10 bg-surface-200 rounded" />
                </div>
              ))}
            </div>
          ) : leads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <DiscoveryLeadCard
                  key={lead.id}
                  lead={lead}
                  onViewDetail={setSelectedLead}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-16">
                <Search className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100 mb-2">
                  {tierFilter ? 'No leads match this filter' : 'No leads found'}
                </h3>
                <p className="text-surface-500 text-sm">
                  {tierFilter 
                    ? 'Try adjusting your filter criteria' 
                    : 'This run completed but no leads were found. Try a different search.'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!activeRunId && runs.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-accent-100 to-accent-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-accent-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-3">
              Discover New Leads
            </h3>
            <p className="text-surface-600 dark:text-surface-400 text-base max-w-md mx-auto mb-8">
              Search Google Maps for businesses, enrich their data with AI, and get scored leads with personalized outreach suggestions.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-surface-500">
              <span className="px-3 py-1 bg-surface-100 rounded-full">🔍 Smart Search</span>
              <span className="px-3 py-1 bg-surface-100 rounded-full">✉️ Email Extraction</span>
              <span className="px-3 py-1 bg-surface-100 rounded-full">🤖 AI Scoring</span>
              <span className="px-3 py-1 bg-surface-100 rounded-full">📧 Outreach Drafts</span>
            </div>
          </div>
        </div>
      )}

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
