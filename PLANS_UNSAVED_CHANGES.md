# Plans Page - Unsaved Changes Protection

## Overview
Implemented comprehensive unsaved-changes protection for the Plans/Estimate page to prevent accidental data loss during estimate creation.

## Features Added

### 1. Visual Indicator - "Unsaved Changes" Chip
**Location**: PlansCommandHeader (top of estimate tab)

- **Amber pulsing badge** appears when user has unsaved changes
- Shows "Unsaved" text with alert icon
- Disappears when estimate is saved or no changes exist
- Replaces "Ready" badge when in dirty state

```jsx
{isDirty ? (
  <span className="... bg-amber-500/20 text-amber-300 ... animate-pulse">
    <AlertCircle className="w-3 h-3" /> Unsaved
  </span>
) : (
  <span className="... bg-emerald-500/20 text-emerald-300 ...">
    <CheckCircle2 className="w-3 h-3" /> Ready
  </span>
)}
```

### 2. Browser Beforeunload Warning
**Protection**: Closing tab/browser or navigating away

- Intercepts `beforeunload` event when `isDirty = true`
- Shows native browser confirmation dialog
- Standard browser message: "You have unsaved changes. Are you sure you want to leave?"

```jsx
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes...';
      return e.returnValue;
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

### 3. Auto-Save to localStorage (Enhanced)
**Already existed, improved visibility**

- Debounced auto-save (500ms) to `localStorage`
- Saves fixture counts and project info
- Restores on page reload
- Shows toast notification when data is restored
- Clears saved data after successful save

```jsx
const { clearSaved, hasRestored } = useFormPersistence('plans-v3', persistedData, setPersisted, {
  shouldSave: (data) => {
    const f = data.fixtures || {};
    return Object.values(f).some(v => v > 0);
  },
});
```

### 4. Dirty State Detection
**Logic**: Tracks changes from initial state

- Stores initial form state on first load
- Compares current state with initial on every change
- Sets `isDirty = true` when differences detected
- Resets when estimate is saved successfully

```jsx
const [isDirty, setIsDirty] = useState(false);
const initialDataRef = useRef(null);

useEffect(() => {
  if (initialDataRef.current) {
    const current = JSON.stringify({ fixtures, projectInfo });
    setIsDirty(current !== initialDataRef.current && totalFixtures > 0);
  }
}, [fixtures, projectInfo, totalFixtures]);
```

## User Flow

```
1. User enters fixture counts
   ↓
2. isDirty = true
   ↓
3. Auto-save to localStorage (500ms debounce)
   ↓
4. "Unsaved" chip appears in header (amber + pulse)
   ↓
5. User tries to close tab
   ↓
6. Browser shows warning dialog
   ↓
7a. User stays → Continue editing
7b. User leaves → Data preserved in localStorage
   ↓
8. User returns → Data restored + toast notification
   ↓
9. User clicks Save → isDirty = false, clear localStorage
```

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/Plans.jsx` | Added dirty tracking, beforeunload handler, toast notifications |
| `src/components/plans/PlansCommandHeader.jsx` | Added unsaved chip indicator |
| `src/hooks/useFormPersistence.js` | Added `hasRestored` return value |

## API Changes

### useFormPersistence Hook
Added return value:
```typescript
{
  clearSaved: () => void;
  isEnabled: boolean;
  hasRestored: boolean;  // NEW: true if data was restored from storage
}
```

### PlansCommandHeader Props
Added props:
```typescript
{
  totalFixtures: number;
  totalPrice: number;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  isDirty?: boolean;      // NEW: show unsaved indicator
  isSaving?: boolean;     // NEW: future use for loading state
}
```

## Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Enter fixture count | "Unsaved" chip appears, pulses amber |
| Reload page | Data restored, "Restored" toast shown |
| Close tab with changes | Browser confirmation dialog |
| Click Save Estimate | Chip changes to "Ready" (green) |
| Clear all fixtures | "Unsaved" disappears |

## Bundle Impact
- Plans chunk: 48.31 kB → 49.18 kB (+0.87 kB)
- Negligible impact for significant UX improvement

## Future Enhancements
- [ ] Add "Save Draft" button for explicit saves
- [ ] Show "Last saved at [time]" timestamp
- [ ] Add keyboard shortcut (Ctrl+S) to save
- [ ] Visual diff of changes before leaving
- [ ] Sync drafts across devices (cloud storage)
