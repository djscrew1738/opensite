import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, Calculator, Box, Calendar,
  HardHat, Plus, Clock, DollarSign,
  AlertCircle, Users, RefreshCw, Trash2,
  FileText, Sparkles, CheckCircle, Download,
  FolderOpen, ArrowRight, Menu, X, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { uploadApi } from '../api/upload';
import { TabSystem, Tab, MobileTabBar } from '../components/tabs';
import { PlumbingVisualizer } from '../plumbing-visualizer/PlumbingVisualizer';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LeadFinder from './LeadFinder';
import {
  AnimatedCard,
  AnimatedStatCard,
  useCountUp,
  useInView,
  pageTransitions,
  cx,
  PullToRefresh,
} from '../components/shared';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { 
  Button, 
  EmptyJobs, 
  SkeletonList,
  PulseLoader 
} from '../components/ui';
import { HeroUpload } from '../components/upload';
import { useToast } from '../hooks/useToast';
import { useBreakpoint, useIsTouchDevice } from '../hooks/useBreakpoint';

import OverviewDashboard from '../components/jobs/OverviewDashboard';
import EstimatingTab from '../components/jobs/EstimatingTab';
import NewJobModal from '../components/jobs/NewJobModal';
import AnalysisJobsDashboard from '../components/dashboard/AnalysisJobsDashboard';

/* ─────────────────────────────────────────────
   ANALYSIS STAGES
───────────────────────────────────────────── */
const ANALYSIS_STAGES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  EXTRACTING: 'extracting',
  ANALYZING: 'analyzing',
  ESTIMATING: 'estimating',
  COMPLETE: 'complete',
  ERROR: 'error'
};

