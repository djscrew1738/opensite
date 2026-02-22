# AI Sidebar Documentation

## Overview

The AI Assistant has been converted from a standalone page into a persistent slide-out sidebar that is accessible from any page. The sidebar is context-aware, providing relevant suggestions based on the current page.

## Features

- **Slide-out sidebar**: 400px wide on desktop, full-screen on mobile
- **Context-aware greetings**: Different welcome messages based on current page
- **Dynamic quick actions**: Suggested chips change based on page context
- **Persistent floating button**: One-tap access from any page
- **Keyboard shortcut**: `Cmd/Ctrl + /` to toggle
- **Streaming responses**: Real-time AI response streaming
- **Model selector**: Choose AI model from the sidebar

## Architecture

### Components

```
src/components/ai/
├── AISidebar.jsx          # Main sidebar component
├── AIFloatingButton.jsx   # FAB to open sidebar
├── ChatInterface.jsx      # Chat display (legacy, adapted)
└── ModelSelector.jsx      # AI model selection
```

### Hooks

```
src/hooks/
├── usePageContext.js      # Detect current page context
├── useStreamingResponse.js # Stream AI responses
└── useModelPreference.js  # Manage model selection
```

## Usage

### Opening the AI Sidebar

1. **Floating Button**: Click the AI button in the bottom-right corner
2. **Keyboard Shortcut**: Press `Cmd/Ctrl + /`
3. **Mobile**: Accessible from the floating action button

### Page Contexts

The AI automatically detects the current page and provides relevant context:

| Page | Greeting Example | Quick Actions |
|------|------------------|---------------|
| Dashboard | "Welcome to your command center..." | Analyze leads, Job summary, Today's priorities |
| Jobs | "Looking at your jobs..." | Schedule analysis, Material needs, Phase planning |
| Leads | "I see you're in the Lead Finder..." | Score hot leads, Draft follow-ups, Conversion analysis |
| Documents/Vision | "I see you're analyzing blueprints..." | Extract data, Code check, Material estimate |
| Settings | "You're in settings..." | AI configuration, Integration help |

### Quick Action Chips

Below the input field, context-aware quick action chips provide one-tap suggestions:

```jsx
// Example: On the Leads page
quickActions: [
  { label: 'Score hot leads', prompt: 'Identify and score my hottest leads' },
  { label: 'Draft follow-up', prompt: 'Draft follow-up messages for recent leads' },
  { label: 'Conversion analysis', prompt: 'Analyze my lead conversion patterns' },
  { label: 'Builder insights', prompt: 'Show insights about builder activity' },
]
```

Clicking a chip automatically sends that prompt to the AI.

## Implementation Details

### usePageContext Hook

```javascript
import { usePageContext } from './hooks/usePageContext';

function MyComponent() {
  const context = usePageContext();
  
  console.log(context);
  // {
  //   page: 'leads',
  //   title: 'Lead Finder',
  //   greeting: 'I see you\'re in the Lead Finder...',
  //   quickActions: [...],
  //   data: {}
  // }
}
```

### Extending Page Context

To add context for a new page, edit `src/hooks/usePageContext.js`:

```javascript
if (path === '/my-new-page') {
  return {
    page: 'myPage',
    title: 'My Page',
    greeting: 'Custom greeting for this page...',
    quickActions: [
      { label: 'Action 1', prompt: 'Prompt for action 1' },
      { label: 'Action 2', prompt: 'Prompt for action 2' },
    ],
    data: { /* any extra data */ },
  };
}
```

### Adding Entity-Specific Context

For detail views (e.g., viewing a specific lead), use `useEntityContext`:

```javascript
import { useEntityContext } from './hooks/usePageContext';

// In a lead detail component
const entityContext = useEntityContext('lead', leadId);
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + /` | Toggle AI Sidebar |
| `Esc` | Close AI Sidebar |
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd/Ctrl + Shift + N` | Open Notifications |

## Migration from Standalone Page

The old `/ai` route now redirects to the dashboard (`/`). Users accessing the AI via bookmarks will land on the dashboard and can open the AI sidebar from there.

### Removed Elements

- Standalone `/ai` page route
- "AI Hub" navigation item in sidebar
- "AI Hub" in mobile "More" menu

### New Elements

- Floating AI button (bottom-right, all pages)
- Slide-out sidebar (right edge)
- Context-aware greeting system
- Dynamic quick action chips

## Styling

The sidebar uses the existing design system tokens:

- Background: `colors.surface.primary`
- Border: `colors.border.default`
- Accent: `colors.accent.blue`
- Text: `colors.text.primary`

Mobile-specific styles ensure full-screen coverage with safe area insets.

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus trap when sidebar is open
- Screen reader announcements for streaming responses
- `aria-modal="true"` for modal behavior
- Respects `prefers-reduced-motion`

## Future Enhancements

Potential improvements to consider:

1. **Entity-specific context**: Pass actual lead/job data to AI for richer responses
2. **Conversation history**: Persist conversations across sessions
3. **Voice input**: Add microphone button for speech-to-text
4. **Image analysis**: Allow uploading images to the AI
5. **Smart suggestions**: AI-generated suggestions based on user behavior
6. **Multi-turn context**: Maintain context across page navigation
