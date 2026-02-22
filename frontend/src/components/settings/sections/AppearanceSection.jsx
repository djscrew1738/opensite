/**
 * Appearance Section
 * Theme and display preferences
 */

import { Palette, Monitor, Moon, Sun, LayoutTemplate, Type, Calendar, Hash, Loader2, Save } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow, Toggle } from '../primitives';

export default function AppearanceSection() {
  const ctx = useSettings();
  const { handleApplyTheme, handleSaveAppearance } = useSettingsActions();
  
  const {
    themePreference, setThemePreference, compactSidebar, setCompactSidebar,
    denseMode, setDenseMode, animationsEnabled, setAnimationsEnabled,
    dateFormat, setDateFormat, numberFormat, setNumberFormat
  } = ctx;

  const themes = [
    { id: 'system', icon: Monitor, label: 'System', desc: 'Follow OS preference' },
    { id: 'light', icon: Sun, label: 'Light', desc: 'Always light mode' },
    { id: 'dark', icon: Moon, label: 'Dark', desc: 'Always dark mode' },
  ];

  return (
    <div className="space-y-6">
      <Section icon={Palette} title="Theme">
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, icon: Icon, label, desc }) => {
            const isActive = themePreference === id;
            return (
              <button
                key={id}
                onClick={() => { setThemePreference(id); handleApplyTheme(id); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-accent-600 dark:text-accent-400' : 'text-gray-400'}`} />
                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={LayoutTemplate} title="Layout">
        <div className="space-y-3">
          <SettingsRow label="Compact Sidebar" description="Reduce sidebar width for more workspace">
            <Toggle enabled={compactSidebar} onChange={setCompactSidebar} />
          </SettingsRow>
          <SettingsRow label="Dense Mode" description="Reduce padding and spacing throughout UI">
            <Toggle enabled={denseMode} onChange={setDenseMode} />
          </SettingsRow>
          <SettingsRow label="Animations" description="Enable transition animations">
            <Toggle enabled={animationsEnabled} onChange={setAnimationsEnabled} />
          </SettingsRow>
        </div>
      </Section>

      <Section icon={Type} title="Formatting">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" /> Date Format
            </label>
            <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="input">
              <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-400" /> Number Format
            </label>
            <select value={numberFormat} onChange={e => setNumberFormat(e.target.value)} className="input">
              <option value="US">1,234.56 (US)</option>
              <option value="EU">1.234,56 (EU)</option>
            </select>
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSaveAppearance} className="btn-primary text-sm">
          <Save className="w-4 h-4" /> Save Appearance
        </button>
      </div>
    </div>
  );
}
