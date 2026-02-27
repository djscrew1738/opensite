import { FileText, Image, FileSpreadsheet, File, FileCode } from 'lucide-react';
import { getFileIconType } from './utils/uploadUtils';

/**
 * FileIcon Component
 * Displays appropriate icon based on file type
 * 
 * @param {Object} props
 * @param {string} props.type - File type or filename
 * @param {string} props.className - Additional classes for the icon
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg'
 */
export default function FileIcon({ type, className = '', size = 'md' }) {
  // If type looks like a filename, extract icon type from it
  const iconType = type?.includes('.') ? getFileIconType(type) : type;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconClass = `${sizeClasses[size] || sizeClasses.md} ${className}`;

  switch (iconType) {
    case 'pdf':
      return <FileText className={`${iconClass} text-[#EF4444]`} />;
    case 'image':
      return <Image className={`${iconClass} text-[#3B82F6]`} />;
    case 'word':
      return <FileText className={`${iconClass} text-[#3B82F6]`} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={`${iconClass} text-[#10B981]`} />;
    case 'markdown':
      return <FileCode className={`${iconClass} text-[#8B5CF6]`} />;
    default:
      return <File className={`${iconClass} text-[#94A3B8]`} />;
  }
}

/**
 * FileIconWithBg - File icon with background container
 */
export function FileIconWithBg({ type, size = 'md', bgClass = '' }) {
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
}
