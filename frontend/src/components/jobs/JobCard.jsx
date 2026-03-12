import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { motion as Motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowRight, Flag, Eye, Check, AlertCircle } from 'lucide-react';
import PhaseTrack from './PhaseTrack';
import BuilderBadge from './BuilderBadge';
import { colors, PHASES, PHASE_MAP } from '../../styles/tokens';
import { JobCardSkeleton } from '../shared/LoadingStates';
import { useHaptic } from '../../hooks/useHaptic';

/**
 * JobCard — The most-used element in Job Pulse.
 *
 * Swipe right → Update Phase (green reveal)
 * Swipe left  → Flag (red reveal)
 * Tap body    → Open detail
 *
 * Accessibility:
 * - Keyboard: ArrowRight to update phase, ArrowLeft to flag, Enter to view detail
 * - Screen readers: Announces job status and available actions
 * - Focus management: Visible focus indicators on all interactive elements
 */
const JobCard = memo(function JobCard({
  job,
  index = 0,
  onUpdatePhase,
  onViewDetail,
  onFlag,
  onClick,
  loading = false,
}) {
  const {
    id,
    address,
    city,
    zip,
    builder,
    phase = 'underground',
    daysInPhase = 0,
    status = 'healthy',
  } = job || {};

  const phaseInfo = PHASE_MAP[phase] || PHASES[0];
  const phaseColor = phaseInfo.color;

  // ─── All hooks unconditionally before any early return ───────────────────
  const [swiped, setSwiped] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const x = useMotionValue(0);
  const cardRef = useRef(null);
  const haptic = useHaptic();
  const passedThresholdRef = useRef(false);

  const bgLeft = useTransform(x, [-120, 0], [1, 0]);
  const bgRight = useTransform(x, [0, 120], [0, 1]);

  // Status-based left border glow — recomputed only when phase changes
  const borderGlow = useMemo(() => ({
    overdue: `0 0 12px ${colors.danger.glow}, inset 3px 0 0 ${colors.danger.DEFAULT}`,
    'due-today': `0 0 12px ${colors.warning.glow}, inset 3px 0 0 ${colors.warning.DEFAULT}`,
    healthy: `inset 3px 0 0 ${phaseColor}`,
  }), [phaseColor]);

  const formattedAddress = useMemo(
    () => [address, city, zip].filter(Boolean).join(', '),
    [address, city, zip]
  );

  // Outer stagger style — recomputed only when index changes
  const wrapperStyle = useMemo(() => ({
    borderRadius: '12px',
    animationDelay: `${index * 25}ms`,
    animation: 'staggerFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
    opacity: 0,
  }), [index]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'overdue': return 'Overdue job';
      case 'due-today': return 'Due today';
      default: return 'Active job';
    }
  }, [status]);

  const handleUpdatePhase = useCallback(async (e) => {
    e?.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      await onUpdatePhase?.(job);
    } catch {
      setError('Failed to update phase');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [job, onUpdatePhase]);

  const handleFlag = useCallback(async (e) => {
    e?.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      await onFlag?.(job);
    } catch {
      setError('Failed to flag job');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [job, onFlag]);

  const handleViewDetail = useCallback((e) => {
    e?.stopPropagation();
    onViewDetail?.(job);
  }, [job, onViewDetail]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleUpdatePhase();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleFlag();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(job);
    }
  }, [job, onClick, handleUpdatePhase, handleFlag]);

  const handleDragEnd = useCallback(async (_, info) => {
    passedThresholdRef.current = false;
    const threshold = 80;
    const velocity = info.velocity.x;
    const isRight = info.offset.x > threshold || velocity > 500;
    const isLeft = info.offset.x < -threshold || velocity < -500;

    if (!isRight && !isLeft) {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
      return;
    }

    const target = isRight ? 120 : -120;
    animate(x, target, { type: 'spring', stiffness: 300, damping: 30 });
    setSwiped(isRight ? 'right' : 'left');

    setTimeout(async () => {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
      setSwiped(null);
      if (isRight) { haptic.confirm(); await handleUpdatePhase(); }
      else { haptic.warning(); await handleFlag(); }
    }, 400);
  }, [x, haptic, handleUpdatePhase, handleFlag]);

  const handleDrag = useCallback((_, info) => {
    const abs = Math.abs(info.offset.x);
    if (abs >= 80 && !passedThresholdRef.current) {
      passedThresholdRef.current = true;
      haptic.tick();
    } else if (abs < 80 && passedThresholdRef.current) {
      passedThresholdRef.current = false;
    }
  }, [haptic]);

  const handleCardClick = useCallback(() => {
    if (!swiped) onClick?.(job);
  }, [swiped, onClick, job]);

  // ─── Early return after all hooks ────────────────────────────────────────
  if (loading) return <JobCardSkeleton count={1} />;

  return (
    <div className="relative w-full overflow-hidden" style={wrapperStyle}>
      {/* Swipe-right background: Update Phase (green) */}
      <Motion.div
        className="absolute inset-0 flex items-center pl-5 rounded-xl"
        style={{ background: colors.success.DEFAULT, opacity: bgRight, borderRadius: '12px' }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: colors.text.inverse }}>
          <Check className="w-5 h-5" />
          <span>Update Phase</span>
        </div>
      </Motion.div>

      {/* Swipe-left background: Flag (red) */}
      <Motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl"
        style={{ background: colors.danger.DEFAULT, opacity: bgLeft, borderRadius: '12px' }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: colors.text.inverse }}>
          <span>Flag</span>
          <Flag className="w-5 h-5" />
        </div>
      </Motion.div>

      {/* Error Toast */}
      {error && (
        <div
          className="absolute top-2 left-2 right-2 z-10 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{
            background: colors.danger.muted,
            color: colors.danger.DEFAULT,
            border: `1px solid ${colors.danger.border || 'rgba(239, 68, 68, 0.2)'}`,
          }}
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Draggable card body */}
      <Motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.1}
        dragDirectionLock
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, willChange: 'transform' }}
        className="relative cursor-pointer touch-pan-y focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="article"
        aria-label={`${statusLabel} ${id} at ${formattedAddress || 'No address'}. Current phase: ${phaseInfo.label}. Use arrow keys to update phase or flag, Enter to view details.`}
        tabIndex={0}
      >
        <div
          style={{
            background: colors.surface.card,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '12px',
            boxShadow: borderGlow[status] || borderGlow.healthy,
            padding: '14px 16px',
          }}
        >
          {/* Row 1: Builder badge + Job ID */}
          <div className="flex items-center justify-between mb-2">
            <BuilderBadge builder={builder} size="xs" />
            <span
              className="font-mono text-xs tabular-nums"
              style={{ color: colors.text.muted, fontWeight: 500 }}
            >
              #{id}
            </span>
          </div>

          {/* Row 2: Address */}
          <p
            className="font-medium truncate mb-3"
            style={{ color: colors.text.primary, fontSize: '15px', lineHeight: 1.4 }}
          >
            {formattedAddress || 'No address'}
          </p>

          {/* Row 3: Phase track + phase name */}
          <div className="flex items-center gap-3 mb-3">
            <PhaseTrack currentPhase={phase} compact />
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-semibold whitespace-nowrap" style={{ color: phaseColor, fontSize: '13px' }}>
                {phaseInfo.label}
              </span>
              <span className="font-mono text-xs tabular-nums" style={{ color: colors.text.muted }}>
                {daysInPhase}d
              </span>
            </div>
          </div>

          {/* Row 4: Action buttons */}
          <div className="flex items-center gap-2">
            <Motion.button
              type="button"
              disabled={isLoading}
              whileTap={!isLoading ? { scale: 0.95 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-xs transition-colors duration-150 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
              style={{ color: colors.text.secondary, height: '36px' }}
              onClick={handleUpdatePhase}
              aria-label="Update job phase"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Update</span>
            </Motion.button>

            <Motion.button
              type="button"
              disabled={isLoading}
              whileTap={!isLoading ? { scale: 0.95 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-xs transition-colors duration-150 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
              style={{ color: colors.text.secondary, height: '36px' }}
              onClick={handleViewDetail}
              aria-label="View job details"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Detail</span>
            </Motion.button>

            <Motion.button
              type="button"
              disabled={isLoading}
              whileTap={!isLoading ? { scale: 0.95 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-xs transition-colors duration-150 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/50"
              style={{ color: colors.text.muted, height: '36px' }}
              onClick={handleFlag}
              aria-label="Flag job for review"
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Flag</span>
            </Motion.button>
          </div>
        </div>
      </Motion.div>
    </div>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard;
