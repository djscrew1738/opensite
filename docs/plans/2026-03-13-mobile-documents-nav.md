# Mobile Documents Nav Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `Documents` back to the global mobile bottom bar while keeping the centered AI button and existing route-level Documents tabs.

**Architecture:** Update the shell-owned mobile nav definition and active-route logic in `MobileNav.jsx`, then prove the behavior with a focused regression test. No layout or page-level behavior outside the shell nav should change.

**Tech Stack:** React, React Router, Framer Motion, Node test runner

---

### Task 1: Add regression coverage for global Documents mobile nav

**Files:**
- Modify: `frontend/tests/mobile-nav-ai-center.test.js`
- Verify: `frontend/src/components/layout/MobileNav.jsx`

**Step 1: Write the failing test**

- Assert that `MobileNav.jsx` includes a `/documents` entry.
- Assert that the nav layout expands beyond the current three-destination arrangement while keeping the AI button centered.
- Assert that `/documents` is included in active-route detection.

**Step 2: Run test to verify it fails**

Run: `cd frontend && node --test tests/mobile-nav-ai-center.test.js`

**Step 3: Write minimal implementation**

- Update `primaryNav` in `frontend/src/components/layout/MobileNav.jsx`
- Update layout column mapping and active-route detection

**Step 4: Run test to verify it passes**

Run: `cd frontend && node --test tests/mobile-nav-ai-center.test.js`

### Task 2: Verify shell regressions still hold

**Files:**
- Verify: `frontend/tests/mobile-action-layer-rules.test.js`
- Verify: `frontend/tests/mobile-tabbar-ai-consistency.test.js`

**Step 1: Run targeted regression suite**

Run: `cd frontend && node --test tests/mobile-nav-ai-center.test.js tests/mobile-action-layer-rules.test.js tests/mobile-tabbar-ai-consistency.test.js`

**Step 2: Run production build**

Run: `cd frontend && npm run build`
