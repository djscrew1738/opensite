# Toast Notification System

## Overview
A global toast notification system is fully implemented and ready to use. It provides non-blocking feedback for user actions across the entire application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  App.jsx                                                    │
│  ├── ToastProvider (context)                               │
│  ├── BrowserRouter                                         │
│  ├── Layout (your pages)                                   │
│  └── ToastContainer (renders toasts)                       │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```jsx
import { useToast } from '../hooks';

function MyComponent() {
  const { success, error, warning, info, loading } = useToast();

  const handleSave = async () => {
    try {
      await api.leads.create(data);
      success('Lead saved successfully!');
    } catch (err) {
      error(`Failed to save: ${err.message}`);
    }
  };

  return <button onClick={handleSave}>Save Lead</button>;
}
```

## API Reference

### Toast Types

```jsx
const toast = useToast();

// Success - green, 4s duration
toast.success('Lead saved successfully!');

// Error - red, 6s duration (longer for reading)
toast.error('Failed to connect to AI provider');
toast.error(err.message); // From caught error

// Warning - amber, 4s duration
toast.warning('Rate limit approaching');

// Info - blue, 4s duration
toast.info('New permits available in your area');

// Loading - persists until updated
toast.loading('Analyzing blueprints...');
```

### Advanced Options

```jsx
// Custom duration (in milliseconds)
toast.success('Saved!', { duration: 2000 });

// Non-dismissible
toast.info('Important update', { dismissible: false });

// Different position
toast.warning('Check this', { position: 'top-center' });

// Custom duration (0 = persistent)
toast.loading('Processing...', { duration: 0 });
```

### Promise-based Toast

Perfect for async operations with automatic loading → success/error:

```jsx
const { promise } = useToast();

const handleAnalyze = () => {
  promise(
    api.ai.analyze(blueprint),
    {
      loading: 'Analyzing blueprint...',
      success: (result) => `Analysis complete: ${result.summary}`,
      error: (err) => `Analysis failed: ${err.message}`,
    }
  );
};
```

### Programmatic Control

```jsx
const { addToast, dismissToast, dismissAll, updateToast } = useToast();

// Add with full control
const id = addToast('Custom message', {
  type: 'info',
  duration: 5000,
  position: 'bottom-right',
});

// Update existing toast (e.g., loading → success)
updateToast(id, {
  message: 'Completed!',
  type: 'success',
  duration: 4000,
});

// Dismiss specific toast
dismissToast(id);

// Dismiss all toasts
dismissAll();
```

## Common Patterns

### API Call Feedback

```jsx
const handleSubmit = async () => {
  const { promise } = useToast();
  
  await promise(
    api.jobs.create(formData),
    {
      loading: 'Creating job...',
      success: 'Job created successfully!',
      error: (err) => `Failed: ${err.message}`,
    }
  );
  
  // Navigate after success
  navigate('/jobs');
};
```

### Form Validation

```jsx
const handleSave = () => {
  if (!formData.name) {
    error('Job name is required');
    return;
  }
  
  if (formData.rate < 0) {
    warning('Rate seems unusually low');
  }
  
  // Proceed with save...
};
```

### Batch Operations

```jsx
const handleBulkDelete = async (ids) => {
  const { success, error } = useToast();
  
  try {
    await Promise.all(ids.map(id => api.leads.delete(id)));
    success(`${ids.length} leads deleted`);
  } catch (err) {
    error('Some deletions failed');
  }
};
```

### Connection Status

```jsx
const testConnection = async () => {
  const { loading, success, error } = useToast();
  
  const toastId = loading('Testing connection...');
  
  try {
    await api.settings.testOllama(url);
    success('Connected successfully!');
  } catch (err) {
    error(`Connection failed: ${err.message}`);
  }
};
```

## Features

### Mobile-Optimized
- Swipe to dismiss on touch devices
- Haptic feedback (vibration) on mobile
- Top-center position on mobile
- Larger touch targets

### Accessibility
- `role="alert"` for screen readers
- `aria-live` regions for announcements
- Keyboard dismissible (click to close)
- Respects `prefers-reduced-motion`

### Auto-Dismiss
- Success: 4 seconds
- Error: 6 seconds (longer for reading)
- Warning: 4 seconds
- Info: 4 seconds
- Loading: persists until updated/dismissed

### Pause on Hover
- Desktop: Timer pauses when hovering
- Mobile: No pause (touch devices)
- Progress bar shows remaining time

## Styling

Toasts use the Dark Forge design system:

| Type | Background | Border | Icon |
|------|------------|--------|------|
| Success | emerald-50/950 | emerald-200/800 | ✓ Green |
| Error | red-50/950 | red-200/800 | ✗ Red |
| Warning | amber-50/950 | amber-200/800 | ⚠ Amber |
| Info | blue-50/950 | blue-200/800 | ℹ Blue |
| Loading | gray-50/900 | gray-200/700 | ⟳ Spinning |

## Migration Guide

Replace blocking modals/alerts with toasts:

```jsx
// Before: Blocking alert
alert('Settings saved');

// After: Non-blocking toast
const { success } = useToast();
success('Settings saved');

// Before: console.error
console.error('API failed:', err);

// After: User-visible error
const { error } = useToast();
error(`API failed: ${err.message}`);
```

## Best Practices

1. **Use promise toast for async operations** - Clean, automatic state handling
2. **Keep messages concise** - Under 100 characters when possible
3. **Use error type for failures** - Always show user-actionable errors
4. **Don't over-toast** - One toast per user action is usually enough
5. **Update loading toasts** - Always resolve loading toasts to success/error

## Examples by Context

### Settings Page
```jsx
// After saving
success('Settings saved successfully');

// After test connection
connected ? success('Connected!') : error('Connection failed');
```

### Lead Finder
```jsx
// After adding lead
success('Lead added to pipeline');

// After AI score
info(`AI Score: ${score}/100 - ${recommendation}`);
```

### Job Management
```jsx
// Phase update
success(`Advanced to ${phaseName}`);

// Inspection scheduled
success('Inspection scheduled for tomorrow 9am');
```

### Documents
```jsx
// Upload complete
success(`${fileName} uploaded successfully`);

// Analysis complete
success('Blueprint analysis complete - 12 fixtures detected');
```
