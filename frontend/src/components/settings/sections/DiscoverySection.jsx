/**
 * Discovery Section
 * Lead generation and automated scoring parameters
 */

import { memo } from 'react';
import { 
  Search, MapPin, Target, Archive, Clock, 
  Settings2, Filter, Save, Loader2, Radius
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

export default memo(function DiscoverySection() {
  const ctx = useSettings();
  const { handleSaveDiscovery } = useSettingsActions();

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Search} 
        title="Lead Discovery"
        description="Configure how the system identifies and evaluates potential plumbing projects"
      >
        <div className="space-y-6 mt-4">
          <div className="grid gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <SliderField 
              label="Search Radius" 
              value={ctx.searchRadius} 
              onChange={ctx.setSearchRadius} 
              min={5} max={100} step={5} 
              unit=" miles" 
              markers={['5mi', '50mi', '100mi']} 
            />

            <div className="border-t border-border-muted pt-6">
              <SliderField 
                label="Maximum Results" 
                value={ctx.maxResults} 
                onChange={ctx.setMaxResults} 
                min={10} max={200} step={10} 
                unit=" leads" 
                markers={['10', '100', '200']} 
              />
            </div>

            <div className="border-t border-border-muted pt-6">
              <SliderField 
                label="Minimum Quality Score" 
                value={ctx.minScore} 
                onChange={ctx.setMinScore} 
                min={1} max={10} step={1} 
                unit="/10" 
                markers={['Low', 'Medium', 'High']} 
              />
            </div>
          </div>

          <div className="grid gap-4 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <SettingsRow 
              label="Automated Scoring" 
              description="Use AI to automatically rank leads based on business profile alignment"
              icon={Target}
            >
              <Toggle enabled={ctx.autoScore} onChange={ctx.setAutoScore} />
            </SettingsRow>

            <SettingsRow 
              label="Auto-Archive Old Leads" 
              description="Automatically move leads to archive after specified inactivity"
              icon={Archive}
            >
              <Toggle enabled={ctx.autoArchive} onChange={ctx.setAutoArchive} />
            </SettingsRow>

            {ctx.autoArchive && (
              <div className="pl-11 pr-2 pb-2">
                <SliderField 
                  label="Archive Threshold" 
                  value={ctx.archiveThreshold} 
                  onChange={ctx.setArchiveThreshold} 
                  min={1} max={30} step={1} 
                  unit=" days" 
                />
              </div>
            )}

            <SettingsRow 
              label="Follow-up Reminders" 
              description="Generate alerts for leads that haven't been contacted"
              icon={Clock}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-muted">Every</span>
                <input 
                  type="number" 
                  value={ctx.followupDays} 
                  onChange={e => ctx.setFollowupDays(parseInt(e.target.value))} 
                  className="input w-16 h-8 text-center font-bold"
                />
                <span className="text-xs font-semibold text-text-muted">days</span>
              </div>
            </SettingsRow>
          </div>

          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Negative Keywords
              </label>
              <textarea 
                value={ctx.excludedKeywords} 
                onChange={e => ctx.setExcludedKeywords(e.target.value)} 
                className="input py-3 min-h-[80px] resize-none text-sm font-medium" 
                placeholder="e.g. landscaping, electric, roofing (comma separated)" 
              />
              <p className="text-xs text-text-muted italic px-1">Leads containing these words will be automatically filtered out.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-default">
            <button 
              onClick={handleSaveDiscovery} 
              disabled={ctx.savingDiscovery} 
              className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20 transition-all active:scale-95"
            >
              {ctx.savingDiscovery ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
              Save Discovery Settings
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
});
