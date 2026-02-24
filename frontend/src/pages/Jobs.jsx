import { 
  useState, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect,
  memo
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, Calculator, Box, Calendar, 
  HardHat, Plus, Filter, Search, MoreVertical,
  ChevronRight, Clock, DollarSign, CheckCircle2,
  AlertCircle, TrendingUp, Users, RefreshCw, X,
  Building2, MapPin, User, FileText, Trash2
} from 'lucide-react';
import { NoJobsEmpty } from '../components/empty-states';
import { api } from '../api/client';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { TabSystem, Tab } from '../components/tabs';
import { PlumbingVisualizer } from '../plumbing-visualizer/PlumbingVisualizer';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LeadFinder from './LeadFinder';

import FixtureGrid from '../components/plans/FixtureGrid';
import PricingDashboard from '../components/plans/PricingDashboard';
import ProjectInfoPanel from '../components/plans/ProjectInfoPanel';
import AIAnalysisSection from '../components/plans/AIAnalysisSection';
import TakeoffPanel from '../components/plans/TakeoffPanel';
import { BlueprintUpload } from '../components/upload';
import { AccessibleCard } from '../components/ui';
import { 
  FIXTURE_PRICE, 
  DEFAULT_FIXTURES, 
  DEFAULT_PROJECT_INFO, 
  QUALIFYING_FIXTURES 
} from '../components/plans/constants';

// Job List Component
function JobList({ jobs, onSelectJob, selectedJobId, onDeleteJob }) {
  // Defensive: ensure jobs is always an array
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
}

