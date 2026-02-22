import { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { useModelPreference } from '../hooks/useModelPreference';

import PlansCommandHeader from '../components/plans/PlansCommandHeader';
import FixtureGrid from '../components/plans/FixtureGrid';
import PricingDashboard from '../components/plans/PricingDashboard';
import ProjectInfoPanel from '../components/plans/ProjectInfoPanel';
import BlueprintUpload from '../components/pricing/BlueprintUpload';
import AIAnalysisSection from '../components/plans/AIAnalysisSection';
import TakeoffPanel from '../components/plans/TakeoffPanel';
import PlansActionBar from '../components/plans/PlansActionBar';
import { FIXTURE_PRICE, DEFAULT_FIXTURES, DEFAULT_PROJECT_INFO, QUALIFYING_FIXTURES } from '../components/plans/constants';

export default function Plans() {
  // --- State ---
  const [fixtures, setFixtures] = useState({ ...DEFAULT_FIXTURES });
  const [projectInfo, setProjectInfo] = useState({ ...DEFAULT_PROJECT_INFO });
  const [estimate, setEstimate] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(false);
  const [takeoffExpanded, setTakeoffExpanded] = useState(false);

  // Model selector
  const { defaultModel } = useModelPreference();
  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;

  // --- Form Persistence ---
  const persistedData = useMemo(() => ({ fixtures, projectInfo }), [fixtures, projectInfo]);
  const setPersisted = useCallback((data) => {
    if (data.fixtures) setFixtures(prev => ({ ...prev, ...data.fixtures }));
    if (data.projectInfo) setProjectInfo(prev => ({ ...prev, ...data.projectInfo }));
  }, []);

  const { clearSaved } = useFormPersistence('plans-v3', persistedData, setPersisted, {
    shouldSave: (data) => {
      const f = data.fixtures || {};
      return Object.values(f).some(v => v > 0);
    },
  });

  // --- Derived ---
  const totalFixtures = useMemo(() => {
    return QUALIFYING_FIXTURES.reduce((sum, f) => sum + (fixtures[f.key] || 0), 0);
  }, [fixtures]);

  const totalPrice = useMemo(() => totalFixtures * FIXTURE_PRICE, [totalFixtures]);

  const phaseBreakdown = useMemo(() => ({
    roughIn: Math.round(totalPrice * 0.5),
    topOut: Math.round(totalPrice * 0.3),
    trim: Math.round(totalPrice * 0.2),
  }), [totalPrice]);

  // --- Mutations ---
  const calculateMutation = useMutation({
    mutationFn: (data) => api.estimates.calculate(data),
    onSuccess: (data) => {
      setEstimate(data);
      setAnalysis(null);
      clearSaved();
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (data) => api.estimates.analyze(data),
    onSuccess: (data) => {
      setEstimate(data);
      setAnalysis(data.analysis);
      clearSaved();
    },
  });

  // --- Handlers ---
  const buildPayload = useCallback(() => ({
    mode: 'fixture-based',
    fixtures,
    ...projectInfo,
    sqft: Number(projectInfo.sqft) || 0,
    units: Number(projectInfo.units) || 0,
    bathrooms: Number(projectInfo.bathrooms) || 0,
    stories: Number(projectInfo.stories) || 1,
  }), [fixtures, projectInfo]);

  const handleSave = () => {
    calculateMutation.mutate(buildPayload());
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate({ ...buildPayload(), model: effectiveModel });
  };

  const handleReset = () => {
    setFixtures({ ...DEFAULT_FIXTURES });
    setEstimate(null);
    setAnalysis(null);
    setExtractedData(null);
    clearSaved();
  };

  const handleExport = () => {
    // Build CSV
    const rows = [
      ['Fixture', 'Count', 'Price Per', 'Subtotal'],
      ...QUALIFYING_FIXTURES.map(f => [
        f.label,
        fixtures[f.key] || 0,
        `$${FIXTURE_PRICE}`,
        `$${((fixtures[f.key] || 0) * FIXTURE_PRICE).toLocaleString()}`,
      ]),
      [],
      ['Total Fixtures', totalFixtures, '', `$${totalPrice.toLocaleString()}`],
      [],
      ['Phase', 'Amount'],
      ['Rough-in (50%)', `$${phaseBreakdown.roughIn.toLocaleString()}`],
      ['Top-out (30%)', `$${phaseBreakdown.topOut.toLocaleString()}`],
      ['Trim (20%)', `$${phaseBreakdown.trim.toLocaleString()}`],
    ];

    if (projectInfo.projectName) {
      rows.unshift(['Project', projectInfo.projectName], []);
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectInfo.projectName || 'plans'}-estimate.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBlueprintAnalysis = (result) => {
    clearSaved();

    if (result.extractedData) {
      const ext = result.extractedData;
      setExtractedData(ext);

      // Auto-fill fixtures from extracted data
      const newFixtures = { ...fixtures };
      for (const f of QUALIFYING_FIXTURES) {
        if (ext[f.key] != null && ext[f.key] > 0) {
          newFixtures[f.key] = Number(ext[f.key]);
        }
      }
      setFixtures(newFixtures);

      // Auto-fill project info
      setProjectInfo(prev => ({
        ...prev,
        sqft: ext.sqft || prev.sqft,
        units: ext.units || prev.units,
        bathrooms: ext.bathrooms || prev.bathrooms,
        stories: ext.stories || prev.stories,
      }));
    }

    if (result.estimate) setEstimate(result.estimate);
    if (result.aiAnalysis) setAnalysis(result.aiAnalysis);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Command Header */}
        <PlansCommandHeader
          totalFixtures={totalFixtures}
          totalPrice={totalPrice}
          phaseBreakdown={phaseBreakdown}
          projectName={projectInfo.projectName}
          onProjectNameChange={(name) => setProjectInfo(prev => ({ ...prev, projectName: name }))}
        />

        {/* Fixture Grid */}
        <section>
          <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
            Fixture Counts
          </h2>
          <FixtureGrid fixtures={fixtures} onChange={setFixtures} />
        </section>

        {/* Dashboard Charts */}
        <PricingDashboard fixtures={fixtures} totalPrice={totalPrice} />

        {/* Project Info (collapsible) */}
        <ProjectInfoPanel
          expanded={projectInfoExpanded}
          onToggle={() => setProjectInfoExpanded(v => !v)}
          projectInfo={projectInfo}
          onChange={setProjectInfo}
        />

        {/* Blueprint Upload */}
        <BlueprintUpload
          onAnalysisComplete={handleBlueprintAnalysis}
          selectedModel={effectiveModel}
        />

        {/* AI Analysis (shows after analysis completes) */}
        <AIAnalysisSection analysis={analysis} extractedData={extractedData} />

        {/* Material Takeoff (collapsible) */}
        <TakeoffPanel
          expanded={takeoffExpanded}
          onToggle={() => setTakeoffExpanded(v => !v)}
        />

        {/* Action Bar */}
        <PlansActionBar
          onSave={handleSave}
          onAnalyze={handleAnalyze}
          onExport={handleExport}
          onReset={handleReset}
          isSaving={calculateMutation.isPending}
          isAnalyzing={analyzeMutation.isPending}
          totalFixtures={totalFixtures}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        {/* Save success feedback */}
        {calculateMutation.isSuccess && !calculateMutation.isError && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-green-500 dark:text-green-400 text-lg leading-none">&#10003;</span>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 flex-1">
              Estimate saved successfully
              {estimate?.estimateId && (
                <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                  ID: {estimate.estimateId}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Mutation error feedback */}
        {(calculateMutation.isError || analyzeMutation.isError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-red-500 dark:text-red-400 text-lg leading-none mt-0.5">&#9888;</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {calculateMutation.isError ? 'Save failed' : 'Analysis failed'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {(calculateMutation.error || analyzeMutation.error)?.message || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                calculateMutation.reset();
                analyzeMutation.reset();
              }}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-lg leading-none flex-shrink-0"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}

        {/* Estimate result display */}
        {estimate && (
          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider mb-3">
              Saved Estimate
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">Total</p>
                <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
                  ${(estimate.total || totalPrice).toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">Rough-in</p>
                <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
                  ${(estimate.breakdown?.roughIn?.amount || phaseBreakdown.roughIn).toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">Top-out</p>
                <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
                  ${(estimate.breakdown?.topOut?.amount || phaseBreakdown.topOut).toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">Trim</p>
                <p className="text-xl font-bold text-surface-900 dark:text-surface-100">
                  ${(estimate.breakdown?.trim?.amount || phaseBreakdown.trim).toLocaleString()}
                </p>
              </div>
            </div>
            {estimate.estimateId && (
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-3 text-right">
                Estimate ID: {estimate.estimateId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
