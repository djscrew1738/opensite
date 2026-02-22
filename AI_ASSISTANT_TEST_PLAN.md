# AI Assistant - Test Plan

## Build Status
✅ **Build Successful** - All modules transformed, no errors

```
AIAssistant-DJEDjzZK.js: 15.69 kB │ gzip: 5.00 kB
```

## Test Scenarios

### 1. Page Load & Navigation

#### Test 1.1: Fresh Load (No URL params)
- **Action**: Navigate to `/ai`
- **Expected**: 
  - Empty chat interface with suggested actions
  - "New Conversation" in header
  - Drawer closed on mobile, hidden on desktop
  - No export/clear buttons visible

#### Test 1.2: Load with Conversation ID
- **Action**: Navigate to `/ai?id=conv_123`
- **Expected**:
  - Conversation loads from API
  - Messages appear in chat
  - Title shows in header
  - Export/clear buttons visible

#### Test 1.3: History → Assistant Navigation
- **Action**: Click "Open in Assistant" in History page
- **Expected**:
  - Navigates to `/ai?id=xxx`
  - Correct conversation loads
  - URL param present

---

### 2. Conversation Drawer

#### Test 2.1: Open Drawer (Mobile)
- **Action**: Click hamburger menu icon
- **Expected**:
  - Drawer slides in from left
  - Backdrop appears
  - Conversation list visible
  - Close button present

#### Test 2.2: Open Drawer (Desktop)
- **Action**: Drawer should be hidden on desktop
- **Expected**:
  - Only hamburger menu visible
  - Main content takes full width

#### Test 2.3: Select Conversation
- **Action**: Click conversation in drawer
- **Expected**:
  - Drawer closes
  - Messages load
  - URL updates with id param
  - Title updates in header

#### Test 2.4: New Conversation Button
- **Action**: Click "+" button in drawer header
- **Expected**:
  - Empty chat interface
  - "New Conversation" title
  - URL params cleared
  - Drawer closes (mobile)

#### Test 2.5: Delete Conversation
- **Action**: Click trash icon on conversation
- **Expected**:
  - Confirmation dialog appears
  - On confirm: conversation removed from list
  - Toast notification: "Conversation deleted"
  - If viewing deleted conv: starts new conversation

---

### 3. Chat Functionality

#### Test 3.1: Send Message
- **Action**: Type message, click Send
- **Expected**:
  - User message appears immediately
  - Streaming indicator shows
  - AI response streams in
  - Message added to conversation

#### Test 3.2: First Message Creates Conversation
- **Action**: Send first message in new chat
- **Expected**:
  - Conversation created on backend
  - URL updates with id param
  - Title auto-generated from message
  - Appears in drawer list

#### Test 3.3: Suggested Actions
- **Action**: Click "Analyze leads" suggested action
- **Expected**:
  - Prompt fills input field
  - Ready to send

---

### 4. Export Functionality

#### Test 4.1: Export Menu
- **Action**: Click Download icon (with messages)
- **Expected**:
  - Dropdown menu appears
  - "Export as Markdown" option
  - "Export as Text" option

#### Test 4.2: Export as Markdown
- **Action**: Click "Export as Markdown"
- **Expected**:
  - File downloads: `ctl-conversation-YYYY-MM-DD.md`
  - Proper markdown formatting
  - Includes date, user/AI labels

#### Test 4.3: Export as Text
- **Action**: Click "Export as Text"
- **Expected**:
  - File downloads: `ctl-conversation-YYYY-MM-DD.txt`
  - Plain text format
  - Readable structure

#### Test 4.4: Export Empty Conversation
- **Action**: Click Download with no messages
- **Expected**:
  - Toast error: "No messages to export"
  - No file downloaded

---

### 5. Character/Token Counter

#### Test 5.1: Counter Updates
- **Action**: Type in input field
- **Expected**:
  - Character count updates in real-time
  - Token estimate updates (~chars/4)

#### Test 5.2: Near Limit Warning
- **Action**: Type > 3000 characters
- **Expected**:
  - Counter turns amber/orange
  - Shows "(near limit)" text

#### Test 5.3: Normal State
- **Action**: Type < 3000 characters
- **Expected**:
  - Counter shows normal color
  - No warning text

---

### 6. Clear Conversation

#### Test 6.1: Clear with Messages
- **Action**: Click trash icon in header (with messages)
- **Expected**:
  - Confirmation dialog: "Clear this conversation?"
  - On confirm: messages cleared
  - Conversation stays in history

#### Test 6.2: Clear Empty
- **Action**: Try to clear empty conversation
- **Expected**:
  - No confirmation (nothing to clear)
  - Or button disabled/hidden

---

### 7. Model Selector

#### Test 7.1: Model Selection
- **Action**: Click model dropdown
- **Expected**:
  - Available models listed
  - Can select different model
  - Selection persists

#### Test 7.2: Model During Streaming
- **Action**: Try to change model while streaming
- **Expected**:
  - Dropdown disabled during streaming
  - Enabled after response complete

---

### 8. Error Handling

#### Test 8.1: API Error on Load
- **Action**: Load with invalid conversation ID
- **Expected**:
  - Error handled gracefully
  - Toast notification
  - Falls back to new conversation

#### Test 8.2: Network Error During Chat
- **Action**: Send message with network offline
- **Expected**:
  - Error toast appears
  - Streaming stops
  - Can retry

---

### 9. Responsive Design

#### Test 9.1: Mobile Layout
- **Viewport**: 375px width
- **Expected**:
  - Drawer hidden by default
  - Hamburger menu visible
  - Full-width chat interface
  - Stacked layout

#### Test 9.2: Tablet Layout
- **Viewport**: 768px width
- **Expected**:
  - Similar to mobile
  - Drawer overlay on open

#### Test 9.3: Desktop Layout
- **Viewport**: 1440px width
- **Expected**:
  - No drawer visible
  - Hamburger menu only
  - Wider chat interface

---

### 10. Accessibility

#### Test 10.1: Keyboard Navigation
- **Action**: Tab through elements
- **Expected**:
  - All interactive elements focusable
  - Focus states visible
  - Logical tab order

#### Test 10.2: Screen Reader
- **Action**: Navigate with screen reader
- **Expected**:
  - Messages announced
  - Button labels read
  - Drawer state announced

---

## Test Environment

```bash
# Start development server
cd /home/djscrew/opensite/frontend
npm run dev

# Run production build
cd /home/djscrew/opensite/frontend
npm run build

# Preview production build
cd /home/djscrew/opensite/frontend
npm run preview
```

## Browser Testing

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ⬜ Test |
| Firefox | Latest | ⬜ Test |
| Safari | Latest | ⬜ Test |
| Edge | Latest | ⬜ Test |

## Mobile Testing

| Device | OS | Status |
|--------|-----|--------|
| iPhone 14 | iOS 17 | ⬜ Test |
| iPad Pro | iPadOS 17 | ⬜ Test |
| Pixel 7 | Android 14 | ⬜ Test |

## Known Limitations

1. **Drawer on Desktop**: Currently hidden on lg+ screens, may need adjustment
2. **No Real-time Sync**: Conversations don't auto-update when created elsewhere
3. **No Pagination**: Conversation list limited to 50 items
4. **No Search**: Can't search within conversations yet

## Debug Tips

```javascript
// Check conversation data in console
localStorage.getItem('opensite_conversations')

// Clear all conversation data
localStorage.clear()

// Check current conversation ID
new URLSearchParams(window.location.search).get('id')
```

## Success Criteria

- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Responsive on all breakpoints
- [ ] Accessibility audit passes
- [ ] Build completes successfully
- [ ] All user flows intuitive
