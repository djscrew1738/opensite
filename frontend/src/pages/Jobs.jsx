import { useState, useMemo, useCallback, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Calculator, Box, Calendar,
  HardHat, Plus, Clock, DollarSign,
  AlertCircle, Users, RefreshCw, Trash2,
  FileText, Sparkles, CheckCircle, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { uploadApi } from '../api/upload';
import { TabSystem, Tab } from '../components/tabs';
import { PlumbingVisualizer } from '../plumbing-visualizer/PlumbingVisualizer';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import LeadFinder from './LeadFinder';
import { AccessibleCard } from '../components/ui';
import { HeroUpload } from '../components/upload';
import { useToast } from '../hooks/useToast';

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
   PROJECT LIST (sidebar/card view)
───────────────────────────────────────────── */
const ProjectList = memo(function ProjectList({ jobs, onSelectJob, selectedJobId, onDeleteJob }) {
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  if (safeJobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1F2430] flex items-center justify-center">
          <FileText className="w-8 h-8 text-[#64748B]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Projects Yet</h3>
        <p className="text-sm text-[#94A3B8] max-w-xs mx-auto">
          Upload a blueprint in the Blueprints tab to automatically create your first project
        </p>
      </div>
    );
  }

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
                  ? 'border-blue-500 bg-blue-500/10'
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
   ANALYSIS RESULTS DISPLAY
───────────────────────────────────────────── */
function AnalysisResults({ results, onCreateJob, onExport }) {
  const { fixtures, estimate, blueprint } = results;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Success header */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Analysis Complete</h3>
            <p className="text-[#94A3B8]">
              Successfully extracted {fixtures?.length || 0} fixtures and generated estimate
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Fixtures', value: fixtures?.length || 0, icon: Box, color: 'blue' },
          { label: 'Square Feet', value: blueprint?.sqft || 'N/A', icon: LayoutDashboard, color: 'purple' },
          { label: 'Est. Cost', value: `$${estimate?.total?.toLocaleString() || 0}`, icon: DollarSign, color: 'green' },
          { label: 'Rooms', value: blueprint?.rooms?.length || 0, icon: HardHat, color: 'amber' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#111318] rounded-xl p-4 border border-[#1F2430]"
          >
            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-[#64748B]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Fixtures grid */}
      {fixtures && fixtures.length > 0 && (
        <div className="bg-[#111318] rounded-2xl border border-[#1F2430] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1F2430]">
            <h4 className="font-semibold text-white">Detected Fixtures</h4>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {fixtures.map((fixture, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0A0B0D] rounded-xl p-3 border border-[#1F2430] flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Box className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{fixture.type}</p>
                  <p className="text-xs text-[#64748B]">{fixture.count}x</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCreateJob}
          className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
        >
          <Sparkles className="w-5 h-5" />
          Create Job from Analysis
        </button>
        <button
          onClick={onExport}
          className="px-6 py-4 bg-[#1F2430] hover:bg-[#2D3548] rounded-xl font-medium text-white flex items-center gap-2 border border-[#2D3548] transition-all"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
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

/* ─────────────────────────────────────────────
   MAIN JOBS PAGE
───────────────────────────────────────────── */
export default function Jobs() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('blueprints');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobData, setNewJobData] = useState(EMPTY_JOB);

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
      // Upload files
      const uploadResult = await uploadApi.upload(files, {
        onProgress: (progress) => {
          setUploadProgress({ stage: 'Upload', percent: Math.min(progress, 25) });
        }
      });

      setUploadProgress({ stage: 'Extract', percent: 30 });

      // Extract data from first file
      if (uploadResult?.files?.[0]) {
        const filePath = uploadResult.files[0].path;

        // Simulate extraction progress
        await new Promise(r => setTimeout(r, 800));
        setUploadProgress({ stage: 'Extract', percent: 50 });

        // Call extraction API
        const extractResult = await api.upload.extract({ filePath });

        setUploadProgress({ stage: 'Analyze', percent: 60 });

        // Simulate analysis progress
        await new Promise(r => setTimeout(r, 1000));
        setUploadProgress({ stage: 'Analyze', percent: 75 });

        // Call analysis/estimation
        const estimateResult = await api.estimates.calculate({
          fixtures: extractResult.fixtures || [],
          blueprint: extractResult.blueprint
        });

        setUploadProgress({ stage: 'Estimate', percent: 90 });

        // Complete
        await new Promise(r => setTimeout(r, 500));
        setUploadProgress({ stage: 'Complete', percent: 100 });

        setAnalysisResults({
          fixtures: extractResult.fixtures || [],
          blueprint: extractResult.blueprint,
          estimate: estimateResult
        });

        setAnalysisState(ANALYSIS_STAGES.COMPLETE);
        showToast('Blueprint analysis complete', 'success');
      }
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

      // Reset analysis state
      setAnalysisState(ANALYSIS_STAGES.IDLE);
      setAnalysisResults(null);
      setUploadProgress({ stage: 'Upload', percent: 0 });

      // Switch to projects tab
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

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col page-transition-wrapper">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-[#1F2430]">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Jobs</h1>
            <p className="text-sm mt-0.5 text-[#94A3B8]">
              Upload blueprints and manage projects
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 animate-spin border-3 border-blue-500/10 border-t-blue-500" />
            <p className="text-sm text-[#94A3B8]">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full flex flex-col page-transition-wrapper">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-[#1F2430]">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Jobs</h1>
            <p className="text-sm mt-0.5 text-[#94A3B8]">
              Upload blueprints and manage projects
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-xl text-center bg-[#111318] border border-[#1F2430]">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold mb-2 text-[#F1F5F9]">
              Failed to load jobs
            </h2>
            <p className="text-sm mb-4 text-[#94A3B8]">
              {error?.message || 'Unable to fetch job data. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium mx-auto transition-all bg-blue-500 text-white hover:bg-blue-600"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-[#1F2430]">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Jobs</h1>
          <p className="text-sm mt-0.5 text-[#94A3B8]">
            Upload blueprints and manage projects
          </p>
        </div>
        {activeTab === 'projects' && (
          <button
            onClick={() => setShowNewJobModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 bg-blue-500 text-white shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            New Job
          </button>
        )}
      </div>

      {/* Tabs */}
      <TabSystem
        defaultTab="blueprints"
        variant="default"
        className="border-b border-[#1F2430]"
        onChange={setActiveTab}
      >
        <Tab id="blueprints" label="Blueprints" icon={FileText}>
          <div className="max-w-4xl mx-auto p-6">
            <AnimatePresence mode="wait">
              {analysisState === ANALYSIS_STAGES.IDLE && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <HeroUpload
                    onUpload={handleBlueprintUpload}
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
                    <h2 className="text-xl font-bold text-white">Analysis Results</h2>
                    <button
                      onClick={resetAnalysis}
                      className="text-sm text-[#94A3B8] hover:text-white transition-colors"
                    >
                      Analyze Another
                    </button>
                  </div>
                  <AnalysisResults
                    results={analysisResults}
                    onCreateJob={handleCreateJobFromAnalysis}
                    onExport={handleExportAnalysis}
                  />
                </motion.div>
              )}

              {analysisState === ANALYSIS_STAGES.ERROR && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Analysis Failed</h3>
                  <p className="text-sm text-[#94A3B8] mb-4">Something went wrong during analysis</p>
                  <button
                    onClick={resetAnalysis}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-all"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tab>

        <Tab id="projects" label="Projects" icon={LayoutDashboard}>
          <div className="h-full flex">
            {/* Project list sidebar */}
            <div className="w-80 border-r border-[#1F2430] overflow-hidden">
              <div className="p-4 border-b border-[#1F2430]">
                <h3 className="font-semibold text-white">All Projects</h3>
                <p className="text-xs text-[#64748B] mt-1">{jobs.length} projects</p>
              </div>
              <ProjectList
                jobs={jobs}
                onSelectJob={(job) => setSelectedJobId(job.id)}
                selectedJobId={selectedJobId}
                onDeleteJob={(job) => setJobToDelete(job)}
              />
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-auto p-6">
              {selectedJobId ? (
                <div className="text-center py-12 text-[#64748B]">
                  <p>Project details view (to be implemented)</p>
                  <p className="text-sm mt-2">Selected: {jobs.find(j => j.id === selectedJobId)?.name}</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1F2430] flex items-center justify-center">
                    <LayoutDashboard className="w-8 h-8 text-[#64748B]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Select a Project</h3>
                  <p className="text-sm text-[#94A3B8]">
                    Choose a project from the sidebar to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </Tab>

        <Tab id="estimating" label="Estimating" icon={Calculator}>
          <div className="p-6">
            <EstimatingTab />
          </div>
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
