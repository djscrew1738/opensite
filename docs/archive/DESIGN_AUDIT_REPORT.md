# OpenSite Design Audit Report
## Industrial Control Room Aesthetic Compliance

**Date**: February 21, 2026  
**Scope**: Full application audit for spacing, colors, typography, and component patterns  
**Status**: 🔴 Critical Issues Found - Action Required

---

## Executive Summary

The application has significant design inconsistencies that break the industrial control room aesthetic. Critical issues include:

| Category | Issues Found | Severity |
|----------|--------------|----------|
| Spacing | 47+ inconsistencies | 🔴 High |
| Typography | 23+ violations | 🔴 High |
| Colors | 15+ inconsistencies | 🟡 Medium |
| Component Patterns | 12+ inconsistencies | 🟡 Medium |

---

## 1. SPACING INCONSISTENCIES

### 1.1 Card Padding Violations

**Standard**: All cards should use `p-5` (20px) padding

| File | Line | Current | Expected |
|------|------|---------|----------|
| `components/shared/PolishedCard.jsx` | 198 | `p-4` (ListItemCard) | `p-5` |
| `components/dashboard/StatCard.jsx` | 43 | `py-5 pl-[18px] pr-4` | `p-5` |
| `components/leads/LeadCard.jsx` | Multiple | `p-4` | `p-5` |

### 1.2 Gap Inconsistencies

**Standard**: Use `gap-4` (16px) for grids, `gap-6` (24px) for sections

| File | Line | Current | Expected |
|------|------|---------|----------|
| `components/shared/StatCard.jsx` | 70 | `gap-2` (8px) | `gap-4` |
| `components/shared/PolishedCard.jsx` | 90 | `gap-2` | `gap-4` |
| `components/shared/PolishedCard.jsx` | 231 | `gap-1` | `gap-2` |
| `components/layout/MobileNav.jsx` | 37 | `gap-0.5` | `gap-1` or `gap-2` |

### 1.3 Margin Inconsistencies

**Standard**: Use consistent margin scale (4px increments)

| File | Line | Current | Issue |
|------|------|---------|-------|
| `components/shared/StatCard.jsx` | 69 | `mb-1` | Too small, use `mb-2` |
| `components/shared/StatCard.jsx` | 79 | `mt-1` | Too small, use `mt-2` |
| `components/shared/PolishedCard.jsx` | 163 | `mt-1` | Too small, use `mt-2` |
| `components/dashboard/StatCard.jsx` | 58 | `mb-2.5` | Non-standard value |
| `components/layout/Sidebar.jsx` | 261 | `mb-2.5` | Non-standard value |

### 1.4 Hardcoded Pixel Values (Critical)

**Files with inline style padding/margins:**

| File | Count | Examples |
|------|-------|----------|
| `pages/Dashboard.jsx` | 24+ | `padding: "12px 14px"`, `gap: 8` |
| `components/layout/Sidebar.jsx` | 10+ | `padding: '9px 12px'`, `py-2.5` |
| `components/layout/MobileNav.jsx` | 7+ | `px-1 pt-1.5 pb-0.5` |

---

## 2. TYPOGRAPHY VIOLATIONS

### 2.1 Heading Size Inconsistencies

**Standard**: Page titles `text-2xl md:text-3xl font-bold tracking-tight`

| File | Line | Current | Expected |
|------|------|---------|----------|
| `components/shared/PageHeader.jsx` | 36 | `md:text-4xl` | `md:text-3xl` |
| `components/shared/StatCard.jsx` | 71 | `text-3xl` | `text-2xl` |
| `components/leads/LeadCard.jsx` | 88 | `text-lg` | `text-base` |

### 2.2 Non-Standard Font Family Usage

**Standard**: Use default Tailwind font stack, NO `font-display`

| File | Line | Usage |
|------|------|-------|
| `components/shared/PageHeader.jsx` | 36 | `font-display` |
| `components/plans/PlansCommandHeader.jsx` | 24 | `font-display` |
| `components/leads/LeadCard.jsx` | 88, 99 | `font-display` |

### 2.3 Missing Mono/Tabular-Nums for Stats

**Standard**: All numeric stats should use `font-mono tabular-nums`

