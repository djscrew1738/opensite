import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Calculator, FileEdit, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { FIXTURE_PRICE, PHASE_CONFIG } from './constants';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Status badge showing estimate state (unsaved/ready)
 */
const StatusBadge = memo(function StatusBadge({ isDirty, isReady }) {
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-300 text-xs font-medium animate-pulse">
        <AlertCircle className="w-3 h-3" />
        Unsaved
      </span>
    );
  }
  
  if (isReady) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Ready
      </span>
    );
  }
  
  return null;
});

/**
 * Stats display showing fixtures, total, and per-unit price
 */
const StatsPanel = memo(function StatsPanel({ totalFixtures, totalPrice }) {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {/* Fixtures Count */}
      <div className="text-center px-3 sm:px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
        <p className="text-xs sm:text-xs uppercase tracking-wider text-blue-200/60 font-semibold mb-1">
          Fixtures
        </p>
        <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums">{totalFixtures}</p>
      </div>
      
      {/* Divider */}
      <div className="w-px h-12 bg-white/20" />
      
      {/* Total Price */}
      <div className="text-center px-3 sm:px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
        <p className="text-xs sm:text-xs uppercase tracking-wider text-blue-200/60 font-semibold mb-1">
          Total
        </p>
        <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums">
          ${totalPrice.toLocaleString()}
        </p>
      </div>
      
      {/* Divider + Per Unit (hidden on mobile) */}
      <div className="w-px h-12 bg-white/20 hidden sm:block" />
      <div className="text-center hidden sm:block px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-wider text-blue-200/60 font-semibold mb-1">
          Per Unit
        </p>
        <p className="text-xl font-bold font-mono tabular-nums">
          ${FIXTURE_PRICE.toLocaleString()}
        </p>
      </div>
    </div>
  );
});

/**
 * Phase breakdown mini-bar showing cost distribution
 */
const PhaseMiniBar = memo(function PhaseMiniBar({ totalPrice }) {
  const hasPrice = totalPrice > 0;
  const formattedTotal = useMemo(() => `${(totalPrice / 1000).toFixed(0)}k`, [totalPrice]);

  return (
    <div className="lg:w-52">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-xs uppercase tracking-wider text-blue-200/60 font-semibold">
          Phase Breakdown
        </p>
        {hasPrice && (
          <span className="text-xs sm:text-xs text-white/60">${formattedTotal} total</span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="flex rounded-full overflow-hidden h-2.5 sm:h-3 bg-white/10">
        {PHASE_CONFIG.map(phase => (
          <div
            key={phase.key}
            className="transition-all duration-500 ease-out"
            style={{ 
              width: hasPrice ? `${phase.pct}%` : '33.33%',
              backgroundColor: phase.color,
              opacity: hasPrice ? 1 : 0.3
            }}
            title={`${phase.label}: ${phase.pct}%`}
          />
        ))}
      </div>
      
      {/* Phase Labels */}
      <div className="flex justify-between mt-2">
        {PHASE_CONFIG.map(phase => (
          <div key={phase.key} className="text-center flex-1">
            <span className="text-xs text-blue-200/50 block">{phase.label}</span>
            <span className="text-xs sm:text-xs font-medium text-white/80">{phase.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Project name input with icon
 */
const ProjectNameInput = memo(function ProjectNameInput({ value, onChange }) {
  return (
    <div className="relative">
      <FileEdit className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter project name..."
        className="w-full max-w-sm bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
        aria-label="Project name"
      />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * PlansCommandHeader - Hero header for the Plans/Estimate page
 * 
 * Displays:
 * - Project name input
 * - Quick stats (fixtures, total, per-unit price)
 * - Phase breakdown mini-bar
 * - Save status indicator
 * 
 * @param {Object} props
 * @param {number} props.totalFixtures - Total number of fixtures
 * @param {number} props.totalPrice - Total estimate price
 * @param {string} props.projectName - Current project name
 * @param {Function} props.onProjectNameChange - Callback when project name changes
 * @param {boolean} props.isDirty - Whether there are unsaved changes
 * @param {boolean} props.isSaving - Whether currently saving
 */
function PlansCommandHeader({ 
  totalFixtures, 
  totalPrice, 
  projectName, 
  onProjectNameChange, 
  isDirty,
  isSaving 
}) {
  const hasProjectName = !!projectName?.trim();
  const hasFixtures = totalFixtures > 0;
  const isReady = !isDirty && hasFixtures && hasProjectName && !isSaving;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-900 via-accent-600 to-accent-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-accent-400/20 blur-3xl" />
      </div>

      <div className="relative p-4 sm:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          {/* Left: Title + Project Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Estimate</h1>
              <StatusBadge isDirty={isDirty} isReady={isReady} />
            </div>
            <ProjectNameInput value={projectName} onChange={onProjectNameChange} />
          </div>

          {/* Center: Stats */}
          <StatsPanel totalFixtures={totalFixtures} totalPrice={totalPrice} />

          {/* Right: Phase mini-bar */}
          <PhaseMiniBar totalPrice={totalPrice} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

PlansCommandHeader.propTypes = {
  totalFixtures: PropTypes.number.isRequired,
  totalPrice: PropTypes.number.isRequired,
  projectName: PropTypes.string,
  onProjectNameChange: PropTypes.func.isRequired,
  isDirty: PropTypes.bool,
  isSaving: PropTypes.bool,
};

PlansCommandHeader.defaultProps = {
  projectName: '',
  isDirty: false,
  isSaving: false,
};

// Sub-component PropTypes
StatusBadge.propTypes = {
  isDirty: PropTypes.bool.isRequired,
  isReady: PropTypes.bool.isRequired,
};

StatsPanel.propTypes = {
  totalFixtures: PropTypes.number.isRequired,
  totalPrice: PropTypes.number.isRequired,
};

PhaseMiniBar.propTypes = {
  totalPrice: PropTypes.number.isRequired,
};

ProjectNameInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default memo(PlansCommandHeader);
