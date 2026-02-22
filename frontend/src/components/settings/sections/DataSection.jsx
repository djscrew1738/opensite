/**
 * Data Section
 * Export, backup, and data management
 */

import { Database, Download, FileDown, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section } from '../primitives';

export default function DataSection() {
  const ctx = useSettings();
  const { handleExportSettings, handleCreateBackup, handleClearCache } = useSettingsActions();
  
  const { creatingBackup, clearingCache, exportingData } = ctx;

  return (
    <div className="space-y-6">
      <Section icon={Database} title="Data Management">
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Export Settings</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Download all settings as JSON for backup or migration</p>
              </div>
              <button onClick={handleExportSettings} disabled={exportingData} className="btn-secondary text-sm">
                {exportingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Export</>}
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Database Backup</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create a full database backup on the server</p>
              </div>
              <button onClick={handleCreateBackup} disabled={creatingBackup} className="btn-secondary text-sm">
                {creatingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileDown className="w-4 h-4" /> Backup</>}
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Clear Cache</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Clear all cached data. May temporarily slow performance.</p>
                </div>
              </div>
              <button onClick={handleClearCache} disabled={clearingCache} className="btn-ghost text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                {clearingCache ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Clear</>}
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
