# Empty States Usage Guide

## Overview
Comprehensive empty state components for every major view in the application.

## Import Options

### Option 1: From dedicated module (recommended)
```jsx
import { NoJobsEmpty, NoLeadsEmpty } from '@/components/empty-states';
```

### Option 2: From UI library
```jsx
import { NoJobsEmpty, NoLeadsEmpty } from '@/components/ui';
```

## Available Empty States

### Jobs & Projects
| Component | Icon | Use Case |
|-----------|------|----------|
| `NoJobsEmpty` | HardHat | No active jobs tracked |
| `NoEstimatesEmpty` | Calculator | Pricing module with no estimates |
| `NoBlueprintsEmpty` | Blueprint | Project without blueprints |
| `NoProjectSelectedEmpty` | Folder | Nothing selected in sidebar |

### Leads
| Component | Icon | Use Case |
|-----------|------|----------|
| `NoLeadsEmpty` | Target | Manual leads tab empty |
| `NoPermitsEmpty` | Building2 | Permit search with no results |
| `NoBuildersEmpty` | Users | Builder directory empty |
| `NoSearchResultsEmpty` | Search | Search returned no matches |
| `ColdLeadsEmpty` | Clock | No cold leads (positive) |
| `NoDiscoveryResultsEmpty` | Radar | AI discovery no results |

### Documents
| Component | Icon | Use Case |
|-----------|------|----------|
| `NoDocumentsEmpty` | Files | Document library empty |
| `NoAnalysisEmpty` | Sparkles | Vision tab, no docs to analyze |
| `UploadPromptEmpty` | Upload | Prompt to upload first file |
| `NoMatchingDocumentsEmpty` | SearchSlash | Filter returned no docs |

### Dashboard
| Component | Icon | Use Case |
|-----------|------|----------|
| `NoActivityEmpty` | CalendarCheck | Activity feed empty |
| `NoInsightsEmpty` | BrainCircuit | AI insights unavailable |
| `DashboardWelcomeEmpty` | LayoutGrid | First-time user dashboard |

### History & Activity
| Component | Icon | Use Case |
|-----------|------|----------|
| `NoHistoryEmpty` | History | Activity timeline empty |
| `NoNotificationsEmpty` | Bell | Notification center empty |
| `NoAlertsEmpty` | ShieldCheck | Alerts panel empty |

### AI Assistant
| Component | Icon | Use Case |
|-----------|------|----------|
| `NoAIInsightsEmpty` | BrainCircuit | No AI analysis available |
| `NoChatHistoryEmpty` | MessageSquare | Chat with no history |
| `AIAnalysisPendingEmpty` | Loader | Analysis in progress |

### Canvas & Vision
| Component | Icon | Use Case |
|-----------|------|----------|
| `NoCanvasItemsEmpty` | LayoutGrid | Canvas workspace empty |
| `NoVisionProjectsEmpty` | Image | No projects with vision docs |
| `NoConnectionsEmpty` | GitBranch | No linked documents |

### Generic
| Component | Icon | Use Case |
|-----------|------|----------|
| `ErrorEmpty` | AlertCircle | Error/failure state |
| `ComingSoonEmpty` | Rocket | Feature not yet available |
| `NoDataEmpty` | Database | Generic no data |
| `LoadingEmpty` | Loader | Skeleton replacement |

## Usage Examples

### Jobs Page
```jsx
import { NoJobsEmpty } from '@/components/empty-states';

function JobsPage() {
  const [jobs, setJobs] = useState([]);
  
  return (
    <div>
      {jobs.length === 0 ? (
        <NoJobsEmpty onCreate={() => setActiveTab('estimating')} />
      ) : (
        <JobList jobs={jobs} />
      )}
    </div>
  );
}
```

### Lead Finder - Manual Tab
```jsx
import { NoLeadsEmpty, NoPermitsEmpty } from '@/components/empty-states';

function LeadFinder() {
  return (
    <Tabs>
      <TabPanel id="manual">
        {leads.length === 0 ? (
          <NoLeadsEmpty 
            onAdd={handleAddLead}
            onSearchCity={() => setActiveTab('cities')}
          />
        ) : (
          <LeadGrid leads={leads} />
        )}
      </TabPanel>
      
      <TabPanel id="permits">
        {permits.length === 0 ? (
          <NoPermitsEmpty onSearch={() => setActiveTab('cities')} />
        ) : (
          <PermitList permits={permits} />
        )}
      </TabPanel>
    </Tabs>
  );
}
```

### Documents Library
```jsx
import { NoDocumentsEmpty } from '@/components/empty-states';

function DocumentsPage() {
  return (
    <div>
      {documents.length === 0 ? (
        <NoDocumentsEmpty onUpload={() => fileInputRef.current?.click()} />
      ) : (
        <DocumentGrid documents={documents} />
      )}
    </div>
  );
}
```

### History Page
```jsx
import { NoHistoryEmpty } from '@/components/empty-states';

function HistoryPage() {
  return (
    <div>
      {activities.length === 0 ? (
        <NoHistoryEmpty />
      ) : (
        <ActivityTimeline activities={activities} />
      )}
    </div>
  );
}
```

### Error State
```jsx
import { ErrorEmpty } from '@/components/empty-states';

function DataFetcher() {
  const { data, error, refetch } = useQuery('jobs');
  
  if (error) {
    return (
      <ErrorEmpty 
        message="Failed to load jobs"
        onRetry={refetch}
      />
    );
  }
  
  return <JobList jobs={data} />;
}
```

## Base Component API

### EmptyState
Base component for creating custom empty states.

```jsx
<EmptyState
  icon={HardHat}              // Lucide icon component
  iconName="hardhat"          // Or use string name
  title="No jobs found"       // Required
  description="Add a job..."  // Required
  primaryAction={{            // Optional primary CTA
    label: 'Add Job',
    onClick: handleAdd,
    icon: <Plus className="w-4 h-4" />
  }}
  secondaryAction={{          // Optional secondary CTA
    label: 'Learn More',
    onClick: () => {},
    icon: <Info className="w-4 h-4" />
  }}
  variant="default"           // default | card | inline
  className="custom-class"    // Additional classes
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | LucideIcon | - | Icon component |
| `iconName` | string | - | Named icon (alternative to icon) |
| `title` | string | required | Main heading |
| `description` | string | required | Supporting text |
| `primaryAction` | Action | - | Main CTA button |
| `secondaryAction` | Action | - | Secondary CTA |
| `variant` | string | 'default' | Visual style |
| `className` | string | '' | Extra CSS classes |

### Action Object
```typescript
interface Action {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}
```

## Design Tokens

All empty states use the Dark Forge design system:

- **Background**: `colors.background.card`
- **Text**: `colors.text.primary`
- **Muted Text**: `colors.text.muted`
- **Primary CTA**: `colors.primary.DEFAULT`
- **Secondary CTA**: `colors.background.elevated`

## Accessibility

- All empty states have `role="status"` for screen readers
- Icons have `aria-hidden="true"`
- Actions are keyboard accessible
- Focus management on primary action
- Reduced motion support

## Custom Empty State

Create custom empty states using the base component:

```jsx
import { EmptyState } from '@/components/empty-states';
import { MyCustomIcon } from 'lucide-react';

export const CustomEmpty = ({ onAction }) => (
  <EmptyState
    icon={MyCustomIcon}
    title="Custom Empty State"
    description="Describe what the user should do here."
    primaryAction={{
      label: 'Take Action',
      onClick: onAction,
      icon: <ArrowRight className="w-4 h-4" />
    }}
  />
);
```
