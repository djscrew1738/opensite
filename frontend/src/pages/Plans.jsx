import { 
  useState, 
  useMemo, 
  useCallback, 
  useRef, 
  useEffect,
  memo
} from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  useFormPersistence, 
  useModelPreference, 
  useToast 
} from '../hooks';
import { LayoutDashboard, Calculator, Save, AlertCircle } from 'lucide-react';

import PlansHome from '../components/plans/PlansHome';
import PlansCommandHeader from '../components/plans/PlansCommandHeader';
import FixtureGrid from '../components/plans/FixtureGrid';
import PricingDashboard from '../components/plans/PricingDashboard';
import ProjectInfoPanel from '../components/plans/ProjectInfoPanel';
import { BlueprintUpload } from '../components/upload';
import AIAnalysisSection from '../components/plans/AIAnalysisSection';
import TakeoffPanel from '../components/plans/TakeoffPanel';
import PlansActionBar from '../components/plans/PlansActionBar';
import { PageHeader, TabNavigation, StatCard } from '../components/shared';
import { 
  FIXTURE_PRICE, 
  DEFAULT_FIXTURES, 
  DEFAULT_PROJECT_INFO, 
  QUALIFYING_FIXTURES 
} from '../components/plans/constants';

const tabs = [
  { key: 'home', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard },
  { key: 'estimate', label: 'Estimate', shortLabel: 'Estimate', icon: Calculator },
];

// Tab order for animations - frozen object to prevent accidental mutations
const TAB_ORDER = Object.freeze({ home: 0, estimate: 1 });

// Memoized child components to prevent unnecessary re-renders
const MemoizedStatCard = memo(StatCard);
const MemoizedPlansHome = memo(PlansHome);
const MemoizedPlansCommandHeader = memo(PlansCommandHeader);
const MemoizedFixtureGrid = memo(FixtureGrid);
const MemoizedPricingDashboard = memo(PricingDashboard);
const MemoizedProjectInfoPanel = memo(ProjectInfoPanel);
const MemoizedBlueprintUpload = memo(BlueprintUpload);
const MemoizedAIAnalysisSection = memo(AIAnalysisSection);
const MemoizedTakeoffPanel = memo(TakeoffPanel);
const MemoizedPlansActionBar = memo(PlansActionBar);

