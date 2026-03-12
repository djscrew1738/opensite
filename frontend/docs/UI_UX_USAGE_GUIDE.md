# UI/UX Overhaul — Usage Guide

A comprehensive guide for using the new UI components, hooks, and design tokens introduced in the v2.0 overhaul.

---

## 📦 Installation

No installation needed! All components are available through the existing import paths:

```jsx
// UI Components
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';

// Shared Components  
import { AnimatedCard, ToastProvider, useToast } from '@/components/shared';

// Design System
import { 
  useCountUp, 
  useInView,
  pageTransitions,
  cx 
} from '@/design-system';
```

---

## 🎨 Design System

### Tokens

```jsx
import { colors, spacing, shadows, animation } from '@/design-system';

// Use tokens directly
<div style={{ color: colors.text.primary }} />
<div style={{ padding: spacing[4] }} />
<div style={{ boxShadow: shadows.card.hover }} />
```

### Class Name Utilities

```jsx
import { cx } from '@/design-system';

// Conditional classes
const className = cx(
  'base-class',
  isActive && 'active-class',
  isLarge ? 'text-lg' : 'text-sm',
  'always-included'
);
```

---

## 🔘 Buttons

### Basic Usage

```jsx
import { Button, IconButton, FAB } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';

// Standard button
<Button variant="primary">Create Job</Button>

// With icon
<Button 
  variant="primary" 
  leftIcon={Plus}
  showRipple
>
  Add New
</Button>

// Icon button
<IconButton 
  icon={Trash2} 
  variant="danger"
  aria-label="Delete"
/>

// Floating Action Button
<FAB 
  icon={Plus}
  variant="primary"
  className="bottom-6 right-6"
  onClick={() => navigate('/jobs/new')}
/>
```

### Variants

- `primary` — Main CTA, blue with glow
- `secondary` — Subdued, with border
- `ghost` — Minimal, for less important actions
- `danger` — Destructive actions
- `success` — Positive actions
- `outline` — Bordered, transparent background

### Sizes

- `sm` — Small (36px height)
- `DEFAULT` — Standard (44px height)
- `lg` — Large (52px height)
- `icon` / `icon-sm` / `icon-lg` — Icon only

---

## 🃏 Cards

### Basic Card

```jsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui';

<Card isInteractive onClick={handleClick}>
  <CardHeader 
    title="Job Title"
    subtitle="Builder Name"
    icon={HardHat}
  />
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost">View</Button>
    <Button variant="primary">Edit</Button>
  </CardFooter>
</Card>
```

### Animated Card (Enhanced)

```jsx
import { AnimatedCard, AnimatedStatCard } from '@/components/shared';

// With entrance animation
<AnimatedCard 
  isInteractive 
  delay={0.1}
  animateOnMount
>
  <h3>Animated Card</h3>
</AnimatedCard>

// Stat card with animation
<AnimatedStatCard
  label="Active Jobs"
  value={24}
  change="+12%"
  changeType="positive"
  icon={HardHat}
  delay={0.2}
/>
```

### Card Variants

- `default` — Standard card
- `elevated` — Higher shadow
- `outlined` — Transparent with border
- `glass` — Frosted glass effect

---

## 🔔 Toast Notifications

### Toast Provider

Wrap your app with the ToastProvider:

```jsx
import { ToastProvider } from '@/components/shared';

function App() {
  return (
    <ToastProvider position="bottom-right">
      <YourApp />
    </ToastProvider>
  );
}
```

### Using Toasts

```jsx
import { useToast } from '@/components/shared';

function MyComponent() {
  const { toast } = useToast();

  const handleSave = async () => {
    // Simple toast
    toast.success('Job saved successfully!');
    
    // With title
    toast.info({
      title: 'New Feature',
      message: 'Check out the updated dashboard',
    });
    
    // With action
    toast.warning({
      title: 'Session Expiring',
      message: 'Your session will expire soon',
      action: {
        label: 'Renew',
        onClick: () => renewSession(),
      },
    });
    
    // Promise-based
    await toast.promise(
      saveJob(data),
      {
        loading: 'Saving job...',
        success: 'Job saved!',
        error: 'Failed to save',
      }
    );
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Toast Positions

- `top-left`, `top-right`, `top-center`
- `bottom-left`, `bottom-right`, `bottom-center`

---

## 🦴 Skeleton Loading

### Basic Skeleton

```jsx
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonList,
  SkeletonTable,
  PulseLoader 
} from '@/components/ui';

// Simple skeleton
<Skeleton height="2em" width="60%" />

// Card skeleton
<SkeletonCard 
  hasHeader 
  hasMedia 
  lines={3} 
  hasFooter 
/>

// List skeleton
<SkeletonList items={5} hasIcon hasAction />

// Table skeleton
<SkeletonTable rows={5} columns={4} />

// Pulse loader
<PulseLoader size="lg" />
```

---

## 📭 Empty States

### Pre-built Empty States

```jsx
import { 
  EmptyState,
  EmptyJobs,
  EmptySearch,
  EmptyLeads,
  ErrorState,
  LoadingState 
} from '@/components/ui';

// Generic empty state
<EmptyState
  iconName="clipboard"
  title="No jobs yet"
  description="Get started by creating your first job"
  action={{
    label: 'Create job',
    icon: Plus,
    onClick: handleCreate,
  }}
