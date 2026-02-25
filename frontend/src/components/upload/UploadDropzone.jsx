import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, FileSpreadsheet, File } from 'lucide-react';

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.tiff,.tif,.webp,.dwg,.docx,.doc,.txt,.md,.csv,.html,.json,.xml,.xlsx,.xls';

export default function UploadDropzone({
  onFiles,
  compact = false,
  disabled = false,
  className = '',
  accept = ACCEPT,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (disabled) return;
    if (e.dataTransfer.files?.length > 0) {
      onFiles?.(e.dataTransfer.files);
    }
  }, [disabled, onFiles]);

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) {
      onFiles?.(e.target.files);
      e.target.value = ''; // Reset for re-select
    }
  };

  if (compact) {
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-[#3B82F6] bg-[#3B82F6]/5'
            : 'border-[#2D3548] hover:border-[#3B82F6]/40 bg-[#0F1117]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <Upload className="w-5 h-5 text-[#64748B] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-[#94A3B8]">
            {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200
        ${isDragging
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
            {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
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
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
