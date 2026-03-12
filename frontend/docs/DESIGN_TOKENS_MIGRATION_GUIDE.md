# Design Tokens Migration Guide

> Mapping Tailwind Semantic Classes → JavaScript Design Tokens  
> Dark Forge Design System — OpenSite

---

## Quick Reference Card

### Color Mappings

| Tailwind Class | Design Token | Value |
|----------------|--------------|-------|
| `bg-surface-50` | `colors.surface.card` | `#111318` |
| `bg-surface-100` | `colors.surface.elevated` | `#181C24` |
| `bg-surface-200` | `colors.surface.elevated` | `#181C24` |
| `bg-surface-800` | `colors.surface.elevated` | `#181C24` |
| `bg-surface-900` | `colors.surface.primary` | `#0A0B0D` |
| `bg-surface-950` | `colors.surface.primary` | `#0A0B0D` |
| `text-surface-100` | `colors.text.primary` | `#F1F5F9` |
| `text-surface-200` | `colors.text.primary` | `#F1F5F9` |
| `text-surface-300` | `colors.text.secondary` | `#94A3B8` |
| `text-surface-400` | `colors.text.secondary` | `#94A3B8` |
| `text-surface-500` | `colors.text.muted` | `#475569` |
| `text-surface-600` | `colors.text.muted` | `#475569` |
| `text-surface-700` | `colors.text.secondary` | `#94A3B8` |
| `text-surface-800` | `colors.text.primary` | `#F1F5F9` |
| `text-surface-900` | `colors.text.primary` | `#F1F5F9` |
| `border-surface-200` | `colors.border.default` | `#1F2430` |
| `border-surface-300` | `colors.border.strong` | `#2D3548` |
| `border-surface-700` | `colors.border.default` | `#1F2430` |

### Accent Colors

| Tailwind Class | Design Token | Value |
|----------------|--------------|-------|
| `bg-primary-50` | `colors.accent.muted` | `rgba(59, 130, 246, 0.12)` |
| `bg-primary-100` | `colors.accent.muted` | `rgba(59, 130, 246, 0.12)` |
| `bg-primary-600` | `colors.accent.DEFAULT` | `#3B82F6` |
| `bg-primary-700` | `colors.accent.hover` | `#2563EB` |
| `text-primary-600` | `colors.accent.DEFAULT` | `#3B82F6` |
| `text-primary-700` | `colors.accent.hover` | `#2563EB` |
| `text-accent-600` | `colors.accent.DEFAULT` | `#3B82F6` |
| `border-accent-300` | `colors.accent.light` | `#60A5FA` |
| `ring-accent-500` | `colors.accent.DEFAULT` | `#3B82F6` |

### Semantic Colors

