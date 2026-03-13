# Mobile Documents Nav Design

**Goal:** Restore `Documents` as a first-class destination in the global mobile bottom navigation without removing the centered AI action or changing the local Documents page tab bar.

## Approved Direction

- Keep the existing centered AI action in the global mobile shell nav.
- Expand the shell nav from three destinations to four:
  - `Home`
  - `Jobs`
  - `Documents`
  - `Leads`
- Preserve the existing route-level mobile tab bar on `/documents` for `Library`, `AI Analysis`, and `Text Intelligence`.
- Update active-route detection so `/documents` highlights the new shell tab correctly and `/jobs?tab=leads` continues to highlight `Leads`.

## Testing

- Add a failing regression in the mobile shell nav tests for:
  - presence of a `Documents` destination
  - updated mobile grid layout for four destinations plus centered AI
  - active-route matching for `/documents`
- Re-run the mobile nav regression test and the existing mobile action-layer regression tests after implementation.
