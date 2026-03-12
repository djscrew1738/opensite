import { useState, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Search, MapPin, Loader2, Grid3X3, Type, Zap } from 'lucide-react';
import { colors, shadows, radius } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** @type {Array<{ label: string; keyword: string }>} */
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

/** @type {Array<{ name: string; lat: number; lng: number; radius: number }>} */
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
// Type Definitions
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Zone
 * @property {string} name - Zone name
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {number} radius - Search radius in meters
 */

/**
 * @typedef {Object} SearchOptions
 * @property {Zone[]} [zones] - Multiple zones for search
 * @property {number} [lat] - Single search latitude
 * @property {number} [lng] - Single search longitude
 * @property {number} [radius] - Single search radius
 * @property {string} [zone] - Zone name
 */

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage form state
 * @returns {Object} Form state and handlers
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

  const resetForm = useCallback(() => {
    setKeyword('');
    setCity('');
    setSelectedZone(null);
    setMultiZone(false);
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
    resetForm,
  };
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Category chip button
 * @param {Object} props
 * @param {{ label: string; keyword: string }} props.category - Category data
 * @param {boolean} props.isSelected - Whether category is selected
 * @param {() => void} props.onClick - Click handler
 * @param {boolean} [props.disabled] - Whether button is disabled
 */
const CategoryChip = memo(function CategoryChip({ 
  category, 
  isSelected, 
  onClick, 
  disabled 
}) {
  const buttonStyle = useMemo(() => ({
    backgroundColor: isSelected ? colors.accent.DEFAULT : colors.surface.card,
    color: isSelected ? colors.text.inverse : colors.text.secondary,
    borderColor: isSelected ? colors.accent.DEFAULT : colors.border.default,
    borderRadius: radius.full,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }), [isSelected, disabled]);

  const handleMouseEnter = useCallback((e) => {
    if (!isSelected && !disabled) {
      e.currentTarget.style.borderColor = colors.accent.light;
      e.currentTarget.style.color = colors.accent.DEFAULT;
    }
  }, [isSelected, disabled]);

  const handleMouseLeave = useCallback((e) => {
    if (!isSelected && !disabled) {
      e.currentTarget.style.borderColor = colors.border.default;
      e.currentTarget.style.color = colors.text.secondary;
    }
  }, [isSelected, disabled]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs font-semibold transition-all border"
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-pressed={isSelected}
      aria-label={`Category: ${category.label}`}
    >
      {category.label}
    </button>
  );
});

CategoryChip.displayName = 'CategoryChip';

CategoryChip.propTypes = {
  category: PropTypes.shape({
    label: PropTypes.string.isRequired,
    keyword: PropTypes.string.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

CategoryChip.defaultProps = {
  disabled: false,
};

/**
 * Category selection section
 * @param {Object} props
 * @param {Array<{ label: string; keyword: string }>} props.categories - Available categories
 * @param {string | null} props.selectedCategory - Currently selected category label
 * @param {(cat: { label: string; keyword: string }) => void} props.onCategoryClick - Category click handler
 * @param {boolean} [props.isRunning] - Whether a search is running
 */
const CategorySection = memo(function CategorySection({ 
  categories, 
  selectedCategory, 
  onCategoryClick, 
  isRunning 
}) {
  const handleCategoryClick = useCallback((cat) => {
    onCategoryClick(cat);
  }, [onCategoryClick]);

  return (
    <div>
      <label 
        className="text-xs font-semibold uppercase tracking-wider mb-2 block"
        style={{ color: colors.text.muted }}
      >
        Gatekeeper Categories
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <CategoryChip
            key={cat.label}
            category={cat}
            isSelected={selectedCategory === cat.label}
            onClick={() => handleCategoryClick(cat)}
            disabled={isRunning}
          />
        ))}
      </div>
    </div>
  );
});

CategorySection.displayName = 'CategorySection';

CategorySection.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    keyword: PropTypes.string.isRequired,
  })).isRequired,
  selectedCategory: PropTypes.string,
  onCategoryClick: PropTypes.func.isRequired,
  isRunning: PropTypes.bool,
};

CategorySection.defaultProps = {
  selectedCategory: null,
  isRunning: false,
};

/**
 * Keyword input field
 * @param {Object} props
 * @param {string} props.value - Input value
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - Change handler
 * @param {boolean} [props.disabled] - Whether input is disabled
 * @param {string} [props.placeholder] - Input placeholder
 */
const KeywordInput = memo(function KeywordInput({ 
  value, 
  onChange, 
  disabled,
  placeholder = 'Business type (e.g., property management)',
}) {
  return (
    <div className="relative">
      <Search 
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
        style={{ color: colors.text.muted }}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input pl-12"
        style={{ 
          backgroundColor: colors.surface.card,
          color: colors.text.primary,
          borderColor: colors.border.default,
          borderRadius: radius.input,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text'
        }}
        disabled={disabled}
        aria-label="Search keyword"
      />
    </div>
  );
});

KeywordInput.displayName = 'KeywordInput';

KeywordInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};

KeywordInput.defaultProps = {
  disabled: false,
  placeholder: 'Business type (e.g., property management)',
};

/**
 * Toggle button for zones/city mode
 * @param {Object} props
 * @param {boolean} props.useZones - Whether zones mode is active
 * @param {(useZones: boolean) => void} props.onToggle - Toggle handler
 */
const ModeToggle = memo(function ModeToggle({ useZones, onToggle }) {
  const getButtonStyle = useCallback((isActive) => ({
    backgroundColor: isActive ? colors.surface.card : 'transparent',
    color: isActive ? colors.text.primary : colors.text.muted,
    borderRadius: radius.sm,
    boxShadow: isActive ? shadows.card : 'none',
  }), []);

  return (
    <div 
      className="flex p-0.5"
      style={{ 
        backgroundColor: colors.surface.elevated,
        borderRadius: radius.md
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
        style={getButtonStyle(useZones)}
        aria-pressed={useZones}
        aria-label="Use DFW Zones"
      >
        <Grid3X3 className="w-3.5 h-3.5" aria-hidden="true" />
        DFW Zones
      </button>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
        style={getButtonStyle(!useZones)}
        aria-pressed={!useZones}
        aria-label="Use custom city"
      >
        <Type className="w-3.5 h-3.5" aria-hidden="true" />
        Custom City
      </button>
    </div>
  );
});

ModeToggle.displayName = 'ModeToggle';

ModeToggle.propTypes = {
  useZones: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

/**
 * Individual zone button
 * @param {Object} props
 * @param {Zone} props.zone - Zone data
 * @param {boolean} props.isSelected - Whether zone is selected
 * @param {() => void} props.onClick - Click handler
 * @param {boolean} [props.disabled] - Whether button is disabled
 */
const ZoneButton = memo(function ZoneButton({ 
  zone, 
  isSelected, 
  onClick, 
  disabled 
}) {
  const radiusKm = Math.round(zone.radius / 1000);
  
  const buttonStyle = useMemo(() => ({
    backgroundColor: isSelected ? colors.accent.muted : colors.surface.card,
    color: isSelected ? colors.accent.DEFAULT : colors.text.secondary,
    borderColor: isSelected ? colors.accent.border : colors.border.default,
    borderRadius: radius.card,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }), [isSelected, disabled]);

  const handleMouseEnter = useCallback((e) => {
    if (!isSelected && !disabled) {
      e.currentTarget.style.borderColor = colors.accent.light;
      e.currentTarget.style.backgroundColor = colors.accent.muted;
    }
  }, [isSelected, disabled]);

  const handleMouseLeave = useCallback((e) => {
    if (!isSelected && !disabled) {
      e.currentTarget.style.borderColor = colors.border.default;
      e.currentTarget.style.backgroundColor = colors.surface.card;
    }
  }, [isSelected, disabled]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative px-3 py-2.5 text-sm font-bold transition-all border text-left"
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-pressed={isSelected}
      aria-label={`Zone: ${zone.name}`}
    >
      <div className="flex items-center gap-1.5">
        <MapPin 
          className="w-3.5 h-3.5" 
          style={{ color: isSelected ? colors.accent.DEFAULT : colors.text.muted }}
          aria-hidden="true"
        />
        {zone.name}
      </div>
      <div 
        className="text-xs font-normal mt-0.5"
        style={{ color: colors.text.muted }}
      >
        {radiusKm}km radius
      </div>
    </button>
  );
});

ZoneButton.displayName = 'ZoneButton';

ZoneButton.propTypes = {
  zone: PropTypes.shape({
    name: PropTypes.string.isRequired,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    radius: PropTypes.number.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ZoneButton.defaultProps = {
  disabled: false,
};

/**
 * Zones grid section
 * @param {Object} props
 * @param {Zone[]} props.zones - Available zones
 * @param {Zone | null} props.selectedZone - Currently selected zone
 * @param {boolean} props.multiZone - Whether multi-zone mode is active
 * @param {(zone: Zone) => void} props.onZoneClick - Zone click handler
 * @param {boolean} [props.isRunning] - Whether search is running
 */
const ZonesGrid = memo(function ZonesGrid({ 
  zones, 
  selectedZone, 
  multiZone, 
  onZoneClick, 
  isRunning 
}) {
  const handleZoneClick = useCallback((zone) => {
    onZoneClick(zone);
  }, [onZoneClick]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {zones.map((zone) => {
        const isSelected = multiZone || selectedZone?.name === zone.name;
        return (
          <ZoneButton
            key={zone.name}
            zone={zone}
            isSelected={isSelected}
            onClick={() => handleZoneClick(zone)}
            disabled={isRunning || multiZone}
          />
        );
      })}
    </div>
  );
});

ZonesGrid.displayName = 'ZonesGrid';

ZonesGrid.propTypes = {
  zones: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    radius: PropTypes.number.isRequired,
  })).isRequired,
  selectedZone: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  multiZone: PropTypes.bool.isRequired,
  onZoneClick: PropTypes.func.isRequired,
  isRunning: PropTypes.bool,
};

ZonesGrid.defaultProps = {
  selectedZone: null,
  isRunning: false,
};

/**
 * Multi-zone checkbox
 * @param {Object} props
 * @param {boolean} props.checked - Whether checkbox is checked
 * @param {(checked: boolean) => void} props.onChange - Change handler
 * @param {boolean} [props.disabled] - Whether checkbox is disabled
 * @param {number} [props.zoneCount] - Number of zones
 */
const MultiZoneToggle = memo(function MultiZoneToggle({ 
  checked, 
  onChange, 
  disabled,
  zoneCount = DFW_ZONES.length,
}) {
  const id = 'multi-zone-toggle';
  
  return (
    <label 
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded"
        style={{ 
          borderColor: colors.border.default,
          accentColor: colors.accent.DEFAULT
        }}
        aria-label="Search all zones"
      />
      <span 
        className="text-sm font-semibold"
        style={{ color: colors.text.primary }}
      >
        Search All Zones
      </span>
      <span style={{ color: colors.text.muted, fontSize: '0.75rem' }}>
        ({zoneCount} zones)
      </span>
    </label>
  );
});

MultiZoneToggle.displayName = 'MultiZoneToggle';

MultiZoneToggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  zoneCount: PropTypes.number,
};

MultiZoneToggle.defaultProps = {
  disabled: false,
  zoneCount: DFW_ZONES.length,
};

/**
 * City input field
 * @param {Object} props
 * @param {string} props.value - Input value
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - Change handler
 * @param {boolean} [props.disabled] - Whether input is disabled
 */
const CityInput = memo(function CityInput({ value, onChange, disabled }) {
  return (
    <div className="relative">
      <MapPin 
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
        style={{ color: colors.text.muted }}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder="City (e.g., Fort Worth TX)"
        value={value}
        onChange={onChange}
        className="input pl-12"
        style={{ 
          backgroundColor: colors.surface.card,
          color: colors.text.primary,
          borderColor: colors.border.default,
          borderRadius: radius.input,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text'
        }}
        disabled={disabled}
        aria-label="City name"
      />
    </div>
  );
});

CityInput.displayName = 'CityInput';

CityInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

CityInput.defaultProps = {
  disabled: false,
};

/**
 * Submit button
 * @param {Object} props
 * @param {boolean} props.canSubmit - Whether form can be submitted
 * @param {boolean} props.isRunning - Whether search is running
 * @param {boolean} [props.isMultiZone] - Whether multi-zone mode is active
 * @param {number} [props.zoneCount] - Number of zones
 */
const SubmitButton = memo(function SubmitButton({ 
  canSubmit, 
  isRunning, 
  isMultiZone,
  zoneCount = DFW_ZONES.length,
}) {
  return (
    <button
      type="submit"
      disabled={!canSubmit}
      className="w-full justify-center flex items-center gap-2 px-4 py-2 font-bold transition-all"
      style={{ 
        backgroundColor: canSubmit ? colors.accent.DEFAULT : colors.surface.elevated,
        color: colors.text.inverse,
        borderRadius: radius.btn,
        opacity: canSubmit ? 1 : 0.5,
        cursor: canSubmit ? 'pointer' : 'not-allowed'
      }}
      aria-label={isRunning ? 'Running pipeline' : 'Discover leads'}
    >
      {isRunning ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          Running Pipeline...
        </>
      ) : (
        <>
          <Zap className="w-5 h-5" aria-hidden="true" />
          Discover Leads
          {isMultiZone && ` (${zoneCount} zones)`}
        </>
      )}
    </button>
  );
});

SubmitButton.displayName = 'SubmitButton';

SubmitButton.propTypes = {
  canSubmit: PropTypes.bool.isRequired,
  isRunning: PropTypes.bool.isRequired,
  isMultiZone: PropTypes.bool,
  zoneCount: PropTypes.number,
};

SubmitButton.defaultProps = {
  isMultiZone: false,
  zoneCount: DFW_ZONES.length,
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DiscoverySearchForm - Search form for discovering leads
 * @param {Object} props
 * @param {(keyword: string, city: string, options: SearchOptions) => void} props.onSubmit - Form submission handler
 * @param {boolean} [props.isRunning] - Whether a search is currently running
 */
function DiscoverySearchForm({ onSubmit, isRunning }) {
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
    <form 
      onSubmit={handleSubmit}
      style={{ 
        backgroundColor: colors.surface.card,
        borderRadius: radius.card,
        boxShadow: shadows.card
      }}
    >
      <div className="p-4 space-y-4">
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
            <label 
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: colors.text.muted }}
            >
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

DiscoverySearchForm.displayName = 'DiscoverySearchForm';

DiscoverySearchForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isRunning: PropTypes.bool,
};

DiscoverySearchForm.defaultProps = {
  isRunning: false,
};

export default DiscoverySearchForm;