| File | Line | Location |
|------|------|----------|
| `components/shared/StatCard.jsx` | 71 | Stat value |
| `components/plans/PlansCommandHeader.jsx` | 47, 52 | Fixtures, Total |
| `components/leads/LeadCard.jsx` | 99 | Score chip |

### 2.4 Custom Font Sizes

**Standard**: Use Tailwind text scale only

| File | Line | Current |
|------|------|---------|
| `components/plans/PlansCommandHeader.jsx` | 46, 51, 56 | `text-[10px]` |
| `pages/Dashboard.jsx` | Multiple | `fontSize: 10`, `14px`, `15px` |

### 2.5 Inconsistent Text Colors

**Standard**: Use `surface` color scale, not `gray`

| File | Line | Current | Expected |
|------|------|---------|----------|
| `components/shared/StatCard.jsx` | 69 | `text-gray-600` | `text-surface-600` |
| `components/shared/StatCard.jsx` | 75 | `text-gray-500` | `text-surface-500` |

---

## 3. COLOR INCONSISTENCIES

### 3.1 Gray vs Surface Color Scale

**Files mixing `gray-*` and `surface-*`:**

| File | Issue |
|------|-------|
| `pages/Dashboard.jsx` | Uses both `gray-500` and `surface-500` |
| `pages/Settings.jsx` | Uses `gray-600` instead of `surface-600` |
| `components/shared/StatCard.jsx` | Uses `gray-*` colors |

### 3.2 Border Color Inconsistencies

| File | Current | Expected |
|------|---------|----------|
| `components/leads/LeadCard.jsx` | `border-gray-200` | `border-surface-200` |
| `components/dashboard/StatCard.jsx` | `border-surface-200/60` | `border-surface-200` |

### 3.3 Background Color Issues

| File | Issue |
|------|-------|
| `pages/Dashboard.jsx` | Mixed `bg-white` and `bg-surface-50` |
| `components/pricing/` | Uses non-system colors |

---

## 4. COMPONENT PATTERN INCONSISTENCIES

### 4.1 Multiple StatCard Components

**Issue**: Two different `StatCard` components exist:
- `components/shared/StatCard.jsx`
- `components/dashboard/StatCard.jsx`

**Impact**: Different styling, spacing, and behavior

### 4.2 Button Style Variations

**Files using non-standard button patterns:**

| File | Issue |
|------|-------|
| `pages/Dashboard.jsx` | Inline button styles instead of `.btn-*` classes |
| `components/pricing/BlueprintUpload.jsx` | Custom button styling |

### 4.3 Card Style Variations

| File | Issue |
|------|-------|
| `components/pricing/*.jsx` | Uses inline card styles instead of `.card` class |
| `pages/Settings.jsx` | Mixed card implementations |

### 4.4 Inconsistent Icon Sizing

| File | Issue |
|------|-------|
| `components/shared/StatCard.jsx` | Mixed `w-4 h-4` and `w-5 h-5` |
| `components/layout/Sidebar.jsx` | `w-[18px] h-[18px]` non-standard |

---

## 5. INDUSTRIAL AESTHETIC VIOLATIONS

### 5.1 Missing Control Room Elements

The following elements break the industrial control room aesthetic:

| Element | Issue | Solution |
|---------|-------|----------|
| Rounded corners | Some use `rounded-2xl`, others `rounded-lg` | Standardize to `rounded-xl` |
| Shadows | Inconsistent shadow usage | Use `card` class shadows only |
| Borders | Some missing borders, others too prominent | Use `border-surface-200` |
| Monospace fonts | Stats not using mono fonts | Add `font-mono tabular-nums` |

### 5.2 Color Temperature

