import { Upload, FileText, Image, FileSpreadsheet, File } from 'lucide-react';
import { useDragDrop, useFileInput } from '../../hooks/upload/useDragDrop';

const DEFAULT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.tiff,.tif,.webp,.dwg,.docx,.doc,.txt,.md,.csv,.html,.json,.xml,.xlsx,.xls';

/**
 * UploadDropzone Component
 * Reusable dropzone for file uploads with compact and full variants
 * 
 * @param {Object} props
 * @param {Function} props.onFiles - Called with FileList when files are selected
 * @param {boolean} props.compact - Whether to show compact variant
 * @param {boolean} props.disabled - Whether dropzone is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.accept - Accepted file types (comma-separated)
 * @param {ReactNode} props.children - Custom content (full mode only)
 */
export default function UploadDropzone({
  onFiles,
  compact = false,
  disabled = false,
  className = '',
  accept = DEFAULT_ACCEPT,
  children,
}) {
  const handleFiles = (files) => {
    onFiles?.(files);
  };

  const dragDrop = useDragDrop({ disabled, onDrop: handleFiles });
  const fileInput = useFileInput({ disabled, onSelect: handleFiles });

  if (compact) {
    return (
      <div
        onDragEnter={dragDrop.handlers.onDragEnter}
        onDragLeave={dragDrop.handlers.onDragLeave}
        onDragOver={dragDrop.handlers.onDragOver}
        onDrop={dragDrop.handlers.onDrop}
        onClick={fileInput.handlers.onClick}
        className={`
          flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${dragDrop.isDragging
            ? 'border-[#3B82F6] bg-[#3B82F6]/5'
            : 'border-[#2D3548] hover:border-[#3B82F6]/40 bg-[#0F1117]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <Upload className="w-5 h-5 text-[#64748B] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-[#94A3B8]">
            {dragDrop.isDragging ? 'Drop files here' : 'Drop files or click to browse'}
          </p>
        </div>
        <input
          ref={fileInput.inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={fileInput.handlers.onChange}
        />
      </div>
    );
  }

  return (
    <div
      onDragEnter={dragDrop.handlers.onDragEnter}
      onDragLeave={dragDrop.handlers.onDragLeave}
      onDragOver={dragDrop.handlers.onDragOver}
      onDrop={dragDrop.handlers.onDrop}
      onClick={fileInput.handlers.onClick}
      className={`
        relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200
        ${dragDrop.isDragging
          ? 'border-[#3B82F6] bg-[#3B82F6]/5 scale-[1.01]'
          : 'border-[#2D3548] hover:border-[#3B82F6]/40 bg-[#0F1117]/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children || (
        <>
          <div className="w-12 h-12 rounded-xl bg-[#181C24] flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <p className="text-sm font-medium text-[#F1F5F9] mb-1">
            {dragDrop.isDragging ? 'Drop files here' : 'Drop files or click to browse'}
          </p>
          <p className="text-xs text-[#64748B] text-center">
            PDF, Images, Docs, Spreadsheets — up to 100MB each
          </p>
          <div className="flex items-center gap-3 mt-3">
            <FileText className="w-4 h-4 text-[#EF4444]/60" />
            <Image className="w-4 h-4 text-[#3B82F6]/60" />
            <FileSpreadsheet className="w-4 h-4 text-[#10B981]/60" />
            <File className="w-4 h-4 text-[#8B5CF6]/60" />
          </div>
        </>
      )}
      <input
        ref={fileInput.inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={fileInput.handlers.onChange}
      />
    </div>
  );
}