| Tailwind Class | Design Token | Value |
|----------------|--------------|-------|
| `bg-red-50` | `colors.danger.muted` | `rgba(239, 68, 68, 0.12)` |
| `bg-red-100` | `colors.danger.muted` | `rgba(239, 68, 68, 0.12)` |
| `bg-red-500` | `colors.danger.DEFAULT` | `#EF4444` |
| `text-red-500` | `colors.danger.DEFAULT` | `#EF4444` |
| `text-red-600` | `colors.danger.dark` | `#DC2626` |
| `text-red-700` | `colors.danger.dark` | `#DC2626` |
| `border-red-200` | `colors.danger.border` | `rgba(239, 68, 68, 0.2)` |
| `bg-green-50` | `colors.success.muted` | `rgba(16, 185, 129, 0.12)` |
| `bg-green-100` | `colors.success.muted` | `rgba(16, 185, 129, 0.12)` |
| `bg-emerald-50` | `colors.success.muted` | `rgba(16, 185, 129, 0.12)` |
| `bg-emerald-100` | `colors.success.muted` | `rgba(16, 185, 129, 0.12)` |
| `bg-emerald-950/30` | `colors.success.muted` | `rgba(16, 185, 129, 0.12)` |
| `text-emerald-500` | `colors.success.DEFAULT` | `#10B981` |
| `text-emerald-600` | `colors.success.dark` | `#059669` |
| `text-emerald-700` | `colors.success.dark` | `#059669` |
| `bg-amber-50` | `colors.warning.muted` | `rgba(245, 158, 11, 0.12)` |
| `bg-amber-100` | `colors.warning.muted` | `rgba(245, 158, 11, 0.12)` |
| `text-amber-500` | `colors.warning.DEFAULT` | `#F59E0B` |
| `text-amber-600` | `colors.warning.dark` | `#D97706` |
| `text-amber-700` | `colors.warning.dark` | `#D97706` |
| `bg-blue-50` | `colors.info.muted` | `rgba(59, 130, 246, 0.12)` |
| `bg-blue-100` | `colors.info.muted` | `rgba(59, 130, 246, 0.12)` |
| `text-blue-500` | `colors.info.DEFAULT` | `#3B82F6` |
| `text-blue-600` | `colors.info.dark` | `#2563EB` |
| `text-blue-700` | `colors.info.dark` | `#2563EB` |
| `bg-violet-50` | `colors.accent.purple + '20'` | `rgba(139, 92, 246, 0.12)` |
| `bg-violet-100` | `colors.accent.purple + '20'` | `rgba(139, 92, 246, 0.12)` |
| `text-violet-500` | `colors.accent.purple` | `#8B5CF6` |
| `text-violet-700` | `colors.accent.purple` | `#8B5CF6` |
| `bg-cyan-600` | `colors.phase.topout` | `#06B6D4` |

### Special Cases

| Tailwind Class | Design Token | Value |
|----------------|--------------|-------|
| `text-white` | `colors.text.inverse` | `#0F172A` |
| `bg-white` | `colors.surface.card` | `#111318` |
| `bg-white/80` | `colors.surface.card + 'CC'` | `#111318CC` |
| `bg-black/40` | `colors.surface.overlay` | `rgba(0, 0, 0, 0.6)` |
| `bg-black/60` | `colors.surface.overlay` | `rgba(0, 0, 0, 0.6)` |
| `text-gray-300` | `colors.text.muted` | `#475569` |
| `text-gray-400` | `colors.text.muted` | `#475569` |
| `text-gray-500` | `colors.text.secondary` | `#94A3B8` |
| `text-gray-600` | `colors.text.secondary` | `#94A3B8` |
| `text-gray-900` | `colors.text.primary` | `#F1F5F9` |
| `bg-gray-50` | `colors.surface.elevated` | `#181C24` |
| `bg-gray-100` | `colors.surface.elevated` | `#181C24` |
| `bg-gray-800` | `colors.surface.elevated` | `#181C24` |
| `bg-gray-900` | `colors.surface.primary` | `#0A0B0D` |
| `border-gray-200` | `colors.border.default` | `#1F2430` |
| `border-gray-600` | `colors.border.strong` | `#2D3548` |
| `border-gray-700` | `colors.border.default` | `#1F2430` |

---

## Migration Patterns

### Pattern 1: Simple Background Color

**Before (Tailwind):**
```jsx
<div className="bg-surface-100 dark:bg-surface-800">
```

**After (Tokens):**
```jsx
<div style={{ backgroundColor: colors.surface.elevated }}>
```

### Pattern 2: Text Color with Hover

**Before (Tailwind):**
```jsx
<span className="text-surface-500 hover:text-accent-600 transition-colors">
```

**After (Tokens):**
```jsx
<span 
  style={{ color: colors.text.muted }}
  onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
  onMouseLeave={(e) => e.currentTarget.style.color = colors.text.muted}
>
```

### Pattern 3: Border with Hover State

**Before (Tailwind):**
```jsx
<div className="border border-surface-200 hover:border-accent-300 transition-all">
```

**After (Tokens):**
```jsx
<div 
  style={{ border: `1px solid ${colors.border.default}` }}
  onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.accent.light}
  onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border.default}
>
```

### Pattern 4: Conditional Colors

