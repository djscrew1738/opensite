/**
 * Data Section
 * Export, backup, and storage management
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Database, Download, Upload, Trash2,
  History, Shield, Save, Loader2, RefreshCw,
  AlertCircle, FileJson, Archive
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow } from '../primitives';
import { ConfirmDialog } from '../../shared';

export default memo(function DataSection() {
  const ctx = useSettings();
  const { 
    handleExportSettings, handleCreateBackup, handleClearCache 
  } = useSettingsActions();

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Database} 
        title="Data Portability & Storage"
        description="Manage your system data, backups, and intelligence cache"
      >
        <div className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Export Settings */}
            <motion.button
              onClick={handleExportSettings}
              disabled={ctx.exportingData}
              whileTap={!ctx.exportingData ? { scale: 0.98 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface-elevated border border-border-default hover:border-accent-blue/40 transition-colors group"
            >
              <div className="p-3 rounded-xl bg-surface-card group-hover:bg-accent-muted transition-colors">
                <FileJson className="w-6 h-6 text-accent-blue" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-text-primary tracking-tight">Export Settings</h4>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">JSON Payload</p>
              </div>
            </motion.button>

            {/* Create Backup */}
            <motion.button
              onClick={handleCreateBackup}
              disabled={ctx.creatingBackup}
              whileTap={!ctx.creatingBackup ? { scale: 0.98 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface-elevated border border-border-default hover:border-success-border/40 transition-colors group"
            >
              <div className="p-3 rounded-xl bg-surface-card group-hover:bg-success-muted transition-colors">
                <Archive className="w-6 h-6 text-success-light" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-text-primary tracking-tight">Database Backup</h4>
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">SQLite Snapshot</p>
              </div>
            </motion.button>
          </div>

          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-1">Maintenance Tools</h3>
            
            <SettingsRow 
              label="Reset Intelligence Cache" 
              description="Clear all cached AI responses and lead discovery metadata"
              icon={RefreshCw}
            >
              <button 
                onClick={() => ctx.setResetConfirm(true)} 
                disabled={ctx.clearingCache}
                className="btn-secondary h-9 px-4 text-xs font-black uppercase tracking-widest text-danger-light border-danger-border bg-danger-muted/5 hover:bg-danger-muted/20"
              >
                {ctx.clearingCache ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Trash2 className="w-3.5 h-3.5 mr-2" />} 
                Clear Cache
              </button>
            </SettingsRow>
          </div>

          <div className="p-5 rounded-2xl bg-danger-muted/5 border border-danger-border/20 flex gap-4">
            <div className="p-2 rounded-lg bg-danger-muted h-fit">
              <AlertCircle className="w-5 h-5 text-danger-light" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-danger-light tracking-tight">System Reset Danger Zone</h4>
              <p className="text-xs text-text-muted leading-relaxed mt-1">
                Performing a full system reset will wipe all local data including leads, estimates, and configuration. 
                This action is irreversible. Always create a backup first.
              </p>
              <button className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-danger-light hover:underline">
                Request Factory Reset Authorization
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Reset Confirmation */}
      {ctx.resetConfirm && (
        <ConfirmDialog
          title="Reset System Cache?"
          message="This will immediately clear all cached AI data. Performance may be temporarily affected while the system rebuilds its intelligence patterns."
          confirmLabel={ctx.clearingCache ? 'Clearing...' : 'Wipe Cache'}
          onConfirm={() => {
            handleClearCache();
            ctx.setResetConfirm(false);
          }}
          onCancel={() => ctx.setResetConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
});