/* ─────────────────────────────────────────────
   MOBILE PROJECT LIST
───────────────────────────────────────────── */
const MobileProjectList = memo(function MobileProjectList({ 
  jobs, 
  onSelectJob, 
  selectedJobId, 
  onDeleteJob, 
  isLoading,
  onCreateJob,
  onClose 
}) {
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <SkeletonList items={5} hasIcon={false} hasAction={false} />
      </div>
    );
  }

  if (safeJobs.length === 0) {
    return (
      <div className="p-4">
        <EmptyJobs size="sm" onCreate={onCreateJob} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-3">
        {safeJobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <AnimatedCard
              isInteractive
              onClick={() => {
                onSelectJob(job);
                onClose?.();
              }}
              className={cx(
                selectedJobId === job.id && 'border-[#3B82F6] bg-[rgba(59,130,246,0.05)]'
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-[#F8FAFC]">
                      {job.name || 'Untitled Job'}
                    </h3>
                    <p className="text-sm mt-1 text-[#94A3B8]">
                      {job.builder || 'No builder'} · <span className="capitalize">{job.phase || 'No phase'}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs flex items-center gap-1 text-[#64748B]">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Just created'}
                      </span>
                      {job.estimate && (
                        <span className="text-xs flex items-center gap-1 text-[#10B981]">
                          <DollarSign className="w-3 h-3" aria-hidden="true" />
                          ${job.estimate.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      aria-hidden="true"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        background: job.status === 'active' ? '#10B981' :
                                   job.status === 'pending' ? '#F59E0B' : '#64748B',
                        boxShadow: job.status === 'active' ? '0 0 8px #10B981' : 
                                  job.status === 'pending' ? '0 0 8px #F59E0B' : 'none'
                      }}
                    />
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteJob(job);
                      }}
                      className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-all"
                      title="Delete Job"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   DESKTOP PROJECT LIST (sidebar)
───────────────────────────────────────────── */
const ProjectList = memo(function ProjectList({ jobs, onSelectJob, selectedJobId, onDeleteJob, isLoading, onCreateJob }) {
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <SkeletonList items={5} hasIcon={false} hasAction={false} />
      </div>
    );
  }

  if (safeJobs.length === 0) {
    return (
      <div className="p-4">
        <EmptyJobs size="sm" onCreate={onCreateJob} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-3">
        {safeJobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <AnimatedCard
              isInteractive
              onClick={() => onSelectJob(job)}
              className={cx(
                selectedJobId === job.id && 'border-[#3B82F6] bg-[rgba(59,130,246,0.05)]'
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-[#F8FAFC]">
                      {job.name || 'Untitled Job'}
                    </h3>
                    <p className="text-sm mt-1 text-[#94A3B8]">
                      {job.builder || 'No builder'} · <span className="capitalize">{job.phase || 'No phase'}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs flex items-center gap-1 text-[#64748B]">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : 'Just created'}
                      </span>
                      {job.estimate && (
                        <span className="text-xs flex items-center gap-1 text-[#10B981]">
                          <DollarSign className="w-3 h-3" aria-hidden="true" />
                          ${job.estimate.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      aria-hidden="true"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        background: job.status === 'active' ? '#10B981' :
                                   job.status === 'pending' ? '#F59E0B' : '#64748B',
                        boxShadow: job.status === 'active' ? '0 0 8px #10B981' : 
                                  job.status === 'pending' ? '0 0 8px #F59E0B' : 'none'
                      }}
                    />
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteJob(job);
                      }}
                      className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete Job"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   ANALYSIS RESULTS DISPLAY
───────────────────────────────────────────── */
function AnalysisResults({ results, onCreateJob, onExport }) {
  const { fixtures, estimate, blueprint } = results;
  const { isMobile } = useBreakpoint();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Success header */}
      <AnimatedCard variant="elevated" className="border-[rgba(16,185,129,0.3)]">
        <div className="p-4 sm:p-6 flex items-center gap-4">
          <motion.div 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-[#10B981]" />
          </motion.div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-[#F8FAFC]">Analysis Complete</h3>
            <p className="text-sm text-[#94A3B8]">
              Successfully extracted {fixtures?.length || 0} fixtures and generated estimate
            </p>
          </div>
        </div>
      </AnimatedCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Fixtures', value: fixtures?.length || 0, icon: Box, color: '#3B82F6' },
          { label: 'Square Feet', value: blueprint?.sqft || 'N/A', icon: LayoutDashboard, color: '#8B5CF6' },
          { label: 'Est. Cost', value: `$${estimate?.total?.toLocaleString() || 0}`, icon: DollarSign, color: '#10B981' },
          { label: 'Rooms', value: blueprint?.rooms?.length || 0, icon: HardHat, color: '#F59E0B' },
        ].map((stat, idx) => (
          <AnimatedStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            delay={idx * 0.1}
          />
        ))}
      </div>

      {/* Fixtures grid */}
      {fixtures && fixtures.length > 0 && (
        <AnimatedCard variant="elevated">
          <div className="px-4 sm:px-5 py-4 border-b border-[#1F2430]">
            <h4 className="font-semibold text-[#F8FAFC]">Detected Fixtures</h4>
          </div>
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {fixtures.map((fixture, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#0A0B0D] rounded-xl p-3 border border-[#1F2430] flex items-center gap-3 cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center flex-shrink-0">
                  <Box className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F8FAFC] font-medium text-sm truncate">{fixture.type}</p>
                  <p className="text-xs text-[#64748B]">{fixture.count}x</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          size={isMobile ? "default" : "lg"}
          leftIcon={Sparkles}
          onClick={onCreateJob}
          className="flex-1 justify-center"
          showRipple
        >
          Create Job from Analysis
        </Button>
        <Button
          variant="secondary"
          size={isMobile ? "default" : "lg"}
          leftIcon={Download}
          onClick={onExport}
        >
          Export
        </Button>
      </div>
    </motion.div>
  );
}

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

const DEFAULT_JOB_TAB = 'projects';

const JOB_PRIMARY_TABS = [
  { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: LayoutDashboard },
  { id: 'blueprints', label: 'Blueprints', shortLabel: 'Blueprints', icon: FileText },
  { id: 'estimating', label: 'Estimating', shortLabel: 'Estimate', icon: Calculator },
  { id: 'leads', label: 'Leads', shortLabel: 'Leads', icon: Users },
];

const JOB_UTILITY_TOOLS = [
  {
    id: 'plumbing',
    label: '4D View',
    description: 'Inspect the plumbing visualizer without promoting it to a peer workflow.',
    icon: Box,
  },
  {
    id: 'analysis-jobs',
    label: 'Analysis Jobs',
    description: 'Review background blueprint processing when you need deeper diagnostics.',
    icon: Calendar,
  },
];

const JOB_UTILITY_PANEL = {
  title: 'More tools',
  description: 'Lower-frequency utilities stay nearby without crowding the main Jobs entry path.',
};

const LEGACY_JOB_TAB_REDIRECTS = {
  'plumbing': 'projects',
  'analysis-jobs': 'projects',
};

const JOB_PRIMARY_TAB_IDS = JOB_PRIMARY_TABS.map(({ id }) => id);
const JOB_UTILITY_TOOL_IDS = JOB_UTILITY_TOOLS.map(({ id }) => id);

function resolveJobsWorkspace(tabValue) {
  if (JOB_PRIMARY_TAB_IDS.includes(tabValue)) {
    return { primaryTab: tabValue, utilityTool: null };
  }

  if (JOB_UTILITY_TOOL_IDS.includes(tabValue)) {
    return {
      primaryTab: LEGACY_JOB_TAB_REDIRECTS[tabValue] || DEFAULT_JOB_TAB,
      utilityTool: tabValue,
    };
  }

  return { primaryTab: DEFAULT_JOB_TAB, utilityTool: null };
}

function renderUtilityTool(toolId) {
  if (toolId === 'plumbing') {
    return <PlumbingVisualizer />;
  }

  if (toolId === 'analysis-jobs') {
    return <AnalysisJobsDashboard />;
  }

  return null;
}

function UtilityWorkspace({ tool, onBack }) {
  if (!tool) {
    return null;
  }

  const Icon = tool.icon;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#111318] border border-[#1F2430] flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#64748B] mb-2">
              {JOB_UTILITY_PANEL.title}
            </p>
            <h3 className="text-xl font-semibold text-[#F8FAFC]">{tool.label}</h3>
            <p className="text-sm text-[#94A3B8] mt-1 max-w-2xl">{tool.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1F2430] text-sm text-[#CBD5E1] hover:text-white hover:border-[#334155] hover:bg-[#111318] transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to projects
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {renderUtilityTool(tool.id)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN JOBS PAGE
───────────────────────────────────────────── */
export default function Jobs() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile, isTablet } = useBreakpoint();
  const isTouch = useIsTouchDevice();

  const queryTab = searchParams.get('tab');
  const initialWorkspace = resolveJobsWorkspace(queryTab);

  const [activeTab, setActiveTabState] = useState(initialWorkspace.primaryTab);
  const [activeUtilityTool, setActiveUtilityTool] = useState(initialWorkspace.utilityTool);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState(EMPTY_JOB);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const syncJobsQuery = useCallback((nextPrimaryTab, nextUtilityTool = null) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextUtilityTool) {
      nextParams.set('tab', nextUtilityTool);
    } else if (nextPrimaryTab === DEFAULT_JOB_TAB) {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextPrimaryTab);
    }

    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const setActiveTab = useCallback((nextTab) => {
    if (!JOB_PRIMARY_TAB_IDS.includes(nextTab)) return;

    setActiveTabState(nextTab);
    setActiveUtilityTool(null);
    setSelectedJobId(null);
    setShowMobileSidebar(false);
    syncJobsQuery(nextTab, null);
  }, [syncJobsQuery]);

  const openUtilityTool = useCallback((toolId) => {
    if (!JOB_UTILITY_TOOL_IDS.includes(toolId)) return;

    setActiveTabState(DEFAULT_JOB_TAB);
    setActiveUtilityTool(toolId);
    setSelectedJobId(null);
    setShowMobileSidebar(false);
    syncJobsQuery(DEFAULT_JOB_TAB, toolId);
  }, [syncJobsQuery]);

  const closeUtilityTool = useCallback(() => {
    setActiveUtilityTool(null);
    syncJobsQuery(DEFAULT_JOB_TAB, null);
  }, [syncJobsQuery]);

  useEffect(() => {
    if (queryTab && !JOB_PRIMARY_TAB_IDS.includes(queryTab) && !JOB_UTILITY_TOOL_IDS.includes(queryTab)) {
      const cleaned = new URLSearchParams(searchParams);
      cleaned.delete('tab');
      setSearchParams(cleaned, { replace: true });
      return;
    }

    const resolvedWorkspace = resolveJobsWorkspace(queryTab);

    if (resolvedWorkspace.primaryTab !== activeTab) {
      setActiveTabState(resolvedWorkspace.primaryTab);
    }

    if (resolvedWorkspace.utilityTool !== activeUtilityTool) {
      setActiveUtilityTool(resolvedWorkspace.utilityTool);
    }
  }, [queryTab, activeTab, activeUtilityTool, searchParams, setSearchParams]);

  // Blueprint analysis state
  const [analysisState, setAnalysisState] = useState(ANALYSIS_STAGES.IDLE);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ stage: 'Upload', percent: 0 });

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

  const ptr = usePullToRefresh(() => refetch(), { enabled: isMobile });

  const jobs = Array.isArray(jobsData?.data?.projects) ? jobsData.data.projects :
               Array.isArray(jobsData?.projects) ? jobsData.projects : [];

  const stats = useMemo(() => ({
    active: jobs.filter(j => j?.status === 'active').length,
    pending: jobs.filter(j => j?.status === 'pending').length,
    completed: jobs.filter(j => j?.status === 'completed').length,
    totalValue: jobs.reduce((sum, j) => sum + (j?.estimate?.total || j?.totalPrice || 0), 0)
  }), [jobs]);

  // Mutations
  const createJobMutation = useMutation({
    mutationFn: (data) => api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      showToast('Job created successfully', 'success');
    },
    onError: (err) => {
      showToast(err.message || 'Failed to create job', 'error');
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id) => api.projects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setJobToDelete(null);
      if (selectedJobId === jobToDelete?.id) setSelectedJobId(null);
      showToast('Job deleted successfully', 'success');
    },
  });

  // Blueprint upload and analysis
  const handleBlueprintUpload = useCallback(async (files) => {
    if (!files.length) return;

    setAnalysisState(ANALYSIS_STAGES.UPLOADING);
    setUploadProgress({ stage: 'Upload', percent: 10 });

    try {
      const uploadResult = await uploadApi.upload(files, {
        onProgress: (progress) => {
          setUploadProgress({ stage: 'Upload', percent: Math.min(progress, 25) });
        }
      });

      if (!uploadResult?.files?.[0]) {
        setUploadProgress({ stage: 'Upload', percent: 0 });
        setAnalysisState(ANALYSIS_STAGES.ERROR);
        showToast('Upload completed without a file to analyze', 'error');
        return;
      }

      setUploadProgress({ stage: 'Extract', percent: 30 });
      const filePath = uploadResult.files[0].path;
      await new Promise(r => setTimeout(r, 800));
      setUploadProgress({ stage: 'Extract', percent: 50 });

      const extractResult = await api.upload.extract({ filePath });
      setUploadProgress({ stage: 'Analyze', percent: 60 });

      await new Promise(r => setTimeout(r, 1000));
      setUploadProgress({ stage: 'Analyze', percent: 75 });

      const estimateResult = await api.estimates.calculate({
        fixtures: extractResult.fixtures || [],
        blueprint: extractResult.blueprint
      });

      setUploadProgress({ stage: 'Estimate', percent: 90 });
      await new Promise(r => setTimeout(r, 500));
      setUploadProgress({ stage: 'Complete', percent: 100 });

      setAnalysisResults({
        fixtures: extractResult.fixtures || [],
        blueprint: extractResult.blueprint,
        estimate: estimateResult
      });

      setAnalysisState(ANALYSIS_STAGES.COMPLETE);
      showToast('Blueprint analysis complete', 'success');
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisState(ANALYSIS_STAGES.ERROR);
      showToast(err.message || 'Analysis failed', 'error');
    }
  }, [showToast]);

  const handleCreateJobFromAnalysis = useCallback(async () => {
    if (!analysisResults) return;

    try {
      await createJobMutation.mutateAsync({
        name: `Blueprint Project ${new Date().toLocaleDateString()}`,
        builder: 'Auto-detected',
        phase: 'rough-in',
        status: 'active',
        notes: `Auto-generated from blueprint analysis. ${analysisResults.fixtures?.length || 0} fixtures detected.`,
        estimate: analysisResults.estimate,
        fixtures: analysisResults.fixtures
      });

      setAnalysisState(ANALYSIS_STAGES.IDLE);
      setAnalysisResults(null);
      setUploadProgress({ stage: 'Upload', percent: 0 });
      setActiveTab('projects');
    } catch (err) {
      showToast('Failed to create job', 'error');
    }
  }, [analysisResults, createJobMutation, showToast]);

  const handleExportAnalysis = useCallback(() => {
    if (!analysisResults) return;

    const dataStr = JSON.stringify(analysisResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blueprint-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Analysis exported', 'success');
  }, [analysisResults, showToast]);

  const resetAnalysis = useCallback(() => {
    setAnalysisState(ANALYSIS_STAGES.IDLE);
    setAnalysisResults(null);
    setUploadProgress({ stage: 'Upload', percent: 0 });
  }, []);

  // Stable callbacks for memoized child lists
  const activeUtility = useMemo(
    () => JOB_UTILITY_TOOLS.find((tool) => tool.id === activeUtilityTool) || null,
    [activeUtilityTool]
  );

  const handleSelectJob = useCallback((job) => {
    setActiveUtilityTool(null);
    setSelectedJobId(job.id);
  }, []);
  const handleSelectJobMobile = useCallback((job) => {
    setActiveUtilityTool(null);
    setSelectedJobId(job.id);
    setShowMobileSidebar(true);
  }, []);
  const handleDeleteJobRequest = useCallback((job) => setJobToDelete(job), []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col page-transition-wrapper">
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PulseLoader size="lg" className="mb-4" />
            <p className="text-sm text-[#94A3B8]">Loading your projects...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full flex flex-col page-transition-wrapper">
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            className="max-w-md w-full text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AnimatedCard className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                </div>
              </motion.div>
              <h2 className="text-lg font-semibold mb-2 text-[#F8FAFC]">
                Failed to load jobs
              </h2>
              <p className="text-sm mb-6 text-[#94A3B8]">
                {error?.message || 'Unable to fetch job data. Please try again.'}
              </p>
              <Button
                variant="primary"
                leftIcon={RefreshCw}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AnimatedCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ptr.ref} className="h-full flex flex-col page-transition-wrapper momentum-scroll">
      <PullToRefresh {...ptr} />
      {activeTab === 'projects' && (
        <motion.div
          className="flex justify-end px-4 sm:px-6 py-4 border-b border-[#1F2430] bg-[#0A0B0D]/80 backdrop-blur-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setShowNewJobModal(true)}
            showRipple
          >
            <span className="hidden sm:inline">New Job</span>
            <span className="sm:hidden">New</span>
          </Button>
        </motion.div>
      )}

      {/* Desktop Tabs */}
      {!isMobile && (
        <TabSystem
          defaultTab={activeTab}
          activeTab={activeTab}
          variant="default"
          className="border-b border-[#1F2430]"
          onTabChange={setActiveTab}
        >
          <Tab id="blueprints" label="Blueprints" icon={FileText}>
            <BlueprintsTab 
              analysisState={analysisState}
              analysisResults={analysisResults}
              uploadProgress={uploadProgress}
              onUpload={handleBlueprintUpload}
              onReset={resetAnalysis}
              onCreateJob={handleCreateJobFromAnalysis}
              onExport={handleExportAnalysis}
            />
          </Tab>

          <Tab id="projects" label="Projects" icon={LayoutDashboard}>
            <ProjectsTab
              jobs={jobs}
              isLoading={isLoading}
              selectedJobId={selectedJobId}
              activeUtilityTool={activeUtility}
              onSelectJob={handleSelectJob}
              onDeleteJob={handleDeleteJobRequest}
              stats={stats}
              onCreateJob={() => setShowNewJobModal(true)}
              onOpenBlueprints={() => setActiveTab('blueprints')}
              utilityTools={JOB_UTILITY_TOOLS}
              utilityPanelTitle={JOB_UTILITY_PANEL.title}
              onOpenUtilityTool={openUtilityTool}
              onCloseUtilityTool={closeUtilityTool}
            />
          </Tab>

          <Tab id="estimating" label="Estimating" icon={Calculator}>
            <div className="p-4 sm:p-6">
              <EstimatingTab />
            </div>
          </Tab>

          <Tab id="leads" label="Leads" icon={Users}>
            <LeadFinder />
          </Tab>
        </TabSystem>
      )}

      {/* Mobile Content with Bottom Bar */}
      {isMobile && (
        <>
          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'blueprints' && (
                <motion.div 
                  key="blueprints"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4"
                >
                  <BlueprintsTab 
                    analysisState={analysisState}
                    analysisResults={analysisResults}
                    uploadProgress={uploadProgress}
                    onUpload={handleBlueprintUpload}
                    onReset={resetAnalysis}
                    onCreateJob={handleCreateJobFromAnalysis}
                    onExport={handleExportAnalysis}
                    isMobile
                  />
                </motion.div>
              )}
              
              {activeTab === 'projects' && (
                <motion.div 
                  key="projects"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <MobileProjectsTab
                    jobs={jobs}
                    isLoading={isLoading}
                    selectedJobId={selectedJobId}
                    activeUtilityTool={activeUtility}
                    onSelectJob={handleSelectJobMobile}
                    onDeleteJob={handleDeleteJobRequest}
                    stats={stats}
                    selectedJob={jobs.find(j => j.id === selectedJobId)}
                    onCloseSidebar={() => {
                      setShowMobileSidebar(false);
                      setSelectedJobId(null);
                    }}
                    showSidebar={showMobileSidebar}
                    onCreateJob={() => setShowNewJobModal(true)}
                    onOpenBlueprints={() => setActiveTab('blueprints')}
                    utilityTools={JOB_UTILITY_TOOLS}
                    utilityPanelTitle={JOB_UTILITY_PANEL.title}
                    onOpenUtilityTool={openUtilityTool}
                    onCloseUtilityTool={closeUtilityTool}
                  />
                </motion.div>
              )}
              
              {activeTab === 'estimating' && (
                <motion.div 
                  key="estimating"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4"
                >
                  <EstimatingTab />
                </motion.div>
              )}
              
              {activeTab === 'leads' && (
                <motion.div 
                  key="leads"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <LeadFinder />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileTabBar
            tabs={JOB_PRIMARY_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="default"
            showLabels={true}
            showCenterAction
          />
        </>
      )}

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
        onSubmit={(e) => {
          e.preventDefault();
          if (!newJobData.name.trim()) return;
          createJobMutation.mutate({
            name: newJobData.name,
            builder: newJobData.builder || 'Unknown Builder',
            phase: newJobData.phase,
            status: newJobData.status,
            notes: newJobData.notes,
          }, {
            onSuccess: () => {
              setShowNewJobModal(false);
              setNewJobData(EMPTY_JOB);
            }
          });
        }}
        isPending={createJobMutation.isPending}
        error={createJobMutation.isError ? createJobMutation.error : null}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   BLUEPRINTS TAB COMPONENT
───────────────────────────────────────────── */
function BlueprintsTab({ 
  analysisState, 
  analysisResults, 
  uploadProgress, 
  onUpload, 
  onReset, 
  onCreateJob, 
  onExport,
  isMobile 
}) {
  return (
    <div className={isMobile ? "" : "max-w-4xl mx-auto p-6"}>
      <AnimatePresence mode="wait">
        {analysisState === ANALYSIS_STAGES.IDLE && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <HeroUpload
              onUpload={onUpload}
              isProcessing={false}
              uploadProgress={uploadProgress}
            />
          </motion.div>
        )}

        {(analysisState === ANALYSIS_STAGES.UPLOADING ||
          analysisState === ANALYSIS_STAGES.EXTRACTING ||
          analysisState === ANALYSIS_STAGES.ANALYZING ||
          analysisState === ANALYSIS_STAGES.ESTIMATING) && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HeroUpload
              onUpload={() => {}}
              isProcessing={true}
              uploadProgress={uploadProgress}
            />
          </motion.div>
        )}

        {analysisState === ANALYSIS_STAGES.COMPLETE && analysisResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Analysis Results</h2>
              <button
                onClick={onReset}
                className="text-sm text-[#94A3B8] hover:text-white transition-colors"
              >
                Analyze Another
              </button>
            </div>
            <AnalysisResults
              results={analysisResults}
              onCreateJob={onCreateJob}
              onExport={onExport}
            />
          </motion.div>
        )}

        {analysisState === ANALYSIS_STAGES.ERROR && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto"
          >
            <AnimatedCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-[#EF4444]" />
                </div>
              </motion.div>
              <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Analysis Failed</h3>
              <p className="text-sm text-[#94A3B8] mb-6">Something went wrong during analysis. Please try uploading your blueprint again.</p>
              <Button
                variant="primary"
                onClick={onReset}
                showRipple
              >
                Try Again
              </Button>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DESKTOP PROJECTS TAB
───────────────────────────────────────────── */
function ProjectsTab({
  jobs,
  isLoading,
  selectedJobId,
  activeUtilityTool,
  onSelectJob,
  onDeleteJob,
  stats,
  onCreateJob,
  onOpenBlueprints,
  utilityTools,
  utilityPanelTitle,
  onOpenUtilityTool,
  onCloseUtilityTool,
}) {
  return (
    <div className="h-full flex">
      {/* Project list sidebar */}
      <div className="w-80 border-r border-[#1F2430] overflow-hidden bg-[#0D0F12] flex-shrink-0">
        <div className="p-4 border-b border-[#1F2430]">
          <h3 className="font-semibold text-[#F8FAFC]">All Projects</h3>
          <p className="text-xs text-[#64748B] mt-1">{jobs.length} projects</p>
        </div>
        <ProjectList
          jobs={jobs}
          onSelectJob={onSelectJob}
          selectedJobId={selectedJobId}
          onDeleteJob={onDeleteJob}
          isLoading={isLoading}
          onCreateJob={onCreateJob}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto p-6 bg-[#0A0B0D]">
        <AnimatePresence mode="wait">
          {selectedJobId ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#111318] border border-[#1F2430] flex items-center justify-center">
                <HardHat className="w-10 h-10 text-[#3B82F6]" />
              </div>
              <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">
                {jobs.find(j => j.id === selectedJobId)?.name}
              </h3>
              <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
                Full project details view is coming soon. For now, you can see the project in the sidebar.
              </p>
            </motion.div>
          ) : activeUtilityTool ? (
            <motion.div
              key={activeUtilityTool.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <UtilityWorkspace
                tool={activeUtilityTool}
                onBack={onCloseUtilityTool}
              />
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="max-w-5xl mx-auto">
                <OverviewDashboard
                  jobs={jobs}
                  stats={stats}
                  onSelectJob={onSelectJob}
                  onDeleteJob={onDeleteJob}
                  onCreateJob={onCreateJob}
                  onOpenBlueprints={onOpenBlueprints}
                  utilityTools={utilityTools}
                  utilityPanelTitle={utilityPanelTitle}
                  onOpenUtilityTool={onOpenUtilityTool}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE PROJECTS TAB
───────────────────────────────────────────── */
function MobileProjectsTab({ 
  jobs, 
  isLoading, 
  selectedJobId, 
  activeUtilityTool,
  onSelectJob, 
  onDeleteJob, 
  stats,
  selectedJob,
  onCloseSidebar,
  showSidebar,
  onCreateJob,
  onOpenBlueprints,
  utilityTools,
  utilityPanelTitle,
  onOpenUtilityTool,
  onCloseUtilityTool,
}) {
  return (
    <div className="h-full relative">
      {/* Project List */}
      <div className={`${showSidebar ? 'hidden' : 'block'}`}>
        <div className="p-4 border-b border-[#1F2430] bg-[#0D0F12]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#F8FAFC]">All Projects</h3>
              <p className="text-xs text-[#64748B] mt-1">{jobs.length} projects</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>{stats.active}</span>
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] ml-2" />
              <span>{stats.pending}</span>
            </div>
          </div>
        </div>
        {activeUtilityTool ? (
          <div className="p-4 bg-[#0A0B0D]">
            <UtilityWorkspace
              tool={activeUtilityTool}
              onBack={onCloseUtilityTool}
            />
          </div>
        ) : jobs.length === 0 ? (
          <OverviewDashboard
            jobs={jobs}
            stats={stats}
            onSelectJob={onSelectJob}
            onDeleteJob={onDeleteJob}
            onCreateJob={onCreateJob}
            onOpenBlueprints={onOpenBlueprints}
            utilityTools={utilityTools}
            utilityPanelTitle={utilityPanelTitle}
            onOpenUtilityTool={onOpenUtilityTool}
          />
        ) : (
          <>
            {utilityTools?.length > 0 && (
              <div className="px-4 py-3 border-b border-[#1F2430] bg-[#0A0B0D]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#F8FAFC]">{utilityPanelTitle}</p>
                    <p className="text-xs text-[#64748B]">Open lower-frequency utilities without leaving Projects.</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {utilityTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => onOpenUtilityTool(tool.id)}
                        className="px-3 py-2 rounded-lg border border-[#1F2430] text-xs text-[#CBD5E1] hover:text-white hover:border-[#334155] hover:bg-[#111318] transition-colors"
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <MobileProjectList
              jobs={jobs}
              onSelectJob={onSelectJob}
              selectedJobId={selectedJobId}
              onDeleteJob={onDeleteJob}
              isLoading={isLoading}
              onCreateJob={onCreateJob}
              onClose={() => {}}
            />
          </>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && selectedJob && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40"
              onClick={onCloseSidebar}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 right-0 w-full max-w-sm bg-[#0D0F12] border-l border-[#1F2430] z-50"
            >
              <div className="p-4 border-b border-[#1F2430] flex items-center gap-3">
                <button
                  onClick={onCloseSidebar}
                  className="p-2 -ml-2 text-[#94A3B8] hover:text-white hover:bg-[#1F2430] rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-[#F8FAFC] truncate">{selectedJob.name}</h3>
              </div>
              <div className="p-6">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#111318] border border-[#1F2430] flex items-center justify-center">
                  <HardHat className="w-10 h-10 text-[#3B82F6]" />
                </div>
                <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2 text-center">
                  {selectedJob.name}
                </h3>
                <p className="text-sm text-[#94A3B8] text-center mb-6">
                  Full project details view is coming soon.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b border-[#1F2430]">
                    <span className="text-[#94A3B8]">Builder</span>
                    <span className="text-[#F8FAFC]">{selectedJob.builder || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#1F2430]">
                    <span className="text-[#94A3B8]">Phase</span>
                    <span className="text-[#F8FAFC] capitalize">{selectedJob.phase || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[#1F2430]">
                    <span className="text-[#94A3B8]">Status</span>
                    <span className="text-[#F8FAFC] capitalize">{selectedJob.status || 'N/A'}</span>
                  </div>
                  {selectedJob.estimate && (
                    <div className="flex justify-between py-3 border-b border-[#1F2430]">
                      <span className="text-[#94A3B8]">Estimate</span>
                      <span className="text-[#10B981]">${selectedJob.estimate.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
