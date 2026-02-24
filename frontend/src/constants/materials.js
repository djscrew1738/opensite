// Material constants shared across takeoff components

export const CATEGORY_LABELS = {
  pipe: 'Pipe',
  fittings: 'Fittings',
  fixtures: 'Fixtures',
  valves: 'Valves',
  water_heater: 'Water Heaters',
  gas: 'Gas',
  misc: 'Miscellaneous'
};

export const CATEGORY_COLORS = {
  pipe: '#2563eb',
  fittings: '#7c3aed',
  fixtures: '#0891b2',
  valves: '#dc2626',
  water_heater: '#ea580c',
  gas: '#ca8a04',
  misc: '#6b7280'
};

export const UNIT_OPTIONS = ['ft', 'ea', 'lb', 'gal', 'roll', 'box', 'set', 'bag', 'pair', 'kit'];

export const SORT_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'cost', label: 'Price (Low-High)' },
  { value: 'cost_desc', label: 'Price (High-Low)' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'usage', label: 'Most Used' },
  { value: 'recent', label: 'Recently Used' },
  { value: 'updated', label: 'Recently Updated' }
];

export const VIEW_MODES = {
  GROUPED: 'grouped',
  TABLE: 'table',
  CARD: 'card'
};

export const QUICK_FILTERS = {
  ALL: 'all',
  FAVORITES: 'favorites',
  RECENT: 'recent',
  MOST_USED: 'most_used'
};
