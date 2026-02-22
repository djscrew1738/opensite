import { memo } from 'react';
import { Search, Zap, Loader2, Save } from 'lucide-react';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

function SettingsDiscovery({
  maxResults,
  setMaxResults,
  searchRadius,
  setSearchRadius,
  minScore,
  setMinScore,
  excludedKeywords,
  setExcludedKeywords,
  autoScore,
  setAutoScore,
  autoArchive,
  setAutoArchive,
  archiveThreshold,
  setArchiveThreshold,
  followupDays,
  setFollowupDays,
  savingDiscovery,
  handleSaveDiscovery,
}) {
  return (
    <div className="space-y-6">
      <Section icon={Search} title="Search Configuration">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SliderField label="Max Results Per Scan" value={maxResults} onChange={setMaxResults} min={10} max={200} step={10} unit=" leads" markers={['10','50','100','200']} />
            <SliderField label="Default Search Radius" value={searchRadius} onChange={setSearchRadius} min={5} max={100} step={5} unit=" mi" markers={['5','25','50','100']} />
          </div>
          <SliderField label="Minimum Score Threshold" value={minScore} onChange={setMinScore} min={1} max={10} step={1} unit={` / 10`} markers={['1','3','5','7','10']} />
          <div>
            <label className="label">Excluded Keywords</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Comma-separated terms to exclude from search results (e.g. competitor names)</p>
            <input type="text" value={excludedKeywords} onChange={e => setExcludedKeywords(e.target.value)} className="input text-sm" placeholder="competitor1, competitor2, residential only..." />
          </div>
        </div>
      </Section>

      <Section icon={Zap} title="Automation">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <SettingsRow label="Auto-Score New Leads" description="Automatically run AI scoring when new permits or leads come in">
            <Toggle enabled={autoScore} onChange={setAutoScore} />
          </SettingsRow>
          <SettingsRow label="Auto-Archive Low-Score Leads" description="Move leads below the archive threshold to archive automatically">
            <Toggle enabled={autoArchive} onChange={setAutoArchive} />
          </SettingsRow>
          {autoArchive && (
            <div className="py-4">
              <SliderField label="Archive Threshold (score ≤)" value={archiveThreshold} onChange={setArchiveThreshold} min={1} max={5} step={1} unit={` / 10`} markers={['1','2','3','4','5']} />
            </div>
          )}
          <div className="py-4">
            <SliderField label="Follow-Up Reminder (days after contact)" value={followupDays} onChange={setFollowupDays} min={1} max={30} step={1} unit=" days" markers={['1','7','14','30']} />
          </div>
        </div>
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSaveDiscovery} disabled={savingDiscovery} className="btn-primary text-sm">
          {savingDiscovery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Discovery Config
        </button>
      </div>
    </div>
  );
}

export default memo(SettingsDiscovery);
