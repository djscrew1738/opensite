import { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { useModelPreference } from '../hooks/useModelPreference';
import { LayoutDashboard, Calculator, Settings } from 'lucide-react';

import PlansHome from '../components/plans/PlansHome';
import PlansCommandHeader from '../components/plans/PlansCommandHeader';
import FixtureGrid from '../components/plans/FixtureGrid';
import PricingDashboard from '../components/plans/PricingDashboard';
import ProjectInfoPanel from '../components/plans/ProjectInfoPanel';
import BlueprintUpload from '../components/pricing/BlueprintUpload';
import AIAnalysisSection from '../components/plans/AIAnalysisSection';
import TakeoffPanel from '../components/plans/TakeoffPanel';
import PlansActionBar from '../components/plans/PlansActionBar';
import { FIXTURE_PRICE, DEFAULT_FIXTURES, DEFAULT_PROJECT_INFO, QUALIFYING_FIXTURES } from '../components/plans/constants';

const tabs = [
  { key: 'home', label: 'Overview', icon: LayoutDashboard },
  { key: 'estimate', label: 'Estimate', icon: Calculator },
];

export default function Plans() {
  // --- State ---
  const [activeTab, setActiveTab] = useState('home');
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
    setActiveTab('estimate');

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

  const handleNewEstimate = () => {
    setFixtures({ ...DEFAULT_FIXTURES });
    setProjectInfo({ ...DEFAULT_PROJECT_INFO });
    setEstimate(null);
    setAnalysis(null);
    setExtractedData(null);
    setActiveTab('estimate');
  };

  const handleQuickAddFixture = (defaults) => {
    setFixtures(prev => ({ ...prev, ...defaults }));
    setActiveTab('estimate');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-surface-200 dark:border-surface-700">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-sm transition-all relative ${
                  activeTab === tab.key
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <PlansHome
            fixtures={fixtures}
            projectInfo={projectInfo}
            estimate={estimate}
            onNewEstimate={handleNewEstimate}
            onLoadEstimate={(est) => {
              // Would load from API
              setActiveTab('estimate');
            }}
            onContinueEditing={() => setActiveTab('estimate')}
            onQuickAddFixture={handleQuickAddFixture}
          />
        )}

        {/* Estimate Tab */}
        {activeTab === 'estimate' && (
          <>
            {/* Command Header */}
            <PlansCommandHeader
              totalFixtures={totalFixtures}
              totalPrice={totalPrice}
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
          isSaving={calculateMutation.isPending}
          isAnalyzing={analyzeMutation.isPending}
          totalFixtures={totalFixtures}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

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
          </>
        )}
      </div>
    </div>
  );
}
