# OpenSite Blueprint Takeoff Integrator Memory

## Tech Stack
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 3 + React Router 6 + TanStack React Query 5
- **Backend**: Express 4 + better-sqlite3 + multer + pdf-parse + Node.js ESM modules
- **Styling**: Tailwind utility classes, custom `primary`, `hot`, `warm`, `cold` color palettes in `tailwind.config.js`
- **Component CSS classes**: `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.label` defined in `index.css`
- **Icons**: lucide-react (used throughout)
- **State**: TanStack React Query for server state, useState for local state
- **API client**: Axios with interceptors, `api` object in `frontend/src/api/client.js`

## Key Architecture Patterns
- Backend uses standardized responses via `res.success()` / `res.error()` from `utils/response.js`
- Route handlers wrapped with `tryCatch()` for error handling
- Database is SQLite at `tool/data/opensite.db`, singleton `db` service
- Sidebar nav items in `frontend/src/components/layout/Sidebar.jsx` as array
- Routes in `frontend/src/App.jsx` nested under `<Layout />`
- No auth middleware - app runs on private Tailscale network
- For non-JSON responses (CSV export), use `res.send()` to bypass response wrapper
- For file downloads from frontend, use raw `fetch()` instead of axios (interceptor interferes with blobs)

## React Query v5 Note
- `onSuccess` is NOT supported on `useQuery` in React Query v5 - use `useEffect` to react to `data` changes
- `onSuccess` IS still supported on `useMutation`

## SQLite Notes
- Use parameterized queries for date comparisons, not `datetime("now")` (quoting issues in JS strings)
- `safeAddColumn` helper in database.js for schema migrations (ALTER TABLE IF NOT EXISTS pattern)
- `better-sqlite3` may need `npm rebuild` after Node.js version changes

## File Paths
- Frontend pages: `frontend/src/pages/`
- Frontend components: `frontend/src/components/<feature>/`
- Backend routes: `backend/src/routes/`
- Backend services: `backend/src/services/`
- Database service: `backend/src/services/database.js`
- API client: `frontend/src/api/client.js`

## Takeoff Module
- Sidebar nav entry with `Ruler` icon at `/takeoff`
- Backend routes at `/api/takeoff` (takeoffs, items) and `/api/takeoff/materials`
- Database tables: `materials`, `takeoffs`, `takeoff_items`, `price_history`
- Materials columns: id, name, category, unit, unitCost, supplier, partNumber, description, notes, isFavorite, usageCount, lastUsedAt, markup, createdAt, updatedAt
- 39 default plumbing materials seeded on first run
- Frontend components in `frontend/src/components/takeoff/`

## Material Catalog (v2 - Feb 2026)
- MaterialManager.jsx: 3 view modes (grouped/table/card), quick filters, advanced filters, bulk ops, CSV import/export, favorites, duplicate
- MaterialDetailModal.jsx: Detail view with price history SVG chart, usage stats, all metadata
- MaterialPicker.jsx: Modal picker with favorites/recent tabs, category colors, usage counts
- Category colors: pipe=#2563eb, fittings=#7c3aed, fixtures=#0891b2, valves=#dc2626, water_heater=#ea580c, gas=#ca8a04, misc=#6b7280

## BlueprintCanvas (v2 - Feb 2026)
- 8 tool types: select, pan, length, area, count, rectangle, circle, annotation
- Color scheme: length=#2563eb, area=#16a34a, count=#dc2626, rect=#7c3aed, circle=#0891b2, annotation=#64748b
- Hover=#fb923c, selected=#f59e0b, snap=#ec4899, calibration=#a855f7
- Snap-to-point, crosshair guide, live preview, minimap, PNG export, duplicate (Ctrl+D)
- requestAnimationFrame loop + ResizeObserver for canvas sizing
- Shortcuts: V/H/L/A/C/R/O/T (tools), G/S/X/M (toggles), Del, Esc, Ctrl+Z/Y/D

## MeasurementsSidebar (v2)
- Grouped by type with collapsible sections, color dots, secondary info
- Shows perimeter/circumference in expanded view, duplicate per measurement
- Keyboard shortcut reference when empty
