/**
 * FileQueueItem Component
 * Displays a single file in the upload queue with status
 * 
 * @module components/upload/FileQueueItem
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, RotateCw, Trash2 } from 'lucide-react';
import FileIcon from './FileIcon';
import { formatFileSize } from './utils';
import { colors } from '../../styles/tokens';

/**
 * FileQueueItem - Single file in upload queue
 * 
 * @param {{
 *   item: {
 *     id: string,
 *     name: string,
 *     size: number,
 *     icon: string,
 *     pipeline: string,
 *     status: 'queued' | 'uploading' | 'processing' | 'complete' | 'error',
 *     progress?: number,
 *     error?: string
 *   },
 *   onRemove: (id: string) => void,
 *   onRetry: (id: string) => void
 * }} props
 */
const FileQueueItem = memo(function FileQueueItem({ item, onRemove, onRetry }) {
  const statusConfig = {
    queued: { label: 'Queued', color: colors.text.muted },
    uploading: { label: `${item.progress}%`, color: colors.accent.DEFAULT },
    processing: { icon: Loader2, color: colors.warning.DEFAULT, spin: true },
    complete: { icon: CheckCircle2, color: colors.success.DEFAULT },
    error: { color: colors.danger.DEFAULT },
  };

  const status = statusConfig[item.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ 
        backgroundColor: colors.surface.primary, 
        border: `1px solid ${colors.border.default}` 
      }}
    >
      <FileIcon type={item.icon} />

      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium truncate"
          style={{ color: colors.text.primary }}
        >
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span 
            className="text-xs"
            style={{ color: colors.text.muted }}
          >
            {formatFileSize(item.size)}
          </span>
          <span style={{ color: colors.text.secondary }}>·</span>
          <span 
            className="text-xs"
            style={{ color: colors.text.muted }}
          >
            {item.pipeline}
          </span>
        </div>

        {/* Progress bar */}
        {item.status === 'uploading' && (
          <div 
            className="w-full h-1.5 rounded-full mt-2 overflow-hidden"
            style={{ backgroundColor: colors.surface.elevated }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: colors.accent.DEFAULT }}
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Error message */}
        {item.status === 'error' && item.error && (
          <p 
            className="text-xs mt-1"
            style={{ color: colors.danger.DEFAULT }}
          >
            {item.error}
          </p>
        )}
      </div>

      {/* Status / Actions */}
      <div className="shrink-0 flex items-center gap-1">
        {item.status === 'queued' && (
          <span 
            className="text-xs"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        )}
        {item.status === 'uploading' && (
          <span 
            className="text-xs font-medium"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        )}
        {item.status === 'processing' && status.icon && (
          <status.icon 
            className="w-4 h-4 animate-spin" 
            style={{ color: status.color }}
          />
        )}
        {item.status === 'complete' && status.icon && (
          <status.icon 
            className="w-4 h-4" 
            style={{ color: status.color }}
          />
        )}
        {item.status === 'error' && (
          <button
            onClick={() => onRetry?.(item.id)}
            className="p-1 rounded-md transition-colors"
            style={{ color: colors.warning.DEFAULT }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surface.elevated;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Retry"
            aria-label={`Retry upload for ${item.name}`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onRemove?.(item.id)}
          className="p-1 rounded-md transition-colors"
          style={{ color: colors.text.muted }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.danger.muted;
            e.currentTarget.style.color = colors.danger.DEFAULT;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.text.muted;
          }}
          title="Remove"
          aria-label={`Remove ${item.name} from queue`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
});

FileQueueItem.displayName = 'FileQueueItem';

export default FileQueueItem;
