# UI/UX Improvement Action Plan
## OpenSite - Prioritized Implementation Guide

---

## 🚨 CRITICAL FIXES (Do First)

### CF-1: Fix Keyboard Accessibility on Interactive Cards
**Priority:** P0 | **Effort:** 2 hours | **Impact:** High

```jsx
// File: components/shared/PolishedCard.jsx
// Add to PolishedCard component:

export function PolishedCard({ 
  children, 
  onClick,
  hoverable = false,
  // ... other props
}) {
  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={title}
      // ... existing classes
    >
      {children}
    </div>
  );
}
```

**Files to Update:**
- [ ] `components/shared/PolishedCard.jsx`
- [ ] `components/leads/LeadCard.jsx`
- [ ] `components/plans/FixtureCard.jsx`
- [ ] `components/pricing/ProjectOverviewCard.jsx`

---

### CF-2: Add ARIA Labels to All Icon-Only Buttons
**Priority:** P0 | **Effort:** 1 hour | **Impact:** High

Search pattern: `<button` without children text, with only icon

```bash
# Find problematic patterns
grep -r "<button" frontend/src --include="*.jsx" | grep -v "aria-label" | grep -E "(X|Plus|Settings|Trash2)"
```

**Quick Fix Script:**
```jsx
// Add aria-label to all icon buttons
// BEFORE:
<button onClick={close} className="p-2">
  <X className="w-4 h-4" />
</button>

// AFTER:
<button 
  onClick={close} 
  className="p-2"
  aria-label="Close dialog"
>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

---

### CF-3: Fix Mobile Sidebar Navigation
**Priority:** P0 | **Effort:** 4 hours | **Impact:** High

```jsx
// File: components/layout/Sidebar.jsx
// Add mobile support:

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile Drawer */}
        <Drawer 
          isOpen={mobileOpen} 
          onClose={() => setMobileOpen(false)}
          side="left"
          size="full"
        >
          <NavContent expanded={true} />
        </Drawer>
      </>
    );
  }

  // Desktop hover sidebar
  return (
    <aside 
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <NavContent expanded={expanded} />
    </aside>
  );
}
```

---

### CF-4: Implement Focus Trap for Modals
**Priority:** P0 | **Effort:** 3 hours | **Impact:** High

```jsx
// File: hooks/useFocusTrap.js
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive) {
  const containerRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (isActive) {
      previousFocus.current = document.activeElement;
      
      const container = containerRef.current;
      const focusable = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      first?.focus();

      const handleTab = (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      };

      container.addEventListener('keydown', handleTab);
      return () => {
        container.removeEventListener('keydown', handleTab);
        previousFocus.current?.focus();
      };
    }
  }, [isActive]);

  return containerRef;
}
```

---

## 🔧 HIGH PRIORITY IMPROVEMENTS

### HP-1: Consolidate Button Usage
**Priority:** P1 | **Effort:** 4 hours | **Impact:** Medium

Replace all CSS `.btn-*` classes with UI Button component:

```bash
# Find files using CSS buttons
grep -r "btn-primary\|btn-secondary\|btn-ghost" frontend/src --include="*.jsx" -l
```

**Migration Guide:**
```jsx
// BEFORE
<button className="btn-primary">Save</button>
<button className="btn-secondary">Cancel</button>

