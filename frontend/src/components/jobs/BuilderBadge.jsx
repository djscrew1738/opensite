/**
 * BuilderBadge Component
 * Colored pill showing builder identity
 * 
 * @module components/jobs/BuilderBadge
 */

import { memo } from 'react';
import { getBuilder } from '../../styles/tokens';

/**
 * BuilderBadge — Colored pill showing builder identity
 * DRH = blue, HH = amber, others = purple with initials
 * 
 * @param {{builder: string, size?: 'xs' | 'sm' | 'md'}} props
 */
const BuilderBadge = memo(function BuilderBadge({ builder, size = 'sm' }) {
  const b = getBuilder(builder);

  const sizeStyles = {
    xs: { fontSize: '10px', padding: '1px 6px' },
    sm: { fontSize: '11px', padding: '2px 8px' },
    md: { fontSize: '12px', padding: '3px 10px' },
  };

  return (
    <span
      className="inline-flex items-center font-bold uppercase tracking-wide"
      style={{
        ...sizeStyles[size],
        background: b.bg,
        color: b.color,
        borderRadius: '6px',
        border: `1px solid ${b.color}25`,
        letterSpacing: '0.05em',
        lineHeight: 1.4,
      }}
      title={b.label}
    >
      {b.abbr}
    </span>
  );
});

BuilderBadge.displayName = 'BuilderBadge';

export default BuilderBadge;
