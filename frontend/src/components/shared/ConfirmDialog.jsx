import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, variant = 'danger' }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl border border-concrete-200 dark:border-gray-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger' ? 'bg-red-100 dark:bg-red-950/30' : 'bg-amber-100 dark:bg-amber-950/30'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
            <button onClick={onConfirm} className={`btn text-sm text-white ${
              variant === 'danger' ? 'btn-danger' : 'btn-primary'
            }`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
