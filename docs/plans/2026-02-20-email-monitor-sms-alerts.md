# Email Monitor SMS Alerts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Monitor an Outlook inbox via IMAP for plumbing/permit/schedule keywords, send SMS alerts via existing Twilio integration when matches found.

**Architecture:** New `email-monitor.js` service connects to Outlook IMAP, polls every 10 min via cron. On keyword match, sends SMS using existing Twilio client from `notifications.js`. Logs to new `email_alerts` DB table. Credentials stored in existing settings DB.

**Tech Stack:** `imapflow` (IMAP client), existing `twilio` + `node-cron`, `better-sqlite3`

---

### Task 1: Install IMAP dependency

**Files:** `backend/package.json`

```bash
cd backend && npm install imapflow
```

---

### Task 2: Add email_alerts table to database

**Files:** Modify `backend/src/services/database.js`

Add to `initializeTables()`:
```sql
CREATE TABLE IF NOT EXISTS email_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  messageId TEXT UNIQUE,
  fromAddress TEXT,
  fromName TEXT,
  subject TEXT,
  matchedKeywords TEXT,
  smsSent INTEGER DEFAULT 0,
  smsExternalId TEXT,
  receivedAt TEXT,
  processedAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_alerts_date ON email_alerts(processedAt);
```

Add methods: `createEmailAlert(data)`, `emailAlertExists(messageId)`

---

### Task 3: Create email-monitor service

**Files:** Create `backend/src/services/email-monitor.js`

Core logic:
1. Connect to IMAP (outlook.office365.com:993 TLS)
2. Open INBOX, search for UNSEEN messages
3. For each: parse subject + text body, check keyword list
4. On match: send SMS via Twilio, log to email_alerts, mark as SEEN
5. Disconnect

Keywords: permit, inspection, variance, schedule change, change order, delay, urgent, plumbing, rough-in, roughin, top-out, topout, trim, final walk, water heater, backflow, sewer, drain, pex, copper, fixture, code violation, failed, approved, rescheduled

---

### Task 4: Create email-monitor API routes

**Files:** Create `backend/src/routes/email-monitor.js`

Endpoints:
- `POST /api/email-monitor/test` — test IMAP connection with provided credentials
- `POST /api/email-monitor/check-now` — manually trigger an email check
- `GET /api/email-monitor/alerts` — list recent alerts (paginated)
- `GET /api/email-monitor/status` — get monitor status (last check, alerts count)

---

### Task 5: Register routes + cron job

**Files:** Modify `backend/src/server.js`, `backend/src/jobs/permit-jobs.js`

- Import and mount email-monitor routes at `/api/email-monitor`
- Add cron job: every 10 min (`*/10 * * * *`), call `checkEmails()`
- Add env var: `EMAIL_MONITOR_CRON` for schedule override
- Add manual trigger: `manualEmailCheck()`

---

### Task 6: Add frontend API client methods

**Files:** Modify `frontend/src/api/client.js`

Add `api.emailMonitor.testConnection()`, `.checkNow()`, `.getAlerts()`, `.getStatus()`

---

### Task 7: Add Email Monitor settings UI

**Files:** Modify `frontend/src/pages/Settings.jsx`

Add new section in notifications tab:
- Enable/disable toggle
- Outlook email field
- Outlook password field (masked)
- IMAP server (default: outlook.office365.com)
- IMAP port (default: 993)
- Keywords textarea (editable, comma-separated)
- Test Connection button
- Check Now button
- Recent alerts list (last 10)
