import { memo, useState } from 'react';
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

const STAT_CARDS = [
  { key: 'active', label: 'Active Jobs', icon: HardHat, color: '#3B82F6' },
  { key: 'pending', label: 'Pending', icon: Clock, color: '#F59E0B' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: '#10B981' },
  { key: 'totalValue', label: 'Total Value', icon: DollarSign, color: '#8B5CF6', isCurrency: true },
];

function JobFilesPreview({ jobId }) {
  const navigate = useNavigate();
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['job-files', jobId],
    queryFn: () => uploadApi.getFiles({ jobId }),
  });

  const handleFiles = async (fileList) => {
    await uploadApi.upload(Array.from(fileList), { jobId });
  };

  return (
    <div
      className="mt-2 p-3 rounded-b-xl space-y-3"
      style={{ background: '#0F1117', border: '1px solid #1F2430', borderTop: 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* File count + view link */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
          <Paperclip className="w-3.5 h-3.5" />
          {isLoading ? '…' : `${files.length} file${files.length !== 1 ? 's' : ''} attached`}
        </span>
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: '#3B82F6' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#60A5FA'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#3B82F6'}
        >
          View full details
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* File thumbnails */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.slice(0, 6).map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
              style={{ background: '#181C24', border: '1px solid #1F2430', color: '#94A3B8' }}
              title={f.original_name}
            >
              <File className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[100px]">{f.original_name}</span>
            </div>
          ))}
          {files.length > 6 && (
            <div
              className="flex items-center px-2 py-1 rounded-lg text-xs"
              style={{ background: '#181C24', border: '1px solid #1F2430', color: '#64748B' }}
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
}

const OverviewDashboard = memo(function OverviewDashboard({ jobs, stats, onSelectJob, onDeleteJob }) {
  const [expandedJobId, setExpandedJobId] = useState(null);

  const toggleExpand = (jobId, e) => {
    e.stopPropagation();
    setExpandedJobId(prev => prev === jobId ? null : jobId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => (
          <AccessibleCard
            key={stat.key}
            isHoverable
            ariaLabel={`${stat.label}: ${stat.isCurrency ? `$${(stats[stat.key] || 0).toLocaleString()}` : stats[stat.key] || 0}`}
            className="p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}20` }}
                aria-hidden="true"
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-100">
                  {stat.isCurrency ? `$${(stats[stat.key] || 0).toLocaleString()}` : stats[stat.key] || 0}
                </p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            </div>
          </AccessibleCard>
        ))}
      </div>

      {/* Recent Jobs */}
      <div>
        <h3 className="font-semibold mb-4 text-surface-100">Recent Jobs</h3>
        {jobs.length === 0 ? (
          <AccessibleCard ariaLabel="No jobs available">
            <NoJobsEmpty onCreate={() => {}} />
          </AccessibleCard>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => {
              const isExpanded = expandedJobId === job.id;
              return (
                <div key={job.id} className="relative group">
                  <AccessibleCard
                    isInteractive
                    isHoverable
                    onClick={() => onSelectJob(job)}
                    ariaLabel={`${job.name || 'Untitled Job'}, ${job.builder || 'No builder'}`}
                    className={`flex items-center justify-between ${isExpanded ? 'rounded-b-none' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-100 truncate">
                        {job.name || 'Untitled'}
                      </p>
                      <p className="text-sm text-surface-500">
                        {job.builder} · {job.phase}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteJob(job);
                        }}
                        className="p-2 text-surface-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => toggleExpand(job.id, e)}
                        className="p-2 text-surface-500 hover:text-surface-100 hover:bg-[#181C24] rounded-lg transition-all"
                        title={isExpanded ? 'Collapse' : 'Show files'}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <ChevronRight className="w-5 h-5 text-surface-500" aria-hidden="true" />
                    </div>
                  </AccessibleCard>

                  {isExpanded && <JobFilesPreview jobId={job.id} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default OverviewDashboard;
