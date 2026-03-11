# UI Snappiness — Design Spec
**Date:** 2026-03-11
**Status:** Approved
**Scope:** Full snappiness pass — animation timing + perceived performance

---

## Problem

The UI feels sluggish in two ways:
1. **Animations are too slow.** Stagger delays compound to 730ms for the last card. Page transitions hold at 0.35s with large translate distances. Every interactive element carries unnecessary lag.
2. **Data starts loading after click.** No prefetching on navigation hover, so every page switch waits for a network round-trip before showing content.

---

## Approach: Option B — Full Snappiness Pass

Two independent levers worked simultaneously:
- **Layer 1–2:** CSS precision tuning (faster, tighter motion)
- **Layer 3–4:** Interaction improvements (hover prefetch, instant feedback)

---

## Layer 1: Animation Timing (`src/index.css`)

### Page Transitions
| Property | Before | After |
|---|---|---|
| `pageEnter` duration | 0.35s | 0.18s |
| `pageEnter` translateY | 8px | 4px |
| `pageSlideLeft/Right` duration | 0.3s | 0.15s |
| `pageSlideLeft/Right` translateX | 20px | 10px |

### Stagger System
| Property | Before | After |
|---|---|---|
| `staggerFadeUp` duration | 0.4s | 0.2s |
| `staggerFadeUp` translateY | 16px | 5px |
| Max stagger delay (12 items) | 330ms | 80ms |
| Per-step increment | 30ms | ~7ms |

Last element visible at: **730ms → 280ms** (61% faster)

### Base Transitions
| Element | Before | After |
|---|---|---|
| `background-color / color` (base) | 0.3s | 0.12s |
| `.content-expand` height | 0.35s | 0.2s |
| Shimmer animation cycle | 1.5s | 0.9s |

### Button Interactions
| Property | Before | After |
|---|---|---|
| Hover transition | 0.2s | 0.1s |
| Active press transition | 0.2s | 0.05s |

---

## Layer 2: Layout Interactions (`Sidebar.jsx`, layout CSS)

- **Sidebar collapse/expand:** Remove or reduce the label-fade delay that gates after the width transition. Icon + label animate together.
- **Mobile drawer slide-in:** Reduce from 0.3s to 0.15s.

---

## Layer 3: Hover Prefetch (`App.jsx` + nav components)

On `mouseenter` of any nav link, call `queryClient.prefetchQuery()` with that page's primary query key and fetcher. Data is warm in cache before the click lands.

**Pages and their primary queries to prefetch:**
| Route | Query key |
|---|---|
| `/` (Dashboard) | `['dashboard']` |
| `/jobs` | `['jobs']` |
| `/documents` | `['documents']` |
| `/ai` | `['ai-conversations']` |
| `/knowledge` | `['knowledge']` |

Implementation: lightweight `onMouseEnter` handler on `<NavLink>` wrappers in `Sidebar.jsx`. Uses existing `useQueryClient()` hook — no new dependencies.

---

## Layer 4: Button Microinteractions (`index.css`)

Active scale (`scale-[0.97]`) already exists. Tighten its transition so feedback is felt within one frame:
- Transition on active: `50ms ease-out`
- Hover color change: `100ms`

---

## Files Changed

| File | Change |
|---|---|
| `src/index.css` | Animation durations, stagger delays, translate distances, shimmer, base transitions |
| `src/components/layout/Sidebar.jsx` | Hover prefetch on nav items, collapse animation tightening |
| `src/App.jsx` | Pass `queryClient` to sidebar or expose via hook for prefetch |

---

## Success Criteria

- Last stagger item visible in < 300ms from page mount
- Page transitions feel imperceptible (< 200ms)
- Navigating to a cached page shows content with zero loading state
- Button press feedback felt within one frame (~16ms)
- No visual regressions on any of the 15 pages
