# Documents Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the Documents tool with reliable uploads (refresh/progress/toasts + guardrails), server-backed search with pagination/virtualization, and per-tab error boundaries.

**Architecture:** Use existing `visionApi`/`docvaultApi` with TanStack Query for fetching/searching and mutations for uploads. Keep state colocated in `Documents.jsx` but shift data fetch to react-query. Add per-tab error boundaries and loading fallbacks. Keep backend unchanged; rely on `searchDocuments` params.

**Tech Stack:** React 19, TanStack Query, Vite, Tailwind (Dark Forge), existing vision/docvault APIs.

---

### Task 1: Set up react-query sources for Documents library

**Files:**
- Modify: `frontend/src/pages/Documents.jsx`
- (Reference) `frontend/src/api/vision.js`

**Steps:**
1. Add a `useQuery` for documents list keyed by `{page, pageSize, query, sort}` calling a new helper (client-side) that hits `visionApi.list`/`search` (same endpoint, pass params) and returns `{items, total}`.
2. Wire library rendering to the query data instead of local `projects` state; keep `viewMode`, `sortBy`, `searchQuery`, `page` in component state.
3. Provide loading and error states; remove any stale manual fetch logic.

### Task 2: Upload mutation with progress, guardrails, and toasts

**Files:**
- Modify: `frontend/src/pages/Documents.jsx`
- Modify: `frontend/src/api/vision.js` (optional: add uploadWithProgress)

**Steps:**
1. Add client-side validation: allowed extensions (pdf, png, jpg, jpeg, tif, tiff, webp, dwg) and size <= 100MB. On failure, toast error and skip request.
2. Create `useMutation` for uploads that supports progress (axios `onUploadProgress`), storing temporary optimistic items in local state.
3. Show upload progress row/spinner in the library toolbar area; on success, toast “Uploaded <name>”, invalidate documents query; on error, toast and remove optimistic entry.

### Task 3: Server-backed search + pagination/virtualization

**Files:**
- Modify: `frontend/src/pages/Documents.jsx`
- Modify: `frontend/src/api/vision.js` (ensure list/search accepts params `q`, `limit`, `offset`, `sort`)
- (Optional) Add small helper for debounce

**Steps:**
1. Hook search input to debounced setter that updates query param passed to the documents query.
2. Add paging controls: `page`, `pageSize`, “Load more” button; adjust query to pass `limit/offset` and merge results for load-more UX.
3. List view: wrap rows with `useVirtualizer` (from `@tanstack/react-virtual`) to avoid heavy DOM for large lists; grid can stay paged.

### Task 4: Per-tab error boundaries and fallbacks

**Files:**
- Modify: `frontend/src/pages/Documents.jsx`
- Create: `frontend/src/components/documents/TabErrorBoundary.jsx` (simple boundary with retry)

**Steps:**
1. Add TabErrorBoundary wrapping each tab panel (Library, AI Analysis, DocVault/Text Intelligence). On error, show message + retry button that re-runs the relevant query (`refetch` callbacks passed as props).
2. Add loading skeletons/spinners per tab instead of blank content.

### Task 5: Smoke tests and verification

**Files:**
- No tests present; use manual + quick script

**Steps:**
1. Run `npm run build` (frontend) and `NODE_TEST_IGNORE=node_modules_backup_* node --test backend/tests/...` (existing quick suite) to ensure no regressions.
2. Manual checks: upload valid/invalid file, see progress & toast; search with a term that matches/doesn’t; paginate to second page; simulate network failure (offline devtools) to see per-tab error boundary.

---

Execution note: After plan approval, use superpowers:executing-plans to implement. Commit in small chunks (upload fixes, search/paging, error boundaries).