export default function Plans() {
  // --- State ---
  const [activeTab, setActiveTab] = useState('home');
  const [tabDirection, setTabDirection] = useState(null);
  const prevTab = useRef('home');
  
  const [fixtures, setFixtures] = useState(() => ({ ...DEFAULT_FIXTURES }));
  const [projectInfo, setProjectInfo] = useState(() => ({ ...DEFAULT_PROJECT_INFO }));
  const [estimate, setEstimate] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(false);
  const [takeoffExpanded, setTakeoffExpanded] = useState(false);

  // --- Computed Values (memoized) ---
  const totalFixtures = useMemo(() => 
    QUALIFYING_FIXTURES.reduce((sum, f) => sum + (fixtures[f.key] || 0), 0),
    [fixtures]
  );

  const { defaultModel } = useModelPreference();
  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;

  // --- Form Persistence ---
  const persistedData = useMemo(() => ({ fixtures, projectInfo }), [fixtures, projectInfo]);
  
  const setPersisted = useCallback((data) => {
    if (data.fixtures) setFixtures(prev => ({ ...prev, ...data.fixtures }));
    if (data.projectInfo) setProjectInfo(prev => ({ ...prev, ...data.projectInfo }));
  }, []);

  const { clearSaved, hasRestored } = useFormPersistence('plans-v3', persistedData, setPersisted, {
    shouldSave: useCallback((data) => {
      const f = data.fixtures || {};
      return Object.values(f).some(v => v > 0);
    }, []),
  });

  // --- Unsaved Changes Tracking ---
  const { success } = useToast();
  
  // Track if user has made any changes
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef(null);
  
  // Store initial data after first load to detect changes
  useEffect(() => {
    if (!initialDataRef.current && hasRestored !== undefined) {
      initialDataRef.current = JSON.stringify({ fixtures, projectInfo });
    }
  }, [fixtures, projectInfo, hasRestored]);
  
  // Detect changes from initial state
  useEffect(() => {
    if (initialDataRef.current) {
      const current = JSON.stringify({ fixtures, projectInfo });
      const hasChanges = current !== initialDataRef.current;
      setIsDirty(hasChanges && totalFixtures > 0);
    }
  }, [fixtures, projectInfo, totalFixtures]);
  
  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  
  // Show restore notification
  useEffect(() => {
    if (hasRestored) {
      success('Previous estimate restored from auto-save');
    }
  }, [hasRestored, success]);

  // --- Computed Values (memoized) ---
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

  // --- Callbacks (memoized) ---
  const buildPayload = useCallback(() => ({
    mode: 'fixture-based',
    fixtures,
    ...projectInfo,
    sqft: Number(projectInfo.sqft) || 0,
    units: Number(projectInfo.units) || 0,
    bathrooms: Number(projectInfo.bathrooms) || 0,
    stories: Number(projectInfo.stories) || 1,
  }), [fixtures, projectInfo]);

  const handleSave = useCallback(() => {
    calculateMutation.mutate(buildPayload());
  }, [calculateMutation, buildPayload]);

  const handleAnalyze = useCallback(() => {
    analyzeMutation.mutate({ ...buildPayload(), model: effectiveModel });
  }, [analyzeMutation, buildPayload, effectiveModel]);

  // Memoized export handler with proper cleanup
  const handleExport = useCallback(() => {
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
    
    // Use requestAnimationFrame to ensure cleanup happens after click
    requestAnimationFrame(() => {
      a.click();
      // Revoke URL after a short delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
  }, [fixtures, totalFixtures, totalPrice, phaseBreakdown, projectInfo.projectName]);

  const handleBlueprintAnalysis = useCallback((result) => {
    clearSaved();
    setActiveTab('estimate');

    if (result.extractedData) {
      const ext = result.extractedData;
      
      setFixtures(prev => {
        const newFixtures = { ...prev };
        for (const f of QUALIFYING_FIXTURES) {
          if (ext[f.key] != null && ext[f.key] > 0) {
            newFixtures[f.key] = Number(ext[f.key]);
          }
        }
        return newFixtures;
      });

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
  }, [clearSaved]);

  const handleNewEstimate = useCallback(() => {
    setFixtures({ ...DEFAULT_FIXTURES });
    setProjectInfo({ ...DEFAULT_PROJECT_INFO });
    setEstimate(null);
    setAnalysis(null);
    setActiveTab('estimate');
  }, []);

  const handleQuickAddFixture = useCallback((defaults) => {
    setFixtures(prev => ({ ...prev, ...defaults }));
    setActiveTab('estimate');
  }, []);

  const handleTabChange = useCallback((newTab) => {
    if (newTab === activeTab) return;
    const direction = TAB_ORDER[newTab] > TAB_ORDER[prevTab.current] ? 'left' : 'right';
    setTabDirection(direction);
    prevTab.current = newTab;
    setActiveTab(newTab);
  }, [activeTab]);

  const handleLoadEstimate = useCallback(() => {
    setActiveTab('estimate');
  }, []);

  const handleContinueEditing = useCallback(() => {
    setActiveTab('estimate');
  }, []);

  const handleProjectNameChange = useCallback((name) => {
    setProjectInfo(prev => ({ ...prev, projectName: name }));
  }, []);

  const toggleProjectInfo = useCallback(() => {
    setProjectInfoExpanded(v => !v);
  }, []);

  const toggleTakeoff = useCallback(() => {
    setTakeoffExpanded(v => !v);
  }, []);

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => setTabDirection(null), 350);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // --- Render Helpers ---
  const estimateDisplayItems = useMemo(() => [
    { label: 'Total', value: estimate?.total || totalPrice },
    { label: 'Rough-in', value: estimate?.breakdown?.roughIn?.amount || phaseBreakdown.roughIn },
    { label: 'Top-out', value: estimate?.breakdown?.topOut?.amount || phaseBreakdown.topOut },
    { label: 'Trim', value: estimate?.breakdown?.trim?.amount || phaseBreakdown.trim },
  ], [estimate, totalPrice, phaseBreakdown]);

  return (
    <div className="h-full overflow-y-auto page-transition-wrapper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Plans & Estimates"
          subtitle="Create detailed estimates from blueprints or manual fixture counts"
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MemoizedStatCard
            label="Total Fixtures"
            value={totalFixtures.toLocaleString()}
            subtext="Across all categories"
            color="copper"
            delay={0}
          />
          <MemoizedStatCard
            label="Total Price"
            value={`$${totalPrice.toLocaleString()}`}
            subtext="Before tax & markup"
            color="green"
            delay={50}
          />
          <MemoizedStatCard
            label="Rough-in"
            value={`$${phaseBreakdown.roughIn.toLocaleString()}`}
            subtext="50% of total"
            color="amber"
            delay={100}
          />
          <MemoizedStatCard
            label="Trim"
            value={`$${phaseBreakdown.trim.toLocaleString()}`}
            subtext="20% of total"
            color="purple"
            delay={150}
          />
        </div>

        {/* Tabs */}
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* Tab Content */}
        <div 
          key={activeTab}
          className={`
            ${tabDirection === 'left' ? 'page-slide-left' : tabDirection === 'right' ? 'page-slide-right' : 'page-transition-wrapper'}
          `}
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Home Tab */}
          {activeTab === 'home' && (
            <MemoizedPlansHome
              fixtures={fixtures}
              projectInfo={projectInfo}
              estimate={estimate}
              totalFixtures={totalFixtures}
              totalValue={totalPrice}
              onNewEstimate={handleNewEstimate}
              onLoadEstimate={handleLoadEstimate}
              onContinueEditing={handleContinueEditing}
              onQuickAddFixture={handleQuickAddFixture}
            />
          )}

          {/* Estimate Tab */}
          {activeTab === 'estimate' && (
            <div className="space-y-6 stagger-container">
              {/* Command Header */}
              <MemoizedPlansCommandHeader
                totalFixtures={totalFixtures}
                totalPrice={totalPrice}
                projectName={projectInfo.projectName}
                onProjectNameChange={handleProjectNameChange}
                isDirty={isDirty}
                isSaving={calculateMutation.isPending || analyzeMutation.isPending}
              />

              {/* Fixture Grid */}
              <section className="card p-5">
                <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4">
                  Fixture Counts
                </h2>
                <MemoizedFixtureGrid fixtures={fixtures} onChange={setFixtures} />
              </section>

              {/* Dashboard Charts */}
              <MemoizedPricingDashboard fixtures={fixtures} totalPrice={totalPrice} />

              {/* Project Info */}
              <MemoizedProjectInfoPanel
                expanded={projectInfoExpanded}
                onToggle={toggleProjectInfo}
                projectInfo={projectInfo}
                onChange={setProjectInfo}
              />

              {/* Blueprint Upload */}
              <MemoizedBlueprintUpload
                onAnalysisComplete={handleBlueprintAnalysis}
                selectedModel={effectiveModel}
              />

              {/* AI Analysis */}
              <MemoizedAIAnalysisSection analysis={analysis} />

              {/* Material Takeoff */}
              <MemoizedTakeoffPanel
                expanded={takeoffExpanded}
                onToggle={toggleTakeoff}
              />

              {/* Action Bar */}
              <MemoizedPlansActionBar
                onSave={handleSave}
                onAnalyze={handleAnalyze}
                onExport={handleExport}
                isSaving={calculateMutation.isPending}
                isAnalyzing={analyzeMutation.isPending}
                totalFixtures={totalFixtures}
                selectedModel={effectiveModel}
                onModelChange={setSelectedModel}
              />

              {/* Estimate result */}
              {estimate && (
                <div className="card p-5 border-l-4 border-l-accent-500">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Save className="w-4 h-4 text-accent-500" />
                    Saved Estimate
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {estimateDisplayItems.map((item) => (
                      <div key={item.label} className="bg-surface-50 dark:bg-surface-850/50 rounded-xl p-4 text-center border border-surface-200 dark:border-surface-700">
                        <p className="text-[10px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">{item.label}</p>
                        <p className="text-xl font-bold text-surface-900 dark:text-surface-100 font-mono">
                          ${(item.value || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {estimate.estimateId && (
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-4 text-right font-mono">
                      Estimate ID: {estimate.estimateId}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
