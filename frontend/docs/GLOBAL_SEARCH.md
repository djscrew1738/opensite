# Global Search Documentation

## Overview

A global search bar accessible from every page that searches across leads, permits, builders, jobs, and estimates simultaneously. Results are displayed grouped by type in a dropdown overlay with keyboard navigation support.

## Features

- **Universal search**: Query across all entity types (leads, permits, builders, jobs, estimates)
- **Keyboard shortcut**: Press `Cmd/Ctrl + K` from any page to open
- **Desktop header integration**: Search input visible in the top header bar
- **Type filtering**: Filter results by entity type using pill buttons
- **Keyboard navigation**: Arrow keys to navigate, Enter to select, Escape to close
- **Quick navigation**: Click any result to navigate to the appropriate page

## Usage

### Opening the Search

1. **Keyboard shortcut**: Press `Cmd/Ctrl + K` from any page
2. **Click search bar**: Click the search input in the desktop header
3. **Mobile**: Use the search option in the Command Palette or navigation

### Search Results

Results are grouped by entity type:
- **Jobs** - Active jobs with builder, phase, and city info
- **Permits** - Permit leads with contractor, type, and cost
- **Leads** - Manual leads with company and location
- **Builders** - Builder profiles with permit counts
- **Estimates** - Project estimates with total value

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑/↓` | Navigate results |
| `Enter` | Open selected result |
| `Escape` | Close search |
| `Cmd/Ctrl + K` | Open search from anywhere |

## Implementation

### Components

```
src/components/search/
├── GlobalSearch.jsx      # Main search overlay component
└── index.js              # Component exports
```

### Integration Points

**Layout.jsx** - Global search state and keyboard shortcut
```jsx
const [showSearch, setShowSearch] = useState(false);

useKeyboardShortcuts({
  onSearch: () => setShowSearch(true),
  // ... other shortcuts
});

<GlobalSearch
  isOpen={showSearch}
  onClose={() => setShowSearch(false)}
/>
```

**PageHeaderBar.jsx** - Desktop search trigger
```jsx
<PageHeaderBar
  onSearchClick={() => setShowSearch(true)}
/>
```

### API Integration

Uses existing search endpoint:
```javascript
const data = await api.permits.search({ 
  q: query.trim(), 
  type: typeFilter === 'all' ? undefined : typeFilter 
});
```

Returns results grouped by type:
```javascript
{
  permits: [...],
  leads: [...],
  builders: [...],
  jobs: [...],
  estimates: [...]
}
```

### SearchResultRow

Reused from LeadFinder with extended type support:
- `permit` - Blue FileText icon
- `lead` - Green User icon
- `builder` - Purple Building2 icon
- `job` - Blue HardHat icon (NEW)
- `estimate` - Amber Calculator icon (NEW)

## Navigation Behavior

| Result Type | Navigation Target |
|-------------|-------------------|
| Permit | `/leads?tab=permits` |
| Lead | `/leads?tab=manual` |
| Builder | `/leads?tab=builders` |
| Job | `/jobs?id={id}` |
| Estimate | `/jobs?tab=estimating&id={id}` |

## Styling

- **Overlay**: Semi-transparent backdrop with blur
- **Modal**: White/surface card with rounded corners and shadow
- **Input**: Large text with placeholder, loading spinner when searching
- **Filters**: Pill buttons with active state highlighting
- **Results**: Grouped sections with type headers, hover highlighting
- **Footer**: Keyboard shortcut hints

## Future Enhancements

1. **Recent searches** - Save and display recent queries
2. **Favorites** - Pin frequently accessed items
3. **Preview panel** - Show entity details on hover
4. **Actions** - Quick actions (edit, delete) in search results
5. **Advanced filters** - Date range, status, value filters
6. **Search history** - Track and suggest previous searches
