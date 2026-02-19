import {
  Droplets, UtensilsCrossed, GlassWater, Waves,
  Bath, ShowerHead, WashingMachine, Flame, Pipette, CircleDot
} from 'lucide-react';

export const FIXTURE_PRICE = 995;

export const QUALIFYING_FIXTURES = [
  { key: 'lavatories',            label: 'Lavatories',            icon: Droplets,          color: '#3b82f6' },
  { key: 'kitchenFaucets',        label: 'Kitchen Faucets',       icon: UtensilsCrossed,   color: '#10b981' },
  { key: 'barSinks',              label: 'Bar Sinks',             icon: GlassWater,        color: '#8b5cf6' },
  { key: 'waterSoftenerPreplumb', label: 'Water Softener',        icon: Waves,             color: '#06b6d4' },
  { key: 'toilets',               label: 'Toilets',               icon: CircleDot,         color: '#f59e0b' },
  { key: 'showerBases',           label: 'Shower Bases',          icon: ShowerHead,        color: '#ec4899' },
  { key: 'tubs',                  label: 'Tubs',                  icon: Bath,              color: '#6366f1' },
  { key: 'washingMachines',       label: 'Washing Machines',      icon: WashingMachine,    color: '#14b8a6' },
  { key: 'waterHeaters',          label: 'Water Heaters',         icon: Flame,             color: '#ef4444' },
];

export const NON_QUALIFYING_FIXTURES = [
  { key: 'mudPans', label: 'Mud Pans', icon: Pipette, color: '#94a3b8' },
];

export const PHASE_CONFIG = [
  { key: 'roughIn', label: 'Rough-in', pct: 50, color: '#003594' },
  { key: 'topOut',  label: 'Top-out',  pct: 30, color: '#0066cc' },
  { key: 'trim',    label: 'Trim',     pct: 20, color: '#4d94ff' },
];

export const DEFAULT_FIXTURES = {
  lavatories: 0,
  kitchenFaucets: 0,
  barSinks: 0,
  waterSoftenerPreplumb: 0,
  toilets: 0,
  showerBases: 0,
  tubs: 0,
  washingMachines: 0,
  waterHeaters: 0,
};

export const DEFAULT_PROJECT_INFO = {
  projectName: '',
  sqft: '',
  units: '',
  bathrooms: '',
  stories: '',
};
