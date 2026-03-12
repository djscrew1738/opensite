/**
 * EstimatingTab Component
 * Job estimating panel with project info, fixtures, and blueprints
 * 
 * @module components/jobs/EstimatingTab
 */

import { useState, useCallback, memo } from 'react';
import { LayoutDashboard, Calculator, Box, ChevronRight } from 'lucide-react';
import FixtureGrid from '../plans/FixtureGrid';
import ProjectInfoPanel from '../plans/ProjectInfoPanel';
import { BlueprintUpload } from '../upload';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Array<{id: string, icon: React.ComponentType, iconBg: string, iconColor: string, title: string, subtitle?: string}>} */
const PANELS = [
  {
    id: 'info',
    icon: LayoutDashboard,
    iconBg: colors.accent.muted,
    iconColor: colors.accent.DEFAULT,
    title: 'Project Info',
    subtitle: 'Address, builder, job details',
  },
  {
    id: 'fixtures',
    icon: Calculator,
    iconBg: colors.success.muted,
    iconColor: colors.success.DEFAULT,
    title: 'Fixture Count',
  },
  {
    id: 'blueprint',
    icon: Box,
    iconBg: 'rgba(139, 92, 246, 0.1)',
    iconColor: '#8B5CF6',
    title: 'Blueprints',
    subtitle: 'Upload and analyze plans',
  },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Panel header button
 * @param {{panel: typeof PANELS[0], isActive: boolean, onClick: () => void, totalFixtures: number, totalPrice: number}} props
 */
const PanelHeader = memo(function PanelHeader({ 
  panel, 
  isActive, 
  onClick, 
  totalFixtures, 
  totalPrice 
}) {
  const Icon = panel.icon;
  
  const subtitle = panel.id === 'fixtures'
    ? `${totalFixtures} fixtures · $${totalPrice.toLocaleString()}`
    : panel.subtitle;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 transition-colors"
      style={{
        backgroundColor: isActive ? colors.surface.elevated : 'transparent',
      }}
      aria-expanded={isActive}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: panel.iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: panel.iconColor }} />
        </div>
        <div className="text-left">
          <h3 
            className="font-semibold"
            style={{ color: colors.text.primary }}
          >
            {panel.title}
          </h3>
          <p 
            className="text-sm"
            style={{ color: colors.text.muted }}
          >
            {subtitle}
          </p>
        </div>
      </div>
      <ChevronRight
        className="w-5 h-5 transition-transform"
        style={{
          color: colors.text.muted,
          transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
        aria-hidden="true"
      />
    </button>
  );
});

PanelHeader.displayName = 'PanelHeader';

/**
 * Estimate summary panel
 * @param {{totalFixtures: number, totalPrice: number, phaseBreakdown: {roughIn: number, topOut: number, trim: number}, onCalculate: () => void, isPending: boolean}} props
 */
const EstimateSummary = memo(function EstimateSummary({ 
  totalFixtures, 
  totalPrice, 
  phaseBreakdown, 
  onCalculate, 
  isPending 
}) {
  return (
    <div
      className="rounded-xl p-4 sticky top-4"
      style={{ 
        backgroundColor: colors.surface.card, 
        border: `1px solid ${colors.border.default}`,
        boxShadow: shadows.card,
      }}
    >
      <h3 
        className="font-semibold mb-4"
        style={{ color: colors.text.primary }}
      >
        Estimate Summary
      </h3>

      <div className="space-y-4">
        <div>
          <p 
            className="text-sm"
            style={{ color: colors.text.muted }}
          >
            Total Fixtures
          </p>
          <p 
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {totalFixtures}
          </p>
        </div>

        <div>
          <p 
            className="text-sm"
            style={{ color: colors.text.muted }}
          >
            Total Price
          </p>
          <p 
            className="text-2xl font-bold"
            style={{ color: colors.success.DEFAULT }}
          >
            ${totalPrice.toLocaleString()}
          </p>
        </div>

        <div
          className="pt-4 space-y-2"
          style={{ borderTop: `1px solid ${colors.border.default}` }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: colors.text.secondary }}>Rough-In (50%)</span>
            <span style={{ color: colors.text.primary }}>
              ${phaseBreakdown.roughIn.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: colors.text.secondary }}>Top-Out (30%)</span>
            <span style={{ color: colors.text.primary }}>
              ${phaseBreakdown.topOut.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: colors.text.secondary }}>Trim (20%)</span>
            <span style={{ color: colors.text.primary }}>
              ${phaseBreakdown.trim.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={onCalculate}
          disabled={isPending}
          className="w-full py-3 rounded-lg font-medium transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: colors.accent.DEFAULT,
            color: '#FFFFFF',
            boxShadow: shadows.glowBlue,
          }}
          onMouseEnter={(e) => {
            if (!isPending) e.currentTarget.style.backgroundColor = colors.accent.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.accent.DEFAULT;
          }}
        >
          {isPending ? 'Calculating...' : 'Save Estimate'}
        </button>
      </div>
    </div>
  );
});

EstimateSummary.displayName = 'EstimateSummary';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * EstimatingTab - Job estimating panel
 * @param {{
 *   fixtures: Record<string, number>,
 *   setFixtures: (fixtures: Record<string, number>) => void,
 *   projectInfo: Record<string, any>,
 *   setProjectInfo: (info: Record<string, any>) => void,
 *   totalFixtures: number,
 *   totalPrice: number,
 *   phaseBreakdown: {roughIn: number, topOut: number, trim: number},
 *   calculateMutation: {mutate: Function, isPending: boolean},
 *   estimate: any,
 *   setEstimate: (estimate: any) => void
 * }} props
 */
function EstimatingTab({
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
  const [selectedModel, setSelectedModel] = useState(null);

  const handleCalculate = useCallback(() => {
    calculateMutation.mutate({ fixtures, projectInfo }, {
      onSuccess: (data) => setEstimate(data),
    });
  }, [calculateMutation, fixtures, projectInfo, setEstimate]);

  const togglePanel = useCallback((id) => {
    setActivePanel(prev => prev === id ? null : id);
  }, []);

  const panelContent = {
    info: <ProjectInfoPanel projectInfo={projectInfo} setProjectInfo={setProjectInfo} />,
    fixtures: <FixtureGrid fixtures={fixtures} setFixtures={setFixtures} />,
    blueprint: <BlueprintUpload selectedModel={selectedModel} onModelChange={setSelectedModel} />,
  };

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {PANELS.map((panel) => (
            <div
              key={panel.id}
              className="rounded-xl overflow-hidden"
              style={{ 
                backgroundColor: colors.surface.card, 
                border: `1px solid ${colors.border.default}`,
              }}
            >
              <PanelHeader
                panel={panel}
                isActive={activePanel === panel.id}
                onClick={() => togglePanel(panel.id)}
                totalFixtures={totalFixtures}
                totalPrice={totalPrice}
              />
              {activePanel === panel.id && (
                <div className="p-4 pt-0">
                  {panelContent[panel.id]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column - Summary */}
        <div>
          <EstimateSummary
            totalFixtures={totalFixtures}
            totalPrice={totalPrice}
            phaseBreakdown={phaseBreakdown}
            onCalculate={handleCalculate}
            isPending={calculateMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

EstimatingTab.displayName = 'EstimatingTab';

export default EstimatingTab;
