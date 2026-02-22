# Tab System Migration Guide

This guide helps you migrate from legacy tab implementations to the new unified `TabSystem` component.

---

## Quick Start

### Installation
The new tab system is already available at:
```jsx
import { TabSystem, Tab } from './components/tabs';
// or
import { TabSystem, Tab } from './components/shared';
```

### Basic Example

```jsx
import { TabSystem, Tab } from './components/tabs';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';

function MyPage() {
  return (
    <TabSystem 
      defaultTab="overview" 
      variant="default"
      animation="directional"
    >
      <Tab id="overview" label="Overview" icon={LayoutDashboard}>
        <OverviewContent />
      </Tab>
      <Tab id="details" label="Details" icon={FileText} badge={3}>
        <DetailsContent />
      </Tab>
      <Tab id="settings" label="Settings" icon={Settings} disabled={!isAdmin}>
        <SettingsContent />
      </Tab>
    </TabSystem>
  );
}
```

---

## Migration Examples

### 1. From Legacy `TabNavigation` (used in Plans.jsx)

**Before:**
```jsx
import { TabNavigation } from './components/shared';

const tabs = [
  { key: 'home', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard },
  { key: 'estimate', label: 'Estimate', shortLabel: 'Estimate', icon: Calculator },
];

const [activeTab, setActiveTab] = useState('home');
const [tabDirection, setTabDirection] = useState(null);
const prevTab = useRef('home');

const handleTabChange = useCallback((newTab) => {
  if (newTab === activeTab) return;
  const direction = TAB_ORDER[newTab] > TAB_ORDER[prevTab.current] ? 'left' : 'right';
  setTabDirection(direction);
  prevTab.current = newTab;
  setActiveTab(newTab);
}, [activeTab]);

// In render:
<TabNavigation tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

<div key={activeTab} className={tabDirection === 'left' ? 'page-slide-left' : 'page-slide-right'}>
  {activeTab === 'home' && <HomeContent />}
  {activeTab === 'estimate' && <EstimateContent />}
</div>
```

**After:**
```jsx
import { TabSystem, Tab } from './components/tabs';

<TabSystem 
  defaultTab="home" 
  variant="default"
  animation="directional"
>
  <Tab id="home" label="Overview" shortLabel="Home" icon={LayoutDashboard}>
    <HomeContent />
  </Tab>
  <Tab id="estimate" label="Estimate" shortLabel="Estimate" icon={Calculator}>
    <EstimateContent />
  </Tab>
</TabSystem>
```

---

### 2. From Custom Inline Tabs (used in LeadFinder.jsx)

**Before:**
```jsx
const tabs = [
  { key: 'cities', label: 'City Search', icon: Building },
  { key: 'permits', label: 'All Permits', icon: FileText },
  { key: 'builders', label: 'Builders', icon: Building2 },
];

const [activeTab, setActiveTab] = useState('cities');

<div className="card">
  <div className="flex border-b border-surface-200 overflow-x-auto">
    {tabs.map(tab => {
      const Icon = tab.icon;
      return (
        <button
          key={tab.key}
          onClick={() => handleTabChange(tab.key)}
          className={`relative flex items-center gap-2 px-5 py-4 font-bold text-sm ...`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{tab.label}</span>
          {activeTab === tab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600" />
          )}
        </button>
      );
    })}
  </div>
</div>

{activeTab === 'cities' && <CitySearch />}
{activeTab === 'permits' && <PermitsList />}
{activeTab === 'builders' && <BuildersList />}
```

**After:**
```jsx
import { TabSystem, Tab } from './components/tabs';

<TabSystem defaultTab="cities" variant="default" animation="directional">
  <Tab id="cities" label="City Search" icon={Building}>
    <CitySearch />
  </Tab>
  <Tab id="permits" label="All Permits" icon={FileText}>
    <PermitsList />
  </Tab>
  <Tab id="builders" label="Builders" icon={Building2}>
    <BuildersList />
  </Tab>
</TabSystem>
```

---

### 3. From Settings-Style Sidebar Tabs

**Before:**
```jsx
const NAV_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'ai', icon: Cpu, label: 'AI' },
  // ... 12 tabs
];

const [activeTab, setActiveTab] = useState('overview');

// Sidebar navigation
<div className="flex">
  <nav className="w-64">
    {NAV_ITEMS.map(item => (
      <button key={item.id} onClick={() => setActiveTab(item.id)}>
        <item.icon /> {item.label}
      </button>
    ))}
  </nav>
  <div>{renderTabContent()}</div>
</div>
```

