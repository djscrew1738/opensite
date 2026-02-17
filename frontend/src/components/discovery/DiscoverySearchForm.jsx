import { useState } from 'react';
import { Search, MapPin, Loader2, Grid3X3, Type, Zap } from 'lucide-react';

const CATEGORIES = [
  { label: 'Property Mgmt', keyword: 'property management company' },
  { label: 'Water Damage', keyword: 'water damage restoration' },
  { label: 'Real Estate', keyword: 'real estate agency' },
  { label: 'HOA Mgmt', keyword: 'HOA management company' },
  { label: 'Plumbing', keyword: 'plumbing contractor' },
  { label: 'General Contractor', keyword: 'general contractor' },
  { label: 'Restoration', keyword: 'restoration company' },
  { label: 'Insurance', keyword: 'insurance adjuster' },
];

const DFW_ZONES = [
  { name: 'Denton', lat: 33.2148, lng: -97.1331, radius: 15000 },
  { name: 'Allen/McKinney', lat: 33.1032, lng: -96.6706, radius: 15000 },
  { name: 'Frisco/Prosper', lat: 33.1507, lng: -96.8236, radius: 15000 },
  { name: 'Fort Worth', lat: 32.7555, lng: -97.3308, radius: 20000 },
  { name: 'Arlington', lat: 32.7357, lng: -97.1081, radius: 15000 },
  { name: 'Plano', lat: 33.0198, lng: -96.6989, radius: 15000 },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970, radius: 20000 },
  { name: 'Southlake/Keller', lat: 32.9413, lng: -97.1342, radius: 15000 },
];

export default function DiscoverySearchForm({ onSubmit, isRunning }) {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [useZones, setUseZones] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [multiZone, setMultiZone] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (cat) => {
    if (selectedCategory === cat.label) {
      setSelectedCategory(null);
      setKeyword('');
    } else {
      setSelectedCategory(cat.label);
      setKeyword(cat.keyword);
    }
  };

  const handleZoneClick = (zone) => {
    if (multiZone) return; // In multi-zone mode, all zones are selected
    if (selectedZone?.name === zone.name) {
      setSelectedZone(null);
    } else {
      setSelectedZone(zone);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim() || isRunning) return;

    if (useZones && multiZone) {
      // Multi-zone: send all zones
      onSubmit(keyword.trim(), '', { zones: DFW_ZONES });
    } else if (useZones && selectedZone) {
      // Single zone
      onSubmit(keyword.trim(), selectedZone.name, {
        lat: selectedZone.lat,
        lng: selectedZone.lng,
        radius: selectedZone.radius,
        zone: selectedZone.name,
      });
    } else if (!useZones && city.trim()) {
      // Custom city
      onSubmit(keyword.trim(), city.trim(), {});
    }
  };

  const canSubmit = keyword.trim() && !isRunning && (
    (useZones && (multiZone || selectedZone)) ||
    (!useZones && city.trim())
  );

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-body p-4 space-y-4">
        {/* Row 1: Category Chips */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            Gatekeeper Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedCategory === cat.label
                    ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accent-300 hover:text-accent-600 dark:hover:text-accent-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Keyword Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Business type (e.g., property management)"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setSelectedCategory(null); }}
            className="input pl-12"
            disabled={isRunning}
          />
        </div>

        {/* Row 3: Zone Toggle + Zone Grid / City Input */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Search Area
            </label>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setUseZones(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  useZones
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                DFW Zones
              </button>
              <button
                type="button"
                onClick={() => { setUseZones(false); setSelectedZone(null); setMultiZone(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  !useZones
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                Custom City
              </button>
            </div>
          </div>

          {useZones ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DFW_ZONES.map((zone) => {
                  const isSelected = multiZone || selectedZone?.name === zone.name;
                  return (
                    <button
                      key={zone.name}
                      type="button"
                      onClick={() => handleZoneClick(zone)}
                      disabled={isRunning || multiZone}
                      className={`relative px-3 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        isSelected
                          ? 'bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300 border-accent-300 dark:border-accent-700 shadow-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accent-200 hover:bg-accent-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-accent-500' : 'text-gray-400'}`} />
                        {zone.name}
                      </div>
                      <div className="text-[10px] font-normal text-gray-400 dark:text-gray-500 mt-0.5">
                        {(zone.radius / 1000).toFixed(0)}km radius
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Multi-zone toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiZone}
                  onChange={(e) => {
                    setMultiZone(e.target.checked);
                    if (e.target.checked) setSelectedZone(null);
                  }}
                  disabled={isRunning}
                  className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Search All Zones
                </span>
                <span className="text-xs text-gray-400">({DFW_ZONES.length} zones)</span>
              </label>
            </div>
          ) : (
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="City (e.g., Fort Worth TX)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input pl-12"
                disabled={isRunning}
              />
            </div>
          )}
        </div>

        {/* Row 4: Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full justify-center"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Pipeline...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Discover Leads
              {multiZone && ` (${DFW_ZONES.length} zones)`}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