**Before (Tailwind):**
```jsx
<div className={`p-2 rounded ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-surface-50 text-surface-500'}`}>
```

**After (Tokens):**
```jsx
<div 
  className="p-2 rounded"
  style={{ 
    backgroundColor: isActive ? colors.accent.muted : colors.surface.card,
    color: isActive ? colors.accent.DEFAULT : colors.text.muted
  }}
>
```

### Pattern 5: Ring/Focus States

**Before (Tailwind):**
```jsx
<button className="ring-2 ring-accent-500 ring-offset-2">
```

**After (Tokens):**
```jsx
<button 
  style={{ 
    boxShadow: `0 0 0 2px ${colors.accent.DEFAULT}, 0 0 0 4px ${colors.surface.card}` 
  }}
>
```

### Pattern 6: Opacity Variants

**Before (Tailwind):**
```jsx
<div className="bg-surface-900/50">  {/* 50% opacity */}
```

**After (Tokens):**
```jsx
<div style={{ backgroundColor: `${colors.surface.primary}80` }}>  {/* 80 = 50% opacity */}
```

**Opacity Hex Reference:**
- `100` = 100% (FF)
- `80` = 50% (80)
- `40` = 25% (40)
- `20` = 12% (20)
- `10` = 6% (10)

### Pattern 7: Gradients

**Before (Tailwind):**
```jsx
<div className="bg-gradient-to-r from-accent-500 to-purple-600">
```

**After (Tokens):**
```jsx
<div 
  style={{ 
    background: `linear-gradient(to right, ${colors.accent.DEFAULT}, ${colors.accent.purple})` 
  }}
>
```

### Pattern 8: Dark Mode Classes

**Before (Tailwind):**
```jsx
<div className="bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100">
```

**After (Tokens):**
```jsx
// Tokens automatically handle dark mode - no conditional needed!
<div 
  style={{ 
    backgroundColor: colors.surface.card,
    color: colors.text.primary 
  }}
>
```

---

## Component Architecture Pattern

### Standard Sub-Component Structure

```jsx
/**
 * ComponentName - Brief description
 * 
 * @module components/category/ComponentName
 */

