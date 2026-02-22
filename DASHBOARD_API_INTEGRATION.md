# Dashboard API Integration

## Overview
Connected Dashboard.jsx to live API data, replacing all hardcoded mock data with React Query hooks. Added loading skeletons, error states, and a "Last updated" indicator.

## Changes Made

### 1. Dashboard.jsx - Complete Rewrite

**Before:**
- Simple wrapper that rendered `JobPulseHome` with no data fetching
- All data was hardcoded in `JobPulseHome.jsx` (MOCK_JOBS, METRICS, FOCUS_ITEMS)

**After:**
- Uses React Query's `useQuery` for data fetching
- Fetches from `api.projects.getAll()` for jobs list
- Fetches from `api.dashboard.getStats()` for dashboard metrics
- Computes derived metrics and focus items from live data
- Auto-refresh every 30 seconds
- Shows loading skeleton while fetching
- Shows error state with retry button on failure
- Displays "Updated X seconds ago" indicator with manual refresh

### 2. JobPulseHome.jsx - Props-Based Architecture

**Before:**
```jsx
// Hardcoded mock data
const MOCK_JOBS = [...];
const METRICS = [...];
const FOCUS_ITEMS = [...];

export default function JobPulseHome({ jobs = MOCK_JOBS, ... }) {
  // Used mock data by default
}
```

**After:**
```jsx
// Pure component - all data via props
export default function JobPulseHome({ 
  jobs = [], 
  metrics = [],
  focusItems = [],
  isLoading = false,
  onJobClick 
}) {
  // Renders whatever data is passed
}
```

## Data Flow

```
Dashboard.jsx
├── useQuery(['dashboard-jobs']) → api.projects.getAll()
├── useQuery(['dashboard-stats']) → api.dashboard.getStats()
├── computeMetrics(jobs, stats) → Metric cards data
├── computeFocusItems(jobs) → "Today's Focus" items
└── <JobPulseHome jobs={jobs} metrics={metrics} focusItems={focusItems} />
```

## Key Features

### Live Data Integration
- **Jobs**: Fetched from `/api/projects` endpoint
- **Stats**: Fetched from `/api/dashboard/stats` endpoint
- **Auto-refresh**: Every 30 seconds for jobs, every 60 seconds for stats
- **Stale-while-revalidate**: Data stays visible while refreshing

### Loading States
- Shows `DashboardSkeleton` while initial data loads
- Smooth transition from skeleton to content
- No layout shift during loading

### Error Handling
- Full-page error card if API fails
- Shows specific error message from API
- "Retry" button to manually refetch
- Graceful fallback to empty state

### Last Updated Indicator
- Positioned in top-right corner
- Shows relative time: "Updated 5 seconds ago"
- Manual refresh button (circular arrow icon)
- Updates automatically when data refreshes

### Computed Metrics
Metrics are now computed from live job data:

| Metric | Calculation |
|--------|-------------|
| Active Jobs | Jobs with status !== 'completed' |
| Inspections | Jobs with status === 'due-today' |
| Overdue | Jobs with daysInPhase > 10 or status === 'overdue' |
| Revenue | Sum of job.estimate.total or job.totalPrice |
| Pipeline | Jobs in 'underground' or 'roughin' phases |

### Focus Items Algorithm
"Today's Focus" is computed dynamically:

1. **Overdue jobs** (highest priority)
   - Jobs with daysInPhase > 10
   - Sorted by most overdue first
   - Max 2 items

2. **Due soon jobs**
   - Jobs with status === 'due-today'
   - Jobs with daysInPhase >= 7
   - Max 2 items

3. **Display**: Max 4 focus items total

## API Response Handling

### Job Data Normalization
The component normalizes various API response formats:

```js
{
  id: job.id || job.jobId,
  address: job.address || job.name || 'Unknown Address',
  city: job.city || 'Unknown City',
  zip: job.zip || job.zipCode || '',
  builder: job.builder || job.builderName || 'Unknown Builder',
  phase: job.phase || job.currentPhase || 'underground',
  daysInPhase: job.daysInPhase || job.daysInCurrentPhase || 0,
  status: job.status || computeStatus(job),
  estimate: job.estimate,
  totalPrice: job.totalPrice || job.estimate?.total
}
```

### Status Computation
If backend doesn't provide status, it's computed:
- `overdue`: daysInPhase > 10
- `due-today`: daysInPhase >= 7
- `healthy`: everything else

## UI Components

### Refresh Indicator
```jsx
<div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-text-muted">
  <Clock className="w-3 h-3" />
  <span>Updated 5 seconds ago</span>
  <button onClick={handleRefresh}>
    <RefreshCw className="w-3 h-3" />
  </button>
</div>
```

### Error State
```jsx
<div className="card p-6 border-red-200 bg-red-50">
  <AlertCircle className="w-8 h-8 text-red-500" />
  <h2>Failed to load dashboard</h2>
  <p>{error.message}</p>
  <button onClick={handleRefresh}>Retry</button>
</div>
```

## Bundle Impact

| File | Before | After | Change |
|------|--------|-------|--------|
| Dashboard.js | 19.24 kB | 21.38 kB | +2.14 kB |
| (gzipped) | 6.21 kB | 7.07 kB | +0.86 kB |

Minimal size increase for significant functionality improvement.

## Testing

### Manual Test Scenarios

1. **Initial Load**
   - Open dashboard
   - See skeleton loader
   - Data appears, skeleton fades out
   - "Updated just now" shows

2. **Auto-Refresh**
   - Wait 30 seconds
   - Data refreshes in background
   - "Updated X seconds ago" updates

3. **Manual Refresh**
   - Click refresh button
   - Data refetches immediately
   - Timestamp updates

4. **Error State**
   - Disconnect network
   - See error card with retry button
   - Click retry, data loads when network returns

5. **Empty State**
   - API returns empty jobs array
   - "No jobs in this phase" message shows
   - Metrics show zeros

### API Mock for Testing

```js
// Mock successful response
api.projects.getAll = () => Promise.resolve({
  projects: [
    { id: '1', address: '123 Main St', city: 'Frisco', ... },
  ]
});

// Mock error
api.projects.getAll = () => Promise.reject(new Error('Network error'));

// Mock empty
api.projects.getAll = () => Promise.resolve({ projects: [] });
```

## Future Enhancements

1. **Real-time Updates**: WebSocket for instant job updates
2. **Offline Support**: Cache dashboard data in service worker
3. **Pagination**: For large job lists
4. **Filtering**: Client-side filtering of jobs
5. **Search**: Search through jobs on dashboard
6. **Historical Data**: Trend charts using historical metrics

## Migration Guide

No breaking changes. The Dashboard component is a drop-in replacement.

If you were importing mock data from JobPulseHome:
```jsx
// Before (if you were using mock data directly)
import JobPulseHome, { MOCK_JOBS } from './JobPulseHome';

// After (mock data removed, use Dashboard or pass your own)
import Dashboard from './pages/Dashboard';
// Dashboard fetches its own data
```
