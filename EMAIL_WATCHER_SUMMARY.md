# Email Watcher Service - Integration Summary

## Overview
A comprehensive email monitoring service that watches Outlook inboxes via Microsoft Graph API and sends keyword-based alerts via Twilio SMS and Telegram Bot.

## Architecture

### Backend Services (`/backend/src/services/emailWatcher/`)

| File | Purpose |
|------|---------|
| `EmailWatcherService.js` | Main orchestrator - polls inbox, matches keywords, dispatches alerts |
| `outlookClient.js` | Microsoft Graph API client with OAuth2 authentication |
| `keywordMatcher.js` | Rule engine supporting exact/contains/regex matching |
| `alertDispatcher.js` | Routes alerts to appropriate channels (SMS/Telegram) |
| `twilioAlert.js` | Twilio SMS sender with retry logic |
| `telegramAlert.js` | Telegram Bot API integration with urgent follow-ups |
| `index.js` | Service exports |

### API Routes (`/backend/src/routes/emailAlerts/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/email-alerts/health` | GET | Service status, last poll time, rules count |
| `/api/email-alerts/trigger` | POST | Manually trigger inbox poll |
| `/api/email-alerts/reload` | POST | Reload keyword rules from DB |
| `/api/email-alerts/test` | POST | Test alert channels |
| `/api/email-alerts/rules` | GET/POST | List/create keyword rules |
| `/api/email-alerts/rules/:id` | GET/PATCH/DELETE | Manage specific rule |
| `/api/email-alerts/rules/:id/toggle` | POST | Toggle rule active state |
| `/api/email-alerts/log` | GET | View alert history |
| `/api/email-alerts/log/stats` | GET | Alert statistics |
| `/api/email-alerts/log/processed` | GET | Recently processed emails |
| `/api/email-alerts/accounts` | GET/POST | Manage monitored accounts |
| `/api/email-alerts/accounts/:id/health` | GET | Check account connection |
| `/api/email-alerts/config` | GET/PUT | Service configuration |
| `/api/email-alerts/auth/callback` | GET | Microsoft OAuth callback |

### Database Schema (SQLite)

```sql
-- Keyword rules
CREATE TABLE email_alert_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  keyword TEXT NOT NULL,
  secondary_keyword TEXT,
  match_type TEXT DEFAULT 'contains', -- exact, contains, regex
  priority TEXT DEFAULT 'medium',     -- low, medium, high
  alert_channels TEXT DEFAULT 'both', -- sms, telegram, both
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Processed emails (prevent duplicates)
CREATE TABLE email_alert_processed (
  id TEXT PRIMARY KEY,
  outlook_message_id TEXT UNIQUE NOT NULL,
  sender TEXT,
  sender_email TEXT,
  subject TEXT,
  body_preview TEXT,
  received_at TEXT,
  matched_keywords TEXT,
  matched_rule_ids TEXT,
  processed_at TEXT NOT NULL
);

-- Alert log
CREATE TABLE email_alert_log (
  id TEXT PRIMARY KEY,
  processed_email_id TEXT,
  rule_id TEXT,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  sent_at TEXT NOT NULL
);

-- Email accounts
CREATE TABLE email_watcher_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email_address TEXT UNIQUE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TEXT,
  provider TEXT DEFAULT 'outlook',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Settings Integration

### Environment Variables
```bash
# Microsoft OAuth
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:5001/api/email-alerts/auth/callback

# Email Watcher
EMAIL_WATCHER_ENABLED=true
EMAIL_WATCHER_POLL_INTERVAL=60
EMAIL_WATCHER_MARK_READ=false

# Twilio (existing)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
NOTIFY_PHONE_NUMBER=

# Telegram (new)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Frontend Settings UI

1. **Notifications Tab** - Contains two sections:
   - "Email Monitor (Outlook)" - Legacy IMAP-based monitoring
   - "Email Watcher (Microsoft Graph)" - New OAuth-based monitoring

2. **API Keys Tab** - Added:
   - Microsoft OAuth credentials (Client ID, Client Secret)
   - Telegram Bot Token and Chat ID

### API Client Methods (`/frontend/src/api/client.js`)

```javascript
api.emailAlerts: {
  getHealth: () => apiClient.get('/email-alerts/health'),
  getRules: () => apiClient.get('/email-alerts/rules'),
  createRule: (data) => apiClient.post('/email-alerts/rules', data),
  updateRule: (id, data) => apiClient.patch(`/email-alerts/rules/${id}`, data),
  deleteRule: (id) => apiClient.delete(`/email-alerts/rules/${id}`),
  toggleRule: (id) => apiClient.post(`/email-alerts/rules/${id}/toggle`),
  getLog: (params) => apiClient.get('/email-alerts/log', { params }),
  getStats: () => apiClient.get('/email-alerts/log/stats'),
  getProcessed: () => apiClient.get('/email-alerts/log/processed'),
  triggerPoll: () => apiClient.post('/email-alerts/trigger'),
  reloadRules: () => apiClient.post('/email-alerts/reload'),
  testAlerts: (channels) => apiClient.post('/email-alerts/test', { channels }),
  getAccounts: () => apiClient.get('/email-alerts/accounts'),
  getConfig: () => apiClient.get('/email-alerts/config'),
  updateConfig: (data) => apiClient.put('/email-alerts/config', data),
}
```

## Features

### Keyword Rules
- **Match Types**: exact, contains, regex
- **Priority Levels**: low, medium, high (affects alert formatting)
- **Alert Channels**: SMS only, Telegram only, or both
- **Multi-keyword**: AND logic with primary + secondary keywords

### Alert Channels
- **Twilio SMS**: Formatted with priority emoji, sender, subject, matched keywords
- **Telegram**: Markdown formatting with bold text, inline code, and urgent follow-ups for high priority

### High Priority Handling
- 🚨 Prefix on all high priority alerts
- Automatic follow-up message after 30 seconds if unacknowledged (Telegram)

### Service Management
- Automatic polling every 60 seconds (configurable)
- Rules cache reloads every 5 minutes
- Duplicate prevention via database + in-memory cache
- Graceful error handling with circuit breaker pattern

## Duplicate Handling Strategy

The system has **two** email monitoring solutions:

1. **Legacy Email Monitor** (`/api/email-monitor`)
   - IMAP-based
   - Simple keyword list
   - SMS alerts only
   - For basic use cases

2. **New Email Watcher** (`/api/email-alerts`)
   - Microsoft Graph API
   - Advanced rule engine
   - SMS + Telegram alerts
   - For production use

Both services are independent and can run simultaneously if needed.

## Testing

### Backend
```bash
cd backend
node scripts/test-ai-providers.js  # Test AI providers
# Email watcher tests can be added via API calls
```

### Frontend Settings Tests
1. Navigate to Settings → Notifications → Email Watcher
2. Enter Microsoft OAuth credentials
3. Click "Test" to verify
4. Save credentials
5. Configure keyword rules via API or UI (future)

## Security Considerations

1. **API Key Masking**: All sensitive keys are masked in API responses (show only first/last 4 chars)
2. **Token Storage**: OAuth tokens stored encrypted in database
3. **Automatic Refresh**: Access tokens refreshed before expiration
4. **No Password Storage**: Uses OAuth2 - no user passwords stored

## Future Enhancements

1. **UI for Rule Management**: Visual rule builder in settings
2. **Email Acknowledgment**: Web UI to acknowledge alerts and cancel Telegram follow-ups
3. **Multiple Account Support**: UI to manage multiple Outlook accounts
4. **Advanced Scheduling**: Configure polling intervals per account
5. **Alert Templates**: Customize alert message formats