/>

// Pre-built contextual empty states
<EmptyJobs onCreate={handleCreate} />
<EmptySearch query={searchQuery} onClear={clearSearch} />
<EmptyLeads onFind={handleFind} />
<ErrorState onRetry={handleRetry} />
<LoadingState />
```

### Empty State Icons

`default`, `search`, `folder`, `inbox`, `file`, `upload`, `building`, `users`, `clipboard`, `error`, `success`, `sparkles`, `idea`, `add`

---

## 🎣 Hooks

### useCountUp — Animated Numbers

```jsx
import { useCountUp, useInView } from '@/design-system';

function StatValue({ value }) {
  const { ref, isInView } = useInView();
  const { displayValue, startAnimation } = useCountUp(value, {
    duration: 1000,
    prefix: '$',
    suffix: '',
    decimals: 0,
  });

  useEffect(() => {
    if (isInView) startAnimation();
  }, [isInView]);

  return <span ref={ref}>{displayValue}</span>;
}
```

### useInView — Scroll Reveal

```jsx
import { useInView } from '@/design-system';

function FadeInSection({ children }) {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
```

### useInteraction — Hover/Press/Focus

```jsx
import { useInteraction } from '@/design-system';

function InteractiveCard() {
  const { ref, hovered, pressed, focused } = useInteraction();

  return (
    <div 
      ref={ref}
      style={{
        transform: pressed ? 'scale(0.98)' : hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.2s',
      }}
    >
      Card Content
    </div>
  );
}
```

### useReducedMotion — Accessibility

```jsx
import { useReducedMotion } from '@/design-system';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={reducedMotion ? {} : { scale: [1, 1.1, 1] }}
    >
      Content
    </motion.div>
  );
}
```

---

## ✨ Animations

### Page Transitions

```jsx
import { motion } from 'framer-motion';
import { pageTransitions } from '@/design-system';

function Page() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitions.enter}
    >
      <h1>Page Content</h1>
    </motion.div>
  );
}
```

### Staggered Lists

```jsx
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/design-system';

function JobList({ jobs }) {
  return (
    <motion.div
      variants={staggerContainer.default}
      initial="initial"
      animate="animate"
    >
      {jobs.map((job) => (
        <motion.div key={job.id} variants={staggerItem.fadeUp}>
          <JobCard job={job} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

## 🎯 Best Practices

### 1. Respect Reduced Motion

```jsx
import { useReducedMotion } from '@/design-system';

function MyComponent() {
  const reducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={reducedMotion ? {} : { y: [0, -10, 0] }}
    >
      Content
    </motion.div>
  );
}
```

### 2. Use Loading States

```jsx
function JobList() {
  const { data, isLoading } = useQuery({...});

  if (isLoading) {
    return <SkeletonList items={5} />;
  }

  if (!data?.length) {
    return <EmptyJobs onCreate={handleCreate} />;
  }

  return <JobList jobs={data} />;
}
```

### 3. Handle Errors Gracefully

```jsx
function JobList() {
  const { data, isError, refetch } = useQuery({...});

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  // ...
}
```

### 4. Animate on Mount

```jsx
import { motion } from 'framer-motion';

<Card 
  animateOnMount 
  delay={0.1}
>
  Content
</Card>
```

---

## 🎨 Tailwind Classes

### New Utility Classes

```css
/* Glow effects */
.glow-blue        /* Blue glow shadow */
.glow-green       /* Green glow shadow */
.glow-red         /* Red glow shadow */

/* Text gradients */
.text-gradient         /* Blue gradient text */
.text-gradient-subtle  /* Subtle gradient text */

/* Animations */
.animate-shimmer     /* Shimmer loading effect */
.animate-float       /* Floating animation */
.animate-glow-pulse  /* Pulsing glow */

/* Backdrop blur */
.backdrop-blur-card  /* Frosted glass effect */

/* GPU acceleration */
.gpu-accelerate      /* Hardware acceleration */
```

---

## 🔧 Migration from Legacy Components

### Button Migration

```jsx
// Before
<button className="btn-primary">Click</button>

// After
<Button variant="primary" showRipple>Click</Button>
```

### Card Migration

```jsx
// Before
<div className="card card-hover">Content</div>

// After
<Card isInteractive>Content</Card>
// or
<AnimatedCard isInteractive delay={0.1}>Content</AnimatedCard>
```

### Toast Migration

```jsx
// Before
import { useToast } from '@/hooks/useToast';
const { showToast } = useToast();
showToast('Message', 'success');

// After
import { useToast } from '@/components/shared';
const { toast } = useToast();
toast.success('Message');
```

---

## 📱 Responsive Considerations

```jsx
// Cards stack on mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <AnimatedStatCard ... />
  <AnimatedStatCard ... />
  <AnimatedStatCard ... />
  <AnimatedStatCard ... />
</div>

// Touch-friendly buttons
<Button size="lg" className="w-full md:w-auto">
  Action
</Button>

// Responsive toast position
<ToastProvider 
  position={isMobile ? 'top-center' : 'bottom-right'}
/>
```

---

## ♿ Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Toast notifications use `aria-live` regions
- [ ] Buttons have clear labels and `aria-label` where needed
- [ ] Loading states are announced to screen readers
- [ ] Empty states provide clear next actions

---

For more examples, see the Storybook documentation or component source files.
