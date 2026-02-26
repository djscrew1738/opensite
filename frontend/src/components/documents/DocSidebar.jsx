import { useRef, useEffect } from 'react';
import { FileText, Trash2, Loader2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * DocSidebar — Sidebar listing uploaded text documents.
 * Dark Forge design system with inline styles for custom colors.
 *
 * @param {Array}    documents   - Array of document objects
 * @param {string}   selectedId  - Currently selected document ID
 * @param {Function} onSelect    - Called with document ID on click
 * @param {Function} onDelete    - Called with document ID on delete
 * @param {boolean}  isLoading   - Show skeleton loading state
 */

// ── Helpers ────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

function truncateName(name, max = 28) {
  if (!name || name.length <= max) return name;
  const ext = name.lastIndexOf('.');
  if (ext === -1) return name.slice(0, max - 3) + '...';
  const extension = name.slice(ext);
  const stem = name.slice(0, ext);
  const available = max - extension.length - 3;
  if (available <= 0) return name.slice(0, max - 3) + '...';
  return stem.slice(0, available) + '...' + extension;
}

function formatWordCount(count) {
  if (count == null) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

// ── Status badge config ────────────────────────────────────

const STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.2)',
    icon: Loader2,
    pulse: true,
  },
  ready: {
    label: 'Ready',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.2)',
    icon: CheckCircle2,
    pulse: false,
  },
  error: {
    label: 'Error',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.2)',
    icon: AlertCircle,
    pulse: false,
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.processing;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium leading-none"
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <Icon
        className={`w-3 h-3 ${config.pulse ? 'animate-spin' : ''}`}
        style={{ color: config.color }}
      />
      {config.label}
    </span>
  );
}

// ── Skeleton rows ──────────────────────────────────────────

function SkeletonRow({ delay = 0 }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-3"
      style={{
        borderBottom: '1px solid #1F2430',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Icon placeholder */}
      <div
        className="w-8 h-8 rounded-lg flex-shrink-0 skeleton-shimmer"
        style={{ background: '#181C24' }}
      />
      {/* Text placeholders */}
      <div className="flex-1 space-y-2">
        <div
          className="h-3.5 rounded skeleton-shimmer"
          style={{ background: '#181C24', width: '75%' }}
        />
        <div
          className="h-2.5 rounded skeleton-shimmer"
          style={{ background: '#181C24', width: '50%' }}
        />
      </div>
      {/* Badge placeholder */}
      <div
        className="w-14 h-5 rounded skeleton-shimmer flex-shrink-0"
        style={{ background: '#181C24' }}
      />
    </div>
  );
}

// ── Document row ───────────────────────────────────────────

function DocRow({ doc, isSelected, onSelect, onDelete }) {
  const wordCount = formatWordCount(doc.word_count);
  const timeAgo = relativeTime(doc.created_at);

  return (
    <div
      data-doc-id={doc.id}
      onClick={() => onSelect(doc.id)}
      className="group flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors"
      style={{
        background: isSelected ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
        borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
        borderBottom: '1px solid #1F2430',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = '#111318';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* File icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isSelected
            ? 'rgba(59, 130, 246, 0.12)'
            : '#181C24',
        }}
      >
        <FileText
          className="w-4 h-4"
          style={{
            color: isSelected ? '#3B82F6' : '#64748B',
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + status row */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: '#F1F5F9' }}
            title={doc.original_name}
          >
            {truncateName(doc.original_name)}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={doc.status} />
          {wordCount && (
            <span
              className="text-[11px]"
              style={{
                color: '#64748B',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {wordCount}
            </span>
          )}
        </div>

        {/* Time */}
        {timeAgo && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" style={{ color: '#475569' }} />
            <span className="text-[11px]" style={{ color: '#475569' }}>
              {timeAgo}
            </span>
          </div>
        )}
      </div>

      {/* Delete button — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(doc.id);
        }}
        className="flex-shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          color: '#64748B',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#EF4444';
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#64748B';
          e.currentTarget.style.background = 'transparent';
        }}
        title="Delete document"
        aria-label={`Delete ${doc.original_name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function DocSidebar({
  documents = [],
  selectedId,
  onSelect,
  onDelete,
  isLoading = false,
}) {
  const scrollContainerRef = useRef(null);

  // Auto-scroll selected document into view when selection changes
  useEffect(() => {
    if (!selectedId || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector(`[data-doc-id="${selectedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  // Loading state — 3 skeleton rows
  if (isLoading) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#111318',
          border: '1px solid #1F2430',
        }}
      >
        <div
          className="px-3 py-2.5"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#64748B' }}
          >
            Documents
          </span>
        </div>
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} delay={i * 50} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!documents || documents.length === 0) {
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#111318',
          border: '1px solid #1F2430',
        }}
      >
        <div
          className="px-3 py-2.5"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#64748B' }}
          >
            Documents
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: '#181C24' }}
          >
            <FileText className="w-6 h-6" style={{ color: '#475569' }} />
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: '#94A3B8' }}
          >
            No documents uploaded yet
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: '#475569' }}
          >
            Upload a document to get started
          </p>
        </div>
      </div>
    );
  }

  // Document list
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#111318',
        border: '1px solid #1F2430',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1F2430' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#64748B' }}
        >
          Documents
        </span>
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded"
          style={{
            color: '#94A3B8',
            background: '#181C24',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {documents.length}
        </span>
      </div>

      {/* Scrollable list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {documents.map((doc) => (
          <DocRow
            key={doc.id}
            doc={doc}
            isSelected={doc.id === selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