The industrial aesthetic requires:
- **Warm neutrals**: Concrete grays (#f0efed, #a09b93)
- **Steel blues**: Primary actions (#003594)
- **Safety colors**: Red/amber for status only

**Violations found:**
- Blue used for non-action elements
- Inconsistent warm/cool gray mixing
- Purple/indigo colors not in palette

---

## 6. CRITICAL FIXES REQUIRED

### Priority 1: Spacing Standardization

```jsx
// Standard card padding
const CARD_PADDING = 'p-5'; // 20px

// Standard gaps
const GRID_GAP = 'gap-4'; // 16px
const SECTION_GAP = 'gap-6'; // 24px

// Standard margins
const LABEL_MARGIN = 'mb-2'; // 8px
const SECTION_MARGIN = 'mb-6'; // 24px
```

### Priority 2: Typography Fixes

```jsx
// Page title
<h1 className="text-2xl md:text-3xl font-bold tracking-tight">

// Section header
<h2 className="text-lg font-semibold uppercase tracking-wider">

// Stat value
<span className="text-2xl font-mono tabular-nums font-bold">

// Body text
<p className="text-sm text-surface-600 dark:text-surface-400">

// Label
<label className="text-xs uppercase tracking-wide font-semibold">
```

### Priority 3: Color Standardization

```jsx
// Use surface scale consistently
text-surface-900 dark:text-surface-100  // Primary text
text-surface-600 dark:text-surface-400  // Secondary text
text-surface-500 dark:text-surface-500  // Tertiary text

// Backgrounds
bg-surface-50 dark:bg-surface-900       // Card backgrounds
bg-surface-100 dark:bg-surface-800      // Hover states

// Borders
border-surface-200 dark:border-surface-700
```

---

## 7. FILES REQUIRING IMMEDIATE ATTENTION

| Priority | File | Issue Count |
|----------|------|-------------|
| 🔴 P0 | `pages/Dashboard.jsx` | 24+ inline styles |
| 🔴 P0 | `components/layout/Sidebar.jsx` | 10+ spacing issues |
| 🔴 P0 | `components/shared/StatCard.jsx` | Typography + spacing |
| 🟡 P1 | `components/leads/LeadCard.jsx` | Font + color issues |
| 🟡 P1 | `pages/Settings.jsx` | Color inconsistencies |
| 🟡 P1 | `components/pricing/*.jsx` | Pattern violations |
| 🟢 P2 | `components/plans/*.jsx` | Minor adjustments |

---

## 8. RECOMMENDED ACTIONS

### Immediate (This Sprint)
1. ✅ Replace all hardcoded pixel values in Dashboard.jsx
2. ✅ Consolidate StatCard components
3. ✅ Remove all `font-display` usage
4. ✅ Add `font-mono tabular-nums` to all stats

### Short Term (Next 2 Weeks)
1. Standardize all card padding to `p-5`
2. Replace `gray-*` with `surface-*` colors
3. Fix gap inconsistencies
4. Audit all remaining components

### Long Term (Next Month)
1. Create component library documentation
2. Add visual regression testing
3. Implement design tokens
4. Create Figma design system sync

---

## 9. DESIGN SYSTEM COMPLIANCE CHECKLIST

### Spacing
- [ ] All cards use `p-5`
- [ ] All grids use `gap-4` or `gap-6`
- [ ] No hardcoded pixel values
- [ ] Consistent margin scale

### Typography
- [ ] Page titles: `text-2xl md:text-3xl font-bold tracking-tight`
- [ ] Section headers: `text-lg font-semibold uppercase tracking-wider`
- [ ] Stats: `font-mono tabular-nums`
- [ ] No `font-display` usage
- [ ] No custom pixel font sizes

### Colors
- [ ] Use `surface` scale only (no `gray-*`)
- [ ] Primary: `#003594`
- [ ] Text: `surface-900/dark:surface-100`
- [ ] Borders: `surface-200/dark:surface-700`

### Components
- [ ] Use `.card` class for all cards
- [ ] Use `.btn-*` classes for buttons
- [ ] Use `.input` class for inputs
- [ ] Consistent icon sizing

---

## 10. APPENDIX: Design System Reference

### Color Palette
```
Primary: #003594 (Steel Blue)
Background Light: #f0efed (Concrete)
Background Dark: #0a0908 (Obsidian)
Text Light: #1a1816
Text Dark: #e2e0dc
Accent: copper/emerald/amber for status
```

### Spacing Scale
```
4px  (1)  - xs
8px  (2)  - sm
12px (3)  - md
16px (4)  - base (gap-4)
20px (5)  - lg (card padding)
24px (6)  - xl (section gap)
32px (8)  - 2xl
```

### Typography Scale
```
text-xs   (12px)  - Labels
text-sm   (14px)  - Body
text-base (16px)  - Card titles
text-lg   (18px)  - Section headers
text-xl   (20px)  - Subsection
text-2xl  (24px)  - Page title mobile
text-3xl  (30px)  - Page title desktop
```

---

**Audit Completed By**: Design System Bot  
**Next Review Date**: March 2026
