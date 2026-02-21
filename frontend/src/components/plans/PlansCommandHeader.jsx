import { Calculator, FileEdit, Save, CheckCircle2 } from 'lucide-react';
import { FIXTURE_PRICE, PHASE_CONFIG } from './constants';

export default function PlansCommandHeader({ totalFixtures, totalPrice, projectName, onProjectNameChange }) {
  const hasProjectName = !!projectName;
  const hasFixtures = totalFixtures > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001a4d] via-[#003594] to-[#002266]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-accent-500/20 blur-3xl" />
      </div>

      <div className="relative p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Title + Project Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Estimate</h1>
              {hasFixtures && hasProjectName && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              )}
            </div>
            <div className="relative">
              <FileEdit className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                placeholder="Enter project name..."
                className="w-full max-w-sm bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
              />
            </div>
          </div>

          {/* Center: Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 backdrop-blur">
              <p className="text-[10px] uppercase tracking-widest text-blue-200/60 font-semibold mb-1">Fixtures</p>
              <p className="text-3xl font-bold tabular-nums">{totalFixtures}</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 backdrop-blur">
              <p className="text-[10px] uppercase tracking-widest text-blue-200/60 font-semibold mb-1">Total</p>
              <p className="text-3xl font-bold tabular-nums">${totalPrice.toLocaleString()}</p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center hidden sm:block px-4 py-2 rounded-xl bg-white/5 backdrop-blur">
              <p className="text-[10px] uppercase tracking-widest text-blue-200/60 font-semibold mb-1">Per Unit</p>
              <p className="text-xl font-semibold">${FIXTURE_PRICE.toLocaleString()}</p>
            </div>
          </div>

          {/* Right: Phase mini-bar */}
          <div className="lg:w-52">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-blue-200/60 font-semibold">Phase Breakdown</p>
              {totalPrice > 0 && (
                <span className="text-xs text-white/60">${(totalPrice / 1000).toFixed(0)}k total</span>
              )}
            </div>
            <div className="flex rounded-full overflow-hidden h-3 bg-white/10">
              {PHASE_CONFIG.map(phase => (
                <div
                  key={phase.key}
                  className="transition-all duration-500"
                  style={{ 
                    width: totalPrice > 0 ? `${phase.pct}%` : '33.33%',
                    backgroundColor: phase.color,
                    opacity: totalPrice > 0 ? 1 : 0.3
                  }}
                  title={`${phase.label}: ${phase.pct}%`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {PHASE_CONFIG.map(phase => (
                <div key={phase.key} className="text-center">
                  <span className="text-[10px] text-blue-200/50 block">{phase.label}</span>
                  <span className="text-[10px] font-medium text-white/80">{phase.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
