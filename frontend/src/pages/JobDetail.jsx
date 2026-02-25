import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, MapPin, FileText, Trash2,
  Loader2, Image, FileSpreadsheet, File, CheckCircle2,
  Clock, AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { uploadApi } from '../api/upload';
import { UploadDropzone } from '../components/upload';
import { ConfirmDialog } from '../components/shared';
import { useToast } from '../hooks/useToast';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function FileIcon({ category, mime, className = 'w-5 h-5' }) {
  if (category === 'image' || (mime && mime.startsWith('image/'))) {
    return <Image className={`${className} text-[#3B82F6]`} />;
  }
  if (mime === 'application/pdf') {
    return <FileText className={`${className} text-[#EF4444]`} />;
  }
  if (mime && (mime.includes('spreadsheet') || mime.includes('excel'))) {
    return <FileSpreadsheet className={`${className} text-[#10B981]`} />;
  }
  if (mime && mime.includes('word')) {
    return <FileText className={`${className} text-[#3B82F6]`} />;
  }
  return <File className={`${className} text-[#94A3B8]`} />;
}

function PipelineStatus({ status }) {
  if (status === 'complete') return (
    <span className="flex items-center gap-1 text-xs text-[#10B981]">
      <CheckCircle2 className="w-3 h-3" /> Ready
    </span>
  );
  if (status === 'processing') return (
    <span className="flex items-center gap-1 text-xs text-[#F59E0B]">
      <Loader2 className="w-3 h-3 animate-spin" /> Processing
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
      <AlertCircle className="w-3 h-3" /> Failed
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-[#64748B]">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const [fileToDelete, setFileToDelete] = useState(null);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.projects.getOne(id),
    enabled: !!id,
  });

  const { data: files = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery({
    queryKey: ['job-files', id],
    queryFn: () => uploadApi.getFiles({ jobId: id }),
    enabled: !!id,
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId) => uploadApi.deleteFile(fileId),
    onSuccess: () => {
      toastSuccess('File deleted');
      queryClient.invalidateQueries({ queryKey: ['job-files', id] });
      setFileToDelete(null);
    },
    onError: () => toastError('Failed to delete file'),
  });

  const handleFiles = async (fileList) => {
    try {
      await uploadApi.upload(Array.from(fileList), { jobId: id });
      toastSuccess(`${fileList.length} file${fileList.length !== 1 ? 's' : ''} uploading…`);
      // Poll briefly to refresh
      setTimeout(() => refetchFiles(), 1500);
      setTimeout(() => refetchFiles(), 4000);
    } catch (err) {
      toastError(err?.response?.data?.error || 'Upload failed');
    }
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-[#EF4444]" />
        <p className="text-[#94A3B8]">Job not found</p>
        <button onClick={() => navigate('/jobs')} className="text-sm text-[#3B82F6] hover:underline">
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col page-transition-wrapper">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #1F2430' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/jobs')}
            className="p-2 rounded-lg hover:bg-[#181C24] transition-colors"
            style={{ color: '#64748B' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>{job.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {job.builder && (
                <span className="flex items-center gap-1 text-sm" style={{ color: '#94A3B8' }}>
                  <Building2 className="w-3.5 h-3.5" />
                  {job.builder}
                </span>
              )}
              {job.phase && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}
                >
                  {job.phase}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Job info card */}
        {job.notes && (
          <div
            className="p-4 rounded-xl"
            style={{ background: '#111318', border: '1px solid #1F2430' }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>Notes</p>
            <p className="text-sm" style={{ color: '#F1F5F9' }}>{job.notes}</p>
          </div>
        )}

        {/* Files section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: '#F1F5F9' }}>
              Attached Files
              {files.length > 0 && (
                <span className="ml-2 text-sm font-normal" style={{ color: '#64748B' }}>
                  ({files.length})
                </span>
              )}
            </h2>
          </div>

          <UploadDropzone onFiles={handleFiles} compact className="mb-4" />

          {filesLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#3B82F6' }} />
            </div>
          ) : files.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl"
              style={{ background: '#111318', border: '1px solid #1F2430' }}
            >
              <File className="w-8 h-8 mb-2" style={{ color: '#2D3548' }} />
              <p className="text-sm" style={{ color: '#64748B' }}>No files attached yet</p>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>Drop files above to attach them</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: '#111318', border: '1px solid #1F2430' }}
                >
                  <FileIcon category={file.category} mime={file.mime_type} className="w-8 h-8 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F1F5F9' }}>
                      {file.original_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: '#64748B' }}>{formatSize(file.size_bytes)}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>·</span>
                      <PipelineStatus status={file.pipeline_status} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{formatDate(file.created_at)}</p>
                  </div>
                  <button
                    onClick={() => setFileToDelete(file)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#64748B' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {fileToDelete && (
        <ConfirmDialog
          title="Delete File?"
          message={`Delete "${fileToDelete.original_name}"? This cannot be undone.`}
          confirmLabel={deleteFileMutation.isPending ? 'Deleting…' : 'Delete'}
          onConfirm={() => deleteFileMutation.mutate(fileToDelete.id)}
          onCancel={() => setFileToDelete(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
