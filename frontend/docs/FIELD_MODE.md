# Field Mode Documentation

## Overview

Field Mode is an ultra-high-contrast interface optimized for direct sunlight on mobile devices. It's designed for field operations where visibility and ease of use with gloved hands are critical.

## Features

- **Ultra-high contrast**: WCAG AAA compliant color ratios
- **Dark background (#0a0a0a)**: Reduces glare in direct sunlight
- **Bright accent colors**:
  - Success: `#00ff88` (neon green)
  - Hot leads: `#ff4444` (bright red)
  - Warnings: `#ffaa00` (amber)
  - Primary: `#00d4ff` (cyan)
- **Large touch targets**: Minimum 48x48px, comfortable 56px default
- **Increased font size**: 18px base font for readability
- **Extra padding**: Designed for gloved-hand use
- **Collapsible sections**: Secondary info hidden behind expandable sections
- **Persistent preference**: Stored in localStorage

## Usage

### Enabling Field Mode

Users can toggle Field Mode using the sun icon button in:
- Mobile sticky header (visible on all mobile devices)
- Desktop control room header

### Using Field Mode Components

#### FieldModeCard

A card component optimized for field mode with critical data visible at a glance:

```jsx
import { FieldModeCard } from './components/shared';

<FieldModeCard
  title="Job #12345"
  subtitle="123 Main St, Dallas TX"
  status="hot" // 'hot' | 'warm' | 'active' | 'pending' | 'completed'
  phase="roughin" // 'underground' | 'roughin' | 'topout' | 'trim' | 'final'
  nextAction="Schedule inspection for tomorrow"
  priority="high" // 'high' | 'medium' | 'low'
  criticalInfo={[
    { label: 'Builder', value: 'DR Horton', type: 'info' },
    { label: 'Lot', value: '147', type: 'info' },
    { label: 'Receivable', value: '$2,450', type: 'success' },
    { label: 'Overdue', value: '3 days', type: 'hot' },
  ]}
>
  {/* Secondary content - collapsed by default in field mode */}
  <div>
    <p>Full job details here...</p>
  </div>
</FieldModeCard>
```

#### FieldModeList

A list container optimized for field mode:

```jsx
import { FieldModeList, FieldModeCard } from './components/shared';

<FieldModeList>
  {jobs.map(job => (
    <FieldModeCard key={job.id} {...job} />
  ))}
</FieldModeList>
```

#### FieldModeSection

An expandable section for organizing content:

```jsx
import { FieldModeSection } from './components/shared';

<FieldModeSection title="Materials" defaultExpanded={false}>
  <ul>
    <li>Pipe: 200ft</li>
    <li>Fittings: 45 pcs</li>
  </ul>
</FieldModeSection>
```

### useFieldMode Hook

Access field mode state programmatically:

```jsx
import { useFieldMode } from './hooks/useFieldMode';

function MyComponent() {
  const { 
    isFieldMode,     // boolean - current state
    isMobile,        // boolean - mobile device detected
    toggleFieldMode, // function - toggle on/off
    enableFieldMode, // function - turn on
    disableFieldMode // function - turn off
  } = useFieldMode();

  return (
    <div>
      {isFieldMode ? 'Field mode is ON' : 'Field mode is OFF'}
    </div>
  );
}
```

## CSS Classes

When field mode is active, the `field-mode` class is added to the HTML root element. Use these CSS custom properties:

```css
.field-mode {
  /* Surfaces */
  --field-surface-bg: #0a0a0a;
  --field-surface-card: #111111;
  --field-surface-elevated: #1a1a1a;
  
  /* Accents */
  --field-accent-primary: #00d4ff;
  --field-accent-success: #00ff88;
  --field-accent-warning: #ffaa00;
  --field-accent-danger: #ff4444;
  
  /* Text */
  --field-text-primary: #ffffff;
  --field-text-secondary: #e0e0e0;
  --field-text-muted: #a0a0a0;
  
  /* Touch targets */
  --field-touch-min: 48px;
  --field-touch-comfortable: 56px;
  --field-touch-large: 64px;
  
  /* Typography */
  --field-font-base: 18px;
  --field-font-small: 16px;
  --field-font-large: 20px;
  --field-font-xl: 24px;
  
  /* Spacing */
  --field-padding-sm: 16px;
  --field-padding-md: 20px;
  --field-padding-lg: 24px;
}
```

## Tailwind Classes

Field mode colors are available in tailwind:

```jsx
// Background colors
<div className="bg-field-bg">
<div className="bg-field-card">
<div className="bg-field-elevated">

// Text colors
<div className="text-field-primary">
<div className="text-field-success">
<div className="text-field-warning">
<div className="text-field-danger">
```

## Best Practices

1. **Always use FieldModeCard for job/lead lists** - It automatically handles the collapsible secondary info
2. **Keep critical data minimal** - Only show phase, status, next action, and 2-4 key metrics
3. **Use appropriate status colors** - Hot leads get red, active jobs get cyan, completed gets green
4. **Test on actual mobile devices** - Field mode is specifically designed for outdoor mobile use
5. **Consider reduced motion** - Field mode respects `prefers-reduced-motion` settings

## Browser Support

Field Mode is supported in all modern browsers:
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- iOS Safari 14+
- Chrome Android 88+

## Accessibility

- WCAG AAA contrast ratios (7:1+ for normal text, 4.5:1+ for large text)
- Minimum 48x48px touch targets (WCAG 2.5.5)
- Respects `prefers-reduced-motion` media query
- Proper ARIA labels on all interactive elements
- Keyboard navigable

## Storage

Field Mode preference is stored in `localStorage` with the key `opensite-field-mode`.