// Overview Dashboard Component
function OverviewDashboard({ jobs, stats, onSelectJob, onDeleteJob }) {
  const statCards = [
    { label: 'Active Jobs', value: stats.active || 0, icon: HardHat, color: '#3B82F6' },
    { label: 'Pending', value: stats.pending || 0, icon: Clock, color: '#F59E0B' },
    { label: 'Completed', value: stats.completed || 0, icon: CheckCircle2, color: '#10B981' },
    { label: 'Total Value', value: `$${(stats.totalValue || 0).toLocaleString()}`, icon: DollarSign, color: '#8B5CF6' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <AccessibleCard
            key={stat.label}
            isHoverable
            ariaLabel={`${stat.label}: ${stat.value}`}
            className="p-4"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}20` }}
                aria-hidden="true"
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-100">
                  {stat.value}
                </p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            </div>
          </AccessibleCard>
        ))}
      </div>

      {/* Recent Jobs */}
      <div>
        <h3 className="font-semibold mb-4 text-surface-100">Recent Jobs</h3>
        {jobs.length === 0 ? (
          <AccessibleCard ariaLabel="No jobs available">
            <NoJobsEmpty onCreate={() => {}} />
          </AccessibleCard>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="relative group">
                <AccessibleCard
                  isInteractive
                  isHoverable
                  onClick={() => onSelectJob(job)}
                  ariaLabel={`${job.name || 'Untitled Job'}, ${job.builder || 'No builder'}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-100 truncate">
                      {job.name || 'Untitled'}
                    </p>
                    <p className="text-sm text-surface-500">
                      {job.builder} · {job.phase}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <ChevronRight className="w-5 h-5 text-surface-500" aria-hidden="true" />
                  </div>
                </AccessibleCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Estimating Component
function Estimating({ 
  fixtures, 
  setFixtures, 
  projectInfo, 
  setProjectInfo,
  totalFixtures,
  totalPrice,
  phaseBreakdown,
  calculateMutation,
  estimate,
  setEstimate
}) {
  const [activePanel, setActivePanel] = useState(null);

  const handleCalculate = () => {
    calculateMutation.mutate({
      fixtures,
      projectInfo,
    }, {
      onSuccess: (data) => {
        setEstimate(data);
      }
    });
  };

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{
              background: '#111318',
              border: '1px solid #1F2430',
            }}
          >
            <button
              onClick={() => setActivePanel(activePanel === 'info' ? null : 'info')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                >
                  <LayoutDashboard className="w-5 h-5" style={{ color: '#3B82F6' }} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold" style={{ color: '#F1F5F9' }}>Project Info</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>Address, builder, job details</p>
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 transition-transform"
                style={{ 
                  color: '#64748B',
                  transform: activePanel === 'info' ? 'rotate(90deg)' : 'rotate(0deg)'
                }}
              />
            </button>
            {activePanel === 'info' && (
              <div className="p-4 pt-0">
                <ProjectInfoPanel
                  projectInfo={projectInfo}
                  setProjectInfo={setProjectInfo}
                />
              </div>
            )}
          </div>

          {/* Fixture Grid */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{
              background: '#111318',
              border: '1px solid #1F2430',
            }}
          >
            <button
              onClick={() => setActivePanel(activePanel === 'fixtures' ? null : 'fixtures')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(16, 185, 129, 0.1)' }}
                >
                  <Calculator className="w-5 h-5" style={{ color: '#10B981' }} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold" style={{ color: '#F1F5F9' }}>Fixture Count</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>
                    {totalFixtures} fixtures · ${totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 transition-transform"
                style={{ 
                  color: '#64748B',
                  transform: activePanel === 'fixtures' ? 'rotate(90deg)' : 'rotate(0deg)'
                }}
              />
            </button>
            {activePanel === 'fixtures' && (
              <div className="p-4 pt-0">
                <FixtureGrid
                  fixtures={fixtures}
                  setFixtures={setFixtures}
                />
              </div>
            )}
          </div>

          {/* Blueprint Upload */}
          <div 
            className="rounded-xl overflow-hidden"
            style={{
              background: '#111318',
              border: '1px solid #1F2430',
            }}
          >
            <button
              onClick={() => setActivePanel(activePanel === 'blueprint' ? null : 'blueprint')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                >
                  <Box className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold" style={{ color: '#F1F5F9' }}>Blueprints</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>Upload and analyze plans</p>
                </div>
              </div>
              <ChevronRight 
                className="w-5 h-5 transition-transform"
                style={{ 
                  color: '#64748B',
                  transform: activePanel === 'blueprint' ? 'rotate(90deg)' : 'rotate(0deg)'
                }}
              />
            </button>
            {activePanel === 'blueprint' && (
              <div className="p-4 pt-0">
                <BlueprintUpload />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div>
          <div 
            className="rounded-xl p-4 sticky top-4"
            style={{
              background: '#111318',
              border: '1px solid #1F2430',
            }}
          >
            <h3 className="font-semibold mb-4" style={{ color: '#F1F5F9' }}>Estimate Summary</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm" style={{ color: '#64748B' }}>Total Fixtures</p>
                <p className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>{totalFixtures}</p>
              </div>
              
              <div>
                <p className="text-sm" style={{ color: '#64748B' }}>Total Price</p>
                <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
                  ${totalPrice.toLocaleString()}
                </p>
              </div>

              <div 
                className="pt-4 space-y-2"
                style={{ borderTop: '1px solid #1F2430' }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#94A3B8' }}>Rough-In (50%)</span>
                  <span style={{ color: '#F1F5F9' }}>${phaseBreakdown.roughIn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#94A3B8' }}>Top-Out (30%)</span>
                  <span style={{ color: '#F1F5F9' }}>${phaseBreakdown.topOut.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#94A3B8' }}>Trim (20%)</span>
                  <span style={{ color: '#F1F5F9' }}>${phaseBreakdown.trim.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleCalculate}
                disabled={calculateMutation.isPending}
                className="w-full py-3 rounded-lg font-medium transition-all mt-4"
                style={{
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
                  opacity: calculateMutation.isPending ? 0.7 : 1,
                }}
              >
                {calculateMutation.isPending ? 'Calculating...' : 'Save Estimate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4D Plumbing View Component
function PlumbingView() {
  return (
    <div className="h-full">
      <PlumbingVisualizer />
    </div>
  );
}

// Main Jobs Page
export default function Jobs() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJobId, setSelectedJobId] = useState(null);
  
  // Deletion state
  const [jobToDelete, setJobToDelete] = useState(null);

  // New Job Modal state
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState({
    name: '',
    builder: '',
    phase: 'rough-in',
    status: 'active',
    notes: ''
  });
  
  // Estimating state
  const [fixtures, setFixtures] = useState(() => ({ ...DEFAULT_FIXTURES }));
  const [projectInfo, setProjectInfo] = useState(() => ({ ...DEFAULT_PROJECT_INFO }));
  const [estimate, setEstimate] = useState(null);

  // Fetch jobs with error handling
  const { 
    data: jobsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.projects.getAll();
      return response;
    },
    retry: 1,
    staleTime: 30000,
  });

  // Defensive: ensure jobs is always an array
  const jobs = Array.isArray(jobsData?.data?.projects) ? jobsData.data.projects : 
               Array.isArray(jobsData?.projects) ? jobsData.projects : [];
  
  // Stats calculation - useMemo for consistency and performance
  const stats = useMemo(() => ({
    active: jobs.filter(j => j && j.status === 'active').length,
    pending: jobs.filter(j => j && j.status === 'pending').length,
    completed: jobs.filter(j => j && j.status === 'completed').length,
    totalValue: jobs.reduce((sum, j) => sum + (j?.estimate?.total || j?.totalPrice || 0), 0)
  }), [jobs]);

  // Calculate values - MUST be called before any early returns (Rules of Hooks)
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

  // Calculate mutation - MUST be called before any early returns (Rules of Hooks)
  const calculateMutation = useMutation({
    mutationFn: (data) => api.estimates?.calculate(data) || Promise.resolve(data),
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (data) => api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowNewJobModal(false);
      setNewJobData({
        name: '',
        builder: '',
        phase: 'rough-in',
        status: 'active',
        notes: ''
      });
      setActiveTab('overview');
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (id) => api.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setJobToDelete(null);
      if (selectedJobId === jobToDelete?.id) {
        setSelectedJobId(null);
      }
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

  // Selected job
  const selectedJob = jobs.find(j => j.id === selectedJobId);

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
          <Estimating
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
          <PlumbingView />
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
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-xl overflow-hidden"
            style={{ background: '#111318', border: '1px solid #1F2430' }}
          >
            {/* Modal Header */}
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1F2430' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                >
                  <Plus className="w-5 h-5" style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                    Create New Job
                  </h2>
                  <p className="text-sm" style={{ color: '#64748B' }}>
                    Add a new project to track
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewJobModal(false)}
                className="p-2 rounded-lg hover:bg-[#1F2430] transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#64748B' }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              {/* Job Name / Address */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Job Name / Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 123 Main St, Dallas, TX"
                  value={newJobData.name}
                  onChange={(e) => setNewJobData({ ...newJobData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                />
              </div>

              {/* Builder */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Builder / Client
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lennar Homes"
                  value={newJobData.builder}
                  onChange={(e) => setNewJobData({ ...newJobData, builder: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                />
              </div>

              {/* Phase & Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                    <HardHat className="w-4 h-4 inline mr-1" />
                    Phase
                  </label>
                  <select
                    value={newJobData.phase}
                    onChange={(e) => setNewJobData({ ...newJobData, phase: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                  >
                    <option value="rough-in">Rough In</option>
                    <option value="top-out">Top Out</option>
                    <option value="trim">Trim</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    Status
                  </label>
                  <select
                    value={newJobData.status}
                    onChange={(e) => setNewJobData({ ...newJobData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                  <FileText className="w-4 h-4 inline mr-1" />
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional job details..."
                  value={newJobData.notes}
                  onChange={(e) => setNewJobData({ ...newJobData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors resize-none"
                />
              </div>

              {/* Error Message */}
              {createJobMutation.isError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    {createJobMutation.error?.message || 'Failed to create job'}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all"
                  style={{ background: '#1F2430', color: '#94A3B8' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newJobData.name.trim() || createJobMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
