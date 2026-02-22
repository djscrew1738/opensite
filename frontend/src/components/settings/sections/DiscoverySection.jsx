/**
 * Discovery Section
 * Lead discovery and search configuration
 */

import { Search, MapPin, Filter, Zap, SlidersHorizontal, Archive, Clock, Loader2, Save } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

export default function DiscoverySection() {
  const ctx = useSettings();
  const { handleSaveDiscovery } = useSettingsActions();
  
  const {
    maxResults, setMaxResults, minScore, setMinScore,
    autoScore, setAutoScore, excludedKeywords, setExcludedKeywords,
    searchRadius, setSearchRadius, autoArchive, setAutoArchive,
    archiveThreshold, setArchiveThreshold, followupDays, setFollowupDays,
    savingDiscovery, settings
  } = ctx;

  return (
    <div className="space-y-6">
      <Section icon={Search} title="Discovery Settings">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderField 
              label="Search Radius" 
              value={searchRadius} 
              onChange={setSearchRadius} 
              min={5} max={100} step={5} 
              unit=" miles" 
            />
            <SliderField 
              label="Max Results" 
              value={maxResults} 
              onChange={setMaxResults} 
              min={10} max={200} step={10} 
              unit=" leads" 
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <SettingsRow 
              label="Auto-Score Leads" 
              description="Automatically calculate lead scores based on relevance"
            >
              <Toggle enabled={autoScore} onChange={setAutoScore} />
            </SettingsRow>
            
            {autoScore && (
              <div className="mt-4 pl-4 border-l-2 border-accent-200 dark:border-accent-800">
                <SliderField 
                  label="Minimum Score Threshold" 
                  value={minScore} 
                  onChange={setMinScore} 
                  min={1} max={10} step={1} 
                  unit="/10" 
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="label flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" /> Excluded Keywords
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Comma-separated keywords to exclude from search results
            </p>
            <input 
              type="text" 
              value={excludedKeywords} 
              onChange={e => setExcludedKeywords(e.target.value)} 
              className="input" 
              placeholder="e.g. residential, small, repair"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleSaveDiscovery} disabled={savingDiscovery} className="btn-primary text-sm">
              {savingDiscovery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Discovery Settings
            </button>
          </div>
        </div>
      </Section>

      <Section icon={Archive} title="Lead Management">
        <div className="space-y-5">
          <SettingsRow 
            label="Auto-Archive Low-Quality Leads" 
            description="Automatically archive leads below the score threshold"
          >
            <Toggle enabled={autoArchive} onChange={setAutoArchive} />
          </SettingsRow>

          {autoArchive && (
            <div className="pl-4 border-l-2 border-accent-200 dark:border-accent-800">
              <SliderField 
                label="Archive Threshold" 
                value={archiveThreshold} 
                onChange={setArchiveThreshold} 
                min={1} max={5} step={1} 
                unit=" stars or below" 
              />
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="label flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /> Follow-up Reminder (days)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Days to wait before reminding about uncontacted leads
            </p>
            <input 
              type="number" 
              value={followupDays} 
              onChange={e => setFollowupDays(Number(e.target.value))} 
              className="input w-32" 
              min="1" max="30"
            />
          </div>
        </div>
      </Section>

      <Section icon={Zap} title="Discovery Sources">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" /> Google Places
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Status: {settings.google_places_api_key_configured ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Configured</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Not configured</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-violet-500" /> Serper.dev
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Status: {settings.serper_api_key_configured ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Configured</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Not configured</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
