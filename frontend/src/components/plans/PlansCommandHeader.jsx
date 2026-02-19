import { FIXTURE_PRICE, PHASE_CONFIG } from './constants';

export default function PlansCommandHeader({ totalFixtures, totalPrice, projectName, onProjectNameChange }) {
  return (
    <div className="bg-gradient-to-r from-[#001a4d] via-[#003594] to-[#002266] rounded-2xl p-6 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Title + Project Name */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Plans</h1>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Project name..."
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 w-full max-w-xs"
          />
        </div>

        {/* Center: Fixture Count + Total */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-blue-300/70 font-semibold">Total Fixtures</p>
            <p className="text-3xl font-bold tabular-nums">{totalFixtures}</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-blue-300/70 font-semibold">Total Price</p>
            <p className="text-3xl font-bold tabular-nums">${totalPrice.toLocaleString()}</p>
          </div>
          <div className="w-px h-10 bg-white/20 hidden sm:block" />
          <div className="text-center hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-blue-300/70 font-semibold">Per Fixture</p>
            <p className="text-lg font-semibold">${FIXTURE_PRICE}</p>
          </div>
        </div>

        {/* Right: Phase mini-bar */}
        <div className="lg:w-48">
          <p className="text-[10px] uppercase tracking-widest text-blue-300/70 font-semibold mb-2">Phase Breakdown</p>
          <div className="flex rounded-full overflow-hidden h-2.5">
            {PHASE_CONFIG.map(phase => (
              <div
                key={phase.key}
                className="transition-all"
                style={{ width: `${phase.pct}%`, backgroundColor: phase.color }}
                title={`${phase.label}: ${phase.pct}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {PHASE_CONFIG.map(phase => (
              <span key={phase.key} className="text-[10px] text-blue-200/60">
                {phase.label} {phase.pct}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
