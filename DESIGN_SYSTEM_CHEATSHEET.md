# OpenSite Design System Cheatsheet
## Industrial Control Room Aesthetic

Quick reference for maintaining design consistency.

---

## Typography

### Hierarchy

| Element | Class | Example |
|---------|-------|---------|
| **Page Title** | `text-2xl md:text-3xl font-bold tracking-tight` | Dashboard |
| **Section Header** | `text-lg font-semibold uppercase tracking-wider` | ACTIVE LEADS |
| **Card Title** | `text-base font-semibold` | Project Alpha |
| **Stat Value** | `text-2xl font-mono font-bold tabular-nums` | 1,234 |
| **Body Text** | `text-sm text-surface-600` | Description text |
| **Label** | `text-xs uppercase tracking-wide font-semibold` | STATUS |
| **Caption** | `text-xs text-surface-400` | Last updated 2m ago |

### ❌ Common Mistakes

```
font-display          → NEVER USE
text-[10px]           → Use text-xs
text-4xl              → Use text-2xl md:text-3xl
text-3xl (stats)      → Use text-2xl
font-bold (labels)    → Use font-semibold
```

---

## Spacing

### Standard Values

| Token | Size | Usage |
|-------|------|-------|
| `p-5` | 20px | All card padding |
| `gap-4` | 16px | Grid gaps |
| `gap-6` | 24px | Section gaps |
| `mb-2` | 8px | Label margins |
| `mb-4` | 16px | Component margins |
| `space-y-4` | 16px | Vertical stacks |

### ❌ Common Mistakes

```
p-4                   → Use p-5 for cards
gap-2                 → Use gap-4
gap-3                 → Use gap-4
mb-1                  → Use mb-2
mt-0.5                → Use mt-1
```

---

## Colors

### Text Colors

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary | `text-surface-900` | `text-surface-100` |
| Secondary | `text-surface-600` | `text-surface-400` |
| Tertiary | `text-surface-500` | `text-surface-500` |
| Muted | `text-surface-400` | `text-surface-600` |

### Background Colors

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page | `bg-[#f0efed]` | `bg-[#0a0908]` |
| Card | `bg-surface-50` | `bg-surface-900` |
| Hover | `bg-surface-100` | `bg-surface-800` |
| Input | `bg-white/80` | `bg-surface-800/60` |

### Border Colors

```
border-surface-200 dark:border-surface-700    // Standard
border-surface-300 dark:border-surface-600    // Hover
```

### ❌ Common Mistakes

```
text-gray-900         → Use text-surface-900
text-gray-600         → Use text-surface-500
text-gray-500         → Use text-surface-400
bg-white              → Use bg-surface-50
bg-gray-50            → Use bg-surface-50
border-gray-200       → Use border-surface-200
```

---

## Components

### Cards

```jsx
// ✅ Standard Card
<div className="card p-5">
  <h3 className="text-base font-semibold mb-4">Title</h3>
  <p className="text-sm text-surface-600">Content</p>
</div>

// ✅ Card with Hover
<div className="card p-5 card-hover cursor-pointer">
  {/* Content */}
</div>

// ✅ Stat Card
<div className="card p-5">
  <p className="text-xs uppercase tracking-wide text-surface-500 mb-2">Label</p>
  <p className="text-2xl font-mono font-bold text-surface-900">1,234</p>
</div>
```

### Buttons

```jsx
// ✅ Primary
<button className="btn-primary">Action</button>

// ✅ Secondary
<button className="btn-secondary">Cancel</button>

// ✅ Danger
<button className="btn-danger">Delete</button>
```

### Inputs

```jsx
// ✅ Standard Input
<input 
  className="input" 
  placeholder="Enter value..."
/>

// ✅ With Label
<label className="label">Email</label>
<input className="input" type="email" />
```

### Badges