import { memo, useCallback } from 'react';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const STATUS_COLORS = {
  active: { bg: colors.accent.muted, text: colors.accent.DEFAULT },
  inactive: { bg: colors.surface.elevated, text: colors.text.muted },
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Sub-component description
 * @param {{ prop1: string; prop2: number }} props
 */
const SubComponent = memo(function SubComponent({ prop1, prop2 }) {
  // Component logic
  
  return (
    <div 
      className="p-4 rounded-xl"
      style={{ 
        backgroundColor: colors.surface.card,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      {/* Content */}
    </div>
  );
});

SubComponent.displayName = 'SubComponent';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * Main component description
 * @param {{ data: any[]; onAction: () => void }} props
 */
const ComponentName = memo(function ComponentName({ data, onAction }) {
  // Hooks and logic
  
  return (
    <div className="space-y-4">
      {/* Render sub-components */}
      <SubComponent prop1="value" prop2={42} />
    </div>
  );
});

ComponentName.displayName = 'ComponentName';

export default ComponentName;
```

---

## Common Import Pattern

```jsx
// Standard token imports
import { colors, shadows, radius, spacing } from '../../styles/tokens';

// Full tokens import (if needed)
import { 
  colors, 
  shadows, 
  radius, 
  spacing, 
  typography,
  animation,
  zIndex,
  breakpoints 
} from '../../styles/tokens';
```

---

## Token Structure Reference

### colors
```javascript
colors.surface.primary    // App background
 colors.surface.card       // Card backgrounds
 colors.surface.elevated   // Modals, panels
 colors.surface.overlay    // Backdrop overlays
 
 colors.border.default     // Standard borders
 colors.border.strong      // Focus/active borders
 colors.border.muted       // Subtle dividers
 
 colors.text.primary       // Main text
 colors.text.secondary     // Supporting text
 colors.text.muted         // Placeholders, hints
 colors.text.inverse       // Text on dark backgrounds
 
 colors.accent.DEFAULT     // Primary accent (blue)
 colors.accent.light       // Hover states
 colors.accent.hover       // Active states
 colors.accent.muted       // Subtle backgrounds
 colors.accent.purple      // Secondary accent
 colors.accent.pink        // Tertiary accent
 
 colors.success.DEFAULT    // Success states
 colors.success.light      // Success hover
 colors.success.dark       // Success text
 colors.success.muted      // Success backgrounds
 
 colors.warning.DEFAULT    // Warning states
 colors.warning.light      // Warning hover
 colors.warning.dark       // Warning text
 colors.warning.muted      // Warning backgrounds
 
 colors.danger.DEFAULT     // Error/destructive
 colors.danger.light       // Error hover
 colors.danger.dark        // Error text
 colors.danger.muted       // Error backgrounds
 
 colors.info.DEFAULT       // Info states (blue)
 colors.info.light         // Info hover
 colors.info.dark          // Info text
 colors.info.muted         // Info backgrounds
 
 colors.phase.underground  // Phase colors
 colors.phase.roughin
 colors.phase.topout
 colors.phase.trim
 colors.phase.final
```

### shadows
```javascript
shadows.card       // Standard card shadow
 shadows.cardHover  // Elevated card shadow
 shadows.glowBlue   // Blue glow effect
 shadows.glowRed    // Red glow effect
 shadows.glowAmber  // Amber glow effect
 shadows.fab        // Floating action button
 shadows.sheet      // Bottom sheet
 shadows.navFloat   // Navigation bar
```

### radius
```javascript
radius.none    // 0px
 radius.sm      // 4px
 radius.btn     // 6px
 radius.input   // 8px
 radius.md      // 10px
 radius.card    // 12px
 radius.sheet   // 16px
 radius.xl      // 20px
 radius.modal   // 24px
 radius.full    // 9999px
```

---

## Quick Fix: Auto-Replace Common Patterns

Use these regex replacements in your editor:

### Find → Replace Patterns

```regex
// Background colors
Find:    className="([^"]*)bg-surface-100([^"]*)"
Replace: style={{ backgroundColor: colors.surface.card }} className="$1$2"

// Text colors
Find:    className="([^"]*)text-surface-500([^"]*)"
Replace: style={{ color: colors.text.muted }} className="$1$2"

// Border colors
Find:    className="([^"]*)border-surface-200([^"]*)"
Replace: style={{ borderColor: colors.border.default }} className="$1$2"

// Accent colors
Find:    className="([^"]*)text-accent-600([^"]*)"
Replace: style={{ color: colors.accent.DEFAULT }} className="$1$2"
```

---

## Verification Checklist

After migration, verify:

- [ ] Component imports `colors` from `'../../styles/tokens'`
- [ ] No hardcoded hex colors remain (except in CSS gradients)
- [ ] All sub-components use `memo()`
- [ ] All sub-components have `displayName`
- [ ] JSDoc types added for all props
- [ ] `className` only used for layout (flex, grid, padding, margin)
- [ ] `style` prop used for all colors
- [ ] Hover states converted to `onMouseEnter`/`onMouseLeave`
- [ ] No `dark:` Tailwind modifiers remain

---

## Troubleshooting

### Issue: Colors look wrong after migration
**Check:** Ensure you're importing from the correct path:
```jsx
import { colors } from '../../styles/tokens';  // Correct for components
import { colors } from '../../../styles/tokens'; // For nested components
```

### Issue: Token not found
**Check:** Verify the token exists in `frontend/src/styles/tokens.js`

### Issue: TypeScript errors on tokens
**Fix:** Tokens are JavaScript exports. Add a `tokens.d.ts` declaration file or use JSDoc:
```jsx
/** @type {import('../../styles/tokens').ColorToken} */
const bgColor = colors.surface.card;
```

---

*Last updated: 2026-02-28*  
*Design System: Dark Forge v2.0*
