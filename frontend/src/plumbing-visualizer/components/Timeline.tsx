import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronRight } from 'lucide-react';
import { useVisualizerStore } from '../store';
import { CONSTRUCTION_PHASES } from '../types';

const colors = {
  surfacePrimary: '#0A0B0D',
  surfaceCard: '#111318',
  surfaceElevated: '#181C24',
  borderDefault: '#1F2430',
  borderStrong: '#2D3548',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  accentBlue: '#3B82F6',
};

export function Timeline() {
  const { currentPhase, setCurrentPhase, project } = useVisualizerStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play through phases
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentPhase((prev) => {
          const next = prev + 1;
          if (next > 5) {
            setIsPlaying(false);
            return 5;
          }
          return next;
        });
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, setCurrentPhase]);

  const handlePlay = () => {
    if (currentPhase >= 5) {
      setCurrentPhase(1);
    }
    setIsPlaying(!isPlaying);
  };

  const handlePhaseClick = (phase: number) => {
    setIsPlaying(false);
    setCurrentPhase(phase);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentPhase(Math.min(5, currentPhase + 1));
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentPhase(Math.max(1, currentPhase - 1));
  };

  if (!project) return null;

  return (
    <div 
      className="border-t p-4"
      style={{ backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h3 
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: colors.textSecondary }}
            >
              Construction Phase Timeline
            </h3>
            <span className="text-lg font-bold" style={{ color: colors.accentBlue }}>
              Phase {currentPhase}: {CONSTRUCTION_PHASES[currentPhase - 1]?.name}
            </span>
          </div>
          
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceElevated}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Previous Phase"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ 
                backgroundColor: colors.accentBlue, 
                color: '#FFFFFF',
                boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentBlue}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </button>
            
            <button
              onClick={handleNext}
              className="p-2 rounded transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceElevated}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Next Phase"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Track */}
        <div className="relative">
          {/* Progress Bar Background */}
          <div 
            className="absolute top-1/2 left-0 right-0 h-1 rounded -translate-y-1/2"
            style={{ backgroundColor: colors.borderDefault }}
          />
          
          {/* Progress Fill */}
          <div 
            className="absolute top-1/2 left-0 h-1 rounded -translate-y-1/2 transition-all duration-300"
            style={{ 
              width: `${((currentPhase - 1) / 4) * 100}%`,
              backgroundColor: colors.accentBlue 
            }}
          />

          {/* Phase Markers */}
          <div className="relative flex justify-between">
            {CONSTRUCTION_PHASES.map(({ phase, name, description }) => {
              const isActive = phase <= currentPhase;
              const isCurrent = phase === currentPhase;
              
              return (
                <button
                  key={phase}
                  onClick={() => handlePhaseClick(phase)}
                  className="relative flex flex-col items-center group"
                  style={{ opacity: isActive ? 1 : 0.5, cursor: isActive ? 'pointer' : 'not-allowed' }}
                >
                  {/* Phase Dot */}
                  <div
                    className="w-4 h-4 rounded-full border-2 transition-all duration-300"
                    style={{
                      backgroundColor: isCurrent 
                        ? colors.accentBlue 
                        : isActive 
                          ? colors.accentBlue 
                          : colors.surfaceElevated,
                      borderColor: isCurrent 
                        ? '#60A5FA' 
                        : isActive 
                          ? colors.accentBlue 
                          : colors.borderStrong,
                      transform: isCurrent ? 'scale(1.25)' : 'scale(1)',
                      boxShadow: isCurrent ? `0 0 0 4px rgba(59, 130, 246, 0.2)` : 'none',
                    }}
                  />
                  
                  {/* Phase Info */}
                  <div className="mt-3 text-center">
                    <div 
                      className="text-sm font-medium transition-colors"
                      style={{ 
                        color: isCurrent 
                          ? colors.accentBlue 
                          : isActive 
                            ? colors.textPrimary 
                            : colors.textMuted 
                      }}
                    >
                      Phase {phase}
                    </div>
                    <div 
                      className="text-xs mt-0.5 max-w-[120px]"
                      style={{ color: colors.textMuted }}
                    >
                      {name}
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div 
                    className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 
                              transition-opacity pointer-events-none"
                  >
                    <div 
                      className="text-xs px-3 py-2 rounded-lg whitespace-nowrap border"
                      style={{ 
                        backgroundColor: colors.surfaceElevated, 
                        borderColor: colors.borderDefault,
                        color: colors.textPrimary 
                      }}
                    >
                      {description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase Description */}
        <div className="mt-4 text-center text-sm" style={{ color: colors.textSecondary }}>
          {CONSTRUCTION_PHASES[currentPhase - 1]?.description}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
