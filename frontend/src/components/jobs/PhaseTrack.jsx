/**
 * PhaseTrack Component
 * 5 connected dots showing job phase progress
 * 
 * @module components/jobs/PhaseTrack
 */

import { memo } from 'react';
import { PHASES, colors } from '../../styles/tokens';

/**
 * PhaseTrack — 5 connected dots showing job phase progress
 * Filled dots for completed phases, current dot pulses, future dots empty.
 * 
 * @param {{currentPhase?: string, compact?: boolean}} props
 */
const PhaseTrack = memo(function PhaseTrack({ 
  currentPhase = 'underground', 
  compact = false 
}) {
  const currentIndex = PHASES.findIndex(p => p.key === currentPhase);
  const validIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div 
      className="flex items-center" 
      role="progressbar" 
      aria-valuenow={validIndex + 1} 
      aria-valuemin={1} 
      aria-valuemax={5}
      aria-label={`Job progress: ${PHASES[validIndex]?.label || 'Unknown'}`}
    >
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
                  background: isCompleted || isCurrent ? phase.color : colors.border.default,
                  transition: 'background 0.3s ease',
                  opacity: isCompleted || isCurrent ? 0.6 : 1,
                }}
                aria-hidden="true"
              />
            )}

            {/* Phase dot */}
            <div
              style={{
                width: isCurrent ? (compact ? '12px' : '14px') : (compact ? '8px' : '10px'),
                height: isCurrent ? (compact ? '12px' : '14px') : (compact ? '8px' : '10px'),
                borderRadius: '50%',
                background: isFuture ? colors.border.default : phase.color,
                transition: 'all 0.3s ease',
                flexShrink: 0,
                ...(isCurrent && {
                  animation: 'pulseDot 2s ease-in-out infinite',
                  boxShadow: `0 0 8px ${phase.color}40`,
                }),
              }}
              title={`${phase.label}${isCompleted ? ' (Complete)' : isCurrent ? ' (Current)' : ''}`}
              aria-label={`${phase.label}${isCompleted ? ' - completed' : isCurrent ? ' - current phase' : ' - pending'}`}
            />
          </div>
        );
      })}
    </div>
  );
});

PhaseTrack.displayName = 'PhaseTrack';

export default PhaseTrack;
