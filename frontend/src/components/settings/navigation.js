import {
  Building2, Cpu, Key, Activity, Bell, Search, Calculator,
  Gauge, Palette, Database, LayoutDashboard, CreditCard, Users
} from 'lucide-react';

/**
 * Settings navigation items configuration
 */
export const NAV_ITEMS = [
  { id: 'overview',      icon: LayoutDashboard,  label: 'Overview' },
  { id: 'ai',            icon: Cpu,              label: 'AI' },
  { id: 'business',      icon: Building2,        label: 'Business' },
  { id: 'estimating',    icon: Calculator,       label: 'Estimating' },
  { id: 'discovery',     icon: Search,           label: 'Discovery' },
  { id: 'jobpulse',      icon: Activity,         label: 'Job Pulse' },
  { id: 'notifications', icon: Bell,             label: 'Notifications' },
  { id: 'quickbooks',    icon: CreditCard,       label: 'QuickBooks' },
  { id: 'apikeys',       icon: Key,              label: 'API Keys' },
  { id: 'performance',   icon: Gauge,            label: 'Performance' },
  { id: 'appearance',    icon: Palette,          label: 'Appearance' },
  { id: 'data',          icon: Database,         label: 'Data' },
  { id: 'system',        icon: Activity,         label: 'System' },
  { id: 'users',         icon: Users,            label: 'Users' },
];

/**
 * Get tab order mapping for animation direction
 * @returns {Object} Map of tab id to order index
 */
export function getTabOrder() {
  return NAV_ITEMS.reduce((acc, item, idx) => ({ 
    ...acc, 
    [item.id]: idx 
  }), {});
}
