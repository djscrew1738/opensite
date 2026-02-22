# Page Header Bar Documentation

## Overview

The Page Header Bar provides a consistent, thin chrome bar across all pages that displays:
- Page title (auto-detected from route or set manually)
- Breadcrumb navigation (optional)
- Page-level action slot (buttons, dropdowns, etc.)

This unifies the visual language and helps users orient themselves when the sidebar is collapsed.

## Features

- **Automatic page detection**: Page titles are determined by the current route
- **Manual override**: Pages can set custom titles and actions via the `usePageHeader` hook
- **Breadcrumb navigation**: Shows parent page links (e.g., Home > Jobs)
- **Action slot**: Pages can inject buttons, menus, or any React elements
- **Responsive design**: Adapts to mobile and desktop layouts
- **Scroll-aware styling**: Adds backdrop blur when scrolled

## Usage

### Automatic (Default Behavior)

By default, the header automatically detects the page title from the current route:

```jsx
// routes.js - Page metadata registry
export const pageMetadata = {
  '/': {
    title: 'Dashboard',
    parent: null,
    description: 'Command center overview',
  },
  '/jobs': {
    title: 'Jobs',
    parent: { path: '/', title: 'Home' },
    description: 'Manage active jobs',
  },
  '/leads': {
    title: 'Lead Finder',
    parent: { path: '/', title: 'Home' },
    description: 'Discover and track leads',
  },
};
```

When a user navigates to `/jobs`, the header automatically shows:
- Title: "Jobs"
- Breadcrumb: Home > Jobs

### Manual Control (usePageHeader Hook)

Pages can programmatically set titles and actions:

```jsx
import { useEffect } from 'react';
import { usePageHeader } from '../hooks/usePageHeader';
import { Plus, Filter } from 'lucide-react';

function JobsPage() {
  const { setTitle, setActions, reset } = usePageHeader();
  
  useEffect(() => {
    // Set custom title (optional - overrides route detection)
    setTitle('Active Jobs (12)');
    
    // Set page actions
    setActions(
      <>
        <button 
          className="btn-secondary flex items-center gap-2"
          onClick={() => setShowFilter(true)}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </>
    );
    
    // Cleanup when leaving the page
    return () => reset();
  }, [setTitle, setActions, reset]);
  
  return (
    <div>
      {/* Page content - no header needed here! */}
    </div>
  );
}
```

### Dynamic Titles

Update the title based on state:

```jsx
function JobDetailPage({ jobId }) {
  const { setTitle } = usePageHeader();
  const { data: job } = useJob(jobId);
  
  useEffect(() => {
    if (job) {
      setTitle(`${job.address} - ${job.phase}`);
    }
  }, [job, setTitle]);
  
  return (...);
}
```

## API Reference

### usePageHeader Hook

```typescript
interface PageHeaderContextValue {
  setTitle: (title: string | null) => void;
  setActions: (actions: React.ReactNode | null) => void;
  reset: () => void;
}
```

| Method | Description |
|--------|-------------|
| `setTitle(title)` | Override the auto-detected page title |
| `setActions(node)` | Set React elements to render in the action slot |
| `reset()` | Clear title and actions (reverts to auto-detection) |

### PageHeaderBar Component

```jsx
import { PageHeaderBar, HeaderAction } from '../components/layout';

// Basic usage
<PageHeaderBar />

// With custom title and actions
<PageHeaderBar 
  title="Custom Title"
  actions={
    <>
      <HeaderAction variant="secondary">Cancel</HeaderAction>
      <HeaderAction variant="primary">Save</HeaderAction>
    </>
  }
/>

// Hide breadcrumb
<PageHeaderBar showBreadcrumb={false} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `null` | Override the page title |
| `actions` | `ReactNode` | `null` | Content for the action slot |
| `showBreadcrumb` | `boolean` | `true` | Show breadcrumb navigation |
| `showMobileMenu` | `boolean` | `false` | Show hamburger menu button |
| `onMobileMenuClick` | `function` | - | Handler for mobile menu |
| `className` | `string` | - | Additional CSS classes |

## Adding New Pages

To add a new page to the metadata registry:

1. Open `src/components/layout/PageHeaderBar.jsx`
2. Add entry to `pageMetadata`:

```javascript
export const pageMetadata = {
  // ... existing entries
  '/my-new-page': {
    title: 'My New Page',
    icon: MyIcon, // Optional icon component
    parent: { path: '/', title: 'Home' }, // Optional breadcrumb parent
    description: 'Description for accessibility',
  },
};
```

## Styling

The header bar uses the design system tokens:

- **Height**: `h-14` (56px)
- **Background**: Transparent when at top, `bg-surface-primary/95 backdrop-blur-xl` when scrolled
- **Border**: `border-b border-border` when scrolled
- **Padding**: `px-4 lg:px-6`

### Customizing Actions

Use the `HeaderAction` helper or standard buttons:

```jsx
// Using HeaderAction helper
<HeaderAction variant="primary" icon={Plus}>
  New Item
</HeaderAction>

// Using standard buttons
<button className="btn-primary">Save</button>
<button className="btn-secondary">Cancel</button>
<button className="btn-ghost">More</button>
```

## Migration Guide

### Before (Each page has its own header)

```jsx
function JobsPage() {
  return (
    <div>
      <div className="p-4 border-b">
        <h1>Jobs</h1>
        <button>New Job</button>
      </div>
      {/* content */}
    </div>
  );
}
```

### After (Header managed by layout)

```jsx
function JobsPage() {
  const { setTitle, setActions } = usePageHeader();
  
  useEffect(() => {
    setActions(<button>New Job</button>);
    return () => setActions(null);
  }, []);
  
  return (
    <div>
      {/* content - no header here! */}
    </div>
  );
}
```

## Examples

### Jobs Page with Filter and Create

```jsx
function JobsPage() {
  const { setTitle, setActions } = usePageHeader();
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  
  useEffect(() => {
    setTitle('Active Jobs');
    setActions(
      <div className="flex items-center gap-2">
        <button 
          className="btn-secondary flex items-center gap-2"
          onClick={() => setFilterOpen(true)}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
        <button 
          className="btn-primary flex items-center gap-2"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Job</span>
        </button>
      </div>
    );
    
    return () => {
      setActions(null);
      setTitle(null);
    };
  }, []);
  
  return (
    <div className="p-4 lg:p-6">
      {/* Page content */}
    </div>
  );
}
```

### Detail Page with Back Button

```jsx
function JobDetailPage({ jobId }) {
  const { setTitle, setActions } = usePageHeader();
  const navigate = useNavigate();
  const { data: job } = useJob(jobId);
  
  useEffect(() => {
    if (job) {
      setTitle(job.address);
      setActions(
        <div className="flex items-center gap-2">
          <button 
            className="btn-ghost"
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button className="btn-primary">Edit</button>
        </div>
      );
    }
    
    return () => reset();
  }, [job, navigate]);
  
  return (...);
}
```

## Accessibility

- Uses semantic `<header>` element
- Breadcrumb uses `<nav aria-label="Breadcrumb">`
- Titles are properly hierarchy (h1)
- Keyboard navigation support
- Respects reduced motion preferences
