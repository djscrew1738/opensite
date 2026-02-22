# Skeleton Loading States

## Overview

Shimmer skeleton loading states have been wired into the design system to provide a polished loading experience. The skeletons match the exact shape of the components they represent, creating a "layout holds its shape" effect during data fetches.

## Components with Skeleton Support

### 1. StatCard

```jsx
import StatCard from './components/dashboard/StatCard';

// During loading
<StatCard isLoading />

// With data
<StatCard
  icon={TrendingUp}
  label="Revenue"
  value="$47.2K"
  subtext="This month"
  trend="up"
  trendValue="12%"
/>
```

### 2. LeadCard

```jsx
import LeadCard from './components/leads/LeadCard';

// During loading
<LeadCard isLoading />

// With data
<LeadCard lead={lead} onEdit={handleEdit} onDelete={handleDelete} />
```

### 3. JobCard

```jsx
import JobCard from './components/jobs/JobCard';

// During loading
<JobCard loading />

// With data
<JobCard job={job} onClick={handleClick} />
```

### 4. Dashboard (JobPulseHome)

```jsx
import JobPulseHome from './components/dashboard/JobPulseHome';

// During loading
<JobPulseHome isLoading />

// With data
<JobPulseHome jobs={jobs} onJobClick={handleJobClick} />
```

## Available Skeleton Components

Import from `components/shared/LoadingStates`:

```jsx
import {
  StatCardSkeleton,
  LeadCardSkeleton,
  JobCardSkeleton,
  DashboardSkeleton,
  ShimmerBlock,
} from './components/shared/LoadingStates';
```

### StatCardSkeleton
```jsx
<StatCardSkeleton count={4} />
```

### LeadCardSkeleton
```jsx
<LeadCardSkeleton count={3} />
```

### JobCardSkeleton
```jsx
<JobCardSkeleton count={5} />
```

### DashboardSkeleton
```jsx
<DashboardSkeleton />
```

### ShimmerBlock (Generic)
```jsx
<ShimmerBlock width="100%" height="1rem" />
<ShimmerBlock width="64px" height="64px" circle />
```

## Usage with React Query

```jsx
import { useQuery } from '@tanstack/react-query';
import { JobPulseHome } from './components/dashboard';

function DashboardPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  });

  return (
    <JobPulseHome 
      jobs={jobs} 
      isLoading={isLoading} 
    />
  );
}
```

## CSS Customization

The shimmer effect uses CSS custom properties:

```css
.skeleton-shimmer {
  background: linear-gradient(90deg,
    var(--surface-card) 0%,
    var(--surface-elevated) 50%,
    var(--surface-card) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

## Benefits

1. **Reduced Layout Shift**: Skeletons match final layout, preventing jarring jumps
2. **Perceived Performance**: Users see progress immediately, reducing perceived wait time
3. **Brand Consistency**: Uses design system tokens for colors and shapes
4. **Accessibility**: Maintains semantic structure during loading
5. **Animation**: Smooth shimmer effect indicates activity

## Migration Guide

### Before
```jsx
{isLoading ? (
  <div className="flex justify-center p-8">
    <Spinner />
  </div>
) : (
  <StatCard {...data} />
)}
```

### After
```jsx
<StatCard {...data} isLoading={isLoading} />
```

Or use skeleton directly:
```jsx
{isLoading ? (
  <StatCardSkeleton count={4} />
) : (
  <div className="grid grid-cols-4 gap-3">
    {stats.map(s => <StatCard key={s.label} {...s} />)}
  </div>
)}
```