```jsx
// ✅ Status Badges
<span className="badge-hot">Hot Lead</span>
<span className="badge-warm">Warm</span>
<span className="badge-cool">Cool</span>
<span className="badge-success">Active</span>
```

---

## Layout Patterns

### Page Structure

```jsx
<div className="h-full overflow-y-auto page-transition-wrapper">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    {/* Page content */}
  </div>
</div>
```

### Grid Layouts

```jsx
// ✅ 2-column grid (mobile → desktop)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Items */}
</div>

// ✅ Stats row
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard ... />
  <StatCard ... />
</div>
```

### Section Spacing

```jsx
// ✅ Section with header
<section className="card p-5">
  <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
    Section Title
  </h2>
  {/* Content */}
</section>
```

---

## Animations

### Entrance Animations

```jsx
// ✅ Page entrance
<div className="page-transition-wrapper">

// ✅ Staggered children
<div className="stagger-container">
  <div>...</div>
  <div>...</div>
</div>

// ✅ Custom delay
<Component delay={100} />
```

### Hover Effects

```jsx
// ✅ Card lift
<div className="card p-5 hover:shadow-md transition-all duration-300">

// ✅ Button press
<button className="btn-primary active:scale-[0.97]">
```

---

## Icons

### Standard Sizes

| Context | Size |
|---------|------|
| Inline with text | `w-4 h-4` |
| Buttons | `w-4 h-4` or `w-5 h-5` |
| Cards | `w-5 h-5` |
| Stats | `w-5 h-5` |
| Empty states | `w-12 h-12` |

### Icon Pattern

```jsx
// ✅ With background
<div className="p-2.5 rounded-xl bg-copper-100 text-copper-600">
  <Icon className="w-5 h-5" />
</div>

// ✅ Inline
<span className="flex items-center gap-2">
  <Icon className="w-4 h-4 text-surface-400" />
  <span>Text</span>
</span>
```

---

## Dark Mode

### Always Use Pairs

```jsx
// ✅ Correct
<p className="text-surface-900 dark:text-surface-100">
<p className="text-surface-600 dark:text-surface-400">
<div className="bg-surface-50 dark:bg-surface-900">
<div className="border-surface-200 dark:border-surface-700">

// ❌ Wrong (missing dark mode)
<p className="text-surface-900">
<div className="bg-surface-50">
```

---

## Quick Checklist

Before submitting code, verify:

- [ ] No `font-display` usage
- [ ] No `text-[px]` custom sizes
- [ ] No `gray-*` colors, use `surface-*`
- [ ] Cards have `p-5`
- [ ] Stats use `font-mono tabular-nums`
- [ ] Labels use `text-xs uppercase tracking-wide`
- [ ] Dark mode classes present
- [ ] No arbitrary pixel values

---

## VS Code Snippets

Add to `.vscode/snippets.json`:

```json
{
  "Design System Card": {
    "prefix": "dscard",
    "body": [
      "<div className=\"card p-5\">",
      "  <h3 className=\"text-base font-semibold text-surface-900 dark:text-surface-100 mb-4\">",
      "    $1",
      "  </h3>",
      "  $2",
      "</div>"
    ]
  },
  "Design System Stat": {
    "prefix": "dsstat",
    "body": [
      "<div>",
      "  <p className=\"text-xs uppercase tracking-wide font-semibold text-surface-500 dark:text-surface-400 mb-2\">",
      "    $1",
      "  </p>",
      "  <p className=\"text-2xl font-mono font-bold text-surface-900 dark:text-surface-100\">",
      "    $2",
      "  </p>",
      "</div>"
    ]
  }
}
```

---

## Need Help?

1. Check [Design Audit Report](./DESIGN_AUDIT_REPORT.md)
2. Check [Applied Fixes](./DESIGN_FIXES_APPLIED.md)
3. Refer to [Design Improvements](./DESIGN_IMPROVEMENTS.md)

**Remember**: Consistency is key to the industrial control room aesthetic.
