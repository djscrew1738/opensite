# Structural UI Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve OpenSite’s structural UX without changing the visual design system by fixing AI failure states, mobile action collisions, duplicated headers, weak empty states, overloaded Jobs navigation, and low-actionability Settings status.

**Architecture:** Implement the overhaul as five shippable slices. Start by tightening shared shell rules in `Layout` and route-level regression tests, then simplify the highest-friction pages using those shared rules. Preserve existing capabilities, but demote or reorganize them when top-level route complexity is too high.

**Tech Stack:** React 19, TanStack Query, Node test runner for source-level regression tests, existing Vite/Tailwind frontend shell.

**Design Doc:** `docs/plans/2026-03-13-structural-ui-overhaul-design.md`

---

### Task 1: AI failure handling and recovery UI

**Files:**
- Create: `frontend/tests/ai-history-error-state.test.js`
- Modify: `frontend/src/pages/AIAssistant.jsx`
- Modify: `frontend/src/components/shared/PageHeader.jsx` (only if needed for compact AI header behavior)
- Reference: `frontend/src/api/client.js`

**Step 1: Write the failing test**

Create `frontend/tests/ai-history-error-state.test.js` covering these expectations:

- `AIAssistant.jsx` reads `isError` and `error` from the conversations query.
- the page renders a retry affordance for failed conversation-history loading.
- the empty drawer state and the error drawer state are distinct.
- the chat area remains usable even when history loading fails.

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && node --test tests/ai-history-error-state.test.js
```

Expected: FAIL because the current AI page does not expose explicit error-state handling for conversation history.

**Step 3: Write minimal implementation**

- Update the conversations `useQuery` in `AIAssistant.jsx` to read `isError`, `error`, and `refetch`.
- Add an inline error state inside the conversation drawer with retry.
- Add a lightweight status message near the main chat area when history is unavailable, but do not block new messages.
- Keep existing conversation loading behavior for healthy responses.

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && node --test tests/ai-history-error-state.test.js
```

Expected: PASS

**Step 5: Run related regression tests**

Run:

```bash
cd frontend && node --test tests/mobile-nav-ai-center.test.js tests/mobile-tabbar-ai-consistency.test.js
```

Expected: PASS

**Step 6: Commit**

```bash
git add frontend/tests/ai-history-error-state.test.js frontend/src/pages/AIAssistant.jsx frontend/src/components/shared/PageHeader.jsx
git commit -m "fix(ui): add recoverable ai history error states"
```

### Task 2: Mobile action-layer arbitration in shared layout

**Files:**
- Create: `frontend/tests/mobile-action-layer-rules.test.js`
- Modify: `frontend/src/components/layout/Layout.jsx`
- Modify: `frontend/src/components/layout/MobileNav.jsx`
- Modify: `frontend/src/components/upload/UploadFAB.jsx`
- Modify: `frontend/src/components/shared/QuickAddFAB.jsx`

**Step 1: Write the failing test**

Create `frontend/tests/mobile-action-layer-rules.test.js` asserting:

- `Layout.jsx` has one explicit rule-set for when global mobile actions are hidden.
- route-level mobile tab bars suppress shell-level floating actions.
- AI, notifications, command palette, and mobile sidebar states all suppress competing mobile actions.

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && node --test tests/mobile-action-layer-rules.test.js
```

Expected: FAIL because the current hiding logic is partially distributed and does not fully enforce a single mobile action zone.

**Step 3: Write minimal implementation**

- Consolidate mobile action visibility rules in `Layout.jsx`.
- Ensure `QuickAddFAB`, `UploadFAB`, and `MobileNav` receive a single source of truth from the shell.
- Avoid introducing a new layout system; only tighten existing visibility behavior.

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && node --test tests/mobile-action-layer-rules.test.js
```

Expected: PASS

**Step 5: Run existing mobile regressions**

Run:

```bash
cd frontend && node --test tests/mobile-nav-ai-center.test.js tests/mobile-tabbar-ai-consistency.test.js tests/documents-mobile-ui-regressions.test.js
```

Expected: PASS

**Step 6: Commit**

```bash
git add frontend/tests/mobile-action-layer-rules.test.js frontend/src/components/layout/Layout.jsx frontend/src/components/layout/MobileNav.jsx frontend/src/components/upload/UploadFAB.jsx frontend/src/components/shared/QuickAddFAB.jsx
git commit -m "fix(ui): enforce one mobile action layer"
```

### Task 3: Shared header ownership and stronger first-use states

**Files:**
- Create: `frontend/tests/layout-header-ownership.test.js`
- Modify: `frontend/src/components/layout/PageHeaderBar.jsx`
- Modify: `frontend/src/pages/Jobs.jsx`
- Modify: `frontend/src/pages/Documents.jsx`
- Modify: `frontend/src/pages/Settings.jsx`
- Modify: `frontend/src/components/ui/EmptyState.jsx`
- Modify: `frontend/src/components/dashboard/JobPulseHome.jsx`

**Step 1: Write the failing test**

