import { PHASES } from '../../styles/tokens';

/**
 * PhaseTrack — 5 connected dots showing job phase progress
 * Filled dots for completed phases, current dot pulses, future dots empty.
 */
export default function PhaseTrack({ currentPhase = 'underground', compact = false }) {
  const currentIndex = PHASES.findIndex(p => p.key === currentPhase);
  const validIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center" role="progressbar" aria-valuenow={validIndex + 1} aria-valuemin={1} aria-valuemax={5}>
      {PHASES.map((phase, i) => {
        const isCompleted = i < validIndex;
        const isCurrent = i === validIndex;
        const isFuture = i > validIndex;

        return (
          <div key={phase.key} className="flex items-center">
            {/* Connector line (not before first dot) */}
            {i > 0 && (
              <div
                style={{
                  width: compact ? '12px' : '20px',
                  height: '2px',
                  background: isCompleted || isCurrent ? phase.color : '#1F2430',
                  transition: 'background 0.3s ease',
                  opacity: isCompleted || isCurrent ? 0.6 : 1,
                }}
              />
            )}

            {/* Phase dot */}
            <div
              style={{
                width: isCurrent ? (compact ? '12px' : '14px') : (compact ? '8px' : '10px'),
                height: isCurrent ? (compact ? '12px' : '14px') : (compact ? '8px' : '10px'),
                borderRadius: '50%',
                background: isFuture ? '#1F2430' : phase.color,
                transition: 'all 0.3s ease',
                flexShrink: 0,
                ...(isCurrent && {
                  animation: 'pulseDot 2s ease-in-out infinite',
                  boxShadow: `0 0 8px ${phase.color}40`,
                }),
              }}
              title={`${phase.label}${isCompleted ? ' (Complete)' : isCurrent ? ' (Current)' : ''}`}
            />
          </div>
        );
      })}
    </div>
  );
}
