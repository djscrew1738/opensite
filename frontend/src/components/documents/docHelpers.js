import { FileText, Image } from 'lucide-react';

// Document types configuration
export const FILE_TYPES = {
  pdf:  { icon: FileText, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)',   label: 'PDF'  },
  png:  { icon: Image,    color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)',  label: 'PNG'  },
  jpg:  { icon: Image,    color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)',  label: 'JPG'  },
  jpeg: { icon: Image,    color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)',  label: 'JPEG' },
  tiff: { icon: Image,    color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'TIFF' },
  tif:  { icon: Image,    color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', label: 'TIF'  },
  webp: { icon: Image,    color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)',  label: 'WebP' },
  dwg:  { icon: FileText, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)',  label: 'DWG'  },
};

// View modes
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

// Format helpers
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