// AFTER
import { Button } from '@/components/ui';
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
```

**Files to Update:**
- [ ] `pages/Dashboard.jsx`
- [ ] `pages/LeadFinder.jsx`
- [ ] `pages/Settings.jsx`
- [ ] `components/pricing/*.jsx`
- [ ] `components/leads/*.jsx`

---

### HP-2: Fix Form Validation & Error States
**Priority:** P1 | **Effort:** 6 hours | **Impact:** High

```jsx
// Enhanced Input with better validation display
export const Input = forwardRef(({
  error,
  touched,
  validating,
  // ... other props
}, ref) => {
  const showError = touched && error;
  
  return (
    <div className="w-full">
      {/* Label */}
      
      <div className="relative">
        <input
          ref={ref}
          aria-invalid={showError}
          aria-describedby={showError ? `${id}-error` : undefined}
          className={`
            ${baseClasses}
            ${showError ? 'border-danger focus:border-danger' : ''}
            ${validating ? 'pr-10' : ''}
          `}
        />
        
        {/* Validation icon */}
        {validating && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
        {touched && !error && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-success" />
        )}
      </div>
      
      {/* Error message */}
      {showError && (
        <p id={`${id}-error`} role="alert" className="text-danger text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
});
```

---

### HP-3: Create Responsive DataTable
**Priority:** P1 | **Effort:** 8 hours | **Impact:** High

```jsx
// New component: components/ui/DataTable.jsx
export function DataTable({
  data,
  columns,
  sortable = true,
  filterable = false,
  pagination = false,
  mobileCards = true,
  rowSelection = false,
  actions,
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile && mobileCards) {
    return <MobileCardView data={data} columns={columns} />;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {rowSelection && <th>Select</th>}
            {columns.map(col => (
              <th key={col.key}>
                {sortable && col.sortable !== false ? (
                  <button onClick={() => handleSort(col.key)}>
                    {col.title}
                    <SortIcon direction={sortConfig.key === col.key ? sortConfig.direction : null} />
                  </button>
                ) : col.title}
              </th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>{/* ... */}</tbody>
      </table>
      
      {pagination && <Pagination />}
    </div>
  );
}
```

---

### HP-4: Standardize Card Padding
**Priority:** P1 | **Effort:** 2 hours | **Impact:** Medium

Replace all card padding variations with `p-5`:

```bash
# Find violations
grep -r "className.*p-4" frontend/src --include="*.jsx" | grep -i card
grep -r "py-.*px-" frontend/src --include="*.jsx" | grep -i card
```

**Pattern to enforce:**
```jsx
// ALWAYS use p-5 for cards
<div className="card p-5">
  {/* content */}
</div>
```

---

## 📱 MEDIUM PRIORITY IMPROVEMENTS

### MP-1: Add Touch Gesture Support
**Priority:** P2 | **Effort:** 6 hours | **Impact:** Medium

```jsx
// hooks/useSwipe.js
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 100 }) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const onTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const diff = touchStart.current - touchEnd.current;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeLeft) onSwipeLeft();
      if (diff < 0 && onSwipeRight) onSwipeRight();
    }
    
    touchStart.current = null;
    touchEnd.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Usage for dismissible cards