Create `frontend/tests/layout-header-ownership.test.js` asserting:

- audited routes do not render duplicated page-title sections when the shell already owns the header.
- Jobs, Documents, and Settings rely on one header owner.
- shared empty-state primitives expose a clear primary action path.

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && node --test tests/layout-header-ownership.test.js
```

Expected: FAIL because those pages currently render repeated title/header blocks.

**Step 3: Write minimal implementation**

- Remove repeated route-body header sections where the shell already provides route identity.
- Preserve route-specific actions by moving them into shared page-action slots only where needed.
- Strengthen shared empty-state usage in dashboard-first-use and other zero-data views without changing the visual style.

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && node --test tests/layout-header-ownership.test.js
```

Expected: PASS

**Step 5: Run related checks**

Run:

```bash
cd frontend && node --test tests/documents-mobile-ui-regressions.test.js
cd frontend && npm run build
```

Expected: PASS

**Step 6: Commit**

```bash
git add frontend/tests/layout-header-ownership.test.js frontend/src/components/layout/PageHeaderBar.jsx frontend/src/pages/Jobs.jsx frontend/src/pages/Documents.jsx frontend/src/pages/Settings.jsx frontend/src/components/ui/EmptyState.jsx frontend/src/components/dashboard/JobPulseHome.jsx
git commit -m "refactor(ui): normalize headers and first-use states"
```

### Task 4: Simplify Jobs top-level structure and first-use flow

**Files:**
- Create: `frontend/tests/jobs-ia-regressions.test.js`
- Modify: `frontend/src/pages/Jobs.jsx`
- Modify: `frontend/src/components/jobs/OverviewDashboard.jsx`
- Modify: `frontend/src/components/ui/EmptyState.jsx` (if shared helper needs extra variant support)

**Step 1: Write the failing test**

Create `frontend/tests/jobs-ia-regressions.test.js` covering:

- Jobs no longer presents the full overloaded peer tab set as-is.
- the first-use Jobs route exposes a dominant creation/upload/manage path.
- lower-frequency tools are demoted or separated from the core operational entry path.

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && node --test tests/jobs-ia-regressions.test.js
```

Expected: FAIL because `Jobs.jsx` currently exposes many top-level peer tabs and weak first-use guidance.

**Step 3: Write minimal implementation**

- Reduce the top-level peer tabs in `Jobs.jsx` to a smaller operational set.
- Re-home or demote lower-frequency destinations without deleting existing capability.
- Improve the empty/first-use state so the next action is explicit.

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && node --test tests/jobs-ia-regressions.test.js
```

Expected: PASS

**Step 5: Run related checks**

Run:

```bash
cd frontend && node --test tests/mobile-tabbar-ai-consistency.test.js tests/jobs-ia-regressions.test.js
cd frontend && npm run build
```

Expected: PASS

**Step 6: Commit**

```bash
git add frontend/tests/jobs-ia-regressions.test.js frontend/src/pages/Jobs.jsx frontend/src/components/jobs/OverviewDashboard.jsx frontend/src/components/ui/EmptyState.jsx
git commit -m "refactor(ui): simplify jobs workspace structure"
```

### Task 5: Documents cleanup and Settings actionability

**Files:**
- Create: `frontend/tests/settings-actionability.test.js`
- Modify: `frontend/src/pages/Documents.jsx`
- Modify: `frontend/src/pages/Settings.jsx`
- Modify: `frontend/src/components/settings/SettingsHome.jsx`
- Modify: `frontend/src/components/settings/primitives/index.jsx`

**Step 1: Write the failing test**

Create `frontend/tests/settings-actionability.test.js` asserting:

- Settings top-level status reflects a concrete unresolved setup issue or next action.
- overview alerts remain the source of the next recommended fix.
- Documents page uses the simplified shell structure and does not reintroduce duplicated header ownership.

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && node --test tests/settings-actionability.test.js
```

Expected: FAIL because Settings currently uses a generic disconnected badge and Documents still carries route-body header structure.

**Step 3: Write minimal implementation**

- Tighten `Documents.jsx` to rely on the shared shell structure from earlier slices.
- Update `Settings.jsx` and `SettingsHome.jsx` so the top-level status is actionable and derived from the highest-priority unresolved state.
- Keep the existing settings sections and visual tone.

**Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && node --test tests/settings-actionability.test.js
```

Expected: PASS

**Step 5: Run final verification for touched frontend areas**

Run:

```bash
cd frontend && node --test tests/*.test.js
cd frontend && npm run build
```

Expected: PASS

**Step 6: Commit**

```bash
git add frontend/tests/settings-actionability.test.js frontend/src/pages/Documents.jsx frontend/src/pages/Settings.jsx frontend/src/components/settings/SettingsHome.jsx frontend/src/components/settings/primitives/index.jsx
git commit -m "refactor(ui): improve documents flow and settings actionability"
```

---

Plan complete and saved to `docs/plans/2026-03-13-structural-ui-overhaul.md`.

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
