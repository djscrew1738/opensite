/**
 * FileIcon Component
 * Displays appropriate icon based on file type
 * 
 * @module components/upload/FileIcon
 */

import { memo } from 'react';
import { FileText, Image, FileSpreadsheet, File, FileCode } from 'lucide-react';
import { getFileIconType } from './utils/uploadUtils';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Record<string, string>} */
const FILE_ICON_COLORS = {
  pdf: colors.danger.DEFAULT,
  image: colors.accent.DEFAULT,
  word: colors.accent.DEFAULT,
  spreadsheet: colors.success.DEFAULT,
  markdown: colors.accent.purple,
  default: colors.text.secondary,
};

/** @type {Record<string, string>} */
const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * FileIcon - Displays appropriate icon based on file type
 * 
 * @param {{
 *   type: string,
 *   className?: string,
 *   size?: 'sm' | 'md' | 'lg'
 * }} props
 */
const FileIcon = memo(function FileIcon({ type, className = '', size = 'md' }) {
  // If type looks like a filename, extract icon type from it
  const iconType = type?.includes('.') ? getFileIconType(type) : type;

  const iconClass = `${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`;
  const iconColor = FILE_ICON_COLORS[iconType] || FILE_ICON_COLORS.default;

  switch (iconType) {
    case 'pdf':
      return <FileText className={iconClass} style={{ color: iconColor }} />;
    case 'image':
      return <Image className={iconClass} style={{ color: iconColor }} />;
    case 'word':
      return <FileText className={iconClass} style={{ color: iconColor }} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={iconClass} style={{ color: iconColor }} />;
    case 'markdown':
      return <FileCode className={iconClass} style={{ color: iconColor }} />;
    default:
      return <File className={iconClass} style={{ color: iconColor }} />;
  }
});

FileIcon.displayName = 'FileIcon';

// ═══════════════════════════════════════════════════════════════
// With Background Variant
// ═══════════════════════════════════════════════════════════════

/**
 * FileIconWithBg - File icon with background container
 * 
 * @param {{
 *   type: string,
 *   size?: 'sm' | 'md' | 'lg',
 *   bgClass?: string
 * }} props
 */
export const FileIconWithBg = memo(function FileIconWithBg({ 
  type, 
  size = 'md', 
  bgClass = '' 
}) {
  const sizeConfig = {
    sm: { container: 'w-8 h-8', icon: 'sm' },
    md: { container: 'w-10 h-10', icon: 'md' },
    lg: { container: 'w-12 h-12', icon: 'lg' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`${config.container} rounded-xl flex items-center justify-center ${bgClass}`}>
      <FileIcon type={type} size={config.icon} />
    </div>
  );
});

FileIconWithBg.displayName = 'FileIconWithBg';

export default FileIcon;