function LeadCard({ lead, onDismiss }) {
  const swipeHandlers = useSwipe({
    onSwipeLeft: onDismiss,
    threshold: 100,
  });

  return (
    <div 
      className="card p-5 touch-pan-y"
      {...swipeHandlers}
    >
      {/* card content */}
    </div>
  );
}
```

---

### MP-2: Implement Skip Navigation
**Priority:** P2 | **Effort:** 1 hour | **Impact:** Medium

```jsx
// Add to Layout.jsx
export function Layout() {
  return (
    <>
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                   focus:z-50 focus:p-4 focus:bg-surface-800 focus:rounded-lg"
      >
        Skip to main content
      </a>
      
      <Sidebar />
      <main id="main-content">
        <Outlet />
      </main>
    </>
  );
}
```

---

### MP-3: Add Breadcrumb Navigation
**Priority:** P2 | **Effort:** 3 hours | **Impact:** Medium

```jsx
// components/ui/Breadcrumb.jsx
export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-surface-400" />}
            {item.href ? (
              <a 
                href={item.href}
                className="text-surface-500 hover:text-surface-700"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-surface-900 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

---

## 🎨 VISUAL CONSISTENCY TASKS

### VC-1: Remove Custom Hex Colors
**Priority:** P2 | **Effort:** 3 hours | **Impact:** Medium

Replace all custom hex values with design tokens:

```bash
# Find custom colors
grep -r "#[0-9a-fA-F]\{6\}" frontend/src --include="*.jsx" | grep -v "node_modules"
```

**Conversion map:**
```
#060608 → bg-surface-bg
#0E0F12 → bg-surface-950
#151720 → bg-surface-900
#1A1C24 → bg-surface-800
```

---

### VC-2: Standardize Typography
**Priority:** P2 | **Effort:** 4 hours | **Impact:** Medium

Remove all custom font sizes:

```bash
# Find custom sizes
grep -r "text-\[" frontend/src --include="*.jsx"
grep -r "fontSize:" frontend/src --include="*.jsx"
```

**Allowed sizes:**
- `text-xs` (12px) - Labels
- `text-sm` (14px) - Body
- `text-base` (16px) - Card titles
- `text-lg` (18px) - Section headers
- `text-xl` (20px) - Subsection
- `text-2xl` (24px) - Page title mobile
- `text-3xl` (30px) - Page title desktop

---

## 🧪 TESTING & QUALITY

### TQ-1: Add Accessibility Tests
**Priority:** P2 | **Effort:** 4 hours | **Impact:** High

```bash
npm install --save-dev @testing-library/jest-dom jest-axe
```

```jsx
// __tests__/Button.test.jsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('icon-only button should have aria-label', () => {
    const { getByLabelText } = render(
      <Button size="icon" aria-label="Close">
        <X />
      </Button>
    );
    expect(getByLabelText('Close')).toBeInTheDocument();
  });
});
```

---

### TQ-2: Visual Regression Testing
**Priority:** P3 | **Effort:** 8 hours | **Impact:** Medium

```bash
npm install --save-dev @storybook/react @storybook/addon-a11y chromatic
```

```jsx
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
};
```

---

## 📅 IMPLEMENTATION TIMELINE

### Week 1: Critical Fixes
| Task | Owner | Hours | Day |
|------|-------|-------|-----|
| CF-1: Keyboard accessibility | Dev | 2 | Mon |
| CF-2: Icon button labels | Dev | 1 | Mon |
| CF-3: Mobile sidebar | Dev | 4 | Tue-Wed |
| CF-4: Focus trap | Dev | 3 | Thu |
| Testing & review | QA | 4 | Fri |

### Week 2: High Priority
| Task | Owner | Hours | Day |
|------|-------|-------|-----|
| HP-1: Button consolidation | Dev | 4 | Mon-Tue |
| HP-2: Form validation | Dev | 6 | Wed-Fri |

### Week 3: Components & Tables
| Task | Owner | Hours | Day |
|------|-------|-------|-----|
| HP-3: DataTable v2 | Dev | 8 | Mon-Wed |
| MP-1: Touch gestures | Dev | 6 | Thu-Fri |

### Week 4: Polish & Documentation
| Task | Owner | Hours | Day |
|------|-------|-------|-----|
| VC-1 & VC-2: Visual fixes | Dev | 7 | Mon-Wed |
| MP-2 & MP-3: Navigation | Dev | 4 | Thu |
| Documentation | Dev | 4 | Fri |

---

## ✅ ACCEPTANCE CRITERIA

### Critical Fixes Complete When:
- [ ] All interactive elements keyboard accessible
- [ ] All icon buttons have aria-label
- [ ] Mobile navigation works on touch devices
- [ ] Modals trap focus properly
- [ ] Zero axe-core violations (critical/serious)

### High Priority Complete When:
- [ ] No CSS `.btn-*` classes remain in codebase
- [ ] All forms show inline validation
- [ ] DataTable works on mobile
- [ ] Card padding consistent (`p-5`)

### Release Ready When:
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Mobile usability score ≥ 90
- [ ] No visual regressions
- [ ] All tests passing

---

**Last Updated:** February 22, 2026  
**Next Review:** March 1, 2026
