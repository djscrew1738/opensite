# UI Snappiness Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every interaction feel instant — tighten all animation durations, compress stagger delays, and prefetch page data on nav hover.

**Architecture:** Three independent layers: (1) CSS timing pass in `index.css`, (2) sidebar label delay reduction in `Sidebar.jsx`, (3) React Query data prefetch added alongside the existing JS chunk prefetch in a new `src/routes/data-prefetch.js` module consumed by `Sidebar.jsx`.

**Tech Stack:** React 19, TailwindCSS 3, Framer Motion (untouched), `@tanstack/react-query` prefetchQuery, Vite

**Spec:** `docs/superpowers/specs/2026-03-11-ui-snappiness-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/src/index.css` | Modify | All animation duration + stagger + shimmer timing |
| `frontend/src/components/layout/Sidebar.jsx` | Modify | Label/logo delay reduction, hook in data prefetch |
| `frontend/src/routes/data-prefetch.js` | Create | React Query data prefetch registry per route |

---

## Chunk 1: CSS Timing Pass

### Task 1: Tighten base body transition

**Files:**
- Modify: `frontend/src/index.css:73`

- [ ] **Step 1: Edit body transition**

Change line 73 from:
```css
transition: background-color 0.3s ease, color 0.3s ease;
```
To:
```css
transition: background-color 0.12s ease, color 0.12s ease;
```

- [ ] **Step 2: Commit**
```bash
cd /home/djscrew/projects/web/opensite
git add frontend/src/index.css
git commit -m "perf: tighten body color transition 0.3s → 0.12s"
```

---

### Task 2: Tighten button hover transitions

**Files:**
- Modify: `frontend/src/index.css:139`

- [ ] **Step 1: Edit `.btn` class**

Change line 139 from:
```css
@apply relative inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation;
```
To:
```css
@apply relative inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all duration-100 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation;
```

- [ ] **Step 2: Tighten active press transition on all btn variants**

Lines 163, 184, 203 already have `transition-duration: 0.1s` on `:active` — change each to `0.05s`:

Find all occurrences of:
```css
transition-duration: 0.1s;
```
There are exactly 3 in the `:active` blocks of `.btn-primary`, `.btn-secondary`, `.btn-ghost`. Change all three to:
```css
transition-duration: 0.05s;
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/index.css
git commit -m "perf: tighten button hover 200ms → 100ms, active 100ms → 50ms"
```

---

### Task 3: Speed up page transition animations

**Files:**
- Modify: `frontend/src/index.css:829-853`

- [ ] **Step 1: Edit pageEnter**

