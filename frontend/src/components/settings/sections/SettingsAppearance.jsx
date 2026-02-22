import { memo } from 'react';
import {
  Moon, Sun, Monitor, LayoutDashboard, Hash, CheckCircle, Save
} from 'lucide-react';
import { Section, SettingsRow, Toggle } from '../primitives';

function SettingsAppearance({
  themePreference,
  handleApplyTheme,
  compactSidebar,
  setCompactSidebar,
  denseMode,
  setDenseMode,
  animationsEnabled,
  setAnimationsEnabled,
  dateFormat,
  setDateFormat,
  numberFormat,
  setNumberFormat,
  handleSaveAppearance,
}) {
  return (
    <div className="space-y-6">
      <Section icon={Moon} title="Theme">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', icon: Sun, label: 'Light', desc: 'Bright, high contrast' },
            { id: 'dark',  icon: Moon, label: 'Dark',  desc: 'Easy on the eyes' },
            { id: 'system', icon: Monitor, label: 'System', desc: 'Follow OS setting' },
          ].map(({ id, icon: Icon, label, desc }) => (
            <button key={id} onClick={() => handleApplyTheme(id)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                themePreference === id
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-copper-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {themePreference === id && <div className="absolute top-2 right-2"><CheckCircle className="w-5 h-5 text-blue-500" /></div>}
              <Icon className={`w-5 h-5 mb-2 ${themePreference === id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{label}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={LayoutDashboard} title="Layout">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingsRow label="Compact Sidebar" description="Reduce sidebar to icons only — hover to see labels">
            <Toggle enabled={compactSidebar} onChange={setCompactSidebar} />
          </SettingsRow>
          <SettingsRow label="Dense Mode" description="Tighter spacing throughout the UI — fits more content on screen">
            <Toggle enabled={denseMode} onChange={setDenseMode} />
          </SettingsRow>
          <SettingsRow label="Enable Animations" description="Transitions and micro-animations — disable for accessibility or performance">
            <Toggle enabled={animationsEnabled} onChange={setAnimationsEnabled} />
          </SettingsRow>
        </div>
      </Section>

      <Section icon={Hash} title="Formatting">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Date Format</label>
            <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="input">
              <option value="MM/DD/YYYY">MM/DD/YYYY (02/19/2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (19/02/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-02-19)</option>
              <option value="MMM D, YYYY">MMM D, YYYY (Feb 19, 2026)</option>
            </select>
          </div>
          <div>
            <label className="label">Number Format</label>
            <select value={numberFormat} onChange={e => setNumberFormat(e.target.value)} className="input">
              <option value="US">US — 1,234.56</option>
              <option value="EU">EU — 1.234,56</option>
              <option value="IN">IN — 1,23,456.00</option>
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

export default memo(SettingsAppearance);
