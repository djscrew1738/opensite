import { FileText, Image } from 'lucide-react';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/**
 * File type configurations with icon, color, and label
 * Uses design tokens for consistent theming
 * @type {Object.<string, {icon: import('lucide-react').LucideIcon, color: string, bg: string, label: string}>}
 */
export const FILE_TYPES = {
  pdf:  { 
    icon: FileText, 
    color: colors.danger.DEFAULT, 
    bg: colors.danger.muted, 
    label: 'PDF' 
  },
  png:  { 
    icon: Image, 
    color: colors.accent.blue, 
    bg: colors.accent.muted, 
    label: 'PNG' 
  },
  jpg:  { 
    icon: Image, 
    color: colors.accent.blue, 
    bg: colors.accent.muted, 
    label: 'JPG' 
  },
  jpeg: { 
    icon: Image, 
    color: colors.accent.blue, 
    bg: colors.accent.muted, 
    label: 'JPEG' 
  },
  tiff: { 
    icon: Image, 
    color: colors.accent.purple, 
    bg: 'rgba(139, 92, 246, 0.1)', 
    label: 'TIFF' 
  },
  tif:  { 
    icon: Image, 
    color: colors.accent.purple, 
    bg: 'rgba(139, 92, 246, 0.1)', 
    label: 'TIF' 
  },
  webp: { 
    icon: Image, 
    color: colors.success.DEFAULT, 
    bg: colors.success.muted, 
    label: 'WebP' 
  },
  dwg:  { 
    icon: FileText, 
    color: colors.warning.DEFAULT, 
    bg: colors.warning.muted, 
    label: 'DWG' 
  },
};

/**
 * View mode constants for document display
 * @type {Object.<string, string>}
 */
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

// ═══════════════════════════════════════════════════════════════
// Format Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Formats a date string into a relative or absolute time string
 * @param {string} dateStr - ISO date string to format
 * @returns {string} Formatted date string (e.g., "5m ago", "2h ago", "Jan 15")
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats byte size into human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB", "256 KB", "512 B")
 */
export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