Change lines 829-836 from:
```css
.page-transition-wrapper {
  animation: pageEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes pageEnter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
To:
```css
.page-transition-wrapper {
  animation: pageEnter 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes pageEnter {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Edit pageSlideLeft and pageSlideRight**

Change lines 838-853 from:
```css
.page-slide-left {
  animation: pageSlideLeft 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.page-slide-right {
  animation: pageSlideRight 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes pageSlideLeft {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes pageSlideRight {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
```
To:
```css
.page-slide-left {
  animation: pageSlideLeft 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.page-slide-right {
  animation: pageSlideRight 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes pageSlideLeft {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes pageSlideRight {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/index.css
git commit -m "perf: page transitions 0.35s→0.18s, slide 0.3s→0.15s, translate halved"
```

---

### Task 4: Compress stagger system

**Files:**
- Modify: `frontend/src/index.css:857-878`

- [ ] **Step 1: Replace stagger block**

Change lines 857-878 from:
```css
/* Staggered content reveal */
.stagger-container > * {
  opacity: 0;
  animation: staggerFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.stagger-container > *:nth-child(1)  { animation-delay: 0ms; }
.stagger-container > *:nth-child(2)  { animation-delay: 30ms; }
.stagger-container > *:nth-child(3)  { animation-delay: 60ms; }
.stagger-container > *:nth-child(4)  { animation-delay: 90ms; }
.stagger-container > *:nth-child(5)  { animation-delay: 120ms; }
.stagger-container > *:nth-child(6)  { animation-delay: 150ms; }
.stagger-container > *:nth-child(7)  { animation-delay: 180ms; }
.stagger-container > *:nth-child(8)  { animation-delay: 210ms; }
.stagger-container > *:nth-child(9)  { animation-delay: 240ms; }
.stagger-container > *:nth-child(10) { animation-delay: 270ms; }
.stagger-container > *:nth-child(11) { animation-delay: 300ms; }
.stagger-container > *:nth-child(12) { animation-delay: 330ms; }

@keyframes staggerFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
To:
```css
/* Staggered content reveal */
.stagger-container > * {
  opacity: 0;
  animation: staggerFadeUp 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.stagger-container > *:nth-child(1)  { animation-delay: 0ms; }
.stagger-container > *:nth-child(2)  { animation-delay: 7ms; }
.stagger-container > *:nth-child(3)  { animation-delay: 14ms; }
.stagger-container > *:nth-child(4)  { animation-delay: 21ms; }
.stagger-container > *:nth-child(5)  { animation-delay: 28ms; }
.stagger-container > *:nth-child(6)  { animation-delay: 35ms; }
.stagger-container > *:nth-child(7)  { animation-delay: 42ms; }
.stagger-container > *:nth-child(8)  { animation-delay: 49ms; }
.stagger-container > *:nth-child(9)  { animation-delay: 56ms; }
.stagger-container > *:nth-child(10) { animation-delay: 63ms; }
.stagger-container > *:nth-child(11) { animation-delay: 70ms; }
.stagger-container > *:nth-child(12) { animation-delay: 80ms; }

@keyframes staggerFadeUp {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Also update the `.stagger-1` through `.stagger-8` utility classes**

Find lines 996-1004 (the `.stagger-N` utilities):
```css
.stagger-1 { animation-delay: 25ms; }
.stagger-2 { animation-delay: 50ms; }
.stagger-3 { animation-delay: 75ms; }
.stagger-4 { animation-delay: 100ms; }
.stagger-5 { animation-delay: 125ms; }
.stagger-6 { animation-delay: 150ms; }
.stagger-7 { animation-delay: 175ms; }
.stagger-8 { animation-delay: 200ms; }
```
Replace with:
```css
.stagger-1 { animation-delay: 7ms; }
.stagger-2 { animation-delay: 14ms; }
.stagger-3 { animation-delay: 21ms; }
.stagger-4 { animation-delay: 28ms; }
.stagger-5 { animation-delay: 35ms; }
.stagger-6 { animation-delay: 42ms; }
.stagger-7 { animation-delay: 49ms; }
.stagger-8 { animation-delay: 56ms; }
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/index.css
git commit -m "perf: compress stagger — 730ms total → 280ms, translateY 16px → 5px"
```

---

### Task 5: Speed up shimmer and utility animations

**Files:**
- Modify: `frontend/src/index.css:880-944`

- [ ] **Step 1: Shimmer speed**

Change line 888:
```css
animation: shimmer 1.5s ease-in-out infinite;
```
To:
```css
animation: shimmer 0.9s linear infinite;
```

- [ ] **Step 2: Content expand**

Change lines 907-909:
```css
.content-expand {
  transition: height 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.25s ease;
```
To:
```css
.content-expand {
  transition: height 0.2s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.15s ease;
```

- [ ] **Step 3: animate-in utility**

Change line 920:
```css
animation-duration: 0.3s;
```
To:
```css
animation-duration: 0.15s;
```

- [ ] **Step 4: slideInFromBottom2 translate**

Change line 936:
```css
from { opacity: 0; transform: translateY(8px); }
```
To:
```css
from { opacity: 0; transform: translateY(4px); }
```

- [ ] **Step 5: slideInFromLeft4 translate**

Change line 941:
```css
from { opacity: 0; transform: translateX(-16px); }
```
To:
```css
from { opacity: 0; transform: translateX(-8px); }
```

- [ ] **Step 6: Commit**
```bash
git add frontend/src/index.css
git commit -m "perf: shimmer 1.5s→0.9s, content-expand 0.35s→0.2s, animate-in 0.3s→0.15s"
```

---

## Chunk 2: Sidebar + Data Prefetch

### Task 6: Reduce sidebar label and logo animation delays

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.jsx:87-92, 188-192`

- [ ] **Step 1: Tighten label span transition and delay**

Change lines 87-90 from:
```jsx
className={`
  text-sm font-semibold whitespace-nowrap overflow-hidden transition-opacity duration-200
  ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
`}
style={{ transitionDelay: expanded ? '0.07s' : '0s' }}
```
To:
```jsx
className={`
  text-sm font-semibold whitespace-nowrap overflow-hidden transition-opacity duration-100
  ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
`}
style={{ transitionDelay: expanded ? '0.03s' : '0s' }}
```

- [ ] **Step 2: Tighten Logo text transition and delay**

Change lines 188-192 from:
```jsx
className={`
  overflow-hidden flex-1 min-w-0 transition-all duration-200
  ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
`}
style={{ transitionDelay: isExpanded ? '0.06s' : '0s' }}
```
To:
```jsx
className={`
  overflow-hidden flex-1 min-w-0 transition-all duration-100
  ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
`}
style={{ transitionDelay: isExpanded ? '0.02s' : '0s' }}
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/layout/Sidebar.jsx
git commit -m "perf: sidebar label delay 70ms→30ms, logo delay 60ms→20ms"
```

---

### Task 7: Create data prefetch registry

**Files:**
- Create: `frontend/src/routes/data-prefetch.js`

- [ ] **Step 1: Create the file**

```js
// Data prefetch registry — warms React Query cache on nav hover
// Companion to routes/prefetch.js (which handles JS chunk prefetch)

import { api } from '../api/client';

/**
 * Map of route path → array of { queryKey, queryFn } descriptors.
 * Keep queryFn lightweight — these fire on mouseenter, not on click.
 */
export const routeDataPrefetchMap = {
  '/': [
    { queryKey: ['dashboard-jobs'], queryFn: () => api.projects.getAll() },
    { queryKey: ['dashboard-stats'], queryFn: () => api.dashboard.getStats() },
  ],
  '/jobs': [
    { queryKey: ['jobs'], queryFn: () => api.projects.getAll() },
  ],
  '/knowledge': [
    { queryKey: ['knowledge'], queryFn: () => api.knowledge.list() },
  ],
};

/**
 * Prefetch all data queries for a given route using the provided queryClient.
 * Called on mouseenter with a 120ms debounce in NavItem.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} path - Route path e.g. '/jobs'
 */
export function prefetchRouteData(queryClient, path) {
  const descriptors = routeDataPrefetchMap[path];
  if (!descriptors) return;

  for (const { queryKey, queryFn } of descriptors) {
    // prefetchQuery is a no-op if data is fresh (staleTime not exceeded)
    queryClient.prefetchQuery({ queryKey, queryFn });
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/src/routes/data-prefetch.js
git commit -m "feat: add React Query data prefetch registry for nav routes"
```

---

### Task 8: Wire data prefetch into NavItem

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.jsx:1-12, 42-55`

- [ ] **Step 1: Add imports at top of Sidebar.jsx**

Add after the existing import block (after line 10):
```jsx
import { useQueryClient } from '@tanstack/react-query';
import { prefetchRouteData } from '../../routes/data-prefetch';
```

- [ ] **Step 2: Use queryClient in NavItem and call data prefetch**

In the `NavItem` component (currently lines 42-54), add `useQueryClient()` and call `prefetchRouteData` inside the existing `handleMouseEnter`. The existing `prefetchRoute` (JS chunk) fires at 100ms — fire data prefetch at the same time:

Change lines 42-54 from:
```jsx
const NavItem = memo(function NavItem({ item, expanded, onClick }) {
  const prefetchTimeout = useRef(null);

  const handleMouseEnter = useCallback(() => {
    prefetchTimeout.current = setTimeout(() => prefetchRoute(item.path), 100);
  }, [item.path]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeout.current) {
      clearTimeout(prefetchTimeout.current);
      prefetchTimeout.current = null;
    }
  }, []);
```
To:
```jsx
const NavItem = memo(function NavItem({ item, expanded, onClick }) {
  const prefetchTimeout = useRef(null);
  const queryClient = useQueryClient();

  const handleMouseEnter = useCallback(() => {
    prefetchTimeout.current = setTimeout(() => {
      prefetchRoute(item.path);
      prefetchRouteData(queryClient, item.path);
    }, 100);
  }, [item.path, queryClient]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeout.current) {
      clearTimeout(prefetchTimeout.current);
      prefetchTimeout.current = null;
    }
  }, []);
```

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/layout/Sidebar.jsx
git commit -m "feat: prefetch React Query data on nav item hover (100ms debounce)"
```

---

## Chunk 3: Build & Verify

### Task 9: Build and smoke-test

**Files:** None (verification only)

- [ ] **Step 1: Build the frontend**
```bash
cd /home/djscrew/projects/web/opensite/frontend
npm run build 2>&1 | tail -20
```
Expected: Build succeeds with no errors. Bundle size warnings (if any) are pre-existing.

- [ ] **Step 2: Check that the site serves correctly**
```bash
curl -s --max-time 10 -o /dev/null -w "HTTP: %{http_code}\n" https://app.ctlplumbingllc.com
```
Expected: `HTTP: 200`

- [ ] **Step 3: Verify PM2 backend is still healthy**
```bash
pm2 list
```
Expected: `opensite-backend` shows `online`

- [ ] **Step 4: Final commit**
```bash
cd /home/djscrew/projects/web/opensite
git add -A
git commit -m "chore: rebuild frontend after UI snappiness pass"
```

---

## Summary of Changes

| What | Before | After | Feel |
|---|---|---|---|
| Page enter | 0.35s / 8px | 0.18s / 4px | Instant |
| Page slide | 0.3s / 20px | 0.15s / 10px | Snappy |
| Stagger last item | 730ms total | 280ms total | 61% faster |
| Stagger translate | 16px | 5px | Tight |
| Shimmer | 1.5s | 0.9s | Crisp |
| Button hover | 200ms | 100ms | Responsive |
| Button press | 100ms | 50ms | Instant |
| Body color | 300ms | 120ms | Smooth |
| Sidebar label delay | 70ms | 30ms | Snappy |
| Data prefetch | on click | on hover | Feels instant |
