/**
 * OverviewDashboard Component
 * Dashboard view showing job statistics and recent jobs list
 * 
 * @module components/jobs/OverviewDashboard
 */

import { memo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, Clock, CheckCircle2, DollarSign, ChevronRight,
  Trash2, ChevronDown, Paperclip, ExternalLink, File
} from 'lucide-react';
import { NoJobsEmpty } from '../empty-states';
import { AccessibleCard } from '../ui';
import { UploadDropzone } from '../upload';
import { uploadApi } from '../../api/upload';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Array<{key: string, label: string, icon: React.ComponentType, color: string, isCurrency?: boolean}>} */
const STAT_CARDS = [
  { key: 'active', label: 'Active Jobs', icon: HardHat, color: colors.accent.DEFAULT },
  { key: 'pending', label: 'Pending', icon: Clock, color: colors.warning.DEFAULT },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: colors.success.DEFAULT },
  { key: 'totalValue', label: 'Total Value', icon: DollarSign, color: colors.accent.purple, isCurrency: true },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Job files preview panel
 * @param {{jobId: string}} props
 */
const JobFilesPreview = memo(function JobFilesPreview({ jobId }) {
  const navigate = useNavigate();
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['job-files', jobId],
    queryFn: () => uploadApi.getFiles({ jobId }),
  });

  const handleFiles = useCallback(async (fileList) => {
    await uploadApi.upload(Array.from(fileList), { jobId });
  }, [jobId]);

  return (
    <div
      className="mt-2 p-3 rounded-b-xl space-y-3"
      style={{ 
        backgroundColor: colors.surface.primary, 
        border: `1px solid ${colors.border.default}`, 
        borderTop: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* File count + view link */}
      <div className="flex items-center justify-between">
        <span 
          className="flex items-center gap-1.5 text-xs"
          style={{ color: colors.text.muted }}
        >
          <Paperclip className="w-3.5 h-3.5" />
          {isLoading ? '…' : `${files.length} file${files.length !== 1 ? 's' : ''} attached`}
        </span>
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: colors.accent.DEFAULT }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.light}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
        >
          View full details
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* File thumbnails */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.slice(0, 6).map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
              style={{ 
                backgroundColor: colors.surface.elevated, 
                border: `1px solid ${colors.border.default}`, 
                color: colors.text.secondary,
              }}
              title={file.original_name}
            >
              <File className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[100px]">{file.original_name}</span>
            </div>
          ))}
          {files.length > 6 && (
            <div
              className="flex items-center px-2 py-1 rounded-lg text-xs"
              style={{ 
                backgroundColor: colors.surface.elevated, 
                border: `1px solid ${colors.border.default}`, 
                color: colors.text.muted,
              }}
            >
              +{files.length - 6} more
            </div>
          )}
        </div>
      )}

      {/* Compact dropzone */}
      <UploadDropzone compact onFiles={handleFiles} />
    </div>
  );
});

JobFilesPreview.displayName = 'JobFilesPreview';

/**
 * Stat card displaying job metrics
 * @param {{stat: typeof STAT_CARDS[0], value: number}} props
 */
const StatCard = memo(function StatCard({ stat, value }) {
  const Icon = stat.icon;
  const displayValue = stat.isCurrency 
    ? `$${(value || 0).toLocaleString()}` 
    : (value || 0);

  return (
    <AccessibleCard
      isHoverable
      ariaLabel={`${stat.label}: ${displayValue}`}
      className="p-4"
      style={{
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.border.default}`,
        boxShadow: shadows.card,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${stat.color}20` }}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" style={{ color: stat.color }} />
        </div>
        <div>
          <p 
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {displayValue}
          </p>
          <p 
            className="text-xs"
            style={{ color: colors.text.muted }}
          >
            {stat.label}
          </p>
        </div>
      </div>
    </AccessibleCard>
  );
});

StatCard.displayName = 'StatCard';

/**
 * Individual job row in the list
 * @param {{
 *   job: Record<string, any>,
 *   isExpanded: boolean,
 *   onToggle: (e: React.MouseEvent) => void,
 *   onSelect: () => void,
 *   onDelete: (e: React.MouseEvent) => void
 * }} props
 */
const JobRow = memo(function JobRow({ 
  job, 
  isExpanded, 
  onToggle, 
  onSelect, 
  onDelete 
}) {
  return (
    <div className="relative group">
      <AccessibleCard
        isInteractive
        isHoverable
        onClick={onSelect}
        ariaLabel={`${job.name || 'Untitled Job'}, ${job.builder || 'No builder'}`}
        className={isExpanded ? 'rounded-b-none' : ''}
        style={{
          backgroundColor: colors.surface.card,
          border: `1px solid ${colors.border.default}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p 
              className="font-medium truncate"
              style={{ color: colors.text.primary }}
            >
              {job.name || 'Untitled'}
            </p>
            <p 
              className="text-sm"
              style={{ color: colors.text.muted }}
            >
              {job.builder} · {job.phase}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              style={{ color: colors.text.muted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.danger.DEFAULT;
                e.currentTarget.style.backgroundColor = colors.danger.muted;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.text.muted;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Delete Job"
              aria-label={`Delete ${job.name || 'job'}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg transition-all"
              style={{ color: colors.text.muted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.text.primary;
                e.currentTarget.style.backgroundColor = colors.surface.elevated;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.text.muted;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={isExpanded ? 'Collapse' : 'Show files'}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse file list' : 'Show attached files'}
            >
              <ChevronDown 
                className="w-4 h-4 transition-transform" 
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            <ChevronRight 
              className="w-5 h-5" 
              style={{ color: colors.text.muted }}
              aria-hidden="true" 
            />
          </div>
        </div>
      </AccessibleCard>

      {isExpanded && <JobFilesPreview jobId={job.id} />}
    </div>
  );
});

JobRow.displayName = 'JobRow';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * OverviewDashboard - Dashboard view for jobs
 * @param {{
 *   jobs: Array<Record<string, any>>,
 *   stats: Record<string, number>,
 *   onSelectJob: (job: any) => void,
 *   onDeleteJob: (job: any) => void
 * }} props
 */
const OverviewDashboard = memo(function OverviewDashboard({ 
  jobs, 
  stats, 
  onSelectJob, 
  onDeleteJob 
}) {
  const [expandedJobId, setExpandedJobId] = useState(null);

  const toggleExpand = useCallback((jobId, e) => {
    e.stopPropagation();
    setExpandedJobId(prev => prev === jobId ? null : jobId);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => (
          <StatCard
            key={stat.key}
            stat={stat}
            value={stats?.[stat.key] || 0}
          />
        ))}
      </div>

      {/* Recent Jobs */}
      <div>
        <h3 
          className="font-semibold mb-4"
          style={{ color: colors.text.primary }}
        >
          Recent Jobs
        </h3>
        {jobs.length === 0 ? (
          <AccessibleCard 
            ariaLabel="No jobs available"
            style={{
              backgroundColor: colors.surface.card,
              border: `1px solid ${colors.border.default}`,
            }}
          >
            <NoJobsEmpty onCreate={() => {}} />
          </AccessibleCard>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <JobRow
                key={job.id}
                job={job}
                isExpanded={expandedJobId === job.id}
                onToggle={(e) => toggleExpand(job.id, e)}
                onSelect={() => onSelectJob(job)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteJob(job);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

OverviewDashboard.displayName = 'OverviewDashboard';

export default OverviewDashboard;
