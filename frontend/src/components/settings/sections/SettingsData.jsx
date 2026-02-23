import { memo } from 'react';
import {
  FileDown, Database, RotateCcw, AlertOctagon, Loader2
} from 'lucide-react';
import { Section } from '../primitives';
import ConfirmDialog from '../../shared/ConfirmDialog';

function SettingsData({
  exportingData,
  handleExportSettings,
  creatingBackup,
  handleCreateBackup,
  clearingCache,
  handleClearCache,
  refetchMetrics,
  refetchOllama,
  showToast,
  resetConfirm,
  setResetConfirm,
}) {
  return (
    <div className="space-y-6">
      <Section icon={FileDown} title="Export & Backup">
        <div className="space-y-3">
          {[
            { label: 'Export Settings', desc: 'Download all current settings as a JSON file', action: handleExportSettings, loading: exportingData, icon: FileDown },
            { label: 'Create Database Backup', desc: 'Snapshot the SQLite database to the backups folder on the server', action: handleCreateBackup, loading: creatingBackup, icon: Database },
          ].map(({ label, desc, action, loading, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <button onClick={action} disabled={loading} className="btn-secondary text-sm whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                {label.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={RotateCcw} title="Maintenance">
        <div className="space-y-3">
          {[
            { label: 'Clear API Cache', desc: 'Flush in-memory cache — all data will reload from the database on next request', action: handleClearCache, loading: clearingCache, color: 'warning' },
            { label: 'Refresh Metrics', desc: 'Reset AI usage counters and circuit breaker state', action: () => { refetchMetrics(); refetchOllama(); showToast('Metrics refreshed'); }, loading: false, color: 'normal' },
          ].map(({ label, desc, action, loading, color }) => (
            <div key={label} className={`flex items-center justify-between p-4 rounded-xl border ${
              color === 'warning' ? 'bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-800/40'
              : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200/60 dark:border-gray-700/60'
            }`}>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <button onClick={action} disabled={loading} className="btn-secondary text-sm whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Run
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={AlertOctagon} title="Danger Zone">
        <div className="p-4 border-2 border-red-200 dark:border-red-900/60 rounded-xl bg-red-50/50 dark:bg-red-950/10">
          <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">Factory Reset</p>
          <p className="text-xs text-red-700 dark:text-red-300 mb-4">Permanently deletes all settings, leads, estimates, and AI history. This action cannot be undone.</p>
          <button onClick={() => setResetConfirm(true)} className="btn-danger text-sm">
            <AlertOctagon className="w-4 h-4" /> Reset All Data
          </button>
        </div>
      </Section>

      {/* Reset Confirmation */}
      {resetConfirm && (
        <ConfirmDialog
          title="Factory Reset?"
          message="Are you absolutely sure you want to reset all data? This will permanently delete all settings, leads, estimates, and AI history. This action cannot be undone."
          confirmLabel="Yes, Reset Everything"
          onConfirm={() => { 
            showToast('Factory reset requires manual database deletion for safety', 'warning'); 
            setResetConfirm(false); 
          }}
          onCancel={() => setResetConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
}

export default memo(SettingsData);
