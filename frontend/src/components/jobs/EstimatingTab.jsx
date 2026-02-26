import { useState } from 'react';
import { LayoutDashboard, Calculator, Box, ChevronRight } from 'lucide-react';
import FixtureGrid from '../plans/FixtureGrid';
import ProjectInfoPanel from '../plans/ProjectInfoPanel';
import { BlueprintUpload } from '../upload';

const PANELS = [
  {
    id: 'info',
    icon: LayoutDashboard,
    iconBg: 'rgba(59, 130, 246, 0.1)',
    iconColor: '#3B82F6',
    title: 'Project Info',
    subtitle: 'Address, builder, job details',
  },
  {
    id: 'fixtures',
    icon: Calculator,
    iconBg: 'rgba(16, 185, 129, 0.1)',
    iconColor: '#10B981',
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

export default function EstimatingTab({
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

  const handleCalculate = () => {
    calculateMutation.mutate({ fixtures, projectInfo }, {
      onSuccess: (data) => setEstimate(data),
    });
  };

  const togglePanel = (id) => setActivePanel(activePanel === id ? null : id);

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
              style={{ background: '#111318', border: '1px solid #1F2430' }}
            >
              <button
                onClick={() => togglePanel(panel.id)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: panel.iconBg }}
                  >
                    <panel.icon className="w-5 h-5" style={{ color: panel.iconColor }} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold" style={{ color: '#F1F5F9' }}>
                      {panel.id === 'fixtures'
                        ? `Fixture Count`
                        : panel.title}
                    </h3>
                    <p className="text-sm" style={{ color: '#64748B' }}>
                      {panel.id === 'fixtures'
                        ? `${totalFixtures} fixtures · $${totalPrice.toLocaleString()}`
                        : panel.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="w-5 h-5 transition-transform"
                  style={{
                    color: '#64748B',
                    transform: activePanel === panel.id ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
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
          <div
            className="rounded-xl p-4 sticky top-4"
            style={{ background: '#111318', border: '1px solid #1F2430' }}
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
