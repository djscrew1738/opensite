# AI Assistant - Conversation Management

## Overview
Extended the AI Assistant with full conversation management capabilities including multiple named conversations, a conversation drawer, export functionality, and History page integration.

## Features Added

### 1. Conversation Drawer (Left Sidebar)
**Component**: `ConversationDrawer`

- Slide-out drawer listing all past conversations
- Fetched from `/api/history/conversations` endpoint
- Shows:
  - Conversation title (generated from first message)
  - Message count
  - Last updated timestamp
  - Active conversation highlighting
- Actions:
  - Click to load conversation
  - Delete conversation (with confirmation)
  - New conversation button

**UI States**:
- Loading: Skeleton placeholders
- Empty: "No conversations yet" message
- Active: Highlighted border with accent color

### 2. Conversation Management

#### New Conversation
- Clears current messages
- Resets conversation ID
- Clears URL params
- Starts fresh chat session

#### Load Conversation
- Fetches conversation data from API
- Loads messages into chat interface
- Sets conversation title
- Updates URL with `?id=xxx` param

#### Delete Conversation
- Confirmation dialog before deletion
- Removes from list immediately
- If currently viewing deleted conversation, starts new one
- Toast notification on success

#### Clear Current Conversation
- Clears messages from current session
- Keeps conversation in history
- Confirmation if unsaved messages exist

### 3. Export Functionality
**Formats**: Markdown (.md) and Plain Text (.txt)

**Export Button**: In header actions (only visible when messages exist)

**Markdown Format**:
```markdown
# CTL Plumbing AI Conversation

**Date:** 1/15/2024, 10:30:00 AM

---

**You:**
What's the code requirement for rough-in?

---

**AI Assistant:**
The IPC code requires...

---
```

**Plain Text Format**:
```
CTL Plumbing AI Conversation
Date: 1/15/2024, 10:30:00 AM

[You]:
What's the code requirement for rough-in?

---

[AI Assistant]:
The IPC code requires...
```

### 4. Character/Token Counter
**Location**: Below input field

- Shows character count
- Shows estimated token count (~chars/4)
- Warning when near 3000 characters
- Real-time updates as user types

```
AI responses are generated based on your data...          245 chars · ~61 tokens
```

### 5. History Page Integration
**New Feature**: "Open in Assistant" button

- Added to each conversation in History list
- Click navigates to `/ai?id=xxx`
- Loads conversation directly in AI Assistant
- Seamless flow between History and Assistant

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  AIAssistant.jsx                                            │
│  ├─ useQuery(['conversations']) → Conversation list         │
│  ├─ useQuery(['conversation', id]) → Load specific conv     │
│  ├─ URL param ?id=xxx → Auto-load conversation              │
│  └─ sendMessage() → Creates/updates conversation            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  History.jsx                                                │
│  └─ "Open in Assistant" → navigate(`/ai?id=xxx`)            │
└─────────────────────────────────────────────────────────────┘
```

## URL Routing

### Routes Added/Modified

| Route | Component | Purpose |
|-------|-----------|---------|
| `/ai` | AIAssistant | New standalone AI Assistant page |
| `/ai?id=xxx` | AIAssistant | Load specific conversation |

### Previous Behavior
`/ai` redirected to `/` (Dashboard)

### New Behavior
`/ai` renders full AI Assistant with conversation management

## API Integration

### Endpoints Used

```javascript
// Fetch conversation list
api.history.getConversations({ limit: 50 })

// Fetch specific conversation
api.history.getConversation(id)

// Delete conversation
api.history.deleteConversation(id)

// Send message (streaming)
POST /api/ai/chat/stream
```

### Conversation Object Structure

```typescript
interface Conversation {
  id: string;
  title?: string;
  preview?: string;
  messageCount: number;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}
```

## Component Architecture

### AIAssistant.jsx
Main container with:
- State management for messages, conversation ID, title
- URL param handling for conversation loading
- Conversation drawer integration
- Export functionality
- Token counter
- Message sending logic

### ConversationDrawer.jsx
Sidebar component with:
- Conversation list rendering
- Loading skeletons
- Empty state
- Delete confirmation
- Active state highlighting

### ChatInterface.jsx
Pure presentation component:
- Renders messages
- Empty state with suggested actions
- Streaming indicator
- Accessibility features

## User Flows

### Flow 1: Start New Conversation
```
1. Click "+" in drawer (or app opens fresh)
2. Empty chat interface shows
3. Type message, press Send
4. New conversation created
5. Title auto-generated from first message
6. Appears in drawer list
```

### Flow 2: Resume Previous Conversation
```
1. Open drawer (hamburger menu on mobile)
2. Click conversation in list
3. URL updates to /ai?id=xxx
4. Messages load into chat
5. Continue conversation
```

### Flow 3: Export Conversation
```
1. Have conversation with messages
2. Click Download icon in header
3. Choose format (Markdown or Text)
4. File downloads automatically
```

### Flow 4: History → Assistant
```
1. Go to History page
2. Click "Open in Assistant" button
3. Navigate to /ai?id=xxx
4. Conversation loads immediately
```

## UI/UX Details

### Responsive Design
- **Desktop**: Drawer always visible (lg breakpoint)
- **Mobile**: Drawer slides over content, hamburger menu to open
- **Tablet**: Same as mobile

### Visual States
- **Active conversation**: Accent border, filled icon
- **Hover**: Background highlight, delete button appears
- **Loading**: Skeleton shimmer animation
- **Empty**: Icon + text centered

### Accessibility
- ARIA labels on all buttons
- Keyboard navigation support
- Focus management on drawer open/close
- Screen reader announcements for new messages

## Files Modified

| File | Changes |
|------|---------|
| `AIAssistant.jsx` | Complete rewrite with conversation management |
| `History.jsx` | Added "Open in Assistant" button + navigation |
| `App.jsx` | Updated /ai route to render AIAssistant |
| `prefetch.js` | Added ai page import and route mapping |

## Bundle Impact

| File | Size | Gzipped |
|------|------|---------|
| AIAssistant-DJEDjzZK.js | 15.69 kB | 5.00 kB |

Minimal size for significant functionality.

## Future Enhancements

1. **Rename Conversations**: Edit title inline
2. **Search Conversations**: Filter in drawer
3. **Folders/Tags**: Organize conversations
4. **Shared Conversations**: Generate shareable links
5. **Templates**: Start from common prompts
6. **Pinned Conversations**: Keep important ones at top

## Testing Checklist

- [ ] Create new conversation
- [ ] Load existing conversation from drawer
- [ ] Delete conversation
- [ ] Export as Markdown
- [ ] Export as Text
- [ ] Character/token counter updates
- [ ] Warning near character limit
- [ ] Mobile drawer open/close
- [ ] History "Open in Assistant" button
- [ ] URL param loads conversation
- [ ] Streaming responses work
