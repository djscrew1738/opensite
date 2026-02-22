import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowRight, Flag, Eye, Check } from 'lucide-react';
import PhaseTrack from './PhaseTrack';
import BuilderBadge from './BuilderBadge';
import { PHASES, PHASE_MAP } from '../../styles/tokens';

/**
 * JobCard — The most-used element in Job Pulse.
 *
 * Swipe right → Update Phase (green reveal)
 * Swipe left  → Flag (red reveal)
 * Tap body    → Open detail
 */
export default function JobCard({
  job,
  index = 0,
  onUpdatePhase,
  onViewDetail,
  onFlag,
  onClick,
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
  const [swiped, setSwiped] = useState(null); // 'left' | 'right' | null

  const x = useMotionValue(0);
  const cardRef = useRef(null);

  // Background reveal colors based on swipe direction
  const bgLeft = useTransform(x, [-120, 0], [1, 0]);
  const bgRight = useTransform(x, [0, 120], [0, 1]);

  // Status-based left border glow
  const borderGlow = {
    overdue: `0 0 12px rgba(239, 68, 68, 0.4), inset 3px 0 0 #EF4444`,
    'due-today': `0 0 12px rgba(245, 158, 11, 0.4), inset 3px 0 0 #F59E0B`,
    healthy: `inset 3px 0 0 ${phaseColor}`,
  };

  const formattedAddress = [address, city, zip].filter(Boolean).join(', ');

  const handleDragEnd = (_, info) => {
    const threshold = 80;
    const velocity = info.velocity.x;

    if (info.offset.x > threshold || velocity > 500) {
      // Swipe right → Update Phase
      animate(x, 120, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped('right');
      setTimeout(() => {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
        setSwiped(null);
        onUpdatePhase?.(job);
      }, 400);
    } else if (info.offset.x < -threshold || velocity < -500) {
      // Swipe left → Flag
      animate(x, -120, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped('left');
      setTimeout(() => {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
        setSwiped(null);
        onFlag?.(job);
      }, 400);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: '12px',
        animationDelay: `${index * 25}ms`,
        animation: 'staggerFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        opacity: 0,
      }}
    >
      {/* Swipe-right background: Update Phase (green) */}
      <motion.div
        className="absolute inset-0 flex items-center pl-5 rounded-xl"
        style={{
          background: '#10B981',
          opacity: bgRight,
          borderRadius: '12px',
        }}
      >
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Check className="w-5 h-5" />
          <span>Update Phase</span>
        </div>
      </motion.div>

      {/* Swipe-left background: Flag (red) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl"
        style={{
          background: '#EF4444',
          opacity: bgLeft,
          borderRadius: '12px',
        }}
      >
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <span>Flag</span>
          <Flag className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Draggable card body */}
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.1}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative cursor-pointer touch-pan-y active:scale-[0.99]"
        onClick={() => !swiped && onClick?.(job)}
        role="article"
        aria-label={`Job ${id} at ${address}`}
      >
        <div
          style={{
            background: '#111318',
            border: '1px solid #1F2430',
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
              style={{ color: '#475569', fontWeight: 500 }}
            >
              #{id}
            </span>
          </div>

          {/* Row 2: Address */}
          <p
            className="font-medium truncate mb-3"
            style={{ color: '#F1F5F9', fontSize: '15px', lineHeight: 1.4 }}
          >
            {formattedAddress || 'No address'}
          </p>

          {/* Row 3: Phase track + phase name */}
          <div className="flex items-center gap-3 mb-3">
            <PhaseTrack currentPhase={phase} compact />
            <div className="flex items-baseline gap-2 min-w-0">
              <span
                className="font-semibold whitespace-nowrap"
                style={{ color: phaseColor, fontSize: '13px' }}
              >
                {phaseInfo.label}
              </span>
              <span
                className="font-mono text-xs tabular-nums"
                style={{ color: '#475569' }}
              >
                {daysInPhase}d
              </span>
            </div>
          </div>

          {/* Row 4: Action buttons */}
          <div className="flex items-center gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-xs transition-colors duration-150 hover:bg-white/5 active:scale-[0.97]"
              style={{ color: '#94A3B8', height: '36px' }}
              onClick={(e) => { e.stopPropagation(); onUpdatePhase?.(job); }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Update</span>
            </button>

            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-xs transition-colors duration-150 hover:bg-white/5 active:scale-[0.97]"
              style={{ color: '#94A3B8', height: '36px' }}
              onClick={(e) => { e.stopPropagation(); onViewDetail?.(job); }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detail</span>
            </button>

            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-xs transition-colors duration-150 hover:bg-red-500/10 active:scale-[0.97]"
              style={{ color: '#475569', height: '36px' }}
              onClick={(e) => { e.stopPropagation(); onFlag?.(job); }}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Flag</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
