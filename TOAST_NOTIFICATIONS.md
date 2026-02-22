# Toast Notifications - Mobile Optimized

A comprehensive, mobile-first toast notification system for OpenSite with desktop support, featuring swipe gestures, haptic feedback, and adaptive positioning.

## Features

### Mobile-First Design
- **Adaptive Positioning**: Toasts appear at top-center on mobile, bottom-right on desktop
- **Swipe to Dismiss**: Swipe left or right to dismiss toasts on touch devices
- **Haptic Feedback**: Light vibration on mobile for errors and confirmations
- **Larger Touch Targets**: Optimized for touch interaction (44px minimum)
- **Safe Area Support**: Respects notched devices and status bars
- **Extended Duration**: 5s on mobile vs 4s on desktop for better readability

### Core Features
- **5 Toast Types**: Success, Error, Warning, Info, Loading
- **Stacking**: Up to 3 toasts on mobile, 5 on desktop
- **Progress Bar**: Visual indicator of remaining time
- **Pause on Hover**: Desktop toasts pause when hovered
- **Auto-Dismiss**: Configurable duration (0 for persistent)
- **Manual Dismiss**: Click X or click toast to dismiss
- **Promise Integration**: Built-in support for async operations

### Accessibility
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Enhanced visibility in high contrast mode
- **Keyboard Navigation**: Full keyboard support

## Quick Start

### 1. Using Toast Methods (Recommended)

```jsx
import { useToast } from '../hooks/useToast';

function MyComponent() {
  const { success, error, warning, info, loading } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      success('Changes saved!');
    } catch (err) {
      error('Failed to save: ' + err.message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### 2. Promise-based Toast (for async operations)

```jsx
const { promise } = useToast();

const handleSubmit = () => {
  promise(
    fetch('/api/submit', { method: 'POST', body: data }),
    {
      loading: 'Submitting...',
      success: 'Submitted successfully!',
      error: 'Submission failed',
    }
  );
};
```

### 3. Custom Toast with Options

```jsx
const { addToast } = useToast();

addToast('Custom message', {
  type: 'warning',
  duration: 10000,        // 10 seconds
  position: 'top-center',
  dismissible: true,
  pauseOnHover: true,
});
```

## Toast Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | CheckCircle | Green | Successful operations |
| `error` | XCircle | Red | Errors, failures |
| `warning` | AlertTriangle | Amber | Warnings, cautions |
| `info` | Info | Blue | Informational |
| `loading` | Loader2 | Gray | Loading states |

## API Reference

### `useToast()` Hook

```typescript
interface UseToastReturn {
  // Toast methods
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  
  // Advanced methods
  addToast: (message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  promise: <T>(promise: Promise<T>, messages: PromiseMessages, options?: ToastOptions) => Promise<T>;
  
  // State
  toasts: Toast[];
  isMobile: boolean;
  isTouch: boolean;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;        // ms, 0 = infinite
  position?: 'top-center' | 'bottom-right' | 'bottom-left' | 'top-right';
  dismissible?: boolean;
  pauseOnHover?: boolean;
  pauseOnFocusLoss?: boolean;
}
```

## Mobile-Specific Behavior

### Automatic Adaptations
- **Position**: Automatically switches to `top-center` on mobile
- **Duration**: Extended to 5 seconds for better readability
- **Stack Limit**: Reduced to 3 toasts to prevent screen overflow
- **Pause on Hover**: Disabled on touch devices

### Swipe Gestures
- Swipe left or right on any toast to dismiss
- Minimum 100px swipe required to trigger dismissal
- Smooth spring-back animation if not swiped far enough

### Haptic Feedback
- Error toasts: Pattern `[50, 100, 50]` (short, pause, short)
- Success/Info/Warning: Single `50ms` vibration
- Loading toasts: No vibration

## CSS Customization

The toast system uses Tailwind CSS with custom animations:

```css
/* Mobile entrance animation */
@keyframes toastSlideInMobile {
  from { opacity: 0; transform: translateY(-100%) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Desktop entrance animation */
@keyframes toastSlideInDesktop {
  from { opacity: 0; transform: translateX(100%) scale(0.95); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

/* Loading bar animation */
@keyframes loadingBar {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}
```

## Examples

### Form Validation

```jsx
const { error, success } = useToast();

const handleSubmit = (formData) => {
  const errors = [];
  if (!formData.email) errors.push('Email is required');
  if (!formData.name) errors.push('Name is required');

  if (errors.length > 0) {
    errors.forEach(err => error(err));
    return;
  }

  success('Form submitted!');
};
```

### Batch Operations with Progress

```jsx
const { addToast, updateToast } = useToast();

const processBatch = async (items) => {
  const id = addToast('Processing 0/' + items.length, {
    type: 'loading',
    duration: 0,
  });

  for (let i = 0; i < items.length; i++) {
    await processItem(items[i]);
    updateToast(id, {
      message: `Processing ${i + 1}/${items.length}...`,
    });
  }

  updateToast(id, {
    message: `Completed! ${items.length} items processed.`,
    type: 'success',
    duration: 4000,
  });
};
```

### Conditional Device Behavior

```jsx
const { success, isMobile, isTouch } = useToast();

const handleAction = () => {
  // System automatically adapts, but you can check if needed
  if (isMobile) {
    console.log('On mobile device');
  }
  
  success('Action completed!');
};
```

## Migration Guide

### From Old Toast System

**Before:**
```jsx
// In component
const [toast, setToast] = useState(null);
const showToast = (message, type) => setToast({ message, type });

// Usage
showToast('Saved!', 'success');

// In JSX
{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
```

**After:**
```jsx
// In component
const { success } = useToast();

// Usage
success('Saved!');

// No JSX needed - ToastContainer is in App.jsx
```

## Files Changed

1. **New Files:**
   - `frontend/src/hooks/useToast.jsx` - Toast context and hook
   - `frontend/src/components/shared/Toast.jsx` - Toast components
   - `frontend/src/hooks/useToast.example.jsx` - Usage examples

2. **Modified Files:**
   - `frontend/src/App.jsx` - Added ToastProvider and ToastContainer
   - `frontend/src/index.css` - Added toast animations
   - `frontend/src/components/shared/index.js` - Exported Toast components
   - `frontend/src/pages/Settings.jsx` - Migrated to new toast system
   - `frontend/src/components/takeoff/MaterialManager.jsx` - Migrated to new toast system

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- iOS Safari 13+
- Chrome Android 80+

## Performance

- Toast components are lazy-rendered (only when needed)
- Animations use `transform` and `opacity` for GPU acceleration
- RequestAnimationFrame for smooth progress bars
- Automatic cleanup of timers and event listeners
- Max toast limits prevent DOM overflow

## Future Enhancements

- [ ] Action buttons in toasts (Undo, Retry, etc.)
- [ ] Toast history/panel
- [ ] Persistent notification preferences
- [ ] Custom toast templates
- [ ] Sound notifications option
