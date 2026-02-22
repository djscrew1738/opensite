# Multi-Provider Email Watcher - Integration Summary

## Overview
The Email Watcher service has been extended to support both **Google (Gmail)** and **Microsoft (Outlook)** OAuth2 authentication, allowing the app to monitor multiple email providers simultaneously.

## Supported Providers

| Provider | API | Authentication | Message ID Format |
|----------|-----|----------------|-------------------|
| Gmail | Gmail API v1 | OAuth2 | `17a...b2c@mail.gmail.com` |
| Outlook | Microsoft Graph | OAuth2 | `AQMkADAwATM0...` |

## Architecture

### Backend Services

```
/src/services/emailWatcher/
├── gmailClient.js              # Google Gmail API client
├── outlookClient.js            # Microsoft Graph API client
├── emailProviderFactory.js     # Factory for creating clients
├── EmailWatcherService.js      # Main orchestrator (multi-provider)
├── keywordMatcher.js           # Rule matching engine
├── alertDispatcher.js          # Routes to SMS/Telegram
├── twilioAlert.js              # Twilio SMS sender
├── telegramAlert.js            # Telegram bot sender
└── index.js                    # Service exports
```

### Database Schema Changes

```sql
-- Multi-provider accounts table
CREATE TABLE email_watcher_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email_address TEXT UNIQUE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TEXT,
  provider TEXT DEFAULT 'outlook' CHECK (provider IN ('gmail', 'outlook')),
  provider_account_id TEXT,      -- Provider-specific account ID
  imap_host TEXT,                -- For future IMAP fallback
  imap_port INTEGER,
  active INTEGER DEFAULT 1,
  last_poll_at TEXT,             -- Track last successful poll
  last_error TEXT,               -- Track errors per account
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Updated processed emails (provider-agnostic)
CREATE TABLE email_alert_processed (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,      -- Link to account
  provider_message_id TEXT NOT NULL,  -- Generic message ID
  sender TEXT,
  sender_email TEXT,
  subject TEXT,
  body_preview TEXT,
  received_at TEXT,
  matched_keywords TEXT,
  matched_rule_ids TEXT,
  processed_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES email_watcher_accounts(id),
  UNIQUE(account_id, provider_message_id)  -- Prevent duplicates per account
);
```

## API Endpoints

### Provider Status
```
GET /api/email-alerts/providers
```
Returns configuration status for both providers:
```json
{
  "gmail": {
    "provider": "gmail",
    "configured": true,
    "hasClientId": true,
    "hasClientSecret": true
  },
  "outlook": {
    "provider": "outlook",
    "configured": true,
    "hasClientId": true,
    "hasClientSecret": true
  }
}
```

### Account Management
```
POST /api/email-alerts/accounts
Body: { "provider": "gmail|outlook", "name": "My Account" }
Response: { "authUrl": "...", "pendingId": "..." }
```

### OAuth Callbacks
```
GET /api/email-alerts/auth/google/callback?code=...
GET /api/email-alerts/auth/microsoft/callback?code=...
```

## Settings UI

### Frontend Updates

The Settings page now includes:

1. **API Keys Tab** - Status pills for:
   - Serper, Anthropic, OpenAI, Twilio, SendGrid
   - **Google** (new)
   - **Microsoft** (existing)
   - **Telegram** (existing)

2. **Notifications Tab** - "Email Watcher (Multi-Provider)" section:
   - **Google Gmail OAuth** subsection
     - Client ID input
     - Client Secret input
     - Test & Save buttons
   - **Microsoft Outlook OAuth** subsection
     - Client ID input  
     - Client Secret input
     - Test & Save buttons
   - **Watcher Configuration**
     - Poll interval slider (30s - 300s)
     - Mark as read toggle

### Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=http://localhost:5001/api/email-alerts/auth/google/callback

# Microsoft OAuth  
MICROSOFT_CLIENT_ID=xxxxx
MICROSOFT_CLIENT_SECRET=xxxxx
MICROSOFT_REDIRECT_URI=http://localhost:5001/api/email-alerts/auth/microsoft/callback

# Email Watcher Settings
EMAIL_WATCHER_ENABLED=true
EMAIL_WATCHER_POLL_INTERVAL=60
EMAIL_WATCHER_MARK_READ=false
```

## Provider Setup

### Google (Gmail)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth2 client ID (Web application)
3. Add authorized redirect URI: `http://localhost:5001/api/email-alerts/auth/google/callback`
4. Enable **Gmail API** in the library
5. Copy Client ID and Client Secret to settings

### Microsoft (Outlook)

1. Go to [Azure Portal](https://portal.azure.com) → App registrations
2. New registration → Single tenant or Multitenant
3. Add redirect URI: `http://localhost:5001/api/email-alerts/auth/microsoft/callback`
4. Add API permissions: `Mail.Read`, `User.Read`
5. Copy Application (Client) ID and Client Secret to settings

## Unified Interface

Both providers implement the same interface:

```javascript
class EmailClient {
  async loadAccount()           // Load tokens from DB
  async getAuthUrl()            // Get OAuth URL
  async exchangeCodeForTokens() // Exchange auth code
  async refreshAccessToken()    // Refresh expired token
  async getUnreadMessages()     // Fetch unread emails
  async getMessage(id)          // Get full message
  async markAsRead(id)          // Mark message read
  async healthCheck()           // Verify connection
}
```

## Service Behavior

### Polling
- Polls **all configured accounts** every 60 seconds (configurable)
- Tracks `last_poll_at` per account
- Continues polling other accounts if one fails

### Duplicate Detection
- Uses composite key: `{account_id}:{message_id}`
- Both in-memory cache (1000 items) and database
- Prevents re-alerting on same message across restarts

### Error Handling
- Per-account error tracking in `last_error` column
- Failed accounts don't block other accounts
- Automatic token refresh before expiration

## Testing

### Backend Tests
```bash
# Check provider status
curl /api/email-alerts/providers

# Add Gmail account (initiates OAuth)
curl -X POST /api/email-alerts/accounts \
  -d '{"provider":"gmail","name":"My Gmail"}'

# Add Outlook account
curl -X POST /api/email-alerts/accounts \
  -d '{"provider":"outlook","name":"My Outlook"}'

# Check health
curl /api/email-alerts/health

# Trigger manual poll
curl -X POST /api/email-alerts/trigger
```

### Frontend Tests
1. Settings → API Keys → Verify Google/Microsoft status pills
2. Settings → Notifications → Email Watcher
3. Enter Google Client ID/Secret → Test → Save
4. Enter Microsoft Client ID/Secret → Test → Save
5. Complete OAuth flow for each provider
6. Verify accounts appear in health check

## Migration Notes

### For Existing Users
- Legacy IMAP email monitor (`/api/email-monitor`) remains unchanged
- New OAuth-based watcher (`/api/email-alerts`) is additive
- Both can run simultaneously if needed
- Database migration is automatic (new tables/columns)

### Breaking Changes
- `email_alert_processed.outlook_message_id` → `provider_message_id`
- Added `account_id` foreign key requirement
- Queries for processed emails now require `account_id`

## Future Enhancements

1. **IMAP Fallback** - Support non-OAuth email providers
2. **Account Groups** - Route different alerts to different accounts
3. **Email Threading** - Track conversation threads
4. **Attachment Scanning** - Keyword search in attachments
5. **Calendar Integration** - Monitor calendar invites
