# Structural UI Overhaul Design

**Date:** 2026-03-13
**Scope:** Structural UX changes only. Preserve the current visual language and avoid broad copy or branding rewrites in this pass.
**Status:** Approved for planning

---

## Summary

This design addresses the audited UI issues in OpenSite through an incremental structural overhaul rather than a visual redesign. The intent is to improve clarity, recoverability, and first-use guidance while keeping the existing dark-forge visual system intact.

The work is organized into independent slices that can ship safely:

1. AI failure handling and mobile action-layer stability
2. Shared shell normalization
3. Jobs IA simplification and first-use flow
4. Documents cleanup
5. Settings actionability improvements

---

## Goals

- Remove structural confusion caused by duplicate page headers.
- Prevent overlapping mobile action layers across the shell and route-level tab bars.
- Make AI resilient when history APIs fail.
- Make first-use and zero-data states teach the next step.
- Reduce top-level complexity in the Jobs workspace.
- Make Settings status more actionable without changing the visual brand.

## Non-Goals

- No broad visual redesign or theme replacement.
- No comprehensive terminology or brand rewrite in this pass.
- No backend architecture changes beyond what is required to support safer frontend error handling.
- No full information-architecture rewrite of the app beyond targeted simplification of the highest-friction routes.

---

## Architecture

The implementation should enforce a small number of shared shell rules instead of solving each page independently.

### Rule 1: One header owner per route

Each route should have a single canonical page header. If the shell already renders a route title and global actions, the page should not repeat the same title block inside the route body unless it is rendering route-specific controls that cannot live in the shared shell.

### Rule 2: One primary mobile action zone

Mobile routes should never show multiple competing floating action systems at once. The shell must arbitrate between:

- global AI launcher
- quick-add/upload FABs
- route-level mobile tab bars with center actions
- route overlays such as notifications or drawers

### Rule 3: Explicit first-use and failure states

Every major route must answer two questions clearly:

- “What should I do first?”
- “What should I do if data failed to load?”

This requires shared empty and error state patterns rather than blank or weak placeholder layouts.

### Rule 4: Complexity threshold for top-level navigation

A route should not present many unrelated peer-level tabs as equal first-class destinations. When a route exceeds that threshold, non-core modes should be demoted into secondary navigation, deferred entry points, or split flows.

---

## Rollout Plan

### Slice 1: AI failure handling + mobile action stacking

**Problems addressed**

- AI history fetches fail silently or opaquely.
- Mobile shell allows multiple action layers to compete for attention and touch space.

**Design**

- Add inline error/retry UI for conversation list loading and conversation hydration.
- Keep chat usable even when conversation history is unavailable.
- Centralize mobile action visibility rules in the shared layout so route-level mobile tab bars suppress competing shell FABs and global action buttons consistently.

**Success conditions**

- AI remains usable when `/api/history/conversations` fails.
- No mobile screen shows overlapping route-level and shell-level primary actions.

### Slice 2: Shared shell normalization

**Problems addressed**

- Duplicate headers across shared layout and route pages.
- Desktop nav is too implicit when collapsed.
- Blank first-use states feel inert.

**Design**

- Introduce a single header ownership model across the shell.
- Improve sidebar discoverability without redesigning the nav language.
- Reuse stronger empty/error state primitives across major routes.

**Success conditions**

- No duplicate page title blocks on audited routes.
- Desktop navigation is more immediately understandable.
- Zero-data screens always present a clear next step.

### Slice 3: Jobs simplification

**Problems addressed**

- Jobs currently acts as multiple unrelated workspaces.
- First-use Jobs state is hard to parse.

**Design**

- Re-center the route around core job operations.
- Demote or separate lower-frequency tools from the top-level peer tab set.
- Improve the first-use experience so “create/upload/manage” is the dominant task path.

**Success conditions**

- Jobs reads as one coherent workspace.
- New users can identify the primary action without scanning all tabs.

### Slice 4: Documents cleanup

**Problems addressed**

- Documents repeats shell structure and wastes vertical space.
- First-use states are cleaner than Jobs but still under-explained.

**Design**

- Remove repeated chrome now covered by the shared shell.
- Keep the route centered on upload, browse, and analyze.
- Reuse the shared empty-state pattern with more explicit guidance.

**Success conditions**

- Documents has one structural hierarchy.
- First-use state explains the core workflow clearly.

### Slice 5: Settings actionability

**Problems addressed**

- High-level disconnected status is visually strong but weakly actionable.
- Status information is partially duplicated between the badge and overview cards.

**Design**

- Make the top-level status summarize the highest-priority unresolved setup issue.
- Preserve the current settings taxonomy, but reduce redundant status presentation.
- Let overview alerts drive the primary next action.

**Success conditions**

- The first unresolved setup action is obvious at a glance.
- Status information feels connected to remediation instead of ornamental.

---

## Testing Strategy

All implementation slices should follow a targeted TDD loop.

1. Add or update a focused regression test for the slice.
2. Verify the test fails for the intended reason.
3. Implement the minimal UI behavior needed to pass.
4. Re-run the focused test.
5. Re-run the existing mobile UI regression suite and touched-area checks.

### Testing emphasis

- Shared layout changes are the highest regression risk.
- Mobile interaction rules must be validated with source-level regression tests first.
- AI error-state behavior needs specific coverage because current failures degrade into console-only noise.
- Jobs simplification should be verified with route-structure and empty-state tests.

---

## Risks and Mitigations

### Risk: shared shell changes cause broad regressions

**Mitigation:** isolate shell rules in `Layout`, `StickyHeader`, and shared primitives; verify with targeted tests before page-level cleanup.

### Risk: mobile behavior changes hide legitimate actions

**Mitigation:** encode the action arbitration rules in tests, especially for route-level tab bars and global FAB visibility.

### Risk: Jobs simplification removes access to existing tools

**Mitigation:** demote or relocate tools without deleting capability; keep behavior intact while simplifying entry points.

### Risk: incremental slices leave temporary inconsistency

**Mitigation:** each slice must be independently shippable and leave the audited routes in a coherent state.

---

## Acceptance Criteria

- No audited route renders duplicate page headers.
- Mobile never shows multiple competing primary action layers simultaneously.
- AI exposes clear retry/recovery UI for history failures.
- Jobs presents a simpler top-level structure and clearer first-use path.
- Documents uses the shared shell structure cleanly.
- Settings highlights the most actionable unresolved setup issue near the top of the page.

