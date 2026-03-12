/**
 * Appearance Section
 * Theme and layout customization
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Sun, Moon, Monitor, Layout,
  Type, Calendar, Hash, Save
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow, Toggle } from '../primitives';
import { colors } from '../../../styles/tokens';

export default memo(function AppearanceSection() {
  const ctx = useSettings();
  const { handleApplyTheme, handleSaveAppearance } = useSettingsActions();

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Palette} 
        title="Visual Identity"
        description="Customize the application interface to match your workflow and environment"
      >
        <div className="space-y-6 mt-4">
          {/* Theme Preference */}
          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-1">Interface Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System' },
              ].map(({ id, icon: Icon, label }) => {
                const isActive = ctx.themePreference === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => handleApplyTheme(id)}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 700, damping: 35 }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                      isActive
                        ? 'bg-surface-card border-accent-blue shadow-md text-accent-blue'
                        : 'bg-surface-elevated border-border-muted text-text-muted hover:border-border-strong'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Layout Settings */}
          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-4 px-1">Layout & Interactions</h3>
            
            <SettingsRow 
              label="Compact Sidebar" 
              description="Minimize the navigation sidebar to show only icons by default"
              icon={Layout}
            >
              <Toggle enabled={ctx.compactSidebar} onChange={ctx.setCompactSidebar} />
            </SettingsRow>

            <SettingsRow 
              label="Dense UI Mode" 
              description="Reduce spacing and font sizes to show more data on screen"
              icon={Type}
            >
              <Toggle enabled={ctx.denseMode} onChange={ctx.setDenseMode} />
            </SettingsRow>

            <SettingsRow 
              label="Motion & Animations" 
              description="Enable smooth page transitions and interactive hover effects"
              icon={Palette}
            >
              <Toggle enabled={ctx.animationsEnabled} onChange={ctx.setAnimationsEnabled} />
            </SettingsRow>
          </div>

          {/* Regional Settings */}
          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-1 px-1">Localization</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date Format
                </label>
                <select 
                  value={ctx.dateFormat} 
                  onChange={e => ctx.setDateFormat(e.target.value)} 
                  className="input h-10 text-xs font-semibold"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (USA)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Hash className="w-3 h-3" /> Number System
                </label>
                <select 
                  value={ctx.numberFormat} 
                  onChange={e => ctx.setNumberFormat(e.target.value)} 
                  className="input h-10 text-xs font-semibold"
                >
                  <option value="US">US ($1,234.56)</option>
                  <option value="EU">EU (€1.234,56)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-default">
            <motion.button
              onClick={handleSaveAppearance}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Appearance
            </motion.button>
          </div>
        </div>
      </Section>
    </div>
  );
});
