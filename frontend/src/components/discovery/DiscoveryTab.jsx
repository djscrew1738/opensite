import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Search, Filter, X } from 'lucide-react';
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
  const queryClient = useQueryClient();

  // Fetch all runs
  const { data: runsData } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: () => api.discovery.getRuns(),
    refetchInterval: activeRunId ? 3000 : false,
  });

  const runs = runsData?.runs || [];

  // Fetch active run status (poll while running)
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

  // Auto-select most recent run on load
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

  const isRunning = activeRun?.status === 'running' || activeRun?.status === 'pending';
  const isComplete = activeRun?.status === 'completed';

  const hotCount = leads.filter(l => l.icpTier === 'hot').length;
  const warmCount = leads.filter(l => l.icpTier === 'warm').length;
  const coldCount = leads.filter(l => l.icpTier === 'cold').length;

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <DiscoverySearchForm
        onSubmit={handleStartRun}
        isRunning={isRunning || startMutation.isPending}
      />

      {/* Progress (show when running) */}
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
          {/* Stats bar */}
          <div className="card">
            <div className="card-body p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-gray-900 dark:text-gray-100">{leads.length} leads</span>
                  {hotCount > 0 && (
                    <button
                      onClick={() => setTierFilter(tierFilter === 'hot' ? '' : 'hot')}
                      className={`font-bold ${tierFilter === 'hot' ? 'text-red-600 underline' : 'text-red-500 hover:text-red-600'}`}
                    >
                      {hotCount} hot
                    </button>
                  )}
                  {warmCount > 0 && (
                    <button
                      onClick={() => setTierFilter(tierFilter === 'warm' ? '' : 'warm')}
                      className={`font-bold ${tierFilter === 'warm' ? 'text-orange-600 underline' : 'text-orange-500 hover:text-orange-600'}`}
                    >
                      {warmCount} warm
                    </button>
                  )}
                  {coldCount > 0 && (
                    <button
                      onClick={() => setTierFilter(tierFilter === 'cold' ? '' : 'cold')}
                      className={`font-bold ${tierFilter === 'cold' ? 'text-gray-600 underline' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {coldCount} cold
                    </button>
                  )}
                </div>
                {tierFilter && (
                  <button
                    onClick={() => setTierFilter('')}
                    className="btn-ghost text-xs"
                  >
                    <X className="w-3 h-3" />
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lead Cards Grid */}
          {leadsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card">
                  <div className="card-body space-y-3">
                    <div className="skeleton h-6 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-10 w-full" />
                  </div>
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
              <div className="card-body text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {tierFilter ? 'No leads match this filter' : 'No leads found in this run'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state (no runs at all) */}
      {!activeRunId && runs.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-100 to-accent-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-accent-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
              Discover New Leads
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
              Search Google Maps for businesses, enrich their data, and get AI-scored leads with personalized outreach emails.
            </p>
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
