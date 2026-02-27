import { useState, useCallback, useMemo, memo } from 'react';
import { Search, MapPin, Loader2, Grid3X3, Type, Zap } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage form state
 */
function useSearchFormState() {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [useZones, setUseZones] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [multiZone, setMultiZone] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = useCallback((cat) => {
    if (selectedCategory === cat.label) {
      setSelectedCategory(null);
      setKeyword('');
    } else {
      setSelectedCategory(cat.label);
      setKeyword(cat.keyword);
    }
  }, [selectedCategory]);

  const handleZoneClick = useCallback((zone) => {
    if (multiZone) return;
    if (selectedZone?.name === zone.name) {
      setSelectedZone(null);
    } else {
      setSelectedZone(zone);
    }
  }, [multiZone, selectedZone]);

  const handleToggleZones = useCallback((useZonesValue) => {
    setUseZones(useZonesValue);
    if (!useZonesValue) {
      setSelectedZone(null);
      setMultiZone(false);
    }
  }, []);

  const handleToggleMultiZone = useCallback((checked) => {
    setMultiZone(checked);
    if (checked) setSelectedZone(null);
  }, []);

  const clearCategory = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  return {
    keyword,
    setKeyword,
    city,
    setCity,
    useZones,
    handleToggleZones,
    selectedZone,
    handleZoneClick,
    multiZone,
    handleToggleMultiZone,
    selectedCategory,
    handleCategoryClick,
    clearCategory,
  };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Category chip button
 */
const CategoryChip = memo(function CategoryChip({ 
  category, 
  isSelected, 
  onClick, 
  disabled 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
        isSelected
          ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accent-300 hover:text-accent-600 dark:hover:text-accent-400'
      }`}
    >
      {category.label}
    </button>
  );
});

/**
 * Category selection section
 */
const CategorySection = memo(function CategorySection({ 
  categories, 
  selectedCategory, 
  onCategoryClick, 
  isRunning 
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
        Gatekeeper Categories
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <CategoryChip
            key={cat.label}
            category={cat}
            isSelected={selectedCategory === cat.label}
            onClick={() => onCategoryClick(cat)}
            disabled={isRunning}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Keyword input field
 */
const KeywordInput = memo(function KeywordInput({ 
  value, 
  onChange, 
  disabled 
}) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Business type (e.g., property management)"
        value={value}
        onChange={onChange}
        className="input pl-12"
        disabled={disabled}
      />
    </div>
  );
});

/**
 * Toggle button for zones/city mode
 */
const ModeToggle = memo(function ModeToggle({ useZones, onToggle }) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => onToggle(true)}
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
        onClick={() => onToggle(false)}
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
  );
});

/**
 * Individual zone button
 */
const ZoneButton = memo(function ZoneButton({ 
  zone, 
  isSelected, 
  onClick, 
  disabled 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
});

/**
 * Zones grid section
 */
const ZonesGrid = memo(function ZonesGrid({ 
  zones, 
  selectedZone, 
  multiZone, 
  onZoneClick, 
  isRunning 
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {zones.map((zone) => {
        const isSelected = multiZone || selectedZone?.name === zone.name;
        return (
          <ZoneButton
            key={zone.name}
            zone={zone}
            isSelected={isSelected}
            onClick={() => onZoneClick(zone)}
            disabled={isRunning || multiZone}
          />
        );
      })}
    </div>
  );
});

/**
 * Multi-zone checkbox
 */
const MultiZoneToggle = memo(function MultiZoneToggle({ 
  checked, 
  onChange, 
  disabled 
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500"
      />
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Search All Zones
      </span>
      <span className="text-xs text-gray-400">({DFW_ZONES.length} zones)</span>
    </label>
  );
});

/**
 * City input field
 */
const CityInput = memo(function CityInput({ value, onChange, disabled }) {
  return (
    <div className="relative">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="City (e.g., Fort Worth TX)"
        value={value}
        onChange={onChange}
        className="input pl-12"
        disabled={disabled}
      />
    </div>
  );
});

/**
 * Submit button
 */
const SubmitButton = memo(function SubmitButton({ 
  canSubmit, 
  isRunning, 
  isMultiZone 
}) {
  return (
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
          {isMultiZone && ` (${DFW_ZONES.length} zones)`}
        </>
      )}
    </button>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function DiscoverySearchForm({ onSubmit, isRunning }) {
  const {
    keyword,
    setKeyword,
    city,
    setCity,
    useZones,
    handleToggleZones,
    selectedZone,
    handleZoneClick,
    multiZone,
    handleToggleMultiZone,
    selectedCategory,
    handleCategoryClick,
    clearCategory,
  } = useSearchFormState();

  const canSubmit = useMemo(() => {
    return keyword.trim() && !isRunning && (
      (useZones && (multiZone || selectedZone)) ||
      (!useZones && city.trim())
    );
  }, [keyword, isRunning, useZones, multiZone, selectedZone, city]);

  const handleKeywordChange = useCallback((e) => {
    setKeyword(e.target.value);
    clearCategory();
  }, [setKeyword, clearCategory]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!keyword.trim() || isRunning) return;

    if (useZones && multiZone) {
      onSubmit(keyword.trim(), '', { zones: DFW_ZONES });
    } else if (useZones && selectedZone) {
      onSubmit(keyword.trim(), selectedZone.name, {
        lat: selectedZone.lat,
        lng: selectedZone.lng,
        radius: selectedZone.radius,
        zone: selectedZone.name,
      });
    } else if (!useZones && city.trim()) {
      onSubmit(keyword.trim(), city.trim(), {});
    }
  }, [keyword, isRunning, useZones, multiZone, selectedZone, city, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-body p-4 space-y-4">
        <CategorySection
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
          isRunning={isRunning}
        />

        <KeywordInput
          value={keyword}
          onChange={handleKeywordChange}
          disabled={isRunning}
        />

        <div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Search Area
            </label>
            <ModeToggle useZones={useZones} onToggle={handleToggleZones} />
          </div>

          {useZones ? (
            <div className="space-y-3">
              <ZonesGrid
                zones={DFW_ZONES}
                selectedZone={selectedZone}
                multiZone={multiZone}
                onZoneClick={handleZoneClick}
                isRunning={isRunning}
              />

              <MultiZoneToggle
                checked={multiZone}
                onChange={handleToggleMultiZone}
                disabled={isRunning}
              />
            </div>
          ) : (
            <CityInput
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isRunning}
            />
          )}
        </div>

        <SubmitButton
          canSubmit={canSubmit}
          isRunning={isRunning}
          isMultiZone={multiZone}
        />
      </div>
    </form>
  );
}
