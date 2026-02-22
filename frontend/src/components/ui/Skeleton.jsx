/**
 * Dark Forge Skeleton System
 * Shimmer uses card surface as base, elevated surface as highlight
 * 1.5s animation, left-to-right, loops
 * 50ms stagger between items for organic feel
 */

// Base Skeleton
export const Skeleton = ({
  className = '',
  width,
  height,
  circle = false,
  style: extraStyle,
}) => (
  <div
    className={`skeleton-shimmer ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
    style={{ width: width || '100%', height: height || '1rem', ...extraStyle }}
  />
);

// Job Card Skeleton — matches card anatomy exactly
export const JobCardSkeleton = ({ delay = 0 }) => (
  <div
    className="rounded-xl p-4 space-y-3"
    style={{
      background: '#111318',
      border: '1px solid #1F2430',
      animationDelay: `${delay}ms`,
    }}
  >
    {/* Row 1: badge + ID */}
    <div className="flex items-center justify-between">
      <Skeleton width={36} height={18} style={{ borderRadius: '6px' }} />
      <Skeleton width={50} height={14} />
    </div>
    {/* Row 2: address */}
    <Skeleton width="85%" height={18} />
    {/* Row 3: phase dots */}
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} width={10} height={10} circle style={{ animationDelay: `${i * 50}ms` }} />
      ))}
      <Skeleton width={60} height={14} className="ml-2" />
    </div>
    {/* Row 4: action buttons */}
    <div className="flex gap-2 pt-1">
      <Skeleton width="33%" height={32} style={{ borderRadius: '6px' }} />
      <Skeleton width="33%" height={32} style={{ borderRadius: '6px' }} />
      <Skeleton width="33%" height={32} style={{ borderRadius: '6px' }} />
    </div>
  </div>
);

// Dashboard Skeleton — metrics + today's focus + cards
export const DashboardSkeleton = () => (
  <div className="space-y-6 p-4">
    {/* Metrics strip */}
    <div className="flex gap-3 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 rounded-xl p-3.5 space-y-2"
          style={{
            width: '140px',
            background: '#111318',
            border: '1px solid #1F2430',
            animationDelay: `${i * 50}ms`,
          }}
        >
          <Skeleton width={20} height={20} circle />
          <Skeleton width="70%" height={28} />
          <Skeleton width="50%" height={12} />
        </div>
      ))}
    </div>
    {/* Today's Focus */}
    <div className="space-y-2">
      <Skeleton width={120} height={20} />
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg p-3 flex items-center gap-3"
          style={{
            background: '#111318',
            border: '1px solid #1F2430',
            minHeight: '56px',
            animationDelay: `${(i + 5) * 50}ms`,
          }}
        >
          <Skeleton width={3} height={32} style={{ borderRadius: '2px' }} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="25%" height={14} className="ml-auto" />
        </div>
      ))}
    </div>
    {/* Job cards grid */}
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <JobCardSkeleton key={i} delay={(i + 8) * 50} />
      ))}
    </div>
  </div>
);

// Metrics Strip Skeleton
export const MetricsStripSkeleton = () => (
  <div className="flex gap-3 overflow-hidden">
    {[...Array(5)].map((_, i) => (
      <Skeleton
        key={i}
        width={140}
        height={80}
        style={{
          flexShrink: 0,
          borderRadius: '12px',
          animationDelay: `${i * 50}ms`,
        }}
      />
    ))}
  </div>
);

// Table Skeleton — header + 8 rows
export const TableSkeleton = ({ rows = 8, columns = 4 }) => (
  <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid #1F2430' }}>
    <div className="px-4 py-3 flex gap-4" style={{ borderBottom: '1px solid #1F2430' }}>
      {[...Array(columns)].map((_, i) => (
        <Skeleton key={i} height={16} className="flex-1" style={{ maxWidth: `${15 + i * 5}%` }} />
      ))}
    </div>
    {[...Array(rows)].map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="px-4 py-3 flex gap-4 items-center"
        style={{
          borderBottom: rowIndex < rows - 1 ? '1px solid #161A22' : 'none',
          minHeight: '56px',
        }}
      >
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            height={16}
            className="flex-1"
            style={{
              maxWidth: `${50 + Math.random() * 50}%`,
              animationDelay: `${(rowIndex * columns + colIndex) * 30}ms`,
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

// Canvas Skeleton — dark grid with ghost nodes
export const CanvasSkeleton = () => (
  <div
    className="h-screen flex"
    style={{ background: '#0A0B0D' }}
  >
    <div className="flex-1 relative">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(31,36,48,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(31,36,48,0.3) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Ghost nodes */}
      {[
        { x: '20%', y: '25%', w: 180 },
        { x: '55%', y: '35%', w: 160 },
        { x: '35%', y: '60%', w: 200 },
      ].map((node, i) => (
        <div
          key={i}
          className="absolute rounded-xl p-4 space-y-2"
          style={{
            left: node.x, top: node.y, width: node.w,
            background: '#111318', border: '1px solid #1F2430',
            animationDelay: `${i * 100}ms`,
          }}
        >
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={12} />
        </div>
      ))}
      {/* Ghost edges */}
      <svg className="absolute inset-0 pointer-events-none" style={{ opacity: 0.3 }}>
        <line x1="25%" y1="30%" x2="52%" y2="38%" stroke="#1F2430" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="40%" y1="40%" x2="40%" y2="58%" stroke="#1F2430" strokeWidth="2" strokeDasharray="6 4" />
      </svg>
    </div>
  </div>
);

// Alert Feed Skeleton
export const AlertFeedSkeleton = ({ count = 5 }) => (
  <div className="space-y-2">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="flex items-start gap-3 p-3 rounded-lg"
        style={{
          background: '#111318',
          border: '1px solid #1F2430',
          animationDelay: `${i * 50}ms`,
        }}
      >
        <Skeleton width={32} height={32} circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={16} />
          <Skeleton width="90%" height={14} />
        </div>
        <Skeleton width={40} height={12} />
      </div>
    ))}
  </div>
);

// Card Skeleton
export const CardSkeleton = ({ hasHeader = true, hasFooter = false, rows = 3 }) => (
  <div className="rounded-xl p-5" style={{ background: '#111318', border: '1px solid #1F2430' }}>
    {hasHeader && (
      <div className="flex items-center gap-4 mb-5">
        <Skeleton width={40} height={40} circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={14} />
        </div>
      </div>
    )}
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} width={`${80 + Math.random() * 20}%`} height={16} />
      ))}
    </div>
    {hasFooter && (
      <div className="flex justify-end gap-3 mt-5 pt-4" style={{ borderTop: '1px solid #1F2430' }}>
        <Skeleton width={80} height={36} style={{ borderRadius: '6px' }} />
        <Skeleton width={80} height={36} style={{ borderRadius: '6px' }} />
      </div>
    )}
  </div>
);

// Stat Card Skeleton
export const StatCardSkeleton = () => (
  <div className="rounded-xl p-5" style={{ background: '#111318', border: '1px solid #1F2430' }}>
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <Skeleton width={80} height={12} />
        <Skeleton width={100} height={32} />
        <Skeleton width={60} height={14} />
      </div>
      <Skeleton width={44} height={44} circle />
    </div>
  </div>
);

// List Item Skeleton
export const ListItemSkeleton = ({ hasAvatar = true }) => (
  <div className="flex items-center gap-4 py-3" style={{ minHeight: '56px' }}>
    {hasAvatar && <Skeleton width={40} height={40} circle />}
    <div className="flex-1 space-y-2">
      <Skeleton width="70%" height={16} />
      <Skeleton width="40%" height={12} />
    </div>
    <Skeleton width={60} height={24} />
  </div>
);

// Detail Panel Skeleton
export const DetailPanelSkeleton = () => (
  <div className="space-y-5">
    <div className="flex items-center gap-4">
      <Skeleton width={56} height={56} circle />
      <div className="space-y-2 flex-1">
        <Skeleton width={200} height={22} />
        <Skeleton width={140} height={16} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: '#111318', border: '1px solid #1F2430' }}>
          <Skeleton width={60} height={12} />
          <Skeleton width="80%" height={20} />
        </div>
      ))}
    </div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} width={`${70 + Math.random() * 30}%`} height={14} />
      ))}
    </div>
  </div>
);

export default Skeleton;
