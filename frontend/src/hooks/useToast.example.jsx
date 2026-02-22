/**
 * Toast Notification System - Usage Examples
 * 
 * This file demonstrates how to use the new toast notification system
 * optimized for both desktop and mobile devices.
 */

import { useToast, ToastType } from './useToast';

// ─────────────────────────────────────────────
// BASIC USAGE
// ─────────────────────────────────────────────

function ExampleComponent() {
  const { success, error, warning, info, loading, promise } = useToast();

  const handleSuccess = () => {
    success('Settings saved successfully!');
  };

  const handleError = () => {
    error('Failed to save settings. Please try again.');
  };

  const handleWarning = () => {
    warning('Your session will expire in 5 minutes.');
  };

  const handleInfo = () => {
    info('New updates are available.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ASYNC OPERATIONS WITH LOADING
// ─────────────────────────────────────────────

function AsyncExample() {
  const { promise, loading, success, error } = useToast();

  // Option 1: Using promise helper (recommended)
  const handleSaveWithPromise = async () => {
    try {
      await promise(
        fetch('/api/save', { method: 'POST', body: data }),
        {
          loading: 'Saving your changes...',
          success: 'Changes saved successfully!',
          error: 'Failed to save changes',
        }
      );
    } catch (err) {
      // Error is already shown via toast
      console.error(err);
    }
  };

  // Option 2: Manual loading state management
  const handleSaveManual = async () => {
    const toastId = loading('Saving your changes...');
    
    try {
      await fetch('/api/save', { method: 'POST', body: data });
      success('Changes saved successfully!');
    } catch (err) {
      error('Failed to save changes: ' + err.message);
    }
  };

  return (
    <button onClick={handleSaveWithPromise}>
      Save with Promise Toast
    </button>
  );
}

// ─────────────────────────────────────────────
// ADVANCED OPTIONS
// ─────────────────────────────────────────────

function AdvancedExample() {
  const { addToast, dismissToast, dismissAll } = useToast();

  const handleCustomToast = () => {
    const id = addToast('Custom notification', {
      type: ToastType.INFO,
      duration: 10000,           // 10 seconds
      position: 'top-center',    // Override position
      dismissible: true,         // Allow manual dismiss
      pauseOnHover: true,        // Pause on hover (desktop)
      pauseOnFocusLoss: true,    // Pause when tab is not focused
    });

    // Dismiss programmatically after 5 seconds
    setTimeout(() => dismissToast(id), 5000);
  };

  const handlePersistentToast = () => {
    // Duration 0 means it won't auto-dismiss
    addToast('This toast stays until dismissed', {
      type: ToastType.WARNING,
      duration: 0,
    });
  };

  const handleClearAll = () => {
    dismissAll();
  };

  return (
    <div>
      <button onClick={handleCustomToast}>Custom Toast</button>
      <button onClick={handlePersistentToast}>Persistent Toast</button>
      <button onClick={handleClearAll}>Clear All</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE-SPECIFIC CONSIDERATIONS
// ─────────────────────────────────────────────

function MobileAwareExample() {
  const { success, isMobile, isTouch } = useToast();

  const handleMobileAction = () => {
    // The toast system automatically:
    // - Positions toasts at top-center on mobile
    // - Increases duration for mobile users
    // - Enables swipe-to-dismiss
    // - Provides haptic feedback (vibration)
    // - Uses larger touch targets

    success('Action completed!');
  };

  return (
    <div>
      <p>Device: {isMobile ? 'Mobile' : 'Desktop'}</p>
      <p>Touch: {isTouch ? 'Yes' : 'No'}</p>
      <button onClick={handleMobileAction}>
        Perform Action
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORM VALIDATION EXAMPLE
// ─────────────────────────────────────────────

function FormValidationExample() {
  const { error, success } = useToast();

  const handleSubmit = (formData) => {
    const errors = [];

    if (!formData.email) {
      errors.push('Email is required');
    }
    if (!formData.name) {
      errors.push('Name is required');
    }

    if (errors.length > 0) {
      // Show each error as a separate toast
      errors.forEach(err => error(err));
      
      // Or combine them
      // error(errors.join('. '));
      return;
    }

    success('Form submitted successfully!');
  };

  return <form>{/* form fields */}</form>;
}

// ─────────────────────────────────────────────
// BATCH OPERATIONS
// ─────────────────────────────────────────────

function BatchOperationsExample() {
  const { addToast, updateToast } = useToast();

  const handleBatchProcess = async (items) => {
    const id = addToast(`Processing 0/${items.length} items...`, {
      type: ToastType.LOADING,
      duration: 0,
    });

    let processed = 0;
    for (const item of items) {
      await processItem(item);
      processed++;
      
      // Update the toast with progress
      updateToast(id, {
        message: `Processing ${processed}/${items.length} items...`,
      });
    }

    // Convert to success toast
    updateToast(id, {
      message: `Completed! ${processed} items processed.`,
      type: ToastType.SUCCESS,
      duration: 4000,
    });
  };

  return (
    <button onClick={() => handleBatchProcess([1, 2, 3, 4, 5])}>
      Process Batch
    </button>
  );
}

// ─────────────────────────────────────────────
// TOAST TYPE REFERENCE
// ─────────────────────────────────────────────

/*
Toast Types:
- ToastType.SUCCESS  (green)  - For successful operations
- ToastType.ERROR    (red)    - For errors and failures
- ToastType.WARNING  (amber)  - For warnings and cautions
- ToastType.INFO     (blue)   - For informational messages
- ToastType.LOADING  (gray)   - For loading states

Default Durations:
- Desktop: 4000ms
- Mobile: 5000ms (longer for reading on small screens)
- Error toasts: 6000ms (longer to read error details)
- Loading toasts: 0ms (infinite, until updated/dismissed)

Positions:
- Desktop: bottom-right
- Mobile: top-center (better visibility, thumb-friendly dismiss)

Features:
- Swipe to dismiss (mobile)
- Click to dismiss
- Progress bar showing remaining time
- Pause on hover (desktop)
- Pause when tab is not focused
- Haptic feedback on mobile (vibration)
- Stacked notifications (max 3 on mobile, 5 on desktop)
- Reduced motion support
- High contrast mode support
- Safe area insets for notched devices
*/

export {
  ExampleComponent,
  AsyncExample,
  AdvancedExample,
  MobileAwareExample,
  FormValidationExample,
  BatchOperationsExample,
};