**After (with persistence):**
```jsx
<TabSystem 
  defaultTab="overview" 
  variant="minimal"
  animation="fade"
  persistKey="settings-active-tab"
  className="flex"
  listClassName="w-64 flex-col"
  contentClassName="flex-1"
>
  <Tab id="overview" label="Overview" icon={LayoutDashboard}>
    <OverviewSettings />
  </Tab>
  <Tab id="ai" label="AI" icon={Cpu}>
    <AISettings />
  </Tab>
  {/* ... */}
</TabSystem>
```

---

### 4. From Filter-Style Tabs (used in Alerts.jsx)

**Before:**
```jsx
const ALERT_TYPES = {
  all:    { label: 'All', icon: Bell },
  email:  { label: 'Emails', icon: Mail },
  job:    { label: 'Jobs', icon: HardHat },
};

const [filter, setFilter] = useState('all');

<div className="flex gap-1.5">
  {Object.entries(ALERT_TYPES).map(([key, { label, icon: Icon }]) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-3 py-2 rounded-lg ${filter === key ? 'bg-blue-500 text-white' : ''}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  ))}
</div>
```

**After:**
```jsx
<TabSystem defaultTab="all" variant="filter" animation="none">
  <Tab id="all" label="All" icon={Bell}>
    <AlertsList type="all" />
  </Tab>
  <Tab id="email" label="Emails" icon={Mail}>
    <AlertsList type="email" />
  </Tab>
  <Tab id="job" label="Jobs" icon={HardHat}>
    <AlertsList type="job" />
  </Tab>
</TabSystem>
```

---

## Variant Reference

| Variant | Use Case | Appearance |
|---------|----------|------------|
| `default` | Primary navigation | Underline indicator, default styling |
| `pills` | Secondary navigation | Pill-shaped active background |
| `underline` | Compact navigation | Simple border-bottom indicator |
| `minimal` | Settings sidebar | Subtle background change |
| `filter` | Filter chips | Button-style with count badges |

---

## Props Reference

### TabSystem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTab` | string | first tab | Initial active tab ID |
| `variant` | string | 'default' | Visual style variant |
| `animation` | string | 'directional' | Animation type: 'none', 'fade', 'directional' |
| `persistKey` | string | - | localStorage key for persistence |
| `syncUrl` | boolean | false | Sync active tab with URL hash |
| `onTabChange` | function | - | Callback `(newTab, prevTab) => {}` |
| `showIcons` | boolean | true | Show tab icons |
| `showLabels` | boolean | true | Show tab labels |
| `responsive` | boolean | true | Hide labels on mobile (show shortLabel) |

### Tab Props

| Prop | Type | Description |
|------|------|-------------|
| `id` | string (required) | Unique tab identifier |
| `label` | string (required) | Display label |
| `shortLabel` | string | Short label for mobile |
| `icon` | LucideIcon | Icon component |
| `badge` | number/string | Badge count |
| `disabled` | boolean | Disable tab selection |
| `hidden` | boolean | Hide tab from list |

---

## Advanced Usage

### With URL Sync

```jsx
<TabSystem 
  defaultTab="overview" 
  syncUrl={true}
  onTabChange={(tab) => analytics.track('Tab Change', { tab })}
>
  {/* tabs */}
</TabSystem>
// URL will update to: /page#overview
```

### Custom Styling

```jsx
<TabSystem 
  defaultTab="overview"
  className="my-custom-tabs"
  listClassName="border-b-2 border-gray-200"
  contentClassName="p-4"
>
  {/* tabs */}
</TabSystem>
```

### Programmatic Control

```jsx
import { useTabAnimation } from './components/tabs';

function MyComponent() {
  const tabs = [{ id: 'a' }, { id: 'b' }];
  const { activeTab, setActiveTab } = useTabAnimation(tabs, {
    defaultTab: 'a'
  });

  return (
    <>
      <button onClick={() => setActiveTab('b')}>Go to B</button>
      <div>Active: {activeTab}</div>
    </>
  );
}
```

---

## Troubleshooting

### Q: My tabs are not animating
A: Make sure `animation` prop is set to 'directional' or 'fade'. 'none' disables animations.

### Q: How do I access the active tab in parent component?
A: Use the `onTabChange` callback or `persistKey` with localStorage.

### Q: Can I have nested tabs?
A: Yes, but use different `persistKey` values for each level.

### Q: The old TabNavigation is deprecated but still works. Should I migrate?
A: Yes, migrate when convenient. TabNavigation will be removed in a future version.

---

## Migration Checklist

- [ ] Identify pages using old tab patterns
- [ ] Choose appropriate variant for each use case
- [ ] Update imports to use `TabSystem, Tab`
- [ ] Convert tab arrays to Tab components
- [ ] Remove manual animation logic
- [ ] Test keyboard navigation (arrow keys, home, end)
- [ ] Test on mobile devices
- [ ] Remove old code after verification
