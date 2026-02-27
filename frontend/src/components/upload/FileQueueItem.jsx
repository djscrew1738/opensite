import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, RotateCw, Trash2 } from 'lucide-react';
import FileIcon from './FileIcon';
import { formatFileSize } from './utils';

/**
 * FileQueueItem Component
 * Displays a single file in the upload queue with status
 * 
 * @param {Object} props
 * @param {Object} props.item - File queue item
 * @param {Function} props.onRemove - Called when remove button clicked
 * @param {Function} props.onRetry - Called when retry button clicked
 */
export default function FileQueueItem({ item, onRemove, onRetry }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1117] border border-[#1F2430]"
    >
      <FileIcon type={item.icon} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#F1F5F9] truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#64748B]">{formatFileSize(item.size)}</span>
          <span className="text-xs text-[#475569]">·</span>
          <span className="text-xs text-[#64748B]">{item.pipeline}</span>
        </div>

        {/* Progress bar */}
        {item.status === 'uploading' && (
          <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden bg-[#181C24]">
            <motion.div
              className="h-full bg-[#3B82F6] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Error message */}
        {item.status === 'error' && (
          <p className="text-xs text-[#EF4444] mt-1">{item.error}</p>
        )}
      </div>

      {/* Status / Actions */}
      <div className="shrink-0 flex items-center gap-1">
        {item.status === 'queued' && (
          <span className="text-xs text-[#64748B]">Queued</span>
        )}
        {item.status === 'uploading' && (
          <span className="text-xs text-[#3B82F6] font-medium">{item.progress}%</span>
        )}
        {item.status === 'processing' && (
          <Loader2 className="w-4 h-4 text-[#F59E0B] animate-spin" />
        )}
        {item.status === 'complete' && (
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
        )}
        {item.status === 'error' && (
          <button
            onClick={() => onRetry?.(item.id)}
            className="p-1 rounded-md hover:bg-[#181C24] text-[#F59E0B] transition-colors"
            title="Retry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onRemove?.(item.id)}
          className="p-1 rounded-md hover:bg-[#181C24] text-[#64748B] hover:text-[#EF4444] transition-colors"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
