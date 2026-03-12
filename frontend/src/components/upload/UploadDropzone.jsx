/**
 * UploadDropzone Component
 * Reusable dropzone for file uploads with compact and full variants
 * 
 * @module components/upload/UploadDropzone
 */

import { memo, useCallback } from 'react';
import { Upload, FileText, Image, FileSpreadsheet, File } from 'lucide-react';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const DEFAULT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.tiff,.tif,.webp,.dwg,.docx,.doc,.txt,.md,.csv,.html,.json,.xml,.xlsx,.xls';

const FILE_ICONS = [
  { Icon: FileText, color: colors.danger.DEFAULT },
  { Icon: Image, color: colors.accent.DEFAULT },
  { Icon: FileSpreadsheet, color: colors.success.DEFAULT },
  { Icon: File, color: colors.accent.purple },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * File type icons row
 */
const FileTypeIcons = memo(function FileTypeIcons() {
  return (
    <div className="flex items-center gap-3 mt-3">
      {FILE_ICONS.map(({ Icon, color }, i) => (
        <Icon 
          key={i} 
          className="w-4 h-4" 
          style={{ color: `${color}99` }} // 60% opacity
          aria-hidden="true" 
        />
      ))}
    </div>
  );
});

FileTypeIcons.displayName = 'FileTypeIcons';

/**
 * Compact dropzone variant
 */
const CompactDropzone = memo(function CompactDropzone({
  isDragging,
  disabled,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  inputRef,
  onChange,
  accept,
  className,
}) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        borderColor: isDragging ? colors.accent.DEFAULT : colors.border.strong,
        backgroundColor: isDragging ? colors.accent.muted : colors.surface.primary,
      }}
    >
      <Upload 
        className="w-5 h-5 shrink-0" 
        style={{ color: colors.text.muted }}
      />
      <div className="min-w-0">
        <p 
          className="text-sm"
          style={{ color: colors.text.secondary }}
        >
          {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
});

CompactDropzone.displayName = 'CompactDropzone';

/**
 * Full dropzone variant
 */
const FullDropzone = memo(function FullDropzone({
  isDragging,
  disabled,
  onClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  inputRef,
  onChange,
  accept,
  className,
  children,
}) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        borderColor: isDragging ? colors.accent.DEFAULT : colors.border.strong,
        backgroundColor: isDragging ? colors.accent.muted : `${colors.surface.primary}80`,
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {children || (
        <>
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: colors.surface.elevated }}
          >
            <Upload 
              className="w-6 h-6" 
              style={{ color: colors.accent.DEFAULT }}
            />
          </div>
          <p 
            className="text-sm font-medium mb-1"
            style={{ color: colors.text.primary }}
          >
            {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
          </p>
          <p 
            className="text-xs text-center"
            style={{ color: colors.text.muted }}
          >
            PDF, Images, Docs, Spreadsheets — up to 100MB each
          </p>
          <FileTypeIcons />
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
});

FullDropzone.displayName = 'FullDropzone';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * UploadDropzone - Reusable dropzone for file uploads
 * 
 * @param {{
 *   onFiles: (files: FileList) => void,
 *   compact?: boolean,
 *   disabled?: boolean,
 *   className?: string,
 *   accept?: string,
 *   children?: React.ReactNode
 * }} props
 */
const UploadDropzone = memo(function UploadDropzone({
  onFiles,
  compact = false,
  disabled = false,
  className = '',
  accept = DEFAULT_ACCEPT,
  children,
}) {
  const handleFiles = useCallback((files) => {
    onFiles?.(files);
  }, [onFiles]);

  const dragDrop = useDragDrop({ disabled, onDrop: handleFiles });
  const fileInput = useFileInput({ disabled, onSelect: handleFiles });

  const commonProps = {
    isDragging: dragDrop.isDragging,
    disabled,
    onClick: fileInput.handlers.onClick,
    onDragEnter: dragDrop.handlers.onDragEnter,
    onDragLeave: dragDrop.handlers.onDragLeave,
    onDragOver: dragDrop.handlers.onDragOver,
    onDrop: dragDrop.handlers.onDrop,
    inputRef: fileInput.inputRef,
    onChange: fileInput.handlers.onChange,
    accept,
    className,
  };

  if (compact) {
    return <CompactDropzone {...commonProps} />;
  }

  return <FullDropzone {...commonProps}>{children}</FullDropzone>;
});

UploadDropzone.displayName = 'UploadDropzone';

export default UploadDropzone;
