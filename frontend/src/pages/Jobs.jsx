import { useState, useMemo, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Calculator, Box, Calendar,
  HardHat, Plus, Clock, DollarSign,
  AlertCircle, Users, RefreshCw, Trash2
} from 'lucide-react';
import { api } from '../api/client';
import { TabSystem, Tab } from '../components/tabs';
import { PlumbingVisualizer } from '../plumbing-visualizer/PlumbingVisualizer';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LeadFinder from './LeadFinder';
import { AccessibleCard } from '../components/ui';
import {
  FIXTURE_PRICE,
  DEFAULT_FIXTURES,
  DEFAULT_PROJECT_INFO,
  QUALIFYING_FIXTURES
} from '../components/plans/constants';

import OverviewDashboard from '../components/jobs/OverviewDashboard';
import EstimatingTab from '../components/jobs/EstimatingTab';
import NewJobModal from '../components/jobs/NewJobModal';
import AnalysisJobsDashboard from '../components/dashboard/AnalysisJobsDashboard';

/* ─────────────────────────────────────────────
   JOB LIST (sidebar)
───────────────────────────────────────────── */
const JobList = memo(function JobList({ jobs, onSelectJob, selectedJobId, onDeleteJob }) {
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-3">
        {safeJobs.map((job) => (
          <div key={job.id} className="relative group">
            <AccessibleCard
              isInteractive
              isHoverable
              onClick={() => onSelectJob(job)}
              ariaLabel={`${job.name || 'Untitled Job'}, ${job.builder || 'No builder'}, ${job.phase || 'No phase'}`}
              className={`transition-all ${
                selectedJobId === job.id
                  ? 'border-accent bg-accent/10'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-surface-100">
                    {job.name || 'Untitled Job'}
                  </h3>
                  <p className="text-sm mt-1 text-surface-400">
                    {job.builder || 'No builder'} · {job.phase || 'No phase'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs flex items-center gap-1 text-surface-500">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Just created'}
                    </span>
                    {job.estimate && (
                      <span className="text-xs flex items-center gap-1 text-success">
                        <DollarSign className="w-3 h-3" aria-hidden="true" />
                        ${job.estimate.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    aria-hidden="true"
                    style={{
                      background: job.status === 'active' ? '#10B981' :
                                 job.status === 'pending' ? '#F59E0B' : '#64748B'
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteJob(job);
                    }}
                    className="p-2 text-surface-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </AccessibleCard>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   DEFAULT NEW JOB STATE
───────────────────────────────────────────── */
const EMPTY_JOB = {
  name: '',
  builder: '',
  phase: 'rough-in',
  status: 'active',
  notes: ''
};

/* ─────────────────────────────────────────────
   MAIN JOBS PAGE
───────────────────────────────────────────── */
export default function Jobs() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState(EMPTY_JOB);

  // Estimating state
  const [fixtures, setFixtures] = useState(() => ({ ...DEFAULT_FIXTURES }));
  const [projectInfo, setProjectInfo] = useState(() => ({ ...DEFAULT_PROJECT_INFO }));
  const [estimate, setEstimate] = useState(null);

  // Fetch jobs
  const {
    data: jobsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.projects.getAll(),
    retry: 1,
    staleTime: 30000,
  });

  const jobs = Array.isArray(jobsData?.data?.projects) ? jobsData.data.projects :
               Array.isArray(jobsData?.projects) ? jobsData.projects : [];

  const stats = useMemo(() => ({
    active: jobs.filter(j => j?.status === 'active').length,
    pending: jobs.filter(j => j?.status === 'pending').length,
    completed: jobs.filter(j => j?.status === 'completed').length,
    totalValue: jobs.reduce((sum, j) => sum + (j?.estimate?.total || j?.totalPrice || 0), 0)
  }), [jobs]);

  const totalFixtures = useMemo(() =>
    QUALIFYING_FIXTURES.reduce((sum, f) => sum + (fixtures[f.key] || 0), 0),
    [fixtures]
  );
  const totalPrice = useMemo(() => totalFixtures * FIXTURE_PRICE, [totalFixtures]);
  const phaseBreakdown = useMemo(() => ({
    roughIn: Math.round(totalPrice * 0.5),
    topOut: Math.round(totalPrice * 0.3),
    trim: Math.round(totalPrice * 0.2),
  }), [totalPrice]);

  // Mutations
  const calculateMutation = useMutation({
    mutationFn: (data) => api.estimates?.calculate(data) || Promise.resolve(data),
  });

  const createJobMutation = useMutation({
    mutationFn: (data) => api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowNewJobModal(false);
      setNewJobData(EMPTY_JOB);
      setActiveTab('overview');
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id) => api.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setJobToDelete(null);
      if (selectedJobId === jobToDelete?.id) setSelectedJobId(null);
    },
  });

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newJobData.name.trim()) return;
    createJobMutation.mutate({
      name: newJobData.name,
      builder: newJobData.builder || 'Unknown Builder',
      phase: newJobData.phase,
      status: newJobData.status,
      notes: newJobData.notes,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col page-transition-wrapper">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Jobs</h1>
            <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
              Manage projects, estimates, and 4D visualization
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 animate-spin"
              style={{
                border: '3px solid rgba(59, 130, 246, 0.1)',
                borderTopColor: '#3B82F6'
              }}
            />
            <p className="text-sm" style={{ color: '#94A3B8' }}>Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full flex flex-col page-transition-wrapper">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Jobs</h1>
            <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
              Manage projects, estimates, and 4D visualization
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className="max-w-md w-full p-6 rounded-xl text-center"
            style={{ background: '#111318', border: '1px solid #1F2430' }}
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#EF4444' }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#F1F5F9' }}>
              Failed to load jobs
            </h2>
            <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
              {error?.message || 'Unable to fetch job data. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium mx-auto transition-all"
              style={{ background: '#3B82F6', color: '#FFFFFF' }}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col page-transition-wrapper">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid #1F2430' }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>Jobs</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
            Manage projects, estimates, and 4D visualization
          </p>
        </div>
        <button
          onClick={() => setShowNewJobModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
          style={{
            background: '#3B82F6',
            color: '#FFFFFF',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
          }}
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </div>

      {/* Tabs */}
      <TabSystem
        defaultTab="overview"
        variant="default"
        className="border-b border-[#1F2430]"
        onChange={setActiveTab}
      >
        <Tab id="overview" label="Overview" icon={LayoutDashboard}>
          <OverviewDashboard
            jobs={jobs}
            stats={stats}
            onSelectJob={(job) => {
              setSelectedJobId(job.id);
              setActiveTab('estimating');
            }}
            onDeleteJob={(job) => setJobToDelete(job)}
          />
        </Tab>

        <Tab id="estimating" label="Estimating" icon={Calculator}>
          <EstimatingTab
            fixtures={fixtures}
            setFixtures={setFixtures}
            projectInfo={projectInfo}
            setProjectInfo={setProjectInfo}
            totalFixtures={totalFixtures}
            totalPrice={totalPrice}
            phaseBreakdown={phaseBreakdown}
            calculateMutation={calculateMutation}
            estimate={estimate}
            setEstimate={setEstimate}
          />
        </Tab>

        <Tab id="plumbing" label="4D View" icon={Box}>
          <div className="h-full">
            <PlumbingVisualizer />
          </div>
        </Tab>

        <Tab id="analysis-jobs" label="Analysis Jobs" icon={Calendar}>
          <AnalysisJobsDashboard />
        </Tab>

        <Tab id="leads" label="Lead Finder" icon={Users}>
          <LeadFinder />
        </Tab>
      </TabSystem>

      {/* Delete Confirmation */}
      {jobToDelete && (
        <ConfirmDialog
          title="Delete Job?"
          message={`Are you sure you want to delete "${jobToDelete.name}"? This action cannot be undone and all associated estimate data will be lost.`}
          confirmLabel={deleteJobMutation.isPending ? 'Deleting...' : 'Delete Job'}
          onConfirm={() => deleteJobMutation.mutate(jobToDelete.id)}
          onCancel={() => setJobToDelete(null)}
          variant="danger"
        />
      )}

      {/* New Job Modal */}
      <NewJobModal
        show={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        jobData={newJobData}
        setJobData={setNewJobData}
        onSubmit={handleCreateJob}
        isPending={createJobMutation.isPending}
        error={createJobMutation.isError ? createJobMutation.error : null}
      />
    </div>
  );
}
